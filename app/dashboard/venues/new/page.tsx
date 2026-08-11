import Link from "next/link";
import { redirect } from "next/navigation";

import { createVenue } from "@/app/actions/venues";
import { SlugPicker } from "@/components/dash/SlugPicker";
import styles from "@/components/dash/dash.module.css";
import { planById } from "@/lib/plans";
import { currentUser } from "@/lib/session";

export default async function NewVenuePage() {
  const me = await currentUser();
  if (!me) redirect("/login");

  // The review app enforces this too, on the create call. Checking here as well
  // is not belt-and-braces for its own sake: it is the difference between
  // explaining the limit up front and letting someone fill in a form that was
  // always going to be refused.
  if (!me.canAddVenue) {
    const plan = planById(me.account.plan);
    return (
      <>
        <Link className={styles.back} href="/dashboard">
          <span aria-hidden="true">←</span> All venues
        </Link>

        <div className={styles.head}>
          <h1 className={styles.title}>No room for another venue</h1>
          <p className={styles.sub}>
            {plan?.name ?? me.plan.name} covers {me.plan.venues} venue
            {me.plan.venues === 1 ? "" : "s"}, and you have {me.usage.venues}.
          </p>
        </div>

        <div className={styles.actions}>
          <Link className="btn btn-go" href="/dashboard/billing">
            See plans
          </Link>
        </div>
      </>
    );
  }

  const baseDomain = process.env.BASE_DOMAIN ?? "reviewslip.com";

  return (
    <>
      <Link className={styles.back} href="/dashboard">
        <span aria-hidden="true">←</span> All venues
      </Link>

      <div className={styles.head}>
        <h1 className={styles.title}>Add a venue</h1>
        <p className={styles.sub}>
          {me.usage.venues} of{" "}
          {me.plan.venues === null ? "unlimited" : me.plan.venues} used on{" "}
          {me.plan.name}
        </p>
      </div>

      <SlugPicker action={createVenue} baseDomain={baseDomain} />
    </>
  );
}
