"use client";

import { useState, useTransition } from "react";

export interface ChecklistItem {
  id: number;
  groupId: number | null;
  groupName: string | null;
  label: string;
}

export interface RoomState {
  id: string;
  label: string;
  note: string;
}

/**
 * What has to be done in a room, and what state each room is in.
 *
 * Both on the Rooms page because both are properties of rooms, and because
 * somebody setting a property up does the two together: these are the types,
 * this is what cleaning one means, and that one is being retiled.
 *
 * The list is per type. An item with no type belongs to every room, which is
 * where most of them end up — the bathroom gets cleaned whatever the room is
 * called — so that is the default the form offers.
 */
export default function CleaningStandard({
  items,
  groups,
  rooms,
  states,
  addItem,
  removeItem,
  setStatus,
}: {
  items: ChecklistItem[];
  groups: { id: number; name: string }[];
  rooms: { id: number; name: string; groupName: string | null; status: string }[];
  states: RoomState[];
  addItem: (
    label: string,
    groupId: number | null
  ) => Promise<{ ok: boolean; error?: string }>;
  removeItem: (id: number) => Promise<{ ok: boolean; error?: string }>;
  setStatus: (id: number, status: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState<string>("");
  const [problem, setProblem] = useState("");
  const [pending, start] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!label.trim()) return;
    setProblem("");
    start(async () => {
      const result = await addItem(
        label.trim(),
        group === "" ? null : Number(group)
      ).catch((): { ok: boolean; error?: string } => ({ ok: false }));
      if (result.ok) setLabel("");
      else setProblem(result.error ?? "That could not be saved.");
    });
  }

  function drop(id: number) {
    setProblem("");
    start(async () => {
      const result = await removeItem(id).catch(
        (): { ok: boolean; error?: string } => ({ ok: false })
      );
      if (!result.ok) setProblem(result.error ?? "That could not be removed.");
    });
  }

  function change(id: number, status: string) {
    setProblem("");
    start(async () => {
      const result = await setStatus(id, status).catch(
        (): { ok: boolean; error?: string } => ({ ok: false })
      );
      if (!result.ok) setProblem(result.error ?? "That could not be changed.");
    });
  }

  const general = items.filter((i) => i.groupId === null);
  const byType = groups
    .map((g) => ({ group: g, mine: items.filter((i) => i.groupId === g.id) }))
    .filter((t) => t.mine.length > 0);

  return (
    <>
      <section style={card}>
        <h2 style={heading}>What cleaning a room means</h2>
        <p style={lede}>
          Housekeepers see this on their phone, under each room, and tick it off
          as they go. Lines with no room type apply to every room; put a type on
          one when the job only exists there &mdash; a staircase, a sofa bed.
        </p>

        <form onSubmit={add} style={form}>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Bathroom clean"
            maxLength={80}
            aria-label="What needs doing"
            style={input}
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Which room type"
            style={select}
          >
            <option value="">Every room</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} only
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-go" disabled={pending || !label.trim()}>
            Add
          </button>
        </form>

        {problem && (
          <p role="status" style={{ margin: "0.6rem 0 0", fontSize: "0.82rem", color: "var(--warn, #d98c3a)" }}>
            {problem}
          </p>
        )}

        {items.length === 0 ? (
          <p style={empty}>
            Nothing yet. Until there is, the board shows the room and the job
            and leaves the standard to whoever is holding the mop.
          </p>
        ) : (
          <div style={{ display: "grid", gap: "1.2rem", marginTop: "1.2rem" }}>
            {general.length > 0 && (
              <Block title="Every room" items={general} onDrop={drop} busy={pending} />
            )}
            {byType.map(({ group: g, mine }) => (
              <Block key={g.id} title={`${g.name} only`} items={mine} onDrop={drop} busy={pending} />
            ))}
          </div>
        )}
      </section>

      <section style={card}>
        <h2 style={heading}>Rooms out of use</h2>
        <p style={lede}>
          {states.map((s) => (
            <span key={s.id} style={{ display: "block" }}>
              <strong style={{ fontWeight: 500 }}>{s.label}</strong> &mdash; {s.note}
            </span>
          ))}
        </p>

        <ul style={list}>
          {rooms.map((room) => (
            <li key={room.id} style={row}>
              <span>
                <strong style={{ fontWeight: 600 }}>{room.name}</strong>{" "}
                <span style={{ color: "var(--ink-soft)", fontSize: "0.82rem" }}>
                  {room.groupName}
                </span>
              </span>
              <select
                value={room.status === "out_of_service" ? "renovating" : room.status}
                onChange={(e) => change(room.id, e.target.value)}
                disabled={pending}
                aria-label={`State of ${room.name}`}
                style={select}
              >
                {states.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Block({
  title,
  items,
  onDrop,
  busy,
}: {
  title: string;
  items: ChecklistItem[];
  onDrop: (id: number) => void;
  busy: boolean;
}) {
  return (
    <div>
      <h3 style={blockHead}>{title}</h3>
      <ul style={list}>
        {items.map((item) => (
          <li key={item.id} style={row}>
            <span>{item.label}</span>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={() => onDrop(item.id)}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const card: React.CSSProperties = {
  background: "var(--paper)",
  color: "var(--ink)",
  borderRadius: 14,
  padding: "1.4rem",
  marginTop: "1.5rem",
};

const heading: React.CSSProperties = { fontSize: "1.1rem", margin: "0 0 0.35rem" };

const lede: React.CSSProperties = {
  margin: "0 0 1rem",
  fontSize: "0.85rem",
  lineHeight: 1.6,
  color: "var(--ink-soft)",
};

const form: React.CSSProperties = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
  alignItems: "center",
};

const input: React.CSSProperties = {
  font: "inherit",
  fontSize: "0.9rem",
  flex: "1 1 14rem",
  minWidth: 0,
  padding: "0.45rem 0.6rem",
  borderRadius: 8,
  border: "1px solid rgba(27,42,35,0.2)",
  background: "var(--paper)",
  color: "var(--ink)",
};

const select: React.CSSProperties = {
  font: "inherit",
  fontSize: "0.85rem",
  padding: "0.4rem 0.5rem",
  borderRadius: 8,
  border: "1px solid rgba(27,42,35,0.2)",
  background: "var(--paper)",
  color: "var(--ink)",
};

const blockHead: React.CSSProperties = {
  fontSize: "0.78rem",
  fontWeight: 600,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "var(--ink-soft)",
  margin: "0 0 0.4rem",
};

const list: React.CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.3rem" };

const row: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.4rem 0",
  fontSize: "0.9rem",
  borderTop: "1px solid rgba(27,42,35,0.1)",
};

const empty: React.CSSProperties = {
  margin: "1rem 0 0",
  fontSize: "0.85rem",
  color: "var(--ink-soft)",
};
