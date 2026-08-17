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

/** The four a business chooses. Everything else is derived from them. */
export interface Palette {
  ground: string;
  paper: string;
  accent: string;
  highlight: string;
}

/** The custom properties the review app derives, keyed as they appear in CSS. */
export type Derived = Record<string, string>;

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
