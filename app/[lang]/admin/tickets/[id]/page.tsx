import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";

import Thread from "@/components/dashboard/Thread";
import { ReplyBox, type TicketState } from "@/components/dashboard/TicketForms";
import {
  call,
  sessionToken,
  type StaffTicketThread,
} from "@/lib/customer";

function when(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
}

const STATUS: Record<string, { label: string; colour: string }> = {
  open: { label: "Waiting on us", colour: "var(--marigold)" },
  answered: { label: "Answered — waiting on them", colour: "var(--jade)" },
  closed: { label: "Closed", colour: "var(--cream-faint)" },
};

export default async function StaffTicketPage({
  params,
}: PageProps<"/[lang]/admin/tickets/[id]">) {
  const { id } = await params;
  const token = await sessionToken();

  let data: StaffTicketThread;
  try {
    data = await call<StaffTicketThread>(`/admin/tickets/${id}`, { token });
  } catch (err) {
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const { ticket, messages, account } = data;
  const here = `/tickets/${ticket.id}`;

  async function reply(
    _prev: TicketState,
    formData: FormData
  ): Promise<TicketState> {
    "use server";

    const t = await sessionToken();
    const body = String(formData.get("body") ?? "").trim();

    try {
      await call(`/admin/tickets/${id}/reply`, {
        method: "POST",
        body: { body },
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not send that.",
        values: { body },
      };
    }

    revalidatePath(here);
    return { ok: true };
  }

  async function closeTicket() {
    "use server";

    const t = await sessionToken();
    try {
      await call(`/admin/tickets/${id}/close`, { method: "POST", token: t });
    } catch (err) {
      console.error("Close failed:", err);
    }
    revalidatePath(here);
  }

  const state = STATUS[ticket.status] ?? {
    label: ticket.status,
    colour: "var(--cream)",
  };

  return (
    <>
      <Link href="/tickets" style={{ color: "var(--jade)", fontSize: "0.9rem" }}>
        ← Tickets
      </Link>

      <h1 style={{ fontSize: "1.4rem", margin: "1rem 0 0.4rem" }}>{ticket.title}</h1>

      <p style={{ color: "var(--cream-faint)", fontSize: "0.85rem", margin: "0 0 1.75rem" }}>
        <Link href={`/accounts/${account.id}`} style={{ color: "var(--jade)" }}>
          {account.email}
        </Link>
        {ticket.venue ? ` · ${ticket.venue.name}` : ""} · opened{" "}
        {when(ticket.createdAt)} ·{" "}
        <span style={{ color: state.colour }}>{state.label}</span>
      </p>

      <div style={{ marginBottom: "1.75rem" }}>
        {/* The labels are inverted from the customer's view: the same message
            is "Reviewslip" to them and "You" to whoever is reading here. */}
        <Thread messages={messages} staffLabel="You" customerLabel={account.email} />
      </div>

      <ReplyBox
        action={reply}
        placeholder="Write a reply — it goes to them by email as well"
        submitLabel="Send reply"
      />

      {ticket.status !== "closed" ? (
        <div style={{ marginTop: "1.25rem" }}>
          <form action={closeTicket}>
            <button type="submit" className="btn btn-quiet">
              Close it
            </button>
          </form>
          <p style={{ color: "var(--cream-faint)", fontSize: "0.85rem", margin: "0.6rem 0 0" }}>
            Closing frees their one ticket slot. A reply from them reopens it
            rather than starting a new thread.
          </p>
        </div>
      ) : null}
    </>
  );
}
