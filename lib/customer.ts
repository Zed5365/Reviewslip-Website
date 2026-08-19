import "server-only";

import { cookies } from "next/headers";

import type {
  BackgroundSummary,
  Derived,
  FontSummary,
  Palette,
} from "./theme";

/**
 * The review app's customer API, and the browser's half of a session.
 *
 * The review app owns the database — accounts, businesses, usage — and this site is
 * a client of it. Nothing here talks to Postgres: two codebases writing one
 * schema is how schemas rot.
 *
 * Calls go over loopback on the same box, so there is no TLS and no latency to
 * cache around. The session token lives only in an httpOnly cookie and is
 * forwarded as a bearer, which means the review app verifies who the caller is
 * rather than taking this site's word for it.
 */

const BASE = process.env.REVIEW_API_URL ?? "http://127.0.0.1:3000";

export const SESSION_COOKIE = "rs_session";

/**
 * A readable companion to the session cookie. Holds no secret — just "someone is
 * signed in" — so the nav can swap Sign in for Dashboard without the layout
 * reading cookies, which would opt every marketing page out of static rendering.
 *
 * It can lie: a session revoked server-side leaves this behind until the next
 * sign-out. The cost of that is a Dashboard link that bounces to /login, which is
 * the same thing that happens if you visit /dashboard directly.
 */
export const SIGNED_IN_COOKIE = "rs_signed_in";

/** Matches the review app's own session lifetime, so the two expire together. */
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface ApiError extends Error {
  status: number;
}

function apiError(status: number, message: string): ApiError {
  return Object.assign(new Error(message), { status });
}

export async function call<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const { method = "GET", body, token } = options;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/customer${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // Account and usage data changes under us; a cached dashboard is a wrong
      // dashboard.
      cache: "no-store",
    });
  } catch {
    throw apiError(503, "Could not reach the service. Try again in a moment.");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw apiError(
      res.status,
      typeof data?.error === "string" ? data.error : "Something went wrong."
    );
  }

  return data as T;
}

/**
 * The same, for a route that answers with text rather than JSON.
 *
 * Separate rather than a flag on `call`, because the two differ in how they
 * report failure as well as how they parse: a failing text route still answers
 * JSON, so the error path has to try that before giving up.
 */
export async function callText(
  path: string,
  options: { token?: string } = {}
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/api/customer${path}`, {
      headers: options.token ? { Authorization: `Bearer ${options.token}` } : {},
      cache: "no-store",
    });
  } catch {
    throw apiError(503, "Could not reach the service. Try again in a moment.");
  }

  const body = await res.text();

  if (!res.ok) {
    let message = "Something went wrong.";
    try {
      const parsed = JSON.parse(body);
      if (typeof parsed?.error === "string") message = parsed.error;
    } catch {
      // A non-JSON error body is not worth showing raw.
    }
    throw apiError(res.status, message);
  }

  return body;
}

/* ---------------------------------------------------------------- sessions */

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Off in development, where the dev server is plain http and a secure
    // cookie would never be stored at all.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });

  store.set(SIGNED_IN_COOKIE, "1", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(SIGNED_IN_COOKIE);
}

export async function sessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

/* ------------------------------------------------------------------ shapes */

export interface Account {
  id: number;
  email: string;
  username: string;
  plan: string;
  status: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Session {
  account: Account;
  token: string;
  expiresAt: string;
}

export interface BusinessSummary {
  slug: string;
  name: string;
  status: string;
  url: string;
  createdAt: string;
  usage: { reviews: number; tokens: number; tokenLimit: number };
  ready: boolean;
  plan: string;
}

export interface Me {
  account: Account;
  plan: {
    id: string;
    name: string;
    businesses: number | null;
    /** The advertised total: the per-business limit times the plan's businesses. */
    reviewAllowance: number;
    /** What each business is actually held to, which is the meter that matters. */
    reviewsPerBusiness: number;
    tokensPerMonthPerBusiness: number;
  };
  usage: { reviewsThisMonth: number; businesses: number };
  canAddBusiness: boolean;
  businesses: BusinessSummary[];
}

/** A setting as the review app describes it: the value, and where it came from. */
export interface Setting<T> {
  value: T;
  source: "subscriber" | "env" | "default";
}

export interface BusinessSettings {
  apiKey: { set: boolean; hint: string; source: string };
  model: Setting<string>;
  googleUrl: Setting<string>;
  tripadvisorUrl: Setting<string>;
  websiteUrl: Setting<string>;
  /** Topics, in the dashboard's words. `categories` is the field the API uses. */
  categories: Setting<{ id: string; label: string; focus: string }[]>;
  kind: Setting<string>;
  place: Setting<string>;
  safeDetails: Setting<string[]>;
  /** This business's own AI context: free prose, drafted then edited by hand. */
  contextDoc: Setting<string>;
  /**
   * What the owner pasted about the business, for when there is no readable
   * page. Optional because the review app deploys separately.
   */
  sourceText?: Setting<string>;
  /**
   * The four colours the guest page and the table card are built from, plus what
   * they derive to. `derived` is the palette actually served — the contrast
   * checks in the review app's theme.js may have moved a colour, and `adjusted`
   * says in words which ones and why.
   */
  theme: Setting<Palette> & {
    derived: Derived;
    adjusted: string[];
    /**
     * The typefaces actually taken off the site, described without the file.
     *
     * Optional because the review app deploys separately: a dashboard running
     * ahead of it will not get this, and must not fall over on that.
     */
    fonts?: { display: FontSummary | null; ui: FontSummary | null };
    /** The hero photograph, described without the file. */
    background?: BackgroundSummary | null;
  };
  limits: { categories: number; safeDetails: number; contextDoc: number };
}

// Re-exported as types only. The shape lives in lib/theme.ts because the theme
// editor is a client component and this module is server-only; a value imported
// from here would drag cookies() into the browser bundle.
export type {
  Palette,
  Derived,
  StoredFont,
  FontSummary,
  StoredBackground,
  BackgroundSummary,
} from "./theme";

export interface BusinessDetail {
  business: {
    slug: string;
    name: string;
    status: string;
    url: string;
    createdAt: string;
  };
  settings: BusinessSettings;
  stats: {
    month: { reviews: number; tokens: number; tokenLimit: number };
    lifetime: { reviews: number; tokens: number; lastAt: string | null };
    daily: { day: string; reviews: number; tokens: number }[];
    byCategory: { category: string; reviews: number }[];
  };
}

/**
 * The signed-in account and its businesses, or null.
 *
 * Null covers both "no cookie" and "the token was rejected" — to a caller those
 * are the same thing: sign in again. Anything else, such as the service being
 * unreachable, is thrown: showing a signed-out page when the truth is "we
 * cannot tell" would log people out on every blip.
 */
export async function currentUser(): Promise<Me | null> {
  const token = await sessionToken();
  if (!token) return null;

  try {
    return await call<Me>("/me", { token });
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 401 || status === 403) return null;
    throw err;
  }
}
