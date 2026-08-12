import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import SettingsForm, { type VenueState } from "@/components/dashboard/SettingsForm";
import { call, sessionToken, type VenueDetail } from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Venue settings",
  robots: { index: false, follow: false },
};

export default async function VenueSettingsPage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]/settings">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  // TypeScript drops the isLocale narrowing inside the action's closure.
  const locale: Locale = lang;

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: VenueDetail;
  try {
    data = await call<VenueDetail>(`/venues/${slug}`, { token });
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
    _prev: VenueState,
    formData: FormData
  ): Promise<VenueState> {
    "use server";

    const current = await sessionToken();
    if (!current) return { error: "Your session expired. Sign in again." };

    const text = (key: string) => String(formData.get(key) ?? "").trim();

    try {
      const result = await call<{ warning?: string }>(`/venues/${slug}`, {
        method: "PATCH",
        token: current,
        body: {
          name: text("name"),
          googleUrl: text("googleUrl"),
          tripadvisorUrl: text("tripadvisorUrl"),
          websiteUrl: text("websiteUrl"),
          kind: text("kind"),
          place: text("place"),
          // Blanks dropped. An empty list means "reset to the built-in set", so
          // an emptied editor resets rather than leaving the venue with nothing.
          safeDetails: formData
            .getAll("safeDetails")
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

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, `/dashboard/${slug}`)}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← {data.venue.name}
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Settings</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          Everything a review about this venue is allowed to say.
        </p>

        <SettingsForm
          action={save}
          name={data.venue.name}
          settings={data.settings}
        />
      </div>
    </section>
  );
}
