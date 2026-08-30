import Link from "next/link";
import { notFound } from "next/navigation";

import { call, sessionToken, type StaffAccountDetail } from "@/lib/customer";

function when(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const card: React.CSSProperties = {
  border: "1px solid var(--jade-line)",
  borderRadius: 14,
  padding: "1.25rem",
  marginBottom: "1.5rem",
};

const cell: React.CSSProperties = {
  padding: "0.65rem 0.75rem",
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

/** Same three words the customer's own referrals page uses. */
const STATE: Record<string, { label: string; colour: string }> = {
  invited: { label: "Invited", colour: "var(--marigold)" },
  "signed up": { label: "Signed up", colour: "var(--marigold)" },
  joined: { label: "Joined", colour: "var(--jade)" },
};

export default async function StaffAccountPage({
  params,
}: PageProps<"/[lang]/admin/accounts/[id]">) {
  const { id } = await params;
  const token = await sessionToken();

  let data: StaffAccountDetail;
  try {
    data = await call<StaffAccountDetail>(`/admin/accounts/${id}`, { token });
  } catch (err) {
    // The API answers 404 for a missing account and for a caller who is not
    // staff. Both become this page's own not-found — there is nothing here to
    // tell apart, and the layout has already established the caller is staff.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const { account, plan, venues, referrals, referredBy } = data;

  return (
    <>
      <Link href="/" style={{ color: "var(--jade)", fontSize: "0.9rem" }}>
        ← Accounts
      </Link>

      <h1 style={{ fontSize: "1.5rem", margin: "1rem 0 0.3rem", overflowWrap: "anywhere" }}>
        {account.email}
      </h1>
      <p style={{ color: "var(--cream-faint)", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
        {account.username} · {plan.name} · {account.status}
        {account.isAdmin ? " · staff" : ""} · joined {when(account.createdAt)}
      </p>

      {/* ------------------------------------------------------------ plan */}

      <div style={card}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>Plan</h2>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--cream-faint)" }}>
          <strong style={{ color: "var(--cream)" }}>{plan.name}</strong> ·{" "}
          {venues.length} of {plan.venues === null ? "unlimited" : plan.venues} venues
          used · {plan.reviewsPerBusiness.toLocaleString()} reviews and{" "}
          {plan.tokensPerMonthPerBusiness.toLocaleString()} tokens per venue per
          month
        </p>
        {plan.venues !== null && venues.length > plan.venues ? (
          <p style={{ margin: "0.6rem 0 0", fontSize: "0.9rem", color: "var(--marigold)" }}>
            Over the plan limit by {venues.length - plan.venues}.
          </p>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- venues */}

      <div style={card}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.75rem" }}>
          Venues ({venues.length})
        </h2>

        {venues.length === 0 ? (
          <p style={{ margin: 0, color: "var(--cream-faint)", fontSize: "0.9rem" }}>
            None yet.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "38rem" }}>
              <thead>
                <tr>
                  <th style={head}>Venue</th>
                  <th style={head}>State</th>
                  <th style={{ ...head, textAlign: "right" }}>Reviews</th>
                  <th style={{ ...head, textAlign: "right" }}>Taken</th>
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
                    <td style={{ ...cell, color: v.ready ? "var(--jade)" : "var(--marigold)" }}>
                      {v.status !== "active" ? v.status : v.ready ? "live" : "no review link"}
                    </td>
                    <td style={num}>{v.reviews.toLocaleString()}</td>
                    <td style={num}>
                      {/* Drafts someone actually pressed Proceed on. The gap
                          between this and Reviews is the number worth watching. */}
                      {v.taken.toLocaleString()}
                    </td>
                    <td style={{ ...num, color: "var(--cream-faint)" }}>
                      {when(v.lastReview)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------- referrals */}

      <div style={card}>
        <h2 style={{ fontSize: "1rem", margin: "0 0 0.3rem" }}>Referrals</h2>
        <p style={{ margin: "0 0 0.9rem", fontSize: "0.9rem" }}>
          <strong
            style={{
              color: referrals.progress.earned ? "var(--marigold)" : "var(--cream)",
            }}
          >
            {referrals.progress.qualified} of {referrals.progress.needed} joined
          </strong>
          <span style={{ color: "var(--cream-faint)" }}>
            {" "}
            · {referrals.invited.length} invited
            {referrals.progress.earned
              ? ` · earned ${referrals.progress.worth}% off, not yet applied`
              : ""}
          </span>
        </p>

        {referredBy ? (
          <p style={{ margin: "0 0 0.9rem", fontSize: "0.9rem", color: "var(--cream-faint)" }}>
            Referred by{" "}
            <Link href={`/accounts/${referredBy.id}`} style={{ color: "var(--jade)" }}>
              {referredBy.email}
            </Link>
            {referredBy.qualified ? " (counted)" : " (not counted yet)"}
          </p>
        ) : null}

        {referrals.invited.length === 0 ? (
          <p style={{ margin: 0, color: "var(--cream-faint)", fontSize: "0.9rem" }}>
            None sent.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "38rem" }}>
              <thead>
                <tr>
                  <th style={head}>Invited</th>
                  <th style={head}>State</th>
                  <th style={head}>Sent</th>
                  <th style={head}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {referrals.invited.map((r) => {
                  const state = STATE[r.state] ?? { label: r.state, colour: "var(--cream)" };
                  return (
                    <tr key={r.id}>
                      <td style={{ ...cell, overflowWrap: "anywhere" }}>
                        {r.email}
                        {/* The invited address is only a label — signing up
                            with a different one still counts — so when they
                            differ, say so rather than showing one and
                            implying the other. */}
                        {r.joinedAs && r.joinedAs.toLowerCase() !== r.email.toLowerCase() ? (
                          <div style={{ color: "var(--cream-faint)", fontSize: "0.8rem" }}>
                            signed up as {r.joinedAs}
                          </div>
                        ) : null}
                      </td>
                      <td style={{ ...cell, color: state.colour, whiteSpace: "nowrap" }}>
                        {state.label}
                      </td>
                      <td style={{ ...cell, color: "var(--cream-faint)", whiteSpace: "nowrap" }}>
                        {when(r.invitedAt)}
                      </td>
                      <td style={{ ...cell, color: "var(--cream-faint)", whiteSpace: "nowrap" }}>
                        {when(r.qualifiedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
