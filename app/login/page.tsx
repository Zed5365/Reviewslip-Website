import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { login } from "@/app/actions/auth";
import { LoginForm } from "@/components/dash/AuthForm";
import styles from "@/components/dash/dash.module.css";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Sign in",
  // A sign-in page has nothing to offer a search engine and every reason to
  // stay out of an index.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <main className={styles.authWrap}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Sign in</h1>
        <p className={styles.authSub}>Manage your venues and see how they are doing.</p>
        <LoginForm action={login} />
      </div>
    </main>
  );
}
