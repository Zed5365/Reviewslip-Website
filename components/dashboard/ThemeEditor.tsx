"use client";

import { useEffect, useRef, useState, useTransition } from "react";

// From lib/theme, not lib/customer: this is a client component, and
// lib/customer is server-only. See the note at the top of lib/theme.ts.
import {
  DISPLAY_FONTS,
  PALETTE_SLOTS,
  UI_FONTS,
  type Derived,
  type Palette,
} from "@/lib/theme";

/**
 * The theme tab: four colours, and an honest preview of what they become.
 *
 * The preview is drawn from the *derived* palette rather than the four chosen
 * colours, and the derivation is asked for over the wire rather than repeated
 * here. That is the whole design decision in this file. A brand palette is not
 * an interface palette — a pale gold that works in a logo is unreadable as body
 * text — so the review app nudges any colour that cannot carry text until it
 * can. Showing the raw four would promise a page the guest is not going to get,
 * and a second copy of that arithmetic in TypeScript would eventually disagree
 * with the first.
 */
export default function ThemeEditor({
  value,
  derived,
  adjusted,
  sources,
  busy,
  reading,
  onChange,
  onGenerate,
  preview,
}: {
  value: Palette;
  derived: Derived;
  adjusted: string[];
  /** Where each colour came from on the website, once it has been drafted. */
  sources: Partial<Record<keyof Palette, string>>;
  busy: boolean;
  reading: boolean;
  onChange: (patch: Partial<Palette>) => void;
  onGenerate: () => void;
  /** Asks the review app what these four derive to. No model call. */
  preview: (theme: Palette) => Promise<{ derived?: Derived; adjusted?: string[] }>;
}) {
  const [live, setLive] = useState<{ derived: Derived; adjusted: string[] }>({
    derived,
    adjusted,
  });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startPreview] = useTransition();

  // Debounced: dragging a colour picker fires continuously, and this is a
  // round trip even if a cheap one.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      startPreview(async () => {
        // Annotated, or the fallback narrows the union and the success fields
        // vanish from the type.
        const result = await preview(value).catch(
          (): { derived?: Derived; adjusted?: string[] } => ({})
        );
        if (result.derived) {
          setLive({ derived: result.derived, adjusted: result.adjusted ?? [] });
        }
      });
    }, 250);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // `preview` is a server action and stable enough; re-running on it would
    // fire a request per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.ground, value.paper, value.accent, value.highlight]);

  const v = (name: string) => live.derived[name] ?? "";

  return (
    <div style={{ display: "grid", gap: "1.25rem" }}>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {PALETTE_SLOTS.map((slot) => (
          <div key={slot.key} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
            <input
              type="color"
              value={value[slot.key]}
              onChange={(e) => onChange({ [slot.key]: e.target.value })}
              aria-label={slot.label}
              style={swatch}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 500 }} htmlFor={`theme-${slot.key}`}>
                {slot.label}
              </label>
              <div style={{ ...hint, marginTop: "0.1rem" }}>
                {sources[slot.key] || slot.hint}
              </div>
            </div>
            <input
              id={`theme-${slot.key}`}
              // Submitted as four flat fields and reassembled server-side, since
              // a form cannot post an object.
              name={`theme-${slot.key}`}
              value={value[slot.key]}
              onChange={(e) => onChange({ [slot.key]: e.target.value })}
              spellCheck={false}
              autoCapitalize="none"
              style={{ ...hexInput }}
              maxLength={7}
              aria-label={`${slot.label} hex value`}
            />
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------- fonts */}

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {[
          { key: "display" as const, label: "Review text", fonts: DISPLAY_FONTS },
          { key: "ui" as const, label: "Everything else", fonts: UI_FONTS },
        ].map((row) => (
          <div key={row.key} style={{ display: "grid", gap: "0.25rem" }}>
            <label style={{ fontSize: "0.85rem", fontWeight: 500 }} htmlFor={`theme-${row.key}`}>
              {row.label}
            </label>
            <select
              id={`theme-${row.key}`}
              name={`theme-${row.key}`}
              value={value[row.key]}
              onChange={(e) => onChange({ [row.key]: e.target.value })}
              style={select}
            >
              {row.fonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name} — {font.note}
                </option>
              ))}
            </select>
            {sources[row.key] && <div style={hint}>On your site: {sources[row.key]}</div>}
          </div>
        ))}
        <span style={hint}>
          Chosen from a shortlist rather than taken off your site: a font file on
          your server is licensed for your domain, not ours. Generating picks the
          closest match to what you already use. These cover Latin text — a
          review written in Thai, Chinese, Japanese or Korean falls back to the
          reader&rsquo;s own device font, which is the only way it renders at all.
        </span>
      </div>

      {/* ---------------------------------------------------------- logo */}

      <div style={{ display: "grid", gap: "0.5rem" }}>
        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Logo</span>
        {/* Carried through the form as a hidden field: it is a stored image, not
            something to type, and it has to survive a save made from any tab. */}
        <input type="hidden" name="theme-logo" value={value.logo} />

        {value.logo ? (
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value.logo}
              alt="Your logo"
              style={{
                maxHeight: "3rem",
                maxWidth: "10rem",
                objectFit: "contain",
                // On the paper colour, since that is the lighter of the two and
                // shows a dark mark; the guest page puts it on the ground.
                background: v("--paper"),
                borderRadius: 8,
                padding: "0.4rem 0.6rem",
              }}
            />
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => onChange({ logo: "" })}
            >
              Remove
            </button>
          </div>
        ) : (
          <span style={hint}>None yet — generating from your website looks for one.</span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        <button type="button" className="btn btn-quiet" disabled={busy} onClick={onGenerate}>
          {reading ? "Reading…" : "Generate from website"}
        </button>
      </div>

      {/* ------------------------------------------------------- preview */}

      <div>
        <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>Preview</span>
        <div style={{ ...hint, margin: "0.2rem 0 0.6rem" }}>
          The guest page and the table card, in these colours.
        </div>

        <div style={{ ...previewFrame, background: v("--shade") }}>
          {value.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value.logo}
              alt=""
              style={{
                display: "block",
                maxHeight: "2rem",
                maxWidth: "8rem",
                objectFit: "contain",
                objectPosition: "left center",
                marginBottom: "0.5rem",
              }}
            />
          )}
          <div style={{ color: v("--jade-dim"), ...eyebrow }}>YOUR BUSINESS</div>
          <div style={{ color: v("--paper"), fontSize: "1.4rem", lineHeight: 1.1 }}>
            Thanks for visiting<span style={{ color: v("--marigold") }}>.</span>
          </div>

          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", margin: "0.9rem 0 0.7rem" }}>
            {["Staff", "The Welcome"].map((chip, i) => (
              <span
                key={chip}
                style={{
                  ...chipStyle,
                  border: `1px solid ${i === 0 ? v("--paper") : v("--jade-line")}`,
                  background: i === 0 ? v("--paper") : "transparent",
                  color: i === 0 ? v("--ink") : v("--jade"),
                }}
              >
                {chip}
              </span>
            ))}
          </div>

          <div style={{ background: v("--paper"), borderRadius: 3, padding: "0.8rem 0.75rem" }}>
            <div style={{ color: v("--ink"), fontSize: "0.95rem", lineHeight: 1.5 }}>
              Popped in on the way past and they sorted it in ten minutes. No fuss.
            </div>
            <div style={{ color: v("--ink-soft"), fontSize: "0.72rem", marginTop: "0.45rem" }}>
              Your review — yours to change
            </div>
          </div>

          <div
            style={{
              ...button,
              background: v("--marigold"),
              color: v("--on-marigold"),
              border: `1px solid ${v("--marigold")}`,
            }}
          >
            Proceed to Google
          </div>
        </div>
      </div>

      {live.adjusted.length > 0 && (
        <div style={adjustedBox} role="note">
          <strong style={{ display: "block", marginBottom: "0.3rem", fontWeight: 500 }}>
            {live.adjusted.length === 1
              ? "One of your colours was adjusted for readability."
              : `${live.adjusted.length} of your colours were adjusted for readability.`}
          </strong>
          <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
            {live.adjusted.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <span style={{ ...hint, display: "block", marginTop: "0.4rem" }}>
            A guest reads this outdoors on a phone. Colours that could not carry
            text at that size are nudged until they can — the preview above is
            what will actually be served.
          </span>
        </div>
      )}
    </div>
  );
}

