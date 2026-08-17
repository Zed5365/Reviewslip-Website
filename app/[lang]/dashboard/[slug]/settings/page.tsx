import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import DeleteBusiness from "@/components/dashboard/DeleteBusiness";
import SettingsForm, {
  type BusinessState,
  type Suggestion,
} from "@/components/dashboard/SettingsForm";
import { call, sessionToken, type BusinessDetail } from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Business settings",
  robots: { index: false, follow: false },
};

export default async function BusinessSettingsPage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]/settings">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  // TypeScript drops the isLocale narrowing inside the action's closure.
  const locale: Locale = lang;

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: BusinessDetail;
  try {
    data = await call<BusinessDetail>(`/businesses/${slug}`, { token });
  } catch (err) {
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  /**
   * Validation lives in the review app — it is the thing that has to be right,
   * and a copy here would eventually disagree with it. Note that apiKey and
   * model are absent: the platform key and the fixed model are not a customer's
   * to change, and the API ignores them even if sent.
   */
  async function save(
    _prev: BusinessState,
    formData: FormData
  ): Promise<BusinessState> {
    "use server";

    const current = await sessionToken();
    if (!current) return { error: "Your session expired. Sign in again." };

    const text = (key: string) => String(formData.get(key) ?? "").trim();

    try {
      const result = await call<{ warning?: string }>(`/businesses/${slug}`, {
        method: "PATCH",
        token: current,
        body: {
          name: text("name"),
          googleUrl: text("googleUrl"),
          tripadvisorUrl: text("tripadvisorUrl"),
          lineUrl: text("lineUrl"),
          facebookUrl: text("facebookUrl"),
          xiaohongshuUrl: text("xiaohongshuUrl"),
          wongnaiUrl: text("wongnaiUrl"),
          websiteUrl: text("websiteUrl"),
          kind: text("kind"),
          place: text("place"),
          contextDoc: text("contextDoc"),
          // Blanks dropped. Labels and notes arrive as two same-length lists,
          // one input each per row, so they zip by index. A row with no label is
          // one the person emptied and the server drops it; an empty list is a
          // business with no topics rather than one inheriting anybody else's.
          categories: formData
            .getAll("catLabel")
            .map((value, index) => ({
              label: String(value).trim(),
              focus: String(formData.getAll("catFocus")[index] ?? "").trim(),
            }))
            .filter((cat) => cat.label),
          // Editable now, where they used to be read-only evidence of what the
          // website said. The validator in the review app is what keeps them
          // honest: it refuses a detail carrying a number or a claim a customer
          // could not check, whether a model wrote it or a person typed it.
          safeDetails: formData
            .getAll("detail")
            .map((value) => String(value).trim())
            .filter(Boolean),
        },
      });

      revalidatePath(localizedPath(locale, `/dashboard/${slug}`));
      revalidatePath(localizedPath(locale, "/dashboard"));

      return { ok: true, warning: result?.warning };
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "Could not save the settings.",
      };
    }
  }

  /**
   * Reads the website and proposes the details a review may claim.
   *
   * It used to store them outright, on the argument that the list was evidence of
   * what the writer had been told rather than something to edit. The details are
   * editable now, so storing behind the customer's back would overwrite their own
   * wording without asking. Same contract as everything else here: it fills the
   * editor, and Save is a separate deliberate act — which also means the details
   * and the description arrive together and are read together.
   */
  async function analyse(): Promise<{
    ok: boolean;
    kind?: string;
    place?: string;
    details?: string[];
    error?: string;
  }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { ok: false, error: "Sign in again." };

    try {
      const seed = await call<{
        proposal: {
          kind: string;
          place: string;
          safeDetails: { detail: string; source: string }[];
        };
      }>(`/businesses/${slug}/seed`, { method: "POST", token: current });

      return {
        ok: true,
        kind: seed.proposal.kind,
        place: seed.proposal.place,
        details: seed.proposal.safeDetails.map((d) => d.detail),
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : "Could not read it.",
      };
    }
  }

  /** Proposes the topics. Fills the editor only — Save still stores them. */
  async function suggest(): Promise<{
    categories?: Suggestion[];
    error?: string;
  }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { error: "Sign in again." };

    try {
      return await call<{ categories: Suggestion[] }>(
        `/businesses/${slug}/topics/suggest`,
        { method: "POST", token: current }
      );
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not read it.",
      };
    }
  }

  /**
   * Drafts this business's own AI context document.
   *
   * Reads the website and any review listings that are set — how this business's
   * real customers already write is the most useful thing on the subject, and the
   * one thing its own marketing pages cannot say. `dropped` carries any sentence
   * the screen removed for carrying a superlative, so the customer is told what
   * went rather than wondering why the draft has a gap.
   */
  async function draftContext(): Promise<{
    contextDoc?: string;
    dropped?: string[];
    error?: string;
  }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { error: "Sign in again." };

    try {
      return await call<{ contextDoc: string; dropped: string[] }>(
        `/businesses/${slug}/context/draft`,
        { method: "POST", token: current }
      );
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not read it.",
      };
    }
  }

  /**
   * Deletes it. The typed confirmation lives in the component; this is the call
   * that cannot be taken back, so it does nothing clever — the API cascades the
   * review history and frees the address.
   */
  async function destroy(): Promise<{ error?: string }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { error: "Your session expired. Sign in again." };

    try {
      await call(`/businesses/${slug}`, { method: "DELETE", token: current });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not delete it.",
      };
    }

    revalidatePath(localizedPath(locale, "/dashboard"));

    // Outside the try: redirect works by throwing, and there is no page left to
    // return to anyway.
    redirect(localizedPath(locale, "/dashboard"));
  }

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, `/dashboard/${slug}`)}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← {data.business.name}
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Settings</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          Everything a review about this business is allowed to say.
        </p>

        {/* Deleting is passed in rather than rendered after: it lives on the
            General tab, which only the form knows which one is showing. */}
        <SettingsForm
          action={save}
          analyse={analyse}
          suggest={suggest}
          draftContext={draftContext}
          name={data.business.name}
          settings={data.settings}
        >
          <DeleteBusiness slug={slug} destroy={destroy} />
        </SettingsForm>
      </div>
    </section>
  );
}
