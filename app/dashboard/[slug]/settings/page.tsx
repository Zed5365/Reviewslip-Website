import Link from "next/link";
import { notFound } from "next/navigation";

import { saveVenue } from "@/app/actions/venue";
import { SettingsForm } from "@/components/dash/SettingsForm";
import styles from "@/components/dash/dash.module.css";
import { call, type VenueDetail } from "@/lib/api";
import { sessionToken } from "@/lib/session";

export default async function VenueSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const token = await sessionToken();
  if (!token) notFound();

  let data: VenueDetail;
  try {
    data = await call<VenueDetail>(`/venues/${slug}`, { token });
  } catch (err) {
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  // The action needs to know which venue it is saving, and the form has no
  // business being told to trust a hidden field for that.
  const action = saveVenue.bind(null, slug);

  return (
    <>
      <Link className={styles.back} href={`/dashboard/${slug}`}>
        <span aria-hidden="true">←</span> {data.venue.name}
      </Link>

      <div className={styles.head}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.sub}>
          Everything a review about this venue is allowed to say.
        </p>
      </div>

      <SettingsForm
        action={action}
        name={data.venue.name}
        settings={data.settings}
      />
    </>
  );
}
