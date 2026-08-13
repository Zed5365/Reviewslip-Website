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
  "https://reviewslip.com";

export const CONTACT_EMAIL = "info@reviewslip.com";

export const CONTACT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  "Reviewslip enquiry"
)}`;

/**
 * Where the contact form POSTs. The form sends a JSON body of
 * { name, email, business, locations, message }. Leave empty to fall back to
 * opening the visitor's email client with the message pre-filled.
 *
 * Currently a Formspree endpoint — submissions land in the Formspree dashboard
 * and are forwarded to the email on that Formspree account. (Formspree accepts
 * this JSON shape directly, no code change needed.)
 *
 * Alternative on file: Web3Forms access key 0a47a13a-5314-4eb8-b4ee-26b43fde9a3b
 * — to switch, POST to https://api.web3forms.com/submit with `access_key`
 * added to the body (a small change in ContactForm).
 */
export const CONTACT_FORM_ENDPOINT = "https://formspree.io/f/mljrnyzy";

/**
 * Where the login / sign-up forms POST. Leave empty until there is a real auth
 * backend: the forms then validate as normal but stop at an "accounts aren't
 * open yet" notice, and the password never leaves the browser.
 *
 * There is deliberately NO mailto fallback here (unlike the contact form) —
 * credentials must never be handed to an email client. When you do set this,
 * it must be an HTTPS endpoint that accepts a JSON POST of
 * { mode: "login" | "signup", email, password, name?, business? }.
 */
/**
 * Where the auth form posts. Handled by app/api/auth/route.ts, which talks to
 * the review app and sets the session cookie.
 */
export const AUTH_ENDPOINT = "/api/auth";
