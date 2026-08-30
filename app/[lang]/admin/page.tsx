import Link from "next/link";

import { call, sessionToken, type StaffAccount } from "@/lib/customer";

/** Numbers a person reads at a glance, not exact timestamps. */
function since(iso: string | null): string {
  if (!iso) return "—";
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (!Number.isFinite(days)) return "—";
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
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
  fontWeight: 500,
  textAlign: "left",
  whiteSpace: "nowrap",
};

const num: React.CSSProperties = {
  ...cell,
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
  whiteSpace: "nowrap",
};

export default async function AdminAccountsPage() {
  const token = await sessionToken();
  const { accounts } = await call<{ accounts: StaffAccount[] }>(
    "/admin/accounts",
    { token }
  );

  const withVenues = accounts.filter((a) => a.venues > 0).length;
  const earned = accounts.filter((a) => a.progress.earned).length;

  return (
    <>
      <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.3rem" }}>Accounts</h1>
      <p style={{ color: "var(--cream-faint)", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
        {accounts.length} account{accounts.length === 1 ? "" : "s"} · {withVenues}{" "}
        with at least one venue · {earned} at the referral discount
      </p>

      {accounts.length === 0 ? (
        <p style={{ color: "var(--cream-faint)" }}>No accounts yet.</p>
      ) : (
        /* Tables do not shrink below their content, so the scroll has to live
           on a wrapper. Without it the page itself scrolls sideways and the
           header goes with it. */
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "46rem" }}>
            <thead>
              <tr>
                <th style={head}>Account</th>
                <th style={head}>Plan</th>
                <th style={{ ...head, textAlign: "right" }}>Venues</th>
                <th style={{ ...head, textAlign: "right" }}>Referrals</th>
                <th style={{ ...head, textAlign: "right" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td style={cell}>
                    <Link
                      href={`/accounts/${a.id}`}
                      style={{ color: "var(--cream)", fontWeight: 500 }}
                    >
                      {a.email}
                    </Link>
                    <div
                      style={{
                        color: "var(--cream-faint)",
                        fontSize: "0.8rem",
                        marginTop: "0.15rem",
                      }}
                    >
                      {a.username}
                      {a.isAdmin ? " · staff" : ""}
                      {a.status !== "active" ? ` · ${a.status}` : ""}
                    </div>
                  </td>
                  <td style={cell}>{a.plan}</td>
                  <td style={num}>{a.venues}</td>
                  <td style={num}>
                    {/* Qualified over the bar, not over invitations sent —
                        five is the number that means anything, and "3/7"
                        would read as though sending more helped. */}
                    <span
                      style={{
                        color: a.progress.earned ? "var(--marigold)" : "var(--cream)",
                      }}
                    >
                      {a.referrals.qualified}/{a.progress.needed}
                    </span>
                    {a.referrals.total > a.referrals.qualified ? (
                      <span style={{ color: "var(--cream-faint)" }}>
                        {" "}
                        ({a.referrals.total} sent)
                      </span>
                    ) : null}
                  </td>
                  <td style={{ ...num, color: "var(--cream-faint)" }}>
                    {since(a.createdAt)}
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
