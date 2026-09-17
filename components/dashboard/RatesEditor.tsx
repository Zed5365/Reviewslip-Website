"use client";

import { useState } from "react";
import type { RateCalendar, RateNight, RoomGroup } from "@/lib/customer";

export interface RateResult {
  error?: string;
}

const field: React.CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "var(--shade-soft)",
  color: "var(--cream)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  marginBottom: "0.25rem",
  color: "var(--cream)",
};

function headOf(night: string) {
  const d = new Date(`${night}T12:00:00Z`);
  return {
    day: d.getUTCDate(),
    weekday: ["S", "M", "T", "W", "T", "F", "S"][d.getUTCDay()],
    weekend: d.getUTCDay() === 0 || d.getUTCDay() === 6,
  };
}

/** What a night's cell says, in one place so the grid and the legend agree. */
function cellOf(n: RateNight) {
  if (n.closed) return { text: "—", title: "Not selling", tone: "closed" };
  if (n.amount === null) {
    return { text: "?", title: "No price set", tone: "unpriced" };
  }
  const marks: string[] = [];
  if (n.closedToArrival) marks.push("no arrivals");
  if (n.minNights && n.minNights > 1) marks.push(`min ${n.minNights}`);
  return {
    text: n.amount,
    title: marks.length ? marks.join(" · ") : n.night,
    tone: n.override ? "override" : "base",
    flag: n.closedToArrival || (n.minNights ?? 0) > 1,
  };
}

/**
 * Rates: the base price per room type, and a range editor for the seasons.
 *
 * Set once, adjusted a few times a year. So the grid is read-only and every
 * change goes through the range form — a spreadsheet of editable cells looks
 * powerful and is how somebody changes March by accident while aiming at May.
 *
 * The form writes only the fields that are filled in. Leaving the price blank
 * and setting a minimum stay does exactly that, and does not wipe the price it
 * did not mention.
 */
/**
 * What a restriction control is asking for.
 *
 * Three states, not two, and this is the whole fix for a real bug. A checkbox
 * has an off that means both "leave whatever is there" and "take it off", and
 * the code could only tell them apart by watching whether somebody had touched
 * it — which fails the moment the form resets after a save. So once a night was
 * marked not-selling there was no way back to selling it, and because the grid
 * draws closed before price, a night you had just priced still showed "—".
 *
 * A form that edits a *range* cannot show the current state of those nights —
 * they may all differ. So each control states its intention instead.
 */
type Wish = "keep" | "on" | "off";