const hint: React.CSSProperties = { fontSize: "0.8rem", color: "var(--ink-soft)" };

const swatch: React.CSSProperties = {
  flex: "0 0 auto",
  width: "2.6rem",
  height: "2.6rem",
  padding: 0,
  border: "1px solid var(--jade-line)",
  borderRadius: 10,
  background: "transparent",
  cursor: "pointer",
};

const select: React.CSSProperties = {
  width: "100%",
  padding: "0.55rem 0.7rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "rgba(243,236,220,0.06)",
  color: "var(--paper)",
  font: "inherit",
  fontSize: "0.85rem",
};

const hexInput: React.CSSProperties = {
  flex: "0 0 6.5rem",
  padding: "0.5rem 0.6rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  background: "rgba(243,236,220,0.06)",
  color: "var(--paper)",
  font: "inherit",
  fontSize: "0.85rem",
};

const previewFrame: React.CSSProperties = {
  padding: "1.1rem",
  borderRadius: 12,
  border: "1px solid var(--jade-line)",
};

const eyebrow: React.CSSProperties = {
  fontSize: "0.6rem",
  letterSpacing: "0.2em",
  fontWeight: 600,
  marginBottom: "0.35rem",
};

const chipStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  padding: "0.35rem 0.7rem",
  borderRadius: 999,
  lineHeight: 1,
};

const button: React.CSSProperties = {
  marginTop: "0.8rem",
  padding: "0.6rem 0.9rem",
  borderRadius: 999,
  textAlign: "center",
  fontSize: "0.85rem",
  fontWeight: 500,
};

const adjustedBox: React.CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: 10,
  border: "1px solid var(--jade-line)",
  fontSize: "0.82rem",
  color: "var(--ink-soft)",
};
