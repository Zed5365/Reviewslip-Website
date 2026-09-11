"use client";

import { useState } from "react";
import Desk, { type DeskResult } from "./Desk";
import BookingPanel, { type EditResult } from "./BookingPanel";
import type { Booking, DayView, Room } from "@/lib/customer";

/**
 * Holds which booking is open, and joins the day list to the panel.
 *
 * The same shape as Diary does for the calendar, and for the same reason: the
 * page stays a server component and passes the actions down, while the piece
 * that needs to remember a selection is a client one.
 *
 * Reusing BookingPanel rather than writing a second editor. A stay opened from
 * the arrivals list and one opened from the grid are the same thing, and two
 * editors would drift — one of them would grow a field the other did not.
 */
export default function DeskBoard({
  day,
  rooms,
  checkIn,
  checkOut,
  setHousekeeping,
  save,
  assign,
  markStatus,
}: {
  day: DayView;
  rooms: Room[];
  checkIn: (id: number) => Promise<DeskResult>;
  checkOut: (id: number) => Promise<DeskResult>;
  setHousekeeping: (roomId: number, state: string) => Promise<DeskResult>;
  save: (id: number, patch: Record<string, unknown>) => Promise<EditResult>;
  assign: (id: number, roomId: number | null) => Promise<EditResult>;
  markStatus: (id: number, status: string) => Promise<EditResult>;
}) {
  const [open, setOpen] = useState<Booking | null>(null);

  return (
    <>
      <Desk
        day={day}
        checkIn={checkIn}
        checkOut={checkOut}
        setHousekeeping={setHousekeeping}
        onOpen={setOpen}
      />
      <BookingPanel
        booking={open}
        rooms={rooms}
        onClose={() => setOpen(null)}
        save={save}
        assign={assign}
        setStatus={markStatus}
      />
    </>
  );
}
