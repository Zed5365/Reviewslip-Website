import "server-only";

import { cookies } from "next/headers";

import { call, type Me } from "./api";

/**
 * The browser's half of a session.
 *
 * The token itself is issued by the review app and only ever lives in an
 * httpOnly cookie — never in localStorage, never in a client component, never
 * in a URL. This site reads it back on each request and forwards it.
 */

export const SESSION_COOKIE = "rs_session";

/** Matches the review app's session lifetime, so the two expire together. */
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // Off in development, where the dev server is plain http and a secure
    // cookie would simply never be stored.
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

/**
 * The signed-in account and its venues, or null.
 *
 * Null covers both "no cookie" and "the review app rejected the token", which
 * are the same thing to a caller: sign in again. Anything else — the service
 * being down — is thrown, because showing a signed-out page when the truth is
 * "we cannot tell" would quietly log people out on every blip.
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
