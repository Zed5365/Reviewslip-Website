"use client";

import { useActionState, useState, useTransition } from "react";

import { PLATFORMS } from "@/lib/platforms.data";
import type { BusinessSettings } from "@/lib/customer";

/** The settings field behind each platform's link. */
const LINK_FIELD: Record<string, string> = {
  google: "googleUrl",
  tripadvisor: "tripadvisorUrl",
  line: "lineUrl",
  facebook: "facebookUrl",
  xiaohongshu: "xiaohongshuUrl",
  wongnai: "wongnaiUrl",
};

/**
 * The brand mark, or an initial for Wongnai, which simple-icons does not carry.
 * A hand-drawn approximation of a trademark would be recognisably wrong.
 */
function Mark({ label, hex, path }: { label: string; hex: string; path: string | null }) {
  return (
    <span
      aria-hidden="true"
      style={
        path
          ? markBox
          : { ...markBox, background: hex, color: "#fff", fontSize: "0.72rem", fontWeight: 500 }
      }
    >
      {path ? (
        <svg viewBox="0 0 24 24" width="17" height="17" fill={hex} focusable="false">
          <path d={path} />
        </svg>
      ) : (
        label.slice(0, 1)
      )}
    </span>
  );
}

const markBox: React.CSSProperties = {
  flex: "0 0 auto",
  width: "1.9rem",
  height: "1.9rem",
  borderRadius: 8,
  display: "grid",
  placeItems: "center",
  border: "1px solid var(--jade-line)",
};

export interface BusinessState {
  error?: string;
  ok?: boolean;
  /** A save that worked but is worth reading — a stale model slug, say. */
  warning?: string;
}

