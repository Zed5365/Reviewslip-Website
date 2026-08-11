/**
 * Site-wide constants.
 *
 * NOTE: CONTACT_EMAIL is a PLACEHOLDER — swap it for your real address before
 * launch. It's used for every "Get in touch" call-to-action across the site.
 */

export const SITE_NAME = "Reviewslip";

/**
 * Production origin, used to build absolute canonical URLs, hreflang alternates,
 * the sitemap and Open Graph tags. Search engines require absolute URLs here.
 *
 * TODO: the real domain is not decided yet — this is a PLACEHOLDER. Change it in
 * this one place (or set NEXT_PUBLIC_SITE_URL at build time) and every canonical,
 * alternate and sitemap entry follows automatically. Must include the protocol
 * and no trailing slash.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://reviewslip.app";

export const CONTACT_EMAIL = "hello@reviewslip.app";

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Reviewslip enquiry"
)}`;

/**
 * Where the contact form POSTs. Leave empty to use the built-in mailto fallback
 * (opens the visitor's email client with the message pre-filled — works with no
 * backend). To collect submissions server-side, set this to a form endpoint URL
 * (e.g. a Formspree "https://formspree.io/f/xxxx" endpoint or your own handler)
 * that accepts a JSON POST of { name, email, business, locations, message }.
 */
export const CONTACT_FORM_ENDPOINT = "";
