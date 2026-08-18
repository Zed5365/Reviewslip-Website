/**
 * The theme's shape, shared by the server and the browser.
 *
 * Separate from `lib/customer.ts` because that module is `server-only` — it
 * reads cookies — and the theme editor is a client component that needs
 * `PALETTE_SLOTS` at runtime. Types erase at compile time, so importing those
 * from a server-only module is harmless; importing a *value* from one pulls the
 * whole thing into the client bundle, which fails the build with an error about
 * `next/headers` that says nothing about the real cause.
 *
 * Nothing here computes a colour. The derivation lives in the review app's
 * theme.js, which is also what serves the guest page — one implementation, so a
 * preview cannot promise a palette the guest will not get.
 */

/**
 * What a business chooses: four colours, two typefaces and a mark.
 *
 * `display` and `ui` are ids from a fixed list in the review app's theme.js —
 * never font names. A name would have to become part of a Google Fonts URL, and
 * a URL built from something that arrived over the wire is not something to put
 * in a page. `logo` is a stored data URI, never a link to the customer's server:
 * hotlinking would put a request to a third party on every guest's phone.
 */
export interface Palette {
  ground: string;
  paper: string;
  accent: string;
  highlight: string;
  display: string;
  ui: string;
  logo: string;
}

/**
 * The typefaces on offer, mirroring theme.js.
 *
 * Duplicated deliberately and kept deliberately dumb: this is a label for a
 * dropdown, not a source of truth. The review app resolves an unknown id to the
 * shipped face, so the worst a stale entry here can do is offer a name that
 * quietly lands on the default — not break a page.
 */
export const DISPLAY_FONTS = [
  { id: "trirong", name: "Trirong", note: "the shipped face, also carries Thai" },
  { id: "lora", name: "Lora", note: "a warm contemporary serif" },
  { id: "playfair", name: "Playfair Display", note: "high contrast, editorial" },
  { id: "baskerville", name: "Libre Baskerville", note: "a classic book serif" },
  { id: "source-serif", name: "Source Serif 4", note: "clean and neutral" },
  { id: "garamond", name: "EB Garamond", note: "old style, understated" },
  { id: "fraunces", name: "Fraunces", note: "characterful, a little quirky" },
  { id: "bitter", name: "Bitter", note: "a sturdy slab serif" },
  { id: "dm-serif", name: "DM Serif Display", note: "a confident display serif" },
];

export const UI_FONTS = [
  { id: "bai-jamjuree", name: "Bai Jamjuree", note: "the shipped face, also carries Thai" },
  { id: "inter", name: "Inter", note: "a neutral interface sans" },
  { id: "work-sans", name: "Work Sans", note: "friendly and open" },
  { id: "manrope", name: "Manrope", note: "geometric and modern" },
  { id: "dm-sans", name: "DM Sans", note: "geometric and soft" },
  { id: "poppins", name: "Poppins", note: "circular geometric, informal" },
  { id: "source-sans", name: "Source Sans 3", note: "humanist and very legible" },
  { id: "karla", name: "Karla", note: "grotesque with character" },
  { id: "nunito-sans", name: "Nunito Sans", note: "rounded and approachable" },
];

/** The custom properties the review app derives, keyed as they appear in CSS. */
export type Derived = Record<string, string>;

/**
 * A typeface taken off the business's own site, whole — the file included.
 *
 * Carried through the dashboard rather than re-derived because it is a stored
 * field: the review app downloads and checks it during drafting, and Save has to
 * hand the same bytes back. `data` is base64 and can be a couple of hundred
 * kilobytes, which is why the settings payload describes rather than includes.
 */
export interface StoredFont {
  family: string;
  format: string;
  source: string;
  data: string;
}

/** What the settings payload says about a grabbed font, minus the file. */
export interface FontSummary {
  family: string;
  format: string;
  source: string;
  kb: number;
}

export const PALETTE_SLOTS: {
  key: keyof Palette;
  label: string;
  hint: string;
}[] = [
  { key: "ground", label: "Background", hint: "the deep colour behind the page" },
  { key: "paper", label: "Paper", hint: "the card the review is written on" },
  { key: "accent", label: "Accent", hint: "labels, borders and topic buttons" },
  { key: "highlight", label: "Highlight", hint: "the button that opens your listing" },
];

/** The hero photograph taken off the site, whole. Carried by the form on save. */
export interface StoredBackground {
  type: string;
  dataUri: string;
  source: string;
}

/** What the settings payload says about it, minus the file. */
export interface BackgroundSummary {
  type: string;
  source: string;
  kb: number;
}
