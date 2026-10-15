import { NextResponse } from "next/server";

import { call, sessionToken } from "@/lib/customer";

/**
 * Open the Phone: signs the dashboard's account in on one of the softphone's
 * pages — the venue phone, or Reviewslip's Sales and Support phone — which
 * live on the review app's host and keep their own cookies.
 *
 * The review app hands back a one-time link that works for two minutes; the
 * token rides in the fragment, which the browser keeps through this redirect
 * and never sends to a server. A plain link, not a Next <Link>, points here:
 * a prefetch would mint a token nobody uses.
 */
export async function GET(request: Request) {
  if (request.headers.get("next-router-prefetch") || request.headers.get("rsc")) {
    return new Response(null, { status: 204 });
  }
  const token = await sessionToken();
  if (!token) return NextResponse.redirect(new URL("/login", request.url), 303);
  try {
    // ?phone=reviewslip opens Reviewslip's Sales and Support phone (admins only);
    // anything else, the venue phone.
    const phone = new URL(request.url).searchParams.get("phone") === "reviewslip" ? "reviewslip" : "venues";
    const { url } = await call<{ url: string }>("/voice/handoff", { method: "POST", body: { phone }, token });
    return NextResponse.redirect(url, 303);
  } catch {
    return new Response("The phone could not be opened. Try again in a moment.", { status: 503 });
  }
}
