import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/app/actions/auth";
import styles from "@/components/dash/dash.module.css";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

/**
 * The gate. Every page under /dashboard renders inside this, so the check
 * happens once — but each Server Action still re-checks the session itself,
 * because a layout does not run before an action does.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await currentUser();
  if (!me) redirect("/login");

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <Link href="/dashboard" className={styles.brand}>
          Reviewslip
        </Link>
        <div className={styles.who}>
          <Link href="/dashboard/billing">
            {me.account.username} · {me.plan.name}
          </Link>
          <form action={logout}>
            <button className="btn btn-quiet" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
