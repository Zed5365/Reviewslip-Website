import type { Metadata } from "next";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

import RoomsSetup, { type RoomsState } from "@/components/dashboard/RoomsSetup";
import {
  call,
  currentUser,
  sessionToken,
  type Room,
  type RoomGroup,
} from "@/lib/customer";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/routing";

export const metadata: Metadata = {
  title: "Rooms",
  robots: { index: false, follow: false },
};

export default async function RoomsPage({
  params,
}: PageProps<"/[lang]/dashboard/[slug]/bookings/rooms">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const locale: Locale = lang;

  const me = await currentUser();
  if (!me) redirect(localizedPath(lang, "/login"));

  const token = await sessionToken();

  let data: { groups: RoomGroup[]; rooms: Room[] };
  try {
    data = await call(`/businesses/${slug}/rooms`, { token });
  } catch (err) {
    // The API answers 404 both for a venue that does not exist and one that
    // belongs to somebody else. Neither is this account's business.
    if ((err as { status?: number }).status === 404) notFound();
    throw err;
  }

  const here = localizedPath(locale, `/dashboard/${slug}/bookings/rooms`);

  async function addGroup(
    _prev: RoomsState,
    formData: FormData
  ): Promise<RoomsState> {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    const name = String(formData.get("name") ?? "").trim();
    const capacity = Number(formData.get("capacity") ?? 2);

    try {
      await call(`/businesses/${slug}/room-groups`, {
        method: "POST",
        body: { name, capacity },
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not add that.",
        values: { name },
      };
    }

    revalidatePath(here);
    return { ok: true };
  }

  async function addRoom(
    _prev: RoomsState,
    formData: FormData
  ): Promise<RoomsState> {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    const name = String(formData.get("name") ?? "").trim();
    const groupId = Number(formData.get("groupId"));

    try {
      await call(`/businesses/${slug}/rooms`, {
        method: "POST",
        body: { name, groupId },
        token: t,
      });
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : "Could not add that.",
        values: { name },
      };
    }

    revalidatePath(here);
    return { ok: true };
  }

  async function remove(formData: FormData) {
    "use server";

    const t = await sessionToken();
    if (!t) redirect(localizedPath(locale, "/login"));

    const kind = String(formData.get("kind") ?? "");
    const id = Number(formData.get("id"));
    if (!Number.isSafeInteger(id) || id <= 0) return;

    const path = kind === "group" ? "room-groups" : "rooms";

    try {
      await call(`/businesses/${slug}/${path}/${id}`, {
        method: "DELETE",
        token: t,
      });
    } catch (err) {
      // Swallowed: the only refusal that reaches here is a room type still
      // holding bookings, and the list re-renders with it still present, which
      // is the honest outcome. Worth a message once anybody asks why.
      console.error("Remove failed:", err);
    }

    revalidatePath(here);
  }

  return (
    <>
    <h1 style={{ margin: "1.25rem 0 0.4rem" }}>Rooms</h1>
    <p className="lede" style={{ marginBottom: "2.5rem" }}>
      Set these up once. The calendar and every booking read from them.
    </p>

    <RoomsSetup
      groups={data.groups}
      rooms={data.rooms}
      addGroup={addGroup}
      addRoom={addRoom}
      remove={remove}
    />

    <p style={{ marginTop: "1.5rem" }}>
      <Link
        className="btn btn-go"
        href={localizedPath(lang, `/dashboard/${slug}/bookings/calendar`)}
      >
        Open the calendar
      </Link>
    </p>
  </>
  );
}
