"use client";

import { useActionState, useRef, useState, useTransition } from "react";

import ThemeEditor from "@/components/dashboard/ThemeEditor";
import { PLATFORMS } from "@/lib/platforms.data";
import type { BusinessSettings } from "@/lib/customer";
import type { Derived, FontSummary, Palette, StoredFont } from "@/lib/theme";

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
 * The page grew past the point where one column could be scanned.
 *
 * General is everything about the business as a business — what it is called,
 * where it lives, and where its reviews go — plus deleting it, which belongs
 * with identity rather than with anything the writer reads. The other three are
 * the writer's inputs, one concern each.
 *
 * Every panel stays inside one form and the panels are hidden rather than
 * unmounted, so a hidden field is still submitted and switching tabs cannot lose
 * an edit. One Save covers the lot.
 */
const TABS = [
  { id: "general", label: "General" },
  { id: "context", label: "About the business" },
  { id: "topics", label: "Topics" },
  { id: "details", label: "Details" },
  { id: "theme", label: "Theme" },
] as const;

type TabId = (typeof TABS)[number]["id"];

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
export type ThemeDraft = {
  theme?: Palette;
  sources?: Partial<Record<keyof Palette, string>>;
  derived?: Derived;
  adjusted?: string[];
  /** Whether a logo was found and downloaded, or why it was not. */
  logoNote?: string;
  /** The real typefaces taken off the site, file included, per slot. */
  fonts?: { display: StoredFont | null; ui: StoredFont | null };
  /** One line per slot: what was taken, or why it could not be. */
  fontNotes?: string[];
  error?: string;
};

const EMPTY: BusinessState = {};

/** A stored font, as the panel describes it. Mirrors the review app's describeFont. */
function summarise(font: StoredFont | null): FontSummary | null {
  if (!font) return null;
  return {
    family: font.family,
    format: font.format,
    source: font.source,
    kb: Math.round((font.data.length * 3) / 4 / 1024),
  };
}

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

/**
 * One tab's fields.
 *
 * `display` is set here rather than left to the `hidden` attribute, and that is
 * the whole reason this component exists. `hidden` works through the user-agent
 * rule `[hidden] { display: none }`, which any inline style outranks — so a
 * panel carrying an inline `display: grid` stayed on screen with `hidden` set,
 * and every tab rendered at once.
 *
 * The attribute stays alongside it: assistive technology and in-page find both
 * read it, and `display: none` alone says nothing about why. Mounted either way,
 * so a hidden field still reaches FormData and one Save covers all four.
 */
function Panel({
  id,
  current,
  children,
}: {
  id: TabId;
  current: TabId;
  children: React.ReactNode;
}) {
  const on = id === current;
  return (
    <div
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!on}
      style={{ display: on ? "grid" : "none", gap: "1.25rem" }}
    >
      {children}
    </div>
  );
}

/**
 * The website-reading button, at the top of the panel it fills.
 *
 * At the top rather than beside the field it writes into, because it is the
 * first thing to do on the tab and not the last: everything below it is either
 * what the button produced or what you type when it could not. Underneath the
 * fields it read as a footnote, and on the longer tabs you had to scroll past
 * the empty thing you wanted filled to find the control that fills it.
 */
function TopAction({ children }: { children: React.ReactNode }) {
  return <div style={topAction}>{children}</div>;
}

