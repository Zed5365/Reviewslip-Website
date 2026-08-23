"use client";

import { useActionState, useRef, useState, useTransition } from "react";

import ThemeEditor from "@/components/dashboard/ThemeEditor";
import { PLATFORMS } from "@/lib/platforms.data";
import type { BusinessSettings } from "@/lib/customer";
import type {
  BackgroundSummary,
  Derived,
  FontSummary,
  Palette,
  StoredBackground,
  StoredFont,
} from "@/lib/theme";

/** The settings field behind each platform's link. */
const LINK_FIELD: Record<string, string> = {
  google: "googleUrl",
  tripadvisor: "tripadvisorUrl",
  facebook: "facebookUrl",
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
  { id: "topics", label: "Topics" },
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
  /** Survives a re-generation, which otherwise replaces the whole set. */
  locked?: boolean;
}

type Action = (state: BusinessState, formData: FormData) => Promise<BusinessState>;

/** What reading the website can produce, per button. */
type Topics = { categories?: Suggestion[]; error?: string };
type Described = { description?: string; error?: string };
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
  /** The hero photograph taken off the site, file included. */
  background?: StoredBackground | null;
  backgroundNote?: string;
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

const noWebsite: React.CSSProperties = {
  margin: 0,
  padding: "0.7rem 0.85rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  fontSize: "0.8rem",
  lineHeight: 1.5,
  color: "var(--ink-soft)",
};

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
  suggest,
  describeTopic,
  draftTheme,
  rulebook,
  previewTheme,
  name,
  settings,
  children,
}: {
  action: Action;
  /** Reads the website and proposes topics. Fills the editor; saves nothing. */
  suggest: () => Promise<Topics>;
  /** Writes one topic's description from its name and whatever is in the box. */
  describeTopic: (label: string, hint: string) => Promise<Described>;
  /** Reads the website and picks four colours. */
  draftTheme: () => Promise<ThemeDraft>;
  /** Everything the writer is told about this business, as markdown. */
  rulebook: () => Promise<{ markdown?: string; error?: string }>;
  /** Asks what four colours derive to, so the preview is the served palette. */
  previewTheme: (
    theme: Palette,
    background?: boolean
  ) => Promise<{ derived?: Derived; adjusted?: string[] }>;
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

  // Same two-piece arrangement as the fonts, for the same reason: the settings
  // payload describes the photograph without carrying half a megabyte of base64,
  // so a save that did not re-draft has no file to send and must leave the
  // stored one alone.
  const [background, setBackground] = useState<BackgroundSummary | null>(
    settings.theme?.background ?? null
  );
  const [backgroundFile, setBackgroundFile] = useState<StoredBackground | null>(null);

  const [busy, startBusy] = useTransition();
  const [notice, setNotice] = useState("");
  // Which button is working, so it can say so. Reading a website through the
  // model takes twenty seconds or more, and a button that only greys out for
  // that long reads as broken.
  const [reading, setReading] = useState<"suggest" | "theme" | null>(null);

  // Which row is being written, by index. One at a time: these are model calls
  // the business pays for, and a button that can be held down is a bill.
  const [writing, setWriting] = useState<number | null>(null);

  /**
   * Writes one row's description.
   *
   * Deliberately outside the shared `read` helper. That one owns `reading`,
   * which greys out every Generate button on the page — right for a call that
   * replaces the whole list, wrong for one that touches a single row while the
   * rest of the form stays usable.
   */
  function onDescribe(index: number) {
    const cat = cats[index];
    const label = cat.label.trim();
    if (!label) {
      setNotice("Name the topic first — that is what it writes about.");
      return;
    }

    if (cat.locked) {
      setNotice("That topic is locked. Unlock it first.");
      return;
    }

    setWriting(index);
    setNotice(`Writing "${label}" — this can take up to a minute.`);

    startBusy(async () => {
      const result = await describeTopic(label, cat.focus.trim()).catch(
        (): Described => ({ error: "Could not write it." })
      );
      setWriting(null);

      if (result.error || !result.description) {
        setNotice(result.error ?? "Nothing usable came back.");
        return;
      }

      setCat(index, { focus: result.description });
      setNotice(`Written. Read it, change anything, then Save.`);
    });
  }

  const full = cats.length >= settings.limits.categories;

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
    which: "suggest" | "theme",
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

  /**
   * Replaces the topic set with a freshly read one — except the locked rows.
   *
   * Merged here rather than on the server because the lock is a property of
   * what is in this editor, which may not have been saved yet: someone who
   * locks three rows and then presses Generate has not stored those locks, and
   * a server-side merge would read the old ones.
   *
   * Locked rows keep their position at the top rather than being woven back in
   * by name. The order is alphabetical once saved, so any arrangement here is
   * temporary — and seeing what survived, together, is worth more for the one
   * screen where it matters.
   */
  function onSuggest() {
    read("suggest", suggest, (result) => {
      if (!result.categories?.length) return "Nothing usable came back.";

      const kept = cats.filter((c) => c.locked && c.label.trim());
      const taken = new Set(kept.map((c) => c.label.trim().toLowerCase()));

      // A proposal that duplicates a locked topic is dropped, not renamed. Two
      // buttons for one thing is worse than one fewer suggestion.
      const fresh = result.categories.filter(
        (c) => !taken.has(c.label.trim().toLowerCase())
      );

      const merged = [...kept, ...fresh].slice(0, settings.limits.categories);
      setCats(merged);

      return kept.length
        ? `Proposed ${fresh.length} topics, and kept your ${kept.length} locked ${kept.length === 1 ? "one" : "ones"}. Edit anything, then Save.`
        : `Proposed ${fresh.length} topics. Edit anything, then Save to keep them.`;
    });
  }

    function onDraftTheme() {
    read("theme", draftTheme, (result) => {
      if (!result.theme) return "No usable colours came back.";
      setPalette(result.theme);
      setPaletteSources(result.sources ?? {});

      // The files, and the descriptions drawn from them. A slot that could not
      // be grabbed comes back null and falls to the shortlist.
      setBackground(
        result.background
          ? {
              type: result.background.type,
              source: result.background.source,
              kb: Math.round((result.background.dataUri.length * 3) / 4 / 1024),
            }
          : null
      );
      setBackgroundFile(result.background ?? null);

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
      return [
        colours,
        ...(result.fontNotes ?? []),
        result.logoNote,
        result.backgroundNote,
        "Then Save.",
      ]
        .filter(Boolean)
        .join(" ");
    });
  }

  /** Drops the photograph, file and all. */
  function onDropBackground() {
    setBackground(null);
    // Explicitly null rather than absent: absent means "leave what is stored
    // alone", and this is a request to clear it.
    setBackgroundFile(null);
  }

  /** Back to the shortlist for one slot, file and all. */
  function onDropFont(slot: "display" | "ui") {
    setFonts({ ...fonts, [slot]: null });
    // Explicitly null rather than absent: absent means "leave what is stored
    // alone", and this is a request to clear it.
    setFontFiles({ ...fontFiles, [slot]: null });
  }

  /**
   * Downloads the rulebook.
   *
   * Built server-side and handed back as text, because a server action cannot
   * set a Content-Disposition header — so the file is assembled here, out of
   * what came back, and the anchor is clicked programmatically. Revoked straight
   * after: an object URL holds the blob in memory until it is.
   */
  function onRulebook() {
    setNotice("Building it…");
    startBusy(async () => {
      // Annotated, or the fallback narrows the union and `markdown` vanishes
      // from the type — the same trap as the other website readers here.
      const result = await rulebook().catch(
        (): { markdown?: string; error?: string } => ({
          error: "Could not build it.",
        })
      );

      if (!result.markdown) {
        setNotice(result.error ?? "Could not build it.");
        return;
      }

      const url = URL.createObjectURL(
        new Blob([result.markdown], { type: "text/markdown;charset=utf-8" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = "context.md";
      link.click();
      URL.revokeObjectURL(url);

      setNotice("Downloaded context.md.");
    });
  }

  const counts: Partial<Record<TabId, number>> = {
    topics: cats.length,
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
          {/* Temporary. It answers "what is the AI actually working from",
              which nothing else here does, and the file says so itself. */}
          <TopAction>
            <button
              type="button"
              className="btn btn-quiet"
              disabled={busy}
              onClick={onRulebook}
            >
              Download context.md
            </button>
            <span style={hint}>
              Everything the writer is told about this business. Temporary.
            </span>
          </TopAction>

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
              Save this first — the Generate buttons on the other tabs work from
              it. Customers never see it.{" "}
              <strong style={{ fontWeight: 500 }}>
                No website? Put your Facebook page in here
              </strong>{" "}
              — or in the Facebook review link below, which is read the same way
              — and the other tabs will work from that instead. Be warned that it
              often comes back empty: Facebook shows a sign-in wall to anything
              that is not a signed-in browser, so what we fetch is the wall
              rather than your page. If it does, write your topics and their
              descriptions by hand on the Topics tab. That always works, and it
              is the only thing that does.
            </span>

            {/* Always shown, not only when the field is empty. The reason
                comes before the offer because that is the honest order: what
                makes a website matter here is that every other tab reads it,
                not that we happen to build them. */}
            <p style={noWebsite}>
              No website? Nearly everything else here is read off one — your
              topics and their descriptions, your colours, your logo. We build
              them:{" "}
              <a
                href="https://zzdigitaldesign.com"
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--jade)" }}
              >
                zzdigitaldesign.com
              </a>
              .
            </p>
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
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "9rem 1fr auto",
                    gap: "0.4rem",
                    alignItems: "start",
                  }}
                >
                  <input
                    style={{ ...input, padding: "0.5rem 0.65rem" }}
                    name="catLabel"
                    value={cat.label}
                    onChange={(e) => setCat(index, { label: e.target.value })}
                    maxLength={40}
                    placeholder="Rooms"
                    aria-label={`Topic ${index + 1} name`}
                  />
                  {/* A textarea, not an input: this is a paragraph now, and
                      a one-line box for a paragraph is a box people write one
                      line into. Three rows is enough to see what you wrote and
                      short enough that fifty of them still scroll. */}
                  {/* Fixed height, and it scrolls. Descriptions are lists of
                      different lengths, and a box that grows to fit pushes the
                      row below it down the page — fifty of those and the form
                      is a mile long with no two rows aligned. The height is one
                      row's worth for every one of them, and .scrollpane keeps
                      the platform scrollbar out of it. */}
                  <textarea
                    className="scrollpane"
                    style={{
                      ...input,
                      padding: "0.5rem 0.65rem",
                      height: "5.5rem",
                      resize: "vertical",
                      lineHeight: 1.5,
                    }}
                    name="catFocus"
                    rows={3}
                    value={cat.focus}
                    onChange={(e) => setCat(index, { focus: e.target.value })}
                    maxLength={settings.limits.description ?? 600}
                    placeholder="What a review about this can say — and nothing else will be said."
                    aria-label={`Topic ${index + 1} description`}
                  />
                  <div style={{ display: "grid", gap: "0.3rem" }}>
                    {/* Always submitted, checked or not. A checkbox sends
                        nothing when unchecked, and these three lists are
                        zipped by index on the server — one missing entry and
                        every row below it takes the wrong lock. */}
                    <input
                      type="hidden"
                      name="catLocked"
                      value={cat.locked ? "1" : ""}
                    />
                    <button
                      type="button"
                      onClick={() => setCat(index, { locked: !cat.locked })}
                      aria-pressed={Boolean(cat.locked)}
                      aria-label={`${cat.locked ? "Unlock" : "Lock"} topic ${index + 1}`}
                      title={
                        cat.locked
                          ? "Locked — Generate from website will leave this one alone"
                          : "Lock this topic against Generate from website"
                      }
                      style={{
                        ...lock,
                        color: cat.locked ? "var(--ink)" : "var(--ink-soft)",
                        background: cat.locked ? "var(--jade)" : "transparent",
                        borderColor: cat.locked
                          ? "var(--jade)"
                          : "var(--jade-line)",
                      }}
                    >
                      {cat.locked ? "Locked" : "Lock"}
                    </button>
                    {/* Writes this row's description and nothing else. It uses
                        the name, and whatever is already in the box as a
                        steer — so it doubles as "generate from a keyword"
                        without a second field to explain. */}
                    <button
                      type="button"
                      className="btn btn-quiet"
                      disabled={busy || Boolean(cat.locked)}
                      onClick={() => onDescribe(index)}
                      title={
                        cat.locked
                          ? "Locked. Unlock it to rewrite it."
                          : cat.focus.trim()
                          ? "Write this description, building on what is in the box"
                          : "Write this description from the topic name"
                      }
                      style={{
                        padding: "0.4rem 0.6rem",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {writing === index
                        ? "Writing…"
                        : cat.focus.trim()
                          ? "Rewrite"
                          : "Write"}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove topic ${index + 1}`}
                      onClick={() => setCats(cats.filter((_, i) => i !== index))}
                      style={remove}
                    >
                      ×
                    </button>
                  </div>
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
              browse button and a search, so a deep list is worth having: two
              customers an hour apart get offered different things and lead with
              different subjects.{" "}
              <strong style={{ fontWeight: 500 }}>
                Name the things you are known for
              </strong>{" "}
              — a signature dish, a house speciality, a flagship product. Those
              are what customers most want to talk about, and a review may name
              the one they picked. Generating from your website looks for them
              first.
            </span>

            <span style={hint}>
              <strong style={{ fontWeight: 500 }}>
                The description is the whole of what a review may say.
              </strong>{" "}
              There is no other document — if something about your business is
              not written in one of these paragraphs, no review will ever
              mention it. Write what a customer would notice rather than what a
              brochure would lead with, and keep each one under{" "}
              {settings.limits.description ?? 600} characters: every topic a
              guest picks is sent with the request, so three chosen topics cost
              three paragraphs. No numbers and no superlatives — both are
              refused on save, because both end up repeated in every review
              written under that button. A topic left blank falls back to its
              name alone, which still works.
            </span>

            <span style={hint}>
              <strong style={{ fontWeight: 500 }}>The padlock</strong> keeps a
              topic through a re-generation. Generate from website replaces the
              whole set, which is what you want the first time and rarely what
              you want the second — so lock the ones you have written or edited
              and they are carried across untouched, along with anything the
              new set proposes that is not a duplicate of them.
            </span>

            <span style={hint}>
              <strong style={{ fontWeight: 500 }}>Write</strong> fills in one
              row on its own, from the topic name and your website — useful for
              a topic you added by hand. Put a word or two in the box first and
              it builds on those instead of starting from the name, so it works
              as a keyword just as well as a blank. It only ever changes the row
              you pressed it on.
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
              background={background}
              rightsConfirmed={rights}
              onChange={(patch) => setPalette({ ...palette, ...patch })}
              onDropBackground={onDropBackground}
              onDropFont={onDropFont}
              onRights={setRights}
              onGenerate={onDraftTheme}
              preview={previewTheme}
            />

            {/* The photograph, on the same three-state contract as the fonts:
                absent leaves the stored one alone, an empty string clears it,
                JSON is a file the review app downloaded and checked. */}
            {backgroundFile ? (
              <input type="hidden" name="background" value={JSON.stringify(backgroundFile)} />
            ) : background ? null : (
              <input type="hidden" name="background" value="" />
            )}

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

/**
 * The lock toggle. A word rather than a padlock: an emoji is guesswork at a
 * glance and near-silent to a screen reader, and the two states of this one are
 * worth being unambiguous about — pressing it decides whether the work in that
 * row survives the next Generate.
 *
 * It says what it is, not what pressing it does. "Locked" is the state you can
 * see, which is what a person scanning fifty rows is looking for; aria-label
 * carries the action for anyone who cannot see the fill.
 */
const lock: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "0.4rem 0.6rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "transparent",
  fontFamily: "inherit",
  fontSize: "0.75rem",
  fontWeight: 500,
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const remove: React.CSSProperties = {
  flex: "0 0 auto",
  width: "2.2rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "transparent",
  color: "var(--ink-soft)",
  cursor: "pointer",
};
