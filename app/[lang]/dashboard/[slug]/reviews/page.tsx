import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ReviewList, { type ReviewRow } from "@/components/dashboard/ReviewList";
import { call, sessionToken, type BusinessDetail } from "@/lib/customer";
import { isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Reviews",
  robots: { index: false, follow: false },
};

/**
 * The reviews a venue has generated, and what its owner made of them.
 *
 * Off the venue page, which had become a hub with a long list bolted to the
 * bottom of it. The list wants room — forty reviews in a column beside a bar
 * chart is a scroll inside a scroll — and the numbers people open the dashboard
 * for should not be under it.
 */
export default async function ReviewsPage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]/reviews">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();

  const token = await sessionToken();
  if (!token) redirect(localizedPath(lang, "/login"));

  let data: BusinessDetail;
  try {
    data = await call<BusinessDetail>(`/businesses/${slug}`, { token });
  } catch (err) {
    // The API answers 404 for a business belonging to somebody else as well as
    // one that does not exist — deliberately, and it stays that way here.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  let reviews: ReviewRow[] = [];
  let notTaken = 0;
  let reviewsFailed = false;
  try {
    const answer = await call<{ reviews: ReviewRow[]; notTaken?: number }>(
      `/businesses/${slug}/reviews`,
      { token }
    );
    reviews = answer.reviews;
    // Optional: the review app deploys separately, and a dashboard running
    // ahead of it gets a list and no count rather than falling over.
    notTaken = answer.notTaken ?? 0;
  } catch (err) {
    // Kept apart from an empty list, because they are different facts and this
    // page used to tell the same story for both. A broken query behind this
    // call rendered "Nothing yet. Reviews appear here as guests generate them."
    // to an owner with forty-seven of them — which reads as a product that is
    // not working rather than one that is broken, and sends them looking in
    // entirely the wrong place.
    reviewsFailed = true;
    console.error(`Could not load reviews for ${slug}:`, err);
  }

  /**
   * Records the owner's judgement. Called straight from the list's stars.
   *
   * `null` clears the rating, which is what a second tap on the star already
   * set means. The review app treats that as a distinct value rather than a
   * missing one, so it is sent as null rather than omitted.
   */
  async function rate(id: number, rating: number | null): Promise<{ ok: boolean }> {
    "use server";

    const current = await sessionToken();
    if (!current) return { ok: false };

    try {
      await call(`/businesses/${slug}/reviews/${id}/feedback`, {
        method: "POST",
        body: { rating },
        token: current,
      });
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  const { business } = data;

  return (
    <section className="section">
      <div className="wrap">
        <Link
          href={localizedPath(lang, `/dashboard/${business.slug}`)}
          style={{ color: "var(--jade)", fontSize: "0.9rem" }}
        >
          ← {business.name}
        </Link>

        <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Reviews</h1>
        <p className="lede" style={{ marginBottom: "2rem" }}>
          What guests have written, and what you thought of it.
        </p>

        <ReviewList
          reviews={reviews}
          notTaken={notTaken}
          failed={reviewsFailed}
          rate={rate}
        />
      </div>
    </section>
  );
}
