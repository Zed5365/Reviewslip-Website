import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import SlugPicker, {
  type CreateVenueState,
} from "@/components/dashboard/SlugPicker";
import { call, currentUser, sessionToken } from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Add a venue",
  robots: { index: false, follow: false },
};

export default async function NewVenuePage({
  params,
}: PageProps<"/[lang]/dashboard/venues/new">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  // TypeScript drops the isLocale narrowing inside the server action's closure,
  // so the narrowed value is captured once here.
  const locale: Locale = lang;

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  /**
   * Defined here rather than in an actions file so it closes over the locale
   * without threading it through a hidden field. The cap is still enforced by
   * the review app on the call below — this is not the check that matters.
   */
  async function create(
    _prev: CreateVenueState,
    formData: FormData
  ): Promise<CreateVenueState> {
    "use server";

    const token = await sessionToken();
    if (!token) return { error: "Your session expired. Sign in again." };

    const slug = String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase();
    const name = String(formData.get("name") ?? "").trim();

    try {
      await call("/venues", { method: "POST", body: { slug, name }, token });
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "Could not create the venue.",
        values: { slug, name },
      };
    }

    revalidatePath(localizedPath(locale, "/dashboard"));

    // Outside the try: redirect works by throwing, so catching around it would
    // swallow the navigation and report it as a failure.
    redirect(localizedPath(locale, "/dashboard"));
  }

  // Checked here as well as in the review app. Not belt-and-braces for its own
  // sake: it is the difference between explaining the limit up front and letting
  // someone fill in a form that was always going to be refused.
  if (!me.canAddVenue) {
    return (
      <section className="section">
        <div className="wrap">
          <h1 style={{ marginBottom: "0.4rem" }}>No room for another venue</h1>
          <p className="lede" style={{ marginBottom: "2rem" }}>
            {me.plan.name} covers {me.plan.venues} venue
            {me.plan.venues === 1 ? "" : "s"}, and you have {me.usage.venues}.
          </p>
          <Link className="btn btn-go" href={localizedPath(lang, "/pricing")}>
            See plans
          </Link>
        </div>
      </section>
    );
  }

  const baseDomain = process.env.BASE_DOMAIN ?? "reviewslip.com";

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, "/dashboard")}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← All venues
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Add a venue</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          {me.usage.venues} of{" "}
          {me.plan.venues === null ? "unlimited" : me.plan.venues} used on{" "}
          {me.plan.name}
        </p>

        <SlugPicker action={create} baseDomain={baseDomain} />
      </div>
    </section>
  );
}
