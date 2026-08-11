"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthState } from "@/app/actions/auth";
import { USERNAME_HINT } from "@/lib/rules";
import styles from "./dash.module.css";

type Action = (state: AuthState, formData: FormData) => Promise<AuthState>;

const EMPTY: AuthState = {};

export function LoginForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="identifier">
          Email or username
        </label>
        <input
          className={styles.input}
          id="identifier"
          name="identifier"
          autoComplete="username"
          defaultValue={state.values?.identifier ?? ""}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      <p className={`${styles.notice} ${styles.noticeError}`} aria-live="polite">
        {state.error ?? ""}
      </p>

      <div className={styles.actions}>
        <button className="btn btn-go" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </div>

      <p className={styles.authAlt}>
        No account yet? <Link href="/signup">Create one</Link>.
      </p>
    </form>
  );
}

export function SignupForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">
          Email
        </label>
        <input
          className={styles.input}
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ""}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="username">
          Username
        </label>
        <input
          className={styles.input}
          id="username"
          name="username"
          autoComplete="username"
          defaultValue={state.values?.username ?? ""}
          required
        />
        <span className={styles.hint}>{USERNAME_HINT}</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          Password
        </label>
        <input
          className={styles.input}
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <span className={styles.hint}>
          At least 10 characters. Length beats punctuation.
        </span>
      </div>

      <p className={`${styles.notice} ${styles.noticeError}`} aria-live="polite">
        {state.error ?? ""}
      </p>

      <div className={styles.actions}>
        <button className="btn btn-go" type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create account"}
        </button>
      </div>

      <p className={styles.authAlt}>
        Already have one? <Link href="/login">Sign in</Link>.
      </p>
    </form>
  );
}
