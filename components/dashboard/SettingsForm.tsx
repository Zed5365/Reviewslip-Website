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

/** What reading the website can produce, per button. */
type Analysis = {
  ok: boolean;
  kind?: string;
  place?: string;
  details?: string[];
  error?: string;
};
type Topics = { categories?: Suggestion[]; error?: string };
type Context = { contextDoc?: string; dropped?: string[]; error?: string };

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
const row: React.CSSProperties = { display: "flex", gap: "0.6rem", flexWrap: "wrap" };

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
  draftContext,
  name,
  settings,
}: {
  action: Action;
  /** Reads the website and proposes the description and the details. */
  analyse: () => Promise<Analysis>;
  /** Reads the website and proposes topics. Fills the editor; saves nothing. */
  suggest: () => Promise<Topics>;
  /** Reads the website and the listings, and drafts the AI context. */
  draftContext: () => Promise<Context>;
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

  // Controlled rather than defaultValue, unlike the link fields: every one of
  // these can be filled in by reading the website, and an uncontrolled input
  // ignores a value that arrives after it mounted.
  const [details, setDetails] = useState<string[]>(settings.safeDetails.value);
  const [context, setContext] = useState(settings.contextDoc.value);
  const [kind, setKind] = useState(settings.kind.value);
  const [place, setPlace] = useState(settings.place.value);

  const [busy, startBusy] = useTransition();
  const [notice, setNotice] = useState("");
  // Which button is working, so it can say so. Reading a website through the
  // model takes twenty seconds or more, and a button that only greys out for
  // that long reads as broken.
  const [reading, setReading] = useState<"analyse" | "suggest" | "context" | null>(
    null
  );

  const full = cats.length >= settings.limits.categories;
  const detailsFull = details.length >= settings.limits.safeDetails;

  function setCat(index: number, patch: Partial<Suggestion>) {
    setCats(cats.map((cat, i) => (i === index ? { ...cat, ...patch } : cat)));
  }

  /**
   * Every one of the three buttons does the same thing around a different call:
   * say what is happening, wait, then either report or fill the editor. Reading
   * takes long enough that the shared "this can take a minute" is load-bearing.
   */
  function read<T extends { error?: string }>(
    which: "analyse" | "suggest" | "context",
    call: () => Promise<T>,
    apply: (result: T) => string
  ) {
    setReading(which);
    setNotice("Reading the website — this can take up to a minute.");
    startBusy(async () => {
      // Annotated, or the fallback narrows the union and the success fields
      // vanish from the type.
      const result = await call().catch(
        () => ({ error: "Could not read the website." }) as T
      );
      setReading(null);
      setNotice(result.error ?? apply(result));
    });
  }

  function onAnalyse() {
    read("analyse", analyse, (result) => {
      if (result.kind) setKind(result.kind);
      if (result.place) setPlace(result.place);
      if (result.details?.length) setDetails(result.details);

      return result.details?.length
        ? `Proposed ${result.details.length} detail${result.details.length === 1 ? "" : "s"} below. Edit anything, then Save to keep them.`
        : "Nothing checkable came back from that page.";
    });
  }

  function onSuggest() {
    read("suggest", suggest, (result) => {
      if (!result.categories?.length) return "Nothing usable came back.";
      setCats(result.categories);
      return `Proposed ${result.categories.length} topics below. Edit anything, then Save to keep them.`;
    });
  }

  function onDraftContext() {
    read("context", draftContext, (result) => {
      if (!result.contextDoc) return "Nothing usable came back.";
      setContext(result.contextDoc);

      const cut = result.dropped?.length ?? 0;
      return cut
        ? `Drafted below, with ${cut} sentence${cut === 1 ? "" : "s"} dropped for claiming something a customer could not check. Read it, then Save.`
        : "Drafted below. Read it, edit anything, then Save to keep it.";
    });
  }

  return (
    <form
      action={formAction}
      // Whatever the last website read had to say is stale the moment a save
      // starts, and leaving it up would hide "Saved." behind it.
      onSubmit={() => setNotice("")}
      style={{ display: "grid", gap: "1.25rem", maxWidth: "34rem" }}
    >
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
          Save this first — every Read the website button below works from it.
          Customers never see it.
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

      {/* ---------------------------------------------------------- identity */}

      {/* These two were being cleared on every save: the form never showed them,
          and an absent field arrives as an empty string, which reads as "clear
          it". Reading the website filled them in and the next Save wiped them. */}
      <div style={field}>
        <label style={label} htmlFor="kind">
          What kind of business
          <Origin source={settings.kind.source} />
        </label>
        <input
          style={input}
          id="kind"
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          maxLength={120}
          placeholder="a small lodge, a dental clinic, a bike shop"
        />
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
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          maxLength={160}
          placeholder="town, region, country"
        />
      </div>

      {/* ------------------------------------------------------- AI context */}

      <div style={field}>
        <label style={label} htmlFor="contextDoc">
          AI context
          <Origin source={settings.contextDoc.source} />
        </label>
        <textarea
          style={{ ...input, minHeight: "11rem", lineHeight: 1.55, resize: "vertical" }}
          id="contextDoc"
          name="contextDoc"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          maxLength={settings.limits.contextDoc}
          placeholder="Who comes here, what they tend to mention afterwards, and how their reviews read."
        />

        <div style={row}>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy}
            onClick={onDraftContext}
          >
            {reading === "context"
              ? "Reading…"
              : context
                ? "Redraft from website"
                : "Draft from website"}
          </button>
          <span style={{ ...hint, alignSelf: "center" }}>
            {context.length}/{settings.limits.contextDoc}
          </span>
        </div>

        <span style={hint}>
          Background for the writer: who your customers are, what they notice, and
          how a real review of a place like yours reads. It steers tone and
          subject matter — it is not a list of facts, and the writer is told not
          to repeat claims from it. Drafting reads your website and any review
          links above, because how your own customers already write is the most
          useful thing here.
        </span>
      </div>

      {/* ----------------------------------------------------------- topics */}

      <div style={field}>
        <span style={label}>
          Review topics
          <Origin source={settings.categories.source} />
          <em style={{ ...hint, fontStyle: "normal", marginLeft: "0.4rem" }}>
            {cats.length}/{settings.limits.categories}
          </em>
        </span>

        <div style={{ display: "grid", gap: "0.4rem" }}>
          {/* Controlled, not defaultValue. Generating topics replaces the whole
              list while the row keys stay 0..n, so React reuses these inputs —
              and an input the person has typed into ignores a new defaultValue,
              which would leave the old topics on screen under the new ones. */}
          {cats.map((cat, index) => (
            <div key={index} style={{ display: "flex", gap: "0.4rem" }}>
              <input
                style={{ ...input, flex: "0 0 9rem", padding: "0.5rem 0.65rem" }}
                name="catLabel"
                value={cat.label}
                onChange={(e) => setCat(index, { label: e.target.value })}
                maxLength={40}
                placeholder="Rooms"
                aria-label={`Topic ${index + 1} name`}
              />
              <input
                style={{ ...input, padding: "0.5rem 0.65rem" }}
                name="catFocus"
                value={cat.focus}
                onChange={(e) => setCat(index, { focus: e.target.value })}
                maxLength={200}
                placeholder="what a review under this topic talks about"
                aria-label={`Topic ${index + 1} note`}
              />
              <button
                type="button"
                aria-label={`Remove topic ${index + 1}`}
                onClick={() => setCats(cats.filter((_, i) => i !== index))}
                style={remove}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={row}>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={full}
            onClick={() => setCats([...cats, { label: "", focus: "" }])}
          >
            {full ? `${settings.limits.categories} is the maximum` : "Add topic"}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy}
            onClick={onSuggest}
          >
            {reading === "suggest" ? "Reading…" : "Generate from website"}
          </button>
        </div>

        <span style={hint}>
          What a customer picks from, up to {settings.limits.categories}. The guest
          page shows ten of them drawn at random with the rest behind a browse
          button, so a deep list is worth having: two customers an hour apart get
          offered different things and lead with different subjects. The note
          steers what that review talks about; leave it blank to go on the name
          alone.
        </span>
      </div>

      {/* ---------------------------------------------------------- details */}

      <div style={field}>
        <span style={label}>
          Details reviews may use
          <Origin source={settings.safeDetails.source} />
          <em style={{ ...hint, fontStyle: "normal", marginLeft: "0.4rem" }}>
            {details.length}/{settings.limits.safeDetails}
          </em>
        </span>

        <div style={{ display: "grid", gap: "0.4rem" }}>
          {details.map((detail, index) => (
            <div key={index} style={{ display: "flex", gap: "0.4rem" }}>
              <input
                style={{ ...input, padding: "0.5rem 0.65rem" }}
                name="detail"
                value={detail}
                onChange={(e) =>
                  setDetails(
                    details.map((d, i) => (i === index ? e.target.value : d))
                  )
                }
                maxLength={180}
                placeholder="clean, comfortable rooms"
                aria-label={`Detail ${index + 1}`}
              />
              <button
                type="button"
                aria-label={`Remove detail ${index + 1}`}
                onClick={() => setDetails(details.filter((_, i) => i !== index))}
                style={remove}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div style={row}>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={detailsFull}
            onClick={() => setDetails([...details, ""])}
          >
            {detailsFull
              ? `${settings.limits.safeDetails} is the maximum`
              : "Add detail"}
          </button>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={busy}
            onClick={onAnalyse}
          >
            {reading === "analyse"
              ? "Reading…"
              : details.length
                ? "Re-read website"
                : "Read website"}
          </button>
        </div>

        <span style={hint}>
          The only things a review is allowed to claim about this business. Keep
          every one of them true: a wrong detail is repeated in every review from
          then on, not just one. No numbers, and nothing a customer could not
          check with their own eyes — Save will tell you which line and why.
          Reading the website proposes these from your own pages, which is the
          safest way to fill them in.
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
        {/* `notice ?? …` never fell through: an empty string is not nullish, so
            a clean save showed a blank line instead of saying it had saved. */}
        {state.error ?? state.warning ?? (notice || (state.ok ? "Saved." : ""))}
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