const topAction: React.CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
  alignItems: "center",
  paddingBottom: "1.1rem",
  borderBottom: "1px solid var(--jade-line)",
};

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
  draftTheme,
  previewTheme,
  name,
  settings,
  children,
}: {
  action: Action;
  /** Reads the website and proposes the description and the details. */
  analyse: () => Promise<Analysis>;
  /** Reads the website and proposes topics. Fills the editor; saves nothing. */
  suggest: () => Promise<Topics>;
  /** Reads the website and the listings, and drafts the About text. */
  draftContext: () => Promise<Context>;
  /** Reads the website and picks four colours. */
  draftTheme: () => Promise<ThemeDraft>;
  /** Asks what four colours derive to, so the preview is the served palette. */
  previewTheme: (theme: Palette) => Promise<{ derived?: Derived; adjusted?: string[] }>;
  name: string;
  settings: BusinessSettings;
  /** Deleting the business. Rendered in General, outside the form. */
  children?: React.ReactNode;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);
  const [tab, setTab] = useState<TabId>("general");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  const [palette, setPalette] = useState<Palette>(settings.theme.value);
  const [paletteSources, setPaletteSources] = useState<
    Partial<Record<keyof Palette, string>>
  >({});

  /**
   * The grabbed typefaces.
   *
   * Two pieces of state because they play two roles. `fonts` is what is
   * described on screen — family, size, format — and comes back from the server
   * on load. `fontFiles` is the bytes, and only exists after a draft in this
   * session: Save has to hand them back, and the settings payload deliberately
   * does not carry a couple of hundred kilobytes of base64 just to display a
   * name. So a save that did not re-draft sends nothing for a slot, and the
   * review app leaves what it already has alone.
   */
  // Defaulted rather than trusted. The two apps deploy separately, so this page
  // can be running against a review app that predates the field — and reading
  // through an absent `fonts` took the whole settings page down with a 500,
  // which is a bad way to find out the deploys went out in the wrong order.
  const storedFonts = settings.theme?.fonts ?? { display: null, ui: null };

  const [fonts, setFonts] = useState(storedFonts);
  const [fontFiles, setFontFiles] = useState<{
    display: StoredFont | null;
    ui: StoredFont | null;
  }>({ display: null, ui: null });
  const [rights, setRights] = useState(
    Boolean(storedFonts.display || storedFonts.ui)
  );

  const [busy, startBusy] = useTransition();
  const [notice, setNotice] = useState("");
  // Which button is working, so it can say so. Reading a website through the
  // model takes twenty seconds or more, and a button that only greys out for
  // that long reads as broken.
  const [reading, setReading] = useState<
    "analyse" | "suggest" | "context" | "theme" | null
  >(null);

  const full = cats.length >= settings.limits.categories;
  const detailsFull = details.length >= settings.limits.safeDetails;

  function setCat(index: number, patch: Partial<Suggestion>) {
    setCats(cats.map((cat, i) => (i === index ? { ...cat, ...patch } : cat)));
  }

  /** Roving tabindex plus arrows, which is what a tablist is expected to do. */
  function onTabKey(event: React.KeyboardEvent, index: number) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;

    event.preventDefault();
    const next = (index + step + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[next]?.focus();
  }

  /**
   * Every one of the three buttons does the same thing around a different call:
   * say what is happening, wait, then either report or fill the editor. Reading
   * takes long enough that the shared "this can take a minute" is load-bearing.
   */
  function read<T extends { error?: string }>(
    which: "analyse" | "suggest" | "context" | "theme",
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

      if (!result.details?.length) return "Nothing checkable came back from that page.";

      // It fills fields on two tabs, so it has to say so — otherwise the
      // description quietly changes on a panel nobody is looking at.
      const changed = result.kind || result.place ? ", and the description on About the business" : "";
      return `Proposed ${result.details.length} detail${result.details.length === 1 ? "" : "s"}${changed}. Edit anything, then Save.`;
    });
  }

  function onSuggest() {
    read("suggest", suggest, (result) => {
      if (!result.categories?.length) return "Nothing usable came back.";
      setCats(result.categories);
      return `Proposed ${result.categories.length} topics. Edit anything, then Save to keep them.`;
    });
  }

  function onDraftContext() {
    read("context", draftContext, (result) => {
      if (!result.contextDoc) return "Nothing usable came back.";
      setContext(result.contextDoc);

      const cut = result.dropped?.length ?? 0;
      return cut
        ? `Drafted, with ${cut} sentence${cut === 1 ? "" : "s"} dropped for claiming something a customer could not check. Read it, then Save.`
        : "Drafted below. Read it, edit anything, then Save to keep it.";
    });
  }

  function onDraftTheme() {
    read("theme", draftTheme, (result) => {
      if (!result.theme) return "No usable colours came back.";
      setPalette(result.theme);
      setPaletteSources(result.sources ?? {});

      // The files, and the descriptions drawn from them. A slot that could not
      // be grabbed comes back null and falls to the shortlist.
      const got = result.fonts ?? { display: null, ui: null };
      setFontFiles(got);
      setFonts({
        display: summarise(got.display),
        ui: summarise(got.ui),
      });
      // Re-confirmed per draft: these may be different files from the ones the
      // customer agreed to last time.
      setRights(false);

      const moved = result.adjusted?.length ?? 0;
      const colours = moved
        ? `Picked colours, ${moved} nudged for readability.`
        : "Picked colours from your site.";

      // The logo and each font are fetched over the network and can fail on
      // their own while the rest of the draft is perfectly good, so each says
      // what happened to it.
      return [colours, ...(result.fontNotes ?? []), result.logoNote, "Then Save."]
        .filter(Boolean)
        .join(" ");
    });
  }

  /** Back to the shortlist for one slot, file and all. */
  function onDropFont(slot: "display" | "ui") {
    setFonts({ ...fonts, [slot]: null });
    // Explicitly null rather than absent: absent means "leave what is stored
    // alone", and this is a request to clear it.
    setFontFiles({ ...fontFiles, [slot]: null });
  }

  const counts: Partial<Record<TabId, number>> = {
    topics: cats.length,
    details: details.length,
  };

  return (
    <div style={{ maxWidth: "34rem" }}>
      <div role="tablist" aria-label="Settings sections" style={tablist}>
        {TABS.map((t, index) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={on}
              aria-controls={`panel-${t.id}`}
              tabIndex={on ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, index)}
              style={tabStyle(on)}
            >
              {t.label}
              {counts[t.id] !== undefined && (
                <span style={{ ...hint, marginLeft: "0.35rem" }}>{counts[t.id]}</span>
              )}
            </button>
          );
        })}
      </div>

      <form
        action={formAction}
        // Whatever the last website read had to say is stale the moment a save
        // starts, and leaving it up would hide "Saved." behind it.
        onSubmit={() => setNotice("")}
        style={{ display: "grid", gap: "1.5rem" }}
      >
        {/* ------------------------------------------------------- general */}

        <Panel id="general" current={tab}>
          <div style={field}>
            <label style={label} htmlFor="name">Business name</label>
            {/* Not `required`. With panels hidden rather than unmounted, the
                browser cannot focus an invalid control on a panel you are not
                looking at, and blocks the submit with nothing on screen. The
                API already refuses an empty name and says so. */}
            <input style={input} id="name" name="name" defaultValue={name} maxLength={120} />
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
              Save this first — every Read the website button on the other tabs
              works from it. Customers never see it.
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
            Every link you set gets its own button on the guest page. Leave one
            empty and it stays off — a button that goes nowhere is worse than no
            button.
          </span>
        </Panel>

        {/* ---------------------------------------------------- AI context */}

        <Panel id="context" current={tab}>
          <TopAction>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={onDraftContext}
            >
              {reading === "context"
                ? "Reading…"
                : context
                  ? "Re-draft from website"
                  : "Draft from website"}
            </button>
          </TopAction>

          {/* These two were being cleared on every save: the form never showed
              them, and an absent field arrives as an empty string, which reads
              as "clear it". Reading the website filled them in and the next
              Save wiped them. */}
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
              Location
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

          <div style={field}>
            <label style={label} htmlFor="contextDoc">
              About the business
              <Origin source={settings.contextDoc.source} />
            </label>
            <textarea
              style={{ ...input, minHeight: "13rem", lineHeight: 1.55, resize: "vertical" }}
              id="contextDoc"
              name="contextDoc"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              maxLength={settings.limits.contextDoc}
              placeholder="Who comes here and why, what is nearby, what they tend to mention afterwards, and how their reviews read."
            />

            <span style={{ ...hint, alignSelf: "flex-end" }}>
              {context.length}/{settings.limits.contextDoc} characters — the
              writer reads all of it, so a full one is worth more than a tidy one.
            </span>

            <span style={hint}>
              Background for the writer: who your customers are, where you sit
              and what is around you, what people notice, and how a real review
              of a place like yours reads. Landmarks are worth having in here —
              a station, a beach, a market, whatever someone would say they were
              nearby for — because that is how customers explain why they came.
              It steers tone and subject matter: it is not a list of facts, and
              the writer is told not to repeat claims from it. Fill the space if
              you can. Drafting reads your website and any review links on
              General, because how your own customers already write is the most
              useful thing here.
            </span>
          </div>
        </Panel>

        {/* -------------------------------------------------------- topics */}

        <Panel id="topics" current={tab}>
          <TopAction>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={onSuggest}
            >
              {reading === "suggest"
                ? "Reading…"
                : cats.length
                  ? "Re-generate from website"
                  : "Generate from website"}
            </button>
          </TopAction>

          <div style={field}>
            <span style={label}>
              Review topics
              <Origin source={settings.categories.source} />
              <em style={{ ...hint, fontStyle: "normal", marginLeft: "0.4rem" }}>
                {cats.length}/{settings.limits.categories}
              </em>
            </span>

            <div style={{ display: "grid", gap: "0.4rem" }}>
              {/* Controlled, not defaultValue. Generating topics replaces the
                  whole list while the row keys stay 0..n, so React reuses these
                  inputs — and an input the person has typed into ignores a new
                  defaultValue, which would leave the old topics on screen under
                  the new ones. */}
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
            </div>

            <span style={hint}>
              What a customer picks from, up to {settings.limits.categories}. The
              guest page shows ten of them drawn at random with the rest behind a
              browse button, so a deep list is worth having: two customers an
              hour apart get offered different things and lead with different
              subjects. The note steers what that review talks about; leave it
              blank to go on the name alone.
            </span>
          </div>
        </Panel>

        {/* ------------------------------------------------------- details */}

        <Panel id="details" current={tab}>
          <TopAction>
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
          </TopAction>

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
            </div>

            <span style={hint}>
              The only things a review is allowed to claim about this business.
              Keep every one of them true: a wrong detail is repeated in every
              review from then on, not just one. No numbers, and nothing a
              customer could not check with their own eyes — Save will tell you
              which line and why. Reading the website proposes these from your
              own pages, which is the safest way to fill them in.
            </span>
          </div>
        </Panel>

        {/* --------------------------------------------------------- theme */}

        <Panel id="theme" current={tab}>
          <div style={field}>
            <span style={label}>
              Colours
              <Origin source={settings.theme.source} />
            </span>

            <ThemeEditor
              value={palette}
              derived={settings.theme.derived}
              adjusted={settings.theme.adjusted}
              sources={paletteSources}
              busy={busy}
              reading={reading === "theme"}
              fonts={fonts}
              rightsConfirmed={rights}
              onChange={(patch) => setPalette({ ...palette, ...patch })}
              onDropFont={onDropFont}
              onRights={setRights}
              onGenerate={onDraftTheme}
              preview={previewTheme}
            />

            {/* The files themselves, carried through the form so a save made
                from any tab keeps them. Only present when this session drafted
                them — otherwise the field is absent and the review app leaves
                what it already has. A slot cleared by the customer, or one they
                have not confirmed the rights for, sends an explicit empty
                string, which the review app reads as "drop it". */}
            {(["display", "ui"] as const).map((slot) => {
              const file = fontFiles[slot];
              const send = file && rights ? JSON.stringify(file) : fonts[slot] ? undefined : "";
              return send === undefined ? null : (
                <input
                  key={slot}
                  type="hidden"
                  name={slot === "display" ? "fontDisplay" : "fontUi"}
                  value={send}
                />
              );
            })}

            <span style={hint}>
              Four colours, taken from your own site or set by hand. Everything
              else — tints, borders, the text colour on the paper and inside the
              button — is worked out from them, so you are choosing a palette
              rather than filling in a stylesheet. They apply to your review page
              and to the printed table card.
            </span>
          </div>
        </Panel>

        {/* Outside every panel: one Save covers all four, and an error raised
            by a field on another tab still has somewhere to appear. */}
        <p
          aria-live="polite"
          style={{
            minHeight: "1.25rem",
            fontSize: "0.88rem",
            color: state.error ? "#e98b7b" : "var(--jade)",
          }}
        >
          {/* `notice ?? …` never fell through: an empty string is not nullish,
              so a clean save showed a blank line instead of saying it saved. */}
          {state.error ?? state.warning ?? (notice || (state.ok ? "Saved." : ""))}
        </p>

        <div>
          <button className="btn btn-go" type="submit" disabled={pending || busy}>
            {pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      {/* Deleting stays on General, and stays outside the form — it is its own
          irreversible act, not something Save should be able to reach. */}
      {tab === "general" && children}
    </div>
  );
}

const tablist: React.CSSProperties = {
  display: "flex",
  gap: "1.4rem",
  borderBottom: "1px solid var(--jade-line)",
  marginBottom: "1.75rem",
  overflowX: "auto",
};

function tabStyle(on: boolean): React.CSSProperties {
  return {
    appearance: "none",
    flex: "0 0 auto",
    border: 0,
    borderBottom: `2px solid ${on ? "var(--jade)" : "transparent"}`,
    background: "transparent",
    color: on ? "var(--paper)" : "var(--ink-soft)",
    font: "inherit",
    fontSize: "0.9rem",
    fontWeight: 500,
    padding: "0.55rem 0.1rem",
    marginBottom: "-1px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
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
