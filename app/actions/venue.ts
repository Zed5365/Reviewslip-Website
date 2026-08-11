"use server";

import { revalidatePath } from "next/cache";

import { call } from "@/lib/api";
import { sessionToken } from "@/lib/session";

/**
 * Venue settings — the fields that used to sit behind the gear icon on the
 * guest page, now edited by the account that owns the venue.
 *
 * Validation lives in the review app: it is the thing that has to be right, and
 * a second copy here would eventually disagree with it.
 */

export interface VenueState {
  error?: string;
  ok?: boolean;
  /** A warning is a save that worked but is worth reading — a stale model, say. */
  warning?: string;
}

/** Empty means "clear this field", which falls back down the settings chain. */
function text(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Repeated inputs of the same name, blanks dropped. The review app treats an
 * empty list as "reset to the built-in set", so an emptied editor resets rather
 * than leaving the venue with nothing.
 */
function list(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function saveVenue(
  slug: string,
  _prev: VenueState,
  formData: FormData
): Promise<VenueState> {
  const token = await sessionToken();
  if (!token) return { error: "Your session expired. Sign in again." };

  const patch: Record<string, unknown> = {
    name: text(formData, "name"),
    googleUrl: text(formData, "googleUrl"),
    tripadvisorUrl: text(formData, "tripadvisorUrl"),
    websiteUrl: text(formData, "websiteUrl"),
    model: text(formData, "model"),
    kind: text(formData, "kind"),
    place: text(formData, "place"),
    safeDetails: list(formData, "safeDetails"),
  };

  // A blank key field means "keep the one you have", not "delete it" — there is
  // no other way to leave a stored key alone while editing anything else.
  const apiKey = text(formData, "apiKey");
  if (apiKey) patch.apiKey = apiKey;

  try {
    const result = await call<{ warning?: string }>(`/venues/${slug}`, {
      method: "PATCH",
      body: patch,
      token,
    });

    revalidatePath(`/dashboard/${slug}`);
    revalidatePath("/dashboard");

    return { ok: true, warning: result?.warning };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not save the settings.",
    };
  }
}
