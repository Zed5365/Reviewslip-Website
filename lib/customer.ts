import "server-only";

import { cookies } from "next/headers";

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
  limits: { categories: number; safeDetails: number; contextDoc: number };
}

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
