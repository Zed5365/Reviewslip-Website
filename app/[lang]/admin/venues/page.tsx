import Link from "next/link";

import { call, sessionToken, type StaffVenue } from "@/lib/customer";

function when(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const cell: React.CSSProperties = {
  padding: "0.7rem 0.75rem",
  borderBottom: "1px solid var(--jade-line)",
  fontSize: "0.9rem",
  verticalAlign: "top",
};

const head: React.CSSProperties = {
  ...cell,
  color: "var(--cream-faint)",
  fontSize: "0.78rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const num: React.CSSProperties = {
  ...cell,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

export default async function StaffVenuesPage() {
  const token = await sessionToken();
  const { venues } = await call<{ venues: StaffVenue[] }>("/admin/venues", {
    token,
  });

  const orphans = venues.filter((v) => !v.owner).length;

  return (
    <>
      <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.3rem" }}>Venues</h1>
      <p style={{ color: "var(--cream-faint)", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
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
          style={{
            border: "1px solid rgba(233,160,59,0.4)",
            borderLeftWidth: 3,
            borderRadius: 10,
            background: "rgba(233,160,59,0.1)",
            padding: "0.8rem 1rem",
            fontSize: "0.9rem",
            margin: "0 0 1.5rem",
          }}
        >
          A venue whose account was deleted keeps serving its public page and
          cannot be reached from any dashboard. Worth deciding what happens to
          those.
        </p>
      ) : null}

      {venues.length === 0 ? (
        <p style={{ color: "var(--cream-faint)" }}>No venues yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "44rem" }}>
            <thead>
              <tr>
                <th style={head}>Venue</th>
                <th style={head}>Owner</th>
                <th style={head}>State</th>
                <th style={{ ...head, textAlign: "right" }}>Reviews</th>
                <th style={{ ...head, textAlign: "right" }}>Last</th>
              </tr>
            </thead>
            <tbody>
              {venues.map((v) => (
                <tr key={v.slug}>
                  <td style={cell}>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--cream)", fontWeight: 500 }}
                    >
                      {v.name}
                    </a>
                    <div style={{ color: "var(--cream-faint)", fontSize: "0.8rem" }}>
                      {v.slug}
                    </div>
                  </td>
                  <td style={{ ...cell, overflowWrap: "anywhere" }}>
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
                  <td style={cell}>{v.status}</td>
                  <td style={num}>{v.reviews.toLocaleString()}</td>
                  <td style={{ ...num, color: "var(--cream-faint)" }}>
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
