"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { call } from "@/lib/api";
import { sessionToken } from "@/lib/session";

/**
 * Creating a venue, and choosing a plan.
 *
 * Both are gated in the review app rather than here — the venue cap belongs
 * next to the data it counts, and a check in this file would be a second
 * opinion that could disagree with it.
 */

export interface CreateVenueState {
  error?: string;
  values?: { slug?: string; name?: string };
}

export async function createVenue(
  _prev: CreateVenueState,
  formData: FormData
): Promise<CreateVenueState> {
  const token = await sessionToken();
  if (!token) return { error: "Your session expired. Sign in again." };

  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const name = String(formData.get("name") ?? "").trim();

  try {
    await call("/venues", { method: "POST", body: { slug, name }, token });
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not create the venue.",
      values: { slug, name },
    };
  }

  revalidatePath("/dashboard");

  // Straight to settings: a venue with no Google review link is not finished,
  // and this is the moment someone is willing to fill it in.
  redirect(`/dashboard/${slug}/settings`);
}

/**
 * Switching plan. Nothing is charged — no payment provider is connected yet —
 * so this only moves the limits. When Stripe arrives it goes *in front* of this
 * call, not inside it.
 */
export async function choosePlan(planId: string) {
  const token = await sessionToken();
  if (!token) redirect("/login");

  await call("/plan", { method: "POST", body: { plan: planId }, token });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/billing");
  redirect(`/dashboard/billing?changed=${encodeURIComponent(planId)}`);
}
