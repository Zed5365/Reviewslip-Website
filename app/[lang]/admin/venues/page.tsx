import Link from "next/link";

import { call, sessionToken, type StaffVenue } from "@/lib/customer";

function when(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function StaffVenuesPage() {
  const token = await sessionToken();
  const { venues } = await call<{ venues: StaffVenue[] }>("/admin/venues", {
    token,
  });

  const orphans = venues.filter((v) => !v.owner).length;

  return (
    <>
      <h1 className="admin-title">Venues</h1>
      <p className="admin-sub">
        {venues.length} venue{venues.length === 1 ? "" : "s"}
        {orphans > 0 ? (
          <>
            {" · "}
            <span style={{ color: "var(--marigold)" }}>
              {orphans} with no owner
            </span>
          </>
        ) : null}
      </p>

      {orphans > 0 ? (
        /* Deleting an account sets subscribers.account_id to null rather than
           removing the venue, so these keep serving guests with nobody able to
           reach them from a dashboard. Nothing else in the product shows them. */
        <p
          className="admin-card"
          style={{
            borderColor: "rgba(233,160,59,0.4)",
            borderLeftWidth: 3,
            background: "rgba(233,160,59,0.08)",
            padding: "0.8rem 1rem",
            fontSize: "0.9rem",
          }}
        >
          A venue whose account was deleted keeps serving its public page and
          cannot be reached from any dashboard. Worth deciding what happens to
          those.
        </p>
      ) : null}

      {venues.length === 0 ? (
        <p className="admin-empty">No venues yet.</p>
      ) : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Venue</th>
                <th>Owner</th>
                <th>State</th>
                <th className="num">Reviews</th>
                <th className="num">Last</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.slug}>
                  <td>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="primary"
                    >
                      {v.name}
                    </a>
                    <span className="sub">{v.slug}</span>
                  </td>
                  <td style={{ overflowWrap: "anywhere" }}>
                    {v.owner ? (
                      <Link
                        href={`/accounts/${v.owner.id}`}
                        style={{ color: "var(--jade)" }}
                      >
                        {v.owner.email}
                      </Link>
                    ) : (
                      <span style={{ color: "var(--marigold)" }}>no owner</span>
                    )}
                  </td>
                  <td>{v.status}</td>
                  <td className="num">{v.reviews.toLocaleString()}</td>
                  <td className="num" style={{ color: "var(--admin-muted)" }}>
                    {when(v.lastReview)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
