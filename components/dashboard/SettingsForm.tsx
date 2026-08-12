"use client";

import { useActionState, useState } from "react";

import type { BusinessSettings } from "@/lib/customer";

export interface BusinessState {
  error?: string;
  ok?: boolean;
  /** A save that worked but is worth reading — a stale model slug, say. */
  warning?: string;
}

type Action = (state: BusinessState, formData: FormData) => Promise<BusinessState>;

const EMPTY: BusinessState = {};

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.65rem 0.8rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "rgba(243,236,220,0.06)",
  color: "var(--paper)",
  font: "inherit",
};

const label: React.CSSProperties = { fontSize: "0.85rem", fontWeight: 500 };
const hint: React.CSSProperties = { fontSize: "0.8rem", color: "var(--ink-soft)" };
const field: React.CSSProperties = { display: "grid", gap: "0.35rem" };

/** Says where an inherited value came from, so nothing reads as a mystery. */
function Origin({ source }: { source: string }) {
  if (source === "subscriber") return null;
  return (
    <em style={{ ...hint, fontStyle: "normal", marginLeft: "0.4rem" }}>
      {source === "env" ? "inherited" : "default"}
    </em>
  );
}

export default function SettingsForm({
  action,
  name,
  settings,
}: {
  action: Action;
  name: string;
  settings: BusinessSettings;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  // The one genuinely interactive part: a list that grows and shrinks. Every row
  // is an input of the same name, so the action reads them all with getAll.
  const [details, setDetails] = useState<string[]>(
    settings.safeDetails.value.length ? settings.safeDetails.value : [""]
  );
  const full = details.length >= settings.limits.safeDetails;

  return (
    <form action={formAction} style={{ display: "grid", gap: "1.25rem", maxWidth: "34rem" }}>
      <div style={field}>
        <label style={label} htmlFor="name">Business name</label>
        <input style={input} id="name" name="name" defaultValue={name} maxLength={120} required />
      </div>

      <div style={field}>
        <label style={label} htmlFor="googleUrl">
          Google review link
          <Origin source={settings.googleUrl.source} />
        </label>
        <input
          style={input}
          id="googleUrl"
          name="googleUrl"
          type="url"
          defaultValue={settings.googleUrl.value}
          placeholder="https://www.google.com/maps?cid=…"
        />
        <span style={hint}>
          Where Proceed to Google sends the guest. Without it they get a review
          and nowhere to post it.
        </span>
      </div>

      <div style={field}>
        <label style={label} htmlFor="tripadvisorUrl">
          Tripadvisor link
          <Origin source={settings.tripadvisorUrl.source} />
        </label>
        <input
          style={input}
          id="tripadvisorUrl"
          name="tripadvisorUrl"
          type="url"
          defaultValue={settings.tripadvisorUrl.value}
        />
        <span style={hint}>Optional. Empty keeps the button off the page.</span>
      </div>

      <div style={field}>
        <label style={label} htmlFor="kind">
          What this place is
          <Origin source={settings.kind.source} />
        </label>
        <input
          style={input}
          id="kind"
          name="kind"
          defaultValue={settings.kind.value}
          maxLength={120}
          placeholder="a small lodge"
        />
        <span style={hint}>How a review refers to it, mid-sentence.</span>
      </div>

      <div style={field}>
        <label style={label} htmlFor="place">
          Where it is
          <Origin source={settings.place.source} />
        </label>
        <input
          style={input}
          id="place"
          name="place"
          defaultValue={settings.place.value}
          maxLength={160}
          placeholder="San Kamphaeng, Chiang Mai, Thailand"
        />
      </div>

      <div style={field}>
        <span style={label}>
          Details reviews may use
          <Origin source={settings.safeDetails.source} />
        </span>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {details.map((detail, index) => (
            <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                style={input}
                name="safeDetails"
                defaultValue={detail}
                maxLength={180}
                placeholder="something a guest could see for themselves"
              />
              <button
                type="button"
                aria-label="Remove detail"
                onClick={() => setDetails(details.filter((_, i) => i !== index))}
                style={{
                  flex: "0 0 auto",
                  width: "2.2rem",
                  borderRadius: 10,
                  border: "1px solid var(--jade-line)",
                  background: "transparent",
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={full}
            onClick={() => setDetails([...details, ""])}
          >
            {full ? `${settings.limits.safeDetails} is the maximum` : "Add detail"}
          </button>
        </div>
        <span style={hint}>
          The only things a review is allowed to claim about this business. A wrong
          one is repeated in every review from then on, not just one — so no
          numbers, no awards, no staff or dish names. Empty the list to fall back
          to the defaults.
        </span>
      </div>

      <div style={field}>
        <label style={label} htmlFor="websiteUrl">
          Business website
          <Origin source={settings.websiteUrl.source} />
        </label>
        <input
          style={input}
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          defaultValue={settings.websiteUrl.value}
        />
        <span style={hint}>Guests never see it.</span>
      </div>

      <p
        aria-live="polite"
        style={{
          minHeight: "1.25rem",
          fontSize: "0.88rem",
          color: state.error ? "#e98b7b" : "var(--jade)",
        }}
      >
        {state.error ?? state.warning ?? (state.ok ? "Saved." : "")}
      </p>

      <div>
        <button className="btn btn-go" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
