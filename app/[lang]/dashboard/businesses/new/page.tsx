import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import SlugPicker, {
  type CreateBusinessState,
} from "@/components/dashboard/SlugPicker";
import { call, currentUser, sessionToken } from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Add a business",
  robots: { index: false, follow: false },
};

export default async function NewBusinessPage({
  params,
}: PageProps<"/[lang]/dashboard/businesses/new">) {
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
    _prev: CreateBusinessState,
    formData: FormData
  ): Promise<CreateBusinessState> {
    "use server";

    const token = await sessionToken();
    if (!token) return { error: "Your session expired. Sign in again." };

    const slug = String(formData.get("slug") ?? "")
      .trim()
      .toLowerCase();
    const name = String(formData.get("name") ?? "").trim();

    try {
      await call("/businesses", { method: "POST", body: { slug, name }, token });
    } catch (err) {
      return {
        error:
          err instanceof Error ? err.message : "Could not create the business.",
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
  if (!me.canAddBusiness) {
    return (
      <section className="section">
        <div className="wrap">
          <h1 style={{ marginBottom: "0.4rem" }}>No room for another business</h1>
          <p className="lede" style={{ marginBottom: "2rem" }}>
            {me.plan.name} covers {me.plan.businesses} business
            {me.plan.businesses === 1 ? "" : "s"}, and you have {me.usage.businesses}.
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
          ← All businesses
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Add a business</h1>
        <p className="lede" style={{ marginBottom: "2.5rem" }}>
          {me.usage.businesses} of{" "}
          {me.plan.businesses === null ? "unlimited" : me.plan.businesses} used on{" "}
          {me.plan.name}
        </p>

        <SlugPicker action={create} baseDomain={baseDomain} />
      </div>
    </section>
  );
}