export interface Suggestion {
  label: string;
  focus: string;
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
  analyse,
  suggest,
  name,
  settings,
}: {
  action: Action;
  /** Reads the website and stores what it finds. Returns how many details. */
  analyse: () => Promise<{ ok: boolean; count?: number; error?: string }>;
  /** Reads the website and proposes buttons. Fills the editor; saves nothing. */
  suggest: () => Promise<{ categories?: Suggestion[]; error?: string }>;
  name: string;
  settings: BusinessSettings;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  const [cats, setCats] = useState<Suggestion[]>(() =>
    settings.categories.value.map((c) => ({
      label: c.label,
      // The server fills a blank note in with the label, so showing that back
      // would turn "no note" into a note the moment it was saved twice.
      focus: c.focus === c.label ? "" : c.focus,
    }))
  );
  const [busy, startBusy] = useTransition();
  const [notice, setNotice] = useState("");
  // Which button is working, so it can say so. Reading a website through the
  // model takes twenty seconds or more, and a button that only greys out for
  // that long reads as broken.
  const [reading, setReading] = useState<"analyse" | "suggest" | null>(null);

  const full = cats.length >= settings.limits.categories;

  function onAnalyse() {
    setReading("analyse");
    setNotice("Reading the website — this can take up to a minute.");
    startBusy(async () => {
      // Annotated, or the fallback narrows the union and the success fields
      // vanish from the type.
      const result = await analyse().catch(
        (): { ok: boolean; count?: number; error?: string } => ({
          ok: false,
          error: "Could not read the website.",
        })
      );
      setReading(null);
      setNotice(
        result.ok
          ? `Stored ${result.count} detail${result.count === 1 ? "" : "s"} from the website.`
          : (result.error ?? "Could not read the website.")
      );
    });
  }

  function onSuggest() {
    setReading("suggest");
    setNotice("Reading the website — this can take up to a minute.");
    startBusy(async () => {
      const result = await suggest().catch(
        (): { categories?: Suggestion[]; error?: string } => ({
          error: "Could not read the website.",
        })
      );
      setReading(null);
      if (result.categories?.length) {
        setCats(result.categories);
        setNotice("Suggested below. Edit anything, then Save to keep them.");
      } else {
        setNotice(result.error ?? "Nothing usable came back.");
      }
    });
  }

  return (
    <form action={formAction} style={{ display: "grid", gap: "1.25rem", maxWidth: "34rem" }}>
      <div style={field}>
        <label style={label} htmlFor="name">Business name</label>
        <input style={input} id="name" name="name" defaultValue={name} maxLength={120} required />
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
        <span style={hint}>
          Save this first, then Analyse reads it. Guests never see it.
        </span>
      </div>

      {PLATFORMS.map((platform) => {
        const key = LINK_FIELD[platform.id];
        const setting = (settings as unknown as Record<string, { value: string; source: string }>)[key];

        return (
          <div style={field} key={platform.id}>
            <label style={label} htmlFor={key}>
              {platform.label} review link
              <Origin source={setting?.source ?? "default"} />
            </label>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
              <Mark label={platform.label} hex={platform.hex} path={platform.path} />
              <input
                style={input}
                id={key}
                name={key}
                type="url"
                defaultValue={setting?.value ?? ""}
                placeholder="https://…"
              />
            </div>
          </div>
        );
      })}

      <span style={{ ...hint, marginTop: "-0.6rem" }}>
        Every link you set gets its own button on the guest page. Leave one empty
        and it stays off — a button that goes nowhere is worse than no button.
      </span>

      {/* ------------------------------------------------------- categories */}

      <div style={field}>
        <span style={label}>
          Review categories
          <Origin source={settings.categories.source} />
        </span>

        <div style={{ display: "grid", gap: "0.5rem" }}>
          {cats.map((cat, index) => (
            <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                style={{ ...input, flex: "0 0 9rem" }}
                name="catLabel"
                defaultValue={cat.label}
                maxLength={40}
                placeholder="Rooms"
              />
              <input
                style={input}
                name="catFocus"
                defaultValue={cat.focus}
                maxLength={200}
                placeholder="what a review under this button talks about"
              />
              <button
                type="button"
                aria-label="Remove category"
                onClick={() => setCats(cats.filter((_, i) => i !== index))}
                style={remove}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={full}
            onClick={() => setCats([...cats, { label: "", focus: "" }])}
          >
            {full ? `${settings.limits.categories} is the maximum` : "Add category"}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy}
            onClick={onSuggest}
          >
            {reading === "suggest" ? "Reading…" : "Suggest from website"}
          </button>
        </div>

        <span style={hint}>
          The buttons a guest picks from, up to {settings.limits.categories}. The
          note steers what that review talks about; leave it blank to go on the
          label alone. Remove them all to fall back to the built-in set.
        </span>
      </div>

      {/* ---------------------------------------------------------- details */}

      <div style={field}>
        <span style={label}>
          Details reviews may use
          <Origin source={settings.safeDetails.source} />
        </span>

        {settings.safeDetails.value.length === 0 ? (
          <p style={hint}>
            Nothing stored yet — Analyse reads the website above and fills this in.
          </p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "0.9rem 1rem",
              display: "grid",
              gap: "0.45rem",
              border: "1px solid var(--jade-line)",
              borderRadius: 10,
              fontSize: "0.9rem",
            }}
          >
            {settings.safeDetails.value.map((detail) => (
              <li key={detail}>— {detail}</li>
            ))}
          </ul>
        )}

        <div>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy}
            onClick={onAnalyse}
          >
            {reading === "analyse"
              ? "Reading…"
              : settings.safeDetails.value.length
                ? "Re-analyse website"
                : "Analyse website"}
          </button>
        </div>

        <span style={hint}>
          The only things a review is allowed to claim about this business, taken
          from its own website. Read only on purpose: these are checked against
          the page they came from, and a claim typed in by hand has nothing
          backing it. A wrong one would be repeated in every review, so if
          something here is off, fix the website and analyse again.
        </span>
      </div>

      <p
        aria-live="polite"
        style={{
          minHeight: "1.25rem",
          fontSize: "0.88rem",
          color: state.error ? "#e98b7b" : "var(--jade)",
        }}
      >
        {state.error ?? state.warning ?? notice ?? (state.ok ? "Saved." : "")}
      </p>

      <div>
        <button className="btn btn-go" type="submit" disabled={pending || busy}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}

const remove: React.CSSProperties = {
  flex: "0 0 auto",
  width: "2.2rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "transparent",
  color: "var(--ink-soft)",
  cursor: "pointer",
};
