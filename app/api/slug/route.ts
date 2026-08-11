import { call } from "@/lib/api";
import { sessionToken } from "@/lib/session";

/**
 * Address availability, for the picker to call as someone types.
 *
 * This exists because the session token lives in an httpOnly cookie and the
 * browser cannot read it — so the check cannot go straight to the review app
 * from the client. This handler reads the cookie server-side and forwards it.
 */
export async function GET(request: Request) {
  const token = await sessionToken();
  if (!token) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  const slug = new URL(request.url).searchParams.get("slug")?.trim() ?? "";
  if (!slug) {
    return Response.json({ slug: "", valid: false, available: false });
  }

  try {
    const result = await call<unknown>(`/slug/${encodeURIComponent(slug)}`, {
      token,
    });
    return Response.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    return Response.json(
      { error: err instanceof Error ? err.message : "Check failed." },
      { status }
    );
  }
}
