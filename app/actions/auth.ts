"use server";

import { redirect } from "next/navigation";

import { call, type Session } from "@/lib/api";
import {
  clearSessionCookie,
  sessionToken,
  setSessionCookie,
} from "@/lib/session";

/**
 * Sign up, sign in, sign out.
 *
 * The review app owns the rules — what a username has to contain, how long a
 * password must be — and returns them as messages. Re-implementing those checks
 * here would give two answers to the same question, so this passes the input
 * straight through and shows whatever comes back.
 */

export interface AuthState {
  error?: string;
  /** Echoed back so a rejected form does not empty itself. */
  values?: { email?: string; username?: string; identifier?: string };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plan") ?? "starter");

  try {
    const session = await call<Session>("/signup", {
      method: "POST",
      body: { email, username, password, plan },
    });
    await setSessionCookie(session.token);
  } catch (err) {
    return { error: message(err), values: { email, username } };
  }

  // Outside the try: redirect works by throwing, so catching around it would
  // swallow the navigation and report it as an error.
  redirect("/dashboard");
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  try {
    const session = await call<Session>("/login", {
      method: "POST",
      body: { identifier, password },
    });
    await setSessionCookie(session.token);
  } catch (err) {
    return { error: message(err), values: { identifier } };
  }

  redirect("/dashboard");
}

export async function logout() {
  const token = await sessionToken();

  // Drop the cookie whatever happens. A session the server still holds is
  // tidier to leave behind than a browser that thinks it is still signed in.
  try {
    if (token) await call("/logout", { method: "POST", token });
  } catch {
    // The token expires on its own.
  }

  await clearSessionCookie();
  redirect("/login");
}
