import "server-only";

import { cookies } from "next/headers";

/**
 * The review app's customer API, and the browser's half of a session.
 *
 * The review app owns the database — accounts, venues, usage — and this site is
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
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
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

export interface VenueSummary {
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
    venues: number | null;
    reviewAllowance: number;
    tokensPerMonthPerVenue: number;
  };
  usage: { reviewsThisMonth: number; venues: number };
  canAddVenue: boolean;
  venues: VenueSummary[];
}

/**
 * The signed-in account and its venues, or null.
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
