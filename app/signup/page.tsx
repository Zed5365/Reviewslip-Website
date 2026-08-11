import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signup } from "@/app/actions/auth";
import { SignupForm } from "@/components/dash/AuthForm";
import styles from "@/components/dash/dash.module.css";
import { currentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Create an account",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <main className={styles.authWrap}>
      <div className={styles.authCard}>
        <h1 className={styles.authTitle}>Create an account</h1>
        <p className={styles.authSub}>
          Set up your venues, then point a QR code at them.
        </p>
        <SignupForm action={signup} />
      </div>
    </main>
  );
}
