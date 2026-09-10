"use client";

import { useState } from "react";
import Calendar, { type MoveResult } from "./Calendar";
import BookingPanel, { type EditResult } from "./BookingPanel";
import type { Booking, CalendarWindow, TakenNight } from "@/lib/customer";

/**
 * Holds which booking is open, and joins the grid to the panel.
 *
 * Both need to be client components — one drags, the other is a dialog — and
 * they need to agree on the selection, so the state lives above them. The page
 * itself stays a server component and passes the actions down.
 */
export default function Diary({
  data,
  move,
  save,
  assign,
  setStatus,
}: {
  data: CalendarWindow;
  move: (bookingId: number, roomId: number | null) => Promise<MoveResult>;
  save: (id: number, patch: Record<string, unknown>) => Promise<EditResult>;
  assign: (id: number, roomId: number | null) => Promise<EditResult>;
  setStatus: (id: number, status: string) => Promise<EditResult>;
}) {
  const [open, setOpen] = useState<Booking | null>(null);

  /**
   * A grid cell knows a stay by its room-night, which carries the guest and the
   * dates but not the room type or the headcount. The full record is in the
   * unassigned list, or is rebuilt from the room it is sitting in — enough for
   * the panel, which re-reads nothing it does not show.
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
      adults: 1,
      children: 0,
      arrival: source.arrival,
      departure: source.departure,
      nights: 0,
      status: source.status,
      source: source.source,
      notes: null,
      // The grid is not sent the money — a room-night carries the guest and
      // the dates, and nothing else. Null here reads as "unpriced" in the
      // panel, which is honest: this is a partial record, and the panel does
      // not show a total it was never given.
      ratePlanId: null,
      totalMinor: null,
      total: null,
      createdAt: "",
    };
  }

  return (
    <>
      <Calendar
        data={data}
        move={move}
        onOpen={(source) => setOpen(toBooking(source))}
      />
      <BookingPanel
        booking={open}
        rooms={data.rooms}
        onClose={() => setOpen(null)}
        save={save}
        assign={assign}
        setStatus={setStatus}
      />
    </>
  );
}
