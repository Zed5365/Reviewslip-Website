"use server";

import { redirect } from "next/navigation";

import {
  call,
  clearSessionCookie,
  sessionToken,
  setSessionCookie,
  type Session,
} from "@/lib/customer";
import type { Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

/**
 * Sign up, sign in, sign out.
 *
 * The review app owns the credential rules — what a username must contain, how
 * long a password has to be — and returns its own messages. Re-checking them
 * here would give two answers to one question, so input goes straight through
 * and whatever comes back is shown.
 *
 * Each action takes the locale so it can send someone to their own language's
 * dashboard rather than dropping them into the default one.
 */

export interface AuthState {
  error?: string;
  /** Echoed back so a rejected form does not empty itself. */
  values?: { email?: string; username?: string; identifier?: string };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}

export async function login(
  lang: Locale,
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const identifier = String(
    formData.get("identifier") ?? formData.get("email") ?? ""
  ).trim();
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

  // Outside the try: redirect works by throwing, so catching around it would
  // swallow the navigation and report it as a failure.
  redirect(localizedPath(lang, "/dashboard"));
}

export async function signup(
  lang: Locale,
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

  redirect(localizedPath(lang, "/dashboard"));
}

export async function logout(lang: Locale) {
  const token = await sessionToken();

  // Drop the cookie whatever happens. A session the server still holds is
  // tidier to leave behind than a browser that thinks it is still signed in.
  try {
    if (token) await call("/logout", { method: "POST", token });
  } catch {
    // It expires on its own.
  }

  await clearSessionCookie();
  redirect(localizedPath(lang, "/login"));
}
