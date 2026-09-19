"use client";

import { useState } from "react";
import Calendar, { type MoveResult } from "./Calendar";
import MonthGrid from "./MonthGrid";
import BookingPanel, {
  type CreateResult,
  type EditResult,
  type Prefill,
} from "./BookingPanel";
import type { Booking, CalendarWindow, RatePlan, TakenNight } from "@/lib/customer";

/**
 * Holds which booking is open, and joins the grid to the panel.
 *
 * Both need to be client components — one drags, the other is a dialog — and
 * they need to agree on the selection, so the state lives above them. The page
 * itself stays a server component and passes the actions down.
 */
export default function Diary({
  data,
  groupId = null,
  today = "",
  shape = "month",
  deskBase,
  slug,
  groups,
  plans,
  move,
  create,
  save,
  assign,
  setStatus,
}: {
  data: CalendarWindow;
  groupId?: number | null;
  /** Today at the property, worked out on the server. */
  today?: string;
  /**
   * Which shape of calendar.
   *
   * "month" is the one people mean by a calendar — seven columns, a row per
   * week. "timeline" is rooms down the side and nights across, which is the
   * tool for assigning a room and the only one that can be dragged.
   */
  shape?: "month" | "timeline";
  /** The desk, for the month's day numbers to link into. */
  deskBase: string;
  slug: string;
  groups: { id: number; name: string }[];
  plans: RatePlan[];
  move: (bookingId: number, roomId: number | null) => Promise<MoveResult>;
  create: (values: Record<string, unknown>) => Promise<CreateResult>;
  save: (id: number, patch: Record<string, unknown>) => Promise<EditResult>;
  assign: (id: number, roomId: number | null) => Promise<EditResult>;
  setStatus: (id: number, status: string) => Promise<EditResult>;
}) {
  const [open, setOpen] = useState<Booking | "new" | null>(null);
  const [prefill, setPrefill] = useState<Prefill | undefined>(undefined);

  /**
   * What the grid knows about a stay, shaped as a booking.
   *
   * A grid cell knows a stay by its room-night, which carries the guest and the
   * dates but not the headcount, the email or the money. This is the instant
   * paint; the panel fetches the rest and fills it in.
   *
   * The fields that are genuinely unknown are left null rather than guessed.
   * This used to say `adults: 1` and `nights: 0`, which are not unknowns, they
   * are wrong answers — and a panel showing "1 adult" for a family of four is
   * worse than one showing a dash for half a second.
   */
  function toBooking(source: Booking | TakenNight): Booking {
    if ("id" in source) return source;

    const room = data.rooms.find((r) => r.id === source.roomId);
    return {
      id: source.bookingId,
      groupId: room?.groupId ?? 0,
      groupName: room?.groupName ?? null,
      roomId: source.roomId,
      roomName: room?.name ?? null,
      guestName: source.guestName,
      guestEmail: null,
      guestPhone: null,
      adults: 0,
      children: 0,
      arrival: source.arrival,
      departure: source.departure,
      nights: 0,
      status: source.status,
      source: source.source,
      notes: null,
      ratePlanId: null,
      totalMinor: null,
      total: null,
      createdAt: "",
    };
  }

  return (
    <>
      {shape === "timeline" ? (
        <Calendar
          data={data}
          groupId={groupId}
          today={today}
          move={move}
          onOpen={(source) => {
            setPrefill(undefined);
            setOpen(toBooking(source));
          }}
          onEmpty={(where) => {
            setPrefill(where);
            setOpen("new");
          }}
        />
      ) : (
        <MonthGrid
          data={data}
          groupId={groupId}
          today={today}
          deskBase={deskBase}
          onOpen={(source) => {
            setPrefill(undefined);
            setOpen(toBooking(source));
          }}
          onEmpty={(where) => {
            setPrefill(where);
            setOpen("new");
          }}
        />
      )}
      <BookingPanel
        booking={open}
        prefill={prefill}
        rooms={data.rooms}
        groups={groups}
        plans={plans}
        slug={slug}
        onClose={() => setOpen(null)}
        onCreated={(made) => setOpen(made)}
        create={create}
        save={save}
        assign={assign}
        setStatus={setStatus}
      />
    </>
  );
}