export default function RatesEditor({
  calendar,
  groups,
  createPlan,
  setRange,
}: {
  calendar: RateCalendar;
  groups: RoomGroup[];
  createPlan: (groupId: number, name: string, base: string) => Promise<RateResult>;
  setRange: (
    planId: number,
    patch: Record<string, unknown>
  ) => Promise<RateResult>;
}) {
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);

  /*
   * The chosen rate, and a correction for the case that used to lose a whole
   * afternoon of pricing.
   *
   * Adding the first rate refreshes this page's data through a Server Action,
   * which re-renders the editor with the new plan in `calendar.plans` — but
   * does not remount it, so the initialiser below does not run again and
   * `planId` stays 0. The select still *looks* right, because a controlled
   * select whose value matches no option leaves the browser showing the first
   * one. Then Apply reads 0, returns at the guard, and nothing happens: no
   * price, no error, not even a cleared field. The only way out was a reload,
   * and nothing on the page said so.
   *
   * Corrected during render rather than in an effect — the same reason as the
   * form restore in NewBooking: an effect would render the broken state first.
   */
  const planIds = calendar.plans.map((p) => p.id);
  const [planId, setPlanId] = useState<number>(planIds[0] ?? 0);
  if (planIds.length > 0 && !planIds.includes(planId)) setPlanId(planIds[0]);
  const first = calendar.nights[0] ?? "";
  const last = calendar.nights[calendar.nights.length - 1] ?? "";
  const [from, setFrom] = useState(first);
  const [to, setTo] = useState(last);

  const [amount, setAmount] = useState("");
  const [stay, setStay] = useState<Wish>("keep");
  const [minNights, setMinNights] = useState("");
  const [closed, setClosed] = useState<Wish>("keep");
  const [cta, setCta] = useState<Wish>("keep");

  /*
   * Re-seed the dates when the server sends a different window.
   *
   * "Earlier" and "Later" change only `?start=`, and a navigation that changes
   * nothing but the search params does not remount this component — the router
   * cache key drops them deliberately. So the props arrive with next month's
   * nights while `from` and `to` still hold last month's, and Apply writes the
   * price to a month nobody is looking at. It saves, the grid on screen does
   * not move, and there is no error to explain why: the single most convincing
   * way to make a working feature look broken.
   *
   * Calendar.tsx re-seeds for exactly this reason. This is the same fix.
   */
  const [seen, setSeen] = useState(first);
  if (first !== seen) {
    setSeen(first);
    setFrom(first);
    setTo(last);
  }

  // The same correction, for the same reason: room types can arrive after
  // this mounted, and a zero here makes Add do nothing quietly.
  const groupIds = groups.map((g) => g.id);
  const [newGroup, setNewGroup] = useState<number>(groupIds[0] ?? 0);
  if (groupIds.length > 0 && !groupIds.includes(newGroup)) setNewGroup(groupIds[0]);
  const [newName, setNewName] = useState("Standard");
  const [newBase, setNewBase] = useState("");

  async function apply() {
    if (busy) return;
    // Should be unreachable now that planId is corrected during render. Kept
    // as a backstop that says something, because the bug this replaces was
    // invisible: a button that does nothing teaches people the page is broken.
    if (!planId) {
      setProblem("Pick a rate first — reload the page if the list looks empty.");
      return;
    }
    setBusy(true);
    setProblem("");

    /*
     * Only what was asked for.
     *
     * An empty price means "leave the price alone", not "set it to nothing" —
     * the difference between adjusting a season and wiping one. The API reads
     * an absent key the same way, and an explicit null as "clear it", so this
     * maps one to one onto what the three selects say.
     */
    const patch: Record<string, unknown> = { from, to };
    if (amount.trim() !== "") patch.amount = amount.trim();
    if (stay === "off") patch.minNights = null;
    if (stay === "on" && minNights.trim() !== "") {
      patch.minNights = Number(minNights);
    }
    if (closed !== "keep") patch.closed = closed === "on";
    if (cta !== "keep") patch.closedToArrival = cta === "on";

    if (stay === "on" && minNights.trim() === "") {
      setBusy(false);
      setProblem("How many nights is the minimum?");
      return;
    }

    if (Object.keys(patch).length === 2) {
      setBusy(false);
      setProblem("Nothing to apply — set a price, a minimum stay, or a closure.");
      return;
    }

    try {
      const result = await setRange(planId, patch);
      if (result.error) setProblem(result.error);
      else {
        setAmount("");
        setStay("keep");
        setMinNights("");
        setClosed("keep");
        setCta("keep");
      }
    } catch {
      // A rejected action rather than a refused one: a tab left open across a
      // deploy, or the server gone. Without this the `finally` never ran, busy
      // stayed true, and every field on the card was disabled for good with the
      // button reading "Applying…" — which looks exactly like a hung save.
      setProblem("Could not reach the server. Reload the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function addPlan() {
    if (busy) return;
    if (!newGroup) {
      setProblem("Add a room type on the Rooms page first — a rate belongs to one.");
      return;
    }
    setBusy(true);
    setProblem("");
    try {
      const result = await createPlan(newGroup, newName.trim(), newBase.trim());
      if (result.error) setProblem(result.error);
      else setNewBase("");
    } catch {
      setProblem("Could not reach the server. Reload the page and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {problem ? (
        <p className="cal-problem" role="alert">
          {problem}
        </p>
      ) : null}

      {calendar.plans.length === 0 ? (
        <p className="admin-empty" style={{ marginBottom: "1.5rem" }}>
          No rates yet. Add one below and the calendar will fill in.
        </p>
      ) : (
        <div className="admin-scroll" style={{ marginBottom: "1.5rem" }}>
          <table className="cal rate-grid">
            <thead>
              <tr>
                <th className="cal-room">Rate</th>
                {calendar.nights.map((night) => {
                  const h = headOf(night);
                  return (
                    <th
                      key={night}
                      className={h.weekend ? "cal-night weekend" : "cal-night"}
                    >
                      <span className="cal-weekday">{h.weekday}</span>
                      <span className="cal-day">{h.day}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {calendar.plans.map((plan) => (
                <tr key={plan.id}>
                  <th scope="row" className="cal-room">
                    {plan.name}
                    <span className="cal-type">
                      {plan.groupName}
                      {plan.base ? ` · base ${plan.base}` : " · no base price"}
                    </span>
                  </th>
                  {plan.byNight.map((n) => {
                    const cell = cellOf(n);
                    return (
                      <td
                        key={n.night}
                        className={`rate-cell ${cell.tone}`}
                        title={cell.title}
                      >
                        {cell.text}
                        {cell.flag ? <i className="rate-flag" aria-hidden="true" /> : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="rate-legend">
        <span className="swatch base" /> base price
        <span className="swatch override" /> set for that night
        <span className="swatch closed" /> not selling
        <span className="swatch unpriced" /> no price
        <span className="swatch flagged" /> minimum stay or no arrivals
      </p>

      {/* ------------------------------------------------- the range editor */}

      {calendar.plans.length > 0 ? (
        <div className="admin-card">
          <h2>Set a range</h2>
          <p className="admin-sub" style={{ marginBottom: "1rem" }}>
            Both dates are nights, and the last one is included. Leave a field
            blank to keep the price that is already there, and the rest on
            &ldquo;Leave as it is&rdquo; to change nothing but the price.
          </p>

          <div
            style={{
              display: "grid",
              gap: "0.9rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(9rem, 1fr))",
            }}
          >
            <div>
              <label htmlFor="r-plan" style={label}>
                Rate
              </label>
              <select
                id="r-plan"
                value={planId}
                disabled={busy}
                onChange={(e) => setPlanId(Number(e.target.value))}
                style={{ ...field, width: "100%", appearance: "auto" }}
              >
                {calendar.plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.groupName} — {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="r-from" style={label}>
                First night
              </label>
              <input
                id="r-from"
                type="date"
                value={from}
                disabled={busy}
                onChange={(e) => setFrom(e.target.value)}
                style={{ ...field, width: "100%" }}
              />
            </div>

            <div>
              <label htmlFor="r-to" style={label}>
                Last night
              </label>
              <input
                id="r-to"
                type="date"
                value={to}
                disabled={busy}
                onChange={(e) => setTo(e.target.value)}
                style={{ ...field, width: "100%" }}
              />
            </div>

            <div>
              <label htmlFor="r-amount" style={label}>
                Price a night
              </label>
              <input
                id="r-amount"
                inputMode="decimal"
                value={amount}
                disabled={busy}
                placeholder="1,200"
                onChange={(e) => setAmount(e.target.value)}
                style={{ ...field, width: "100%" }}
              />
            </div>

            <div>
              <label htmlFor="r-min" style={label}>
                Minimum stay
              </label>
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <select
                  id="r-min-wish"
                  aria-label="Minimum stay"
                  value={stay}
                  disabled={busy}
                  onChange={(e) => setStay(e.target.value as Wish)}
                  style={{ ...field, flex: "1 1 0", minWidth: 0, appearance: "auto" }}
                >
                  <option value="keep">Leave as it is</option>
                  <option value="on">At least</option>
                  <option value="off">No minimum</option>
                </select>
                {stay === "on" ? (
                  <input
                    id="r-min"
                    type="number"
                    min={1}
                    max={90}
                    value={minNights}
                    disabled={busy}
                    aria-label="Nights"
                    onChange={(e) => setMinNights(e.target.value)}
                    style={{ ...field, width: "4.5rem" }}
                  />
                ) : null}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(11rem, 1fr))",
              margin: "1rem 0",
            }}
          >
            <div>
              <label htmlFor="r-closed" style={label}>
                Selling
              </label>
              <select
                id="r-closed"
                value={closed}
                disabled={busy}
                onChange={(e) => setClosed(e.target.value as Wish)}
                style={{ ...field, width: "100%", appearance: "auto" }}
              >
                <option value="keep">Leave as it is</option>
                <option value="on">Not selling these nights</option>
                <option value="off">Selling these nights</option>
              </select>
            </div>

            <div>
              <label htmlFor="r-cta" style={label}>
                Arrivals
              </label>
              <select
                id="r-cta"
                value={cta}
                disabled={busy}
                onChange={(e) => setCta(e.target.value as Wish)}
                style={{ ...field, width: "100%", appearance: "auto" }}
              >
                <option value="keep">Leave as it is</option>
                <option value="on">No arrivals on these nights</option>
                <option value="off">Arrivals allowed</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-go"
            disabled={busy}
            onClick={() => void apply()}
          >
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      ) : null}

      {/* ------------------------------------------------------- a new rate */}

      <div className="admin-card">
        <h2>Add a rate</h2>
        <p className="admin-sub" style={{ marginBottom: "1rem" }}>
          One per room type is enough to start. More — non-refundable, with
          breakfast — is what the channels expect later.
        </p>

        {groups.length === 0 ? (
          <p style={{ margin: 0, color: "var(--admin-muted)", fontSize: "0.9rem" }}>
            Add a room type first — a rate prices one.
          </p>
        ) : (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <select
              value={newGroup}
              disabled={busy}
              aria-label="Room type"
              onChange={(e) => setNewGroup(Number(e.target.value))}
              style={{ ...field, flex: "1 1 12rem", appearance: "auto" }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <input
              value={newName}
              disabled={busy}
              maxLength={60}
              aria-label="Rate name"
              onChange={(e) => setNewName(e.target.value)}
              style={{ ...field, flex: "1 1 10rem" }}
            />
            <input
              value={newBase}
              disabled={busy}
              inputMode="decimal"
              placeholder="Base price"
              aria-label="Base price a night"
              onChange={(e) => setNewBase(e.target.value)}
              style={{ ...field, flex: "0 1 9rem" }}
            />
            <button
              type="button"
              className="btn btn-go"
              disabled={busy}
              onClick={() => void addPlan()}
            >
              Add
            </button>
          </div>
        )}
      </div>
    </>
  );
}
