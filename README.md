# Reviewslip

Marketing site and (upcoming) full SaaS product for **Reviewslip** — an app that helps
real customers write and post a genuine Google review in seconds.

Built with **Next.js (App Router)** + TypeScript, hand-written CSS using the app's
"paper receipt slip" design system (dark teal canvas, cream slip cards, jade + marigold
accents, Trirong + Bai Jamjuree fonts).

> Positioning: Reviewslip only ever assists **genuine customers** with **their own** reviews.
> No fabricated, bulk, or fake reviews — by design. See `/compliance`.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

```bash
npm run build   # production build (typechecks + lints)
npm run start   # serve the production build
```

## Project structure

```
app/
  layout.tsx            # root layout: fonts, metadata, viewport
  globals.css           # design system (tokens + component classes)
  (marketing)/          # public marketing site (Nav + Footer layout)
    page.tsx            # landing page
    pricing/            # pricing + FAQ
    how-it-works/       # step-by-step walkthrough
    compliance/         # FTC / platform compliance stance
    demo/               # public interactive slip demo
    legal/              # privacy + terms (template stubs)
  dashboard/            # placeholder — real dashboard is Phase 3
components/marketing/    # Nav, Footer, DemoSlip, PricingCards, Faq
lib/
  plans.ts              # plan/pricing config (PLACEHOLDER prices)
  demoReviews.ts        # canned demo drafts (no AI key needed on marketing site)
```

## Status

Scope: **marketing site only** — no sign-up, dashboard, auth, or billing. The primary
call-to-action is "Get in touch" (email).

- [x] **Phase 0** — Foundation: Next.js scaffold, design system, shared components
- [x] **Phase 1** — Marketing site: landing, pricing, how-it-works, compliance, demo, contact, legal
- [ ] **Phase 2** — Polish & launch: real content/assets, final pricing, analytics, custom domain

See [PLAN.md](PLAN.md) for the full context.

## Internationalisation & currency

- **Language selector** — 10 languages (English, Spanish, French, German, Portuguese,
  Italian, Thai, Chinese, Japanese, Korean). All site copy lives in
  `lib/i18n/dictionaries/<code>.ts`; `en.ts` is the source of truth and its type
  (`Dictionary`) enforces that every language has the same keys. Add a language by adding
  it to `lib/i18n/config.ts` and dropping in a matching dictionary file.
  - Non-English translations were machine-generated and should be reviewed by native
    speakers before launch (legal pages especially).
- **Country selector → currency** — converts all pricing via `Intl.NumberFormat`.
  Countries/currencies and **placeholder** exchange rates live in `lib/currency.ts`
  (base currency is USD; swap the rates for real ones before launch).
- Both preferences are held in a client `LocaleProvider` (`lib/i18n/LocaleProvider.tsx`)
  and persisted to `localStorage`. Access copy via `useLocale().t` and format prices via
  `useLocale().money(usd)`.
- **Tradeoff:** this is client-side i18n (no per-language URLs), so language isn't in the
  URL and pages aren't server-rendered per locale — simpler, but weaker SEO than routed
  i18n (`/[lang]/…`). Revisit if multilingual SEO becomes a priority.

## Notes

- **Marketing only** — no sign-up. All CTAs link to `/contact` (email).
- **Contact email** is a placeholder in `lib/site.ts` (`hello@reviewslip.app`) — swap it.
- **Pricing is placeholder** (`lib/plans.ts`) until finalised.
- **Platform**: Google reviews only for v1.
- The demo uses canned drafts and never calls an AI model.
