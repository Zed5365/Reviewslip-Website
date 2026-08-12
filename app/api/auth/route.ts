import { call, setSessionCookie, type Session } from "@/lib/customer";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

/**
 * Sign in and sign up, for the auth form to post to.
 *
 * A route handler rather than a Server Action because AuthForm is a client
 * component that already posts JSON to a single endpoint — this fills the seam
 * it was built with instead of rewriting it.
 *
 * The password reaches this handler and goes no further than the review app.
 * The session token it returns is put straight into an httpOnly cookie and is
 * never sent to the browser in the response body.
 */
export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  const mode = body.mode === "signup" ? "signup" : "login";
  const email = String(body.email ?? "").trim();
  const password = String(body.password ?? "");
  const asked = typeof body.lang === "string" ? body.lang : "";
  const lang = isLocale(asked) ? asked : DEFAULT_LOCALE;

  try {
    const session = await call<Session>(`/${mode}`, {
      method: "POST",
      body:
        mode === "signup"
          ? // No username field on the form; the review app derives one from
            // the email. `name` is the person, not the account, so it is not
            // sent as a username.
            { email, password }
          : { identifier: email, password },
    });

    await setSessionCookie(session.token);

    return Response.json({ redirect: localizedPath(lang, "/dashboard") });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return Response.json(
      {
        error:
          err instanceof Error ? err.message : "Something went wrong.",
      },
      // 401 and 409 are the caller's to fix — a wrong password, an email
      // already registered — and the form shows the message as-is.
      { status }
    );
  }
}
