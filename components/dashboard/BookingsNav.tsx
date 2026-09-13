"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The reservations module's own tabs.
 *
 * These five pages were siblings of Settings and Table card on the venue page,
 * which put seven buttons in a row and said nothing about which of them belong
 * together. They are one job — running the rooms — and they now sit behind one
 * door with their own navigation.
 *
 * A client component because knowing which tab you are on needs the path, and
 * the current tab is marked with `aria-current` and styled off that attribute
 * rather than a class of its own. The same reasoning as the staff nav: one
 * piece of state, so what a screen reader announces and what the eye sees
 * cannot drift.
 */

const TABS = [
  { segment: "", label: "Today" },
  { segment: "calendar", label: "Calendar" },
  { segment: "rooms", label: "Rooms" },
  { segment: "rates", label: "Rates" },
  { segment: "tm30", label: "TM30" },
];

export default function BookingsNav({ base }: { base: string }) {
  const path = usePathname() ?? "";

  return (
    <nav className="admin-nav" aria-label="Reservations">
      {TABS.map((tab) => {
        const href = tab.segment ? `${base}/${tab.segment}` : base;

        // The module root would otherwise match every tab beneath it, so it is
        // the one that has to be exact.
        const current = tab.segment
          ? path === href || path.startsWith(`${href}/`)
          : path === base || path === `${base}/`;

        return (
          <Link key={tab.label} href={href} aria-current={current ? "page" : undefined}>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
