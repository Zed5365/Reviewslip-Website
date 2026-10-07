import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ServerHealth from "@/components/admin/ServerHealth";
import { currentStaff } from "@/lib/customer";

export const metadata: Metadata = {
  title: "Server",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * The server monitor, as a tab in the dashboard — for admin accounts only, so
 * it can be read without going to the staff host. Anybody else gets the same
 * not-found as an address that does not exist.
 */
export default async function DashboardServerPage() {
  if (!(await currentStaff())) notFound();
  return <ServerHealth />;
}
