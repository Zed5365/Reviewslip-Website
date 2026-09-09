"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The staff tabs, with the current one marked.
 *
 * A client component only because knowing which tab you are on needs the path,
 * and the path is not available to a layout on the server in a way that
 * survives navigation between its own children.
 *
 * The current tab is marked with `aria-current="page"` and styled off that
 * attribute rather than a class of its own — so the thing a screen reader
 * announces and the thing the eye sees cannot drift apart, which they do the
 * moment they are two separate pieces of state.
 */

const TABS = [
  { href: "/", label: "Accounts" },
  { href: "/tickets", label: "Tickets" },
  { href: "/venues", label: "Venues" },
];

export default function AdminNav() {
  const path = usePathname() ?? "/";

  return (
    <nav className="admin-nav" aria-label="Staff sections">
      {TABS.map((tab) => {
        // "/" would otherwise match every path. Everything else matches its own
        // subtree, so /tickets/3 keeps Tickets lit rather than nothing.
        const current =
          tab.href === "/" ? path === "/" : path.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
