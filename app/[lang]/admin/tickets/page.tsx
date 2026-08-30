import Link from "next/link";

import { call, sessionToken, type StaffTicket } from "@/lib/customer";

function ago(iso: string | null): string {
  if (!iso) return "—";
  const hours = Math.floor((Date.now() - Date.parse(iso)) / 3_600_000);
  if (!Number.isFinite(hours)) return "—";
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d` : `${Math.floor(days / 30)}mo`;
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

const STATUS: Record<string, { label: string; colour: string }> = {
  open: { label: "Open", colour: "var(--marigold)" },
  answered: { label: "Answered", colour: "var(--jade)" },
  closed: { label: "Closed", colour: "var(--cream-faint)" },
};

export default async function StaffTicketsPage() {
  const token = await sessionToken();
  const { tickets } = await call<{ tickets: StaffTicket[] }>("/admin/tickets", {
    token,
  });

  const open = tickets.filter((t) => t.status === "open");

  return (
    <>
      <h1 style={{ fontSize: "1.6rem", margin: "0 0 0.3rem" }}>Tickets</h1>
      <p style={{ color: "var(--cream-faint)", fontSize: "0.9rem", margin: "0 0 1.75rem" }}>
        {open.length === 0 ? (
          "Nothing waiting."
        ) : (
          <>
            <span style={{ color: "var(--marigold)" }}>
              {open.length} waiting on us
            </span>
            {" · oldest first"}
          </>
        )}
      </p>

      {tickets.length === 0 ? (
        <p style={{ color: "var(--cream-faint)" }}>No tickets yet.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "42rem" }}>
            <thead>
              <tr>
                <th style={head}>Subject</th>
                <th style={head}>From</th>
                <th style={head}>Status</th>
                <th style={{ ...head, textAlign: "right" }}>Waiting</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const state = STATUS[t.status] ?? {
                  label: t.status,
                  colour: "var(--cream)",
                };
                return (
                  <tr key={t.id}>
                    <td style={cell}>
                      <Link
                        href={`/tickets/${t.id}`}
                        style={{ color: "var(--cream)", fontWeight: 500 }}
                      >
                        {t.title}
                      </Link>
                      <div style={{ color: "var(--cream-faint)", fontSize: "0.8rem" }}>
                        {t.messages} message{t.messages === 1 ? "" : "s"}
                        {t.venue ? ` · ${t.venue.name}` : ""}
                      </div>
                    </td>
                    <td style={{ ...cell, overflowWrap: "anywhere" }}>
                      <Link
                        href={`/accounts/${t.account.id}`}
                        style={{ color: "var(--jade)" }}
                      >
                        {t.account.email}
                      </Link>
                    </td>
                    <td style={{ ...cell, color: state.colour, whiteSpace: "nowrap" }}>
                      {state.label}
                    </td>
                    <td
                      style={{
                        ...cell,
                        textAlign: "right",
                        whiteSpace: "nowrap",
                        fontVariantNumeric: "tabular-nums",
                        // How long since anything happened, not since it opened:
                        // a ticket answered an hour ago is not two weeks old.
                        color:
                          t.status === "open" ? "var(--marigold)" : "var(--cream-faint)",
                      }}
                    >
                      {ago(t.lastMessage ?? t.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
