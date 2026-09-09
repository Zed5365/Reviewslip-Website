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

const STATUS: Record<string, { label: string; colour: string; tint: string }> = {
  open: { label: "Open", colour: "var(--marigold)", tint: "rgba(233,160,59,0.16)" },
  answered: { label: "Answered", colour: "var(--jade)", tint: "rgba(130,180,155,0.16)" },
  closed: { label: "Closed", colour: "var(--admin-muted)", tint: "rgba(243,236,220,0.08)" },
};

export default async function StaffTicketsPage() {
  const token = await sessionToken();
  const { tickets } = await call<{ tickets: StaffTicket[] }>("/admin/tickets", {
    token,
  });

  const open = tickets.filter((t) => t.status === "open");

  return (
    <>
      <h1 className="admin-title">Tickets</h1>
      <p className="admin-sub">
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
        <p className="admin-empty">
          No tickets yet. They arrive here the moment a customer opens one.
        </p>
      ) : (
        <div className="admin-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>From</th>
                <th>Status</th>
                <th className="num">Waiting</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const state = STATUS[t.status] ?? {
                  label: t.status,
                  colour: "var(--cream)",
                  tint: "rgba(243,236,220,0.08)",
                };
                return (
                  <tr key={t.id}>
                    <td>
                      <Link href={`/tickets/${t.id}`} className="primary">
                        {t.title}
                      </Link>
                      <span className="sub">
                        {t.messages} message{t.messages === 1 ? "" : "s"}
                        {t.venue ? ` · ${t.venue.name}` : ""}
                      </span>
                    </td>
                    <td style={{ overflowWrap: "anywhere" }}>
                      <Link
                        href={`/accounts/${t.account.id}`}
                        style={{ color: "var(--jade)" }}
                      >
                        {t.account.email}
                      </Link>
                    </td>
                    <td>
                      <span
                        className="admin-chip"
                        style={{ color: state.colour, background: state.tint }}
                      >
                        {state.label}
                      </span>
                    </td>
                    <td
                      className="num"
                      style={{
                        // How long since anything happened, not since it opened:
                        // a ticket answered an hour ago is not two weeks old.
                        color:
                          t.status === "open" ? "var(--marigold)" : "var(--admin-muted)",
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
