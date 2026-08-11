"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import type { CreateVenueState } from "@/app/actions/venues";
import styles from "./dash.module.css";

type Action = (
  state: CreateVenueState,
  formData: FormData
) => Promise<CreateVenueState>;

const EMPTY: CreateVenueState = {};

interface Check {
  state: "idle" | "checking" | "ok" | "bad";
  reason?: string;
  url?: string;
}

/** The same shape the review app requires, so the hint matches the rule. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32)
    .replace(/-+$/, "");
}

export function SlugPicker({
  action,
  baseDomain,
}: {
  action: Action;
  baseDomain: string;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  const [name, setName] = useState(state.values?.name ?? "");
  const [slug, setSlug] = useState(state.values?.slug ?? "");
  // Once someone edits the address themselves, the name stops driving it —
  // otherwise a later change to the name would silently undo their choice.
  const [slugEdited, setSlugEdited] = useState(Boolean(state.values?.slug));
  const [check, setCheck] = useState<Check>({ state: "idle" });

  const shown = slugEdited ? slug : slugify(name);

  // The check is debounced and out of date the moment it returns, so each
  // request records which value it was for and stale answers are dropped.
  const latest = useRef("");

  useEffect(() => {
    const value = shown;
    latest.current = value;

    if (!value) {
      setCheck({ state: "idle" });
      return;
    }

    setCheck({ state: "checking" });
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/slug?slug=${encodeURIComponent(value)}`);
        const data = await res.json();
        if (latest.current !== value) return;

        setCheck(
          data.valid && data.available
            ? { state: "ok", url: data.url }
            : { state: "bad", reason: data.reason ?? data.error ?? "Not usable." }
        );
      } catch {
        if (latest.current === value) {
          setCheck({ state: "bad", reason: "Could not check that address." });
        }
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [shown]);

  const ready = check.state === "ok" && name.trim().length > 0;

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Venue name
        </label>
        <input
          className={styles.input}
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Baanpong Lodge"
          required
        />
        <span className={styles.hint}>What guests see at the top of the page.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="slug">
          Address
        </label>
        <div className={styles.slugRow}>
          <input
            className={`${styles.input} ${styles.slugInput}`}
            id="slug"
            name="slug"
            value={shown}
            onChange={(e) => {
              setSlugEdited(true);
              setSlug(slugify(e.target.value));
            }}
            maxLength={32}
            placeholder="baanpong"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
          />
          <span className={styles.slugSuffix}>.{baseDomain}</span>
        </div>

        <span
          className={`${styles.slugStatus} ${
            check.state === "ok"
              ? styles.slugOk
              : check.state === "bad"
                ? styles.slugBad
                : ""
          }`}
          aria-live="polite"
        >
          {check.state === "checking" && "Checking…"}
          {check.state === "ok" && `${shown}.${baseDomain} is available`}
          {check.state === "bad" && check.reason}
          {check.state === "idle" && "Filled in from the name — edit it if you like."}
        </span>

        <span className={styles.hint}>
          This becomes the venue&apos;s own web address, and it is what a QR code
          points at. It cannot be changed afterwards without reprinting the code,
          so pick one you can live with.
        </span>
      </div>

      <p className={`${styles.notice} ${styles.noticeError}`} aria-live="polite">
        {state.error ?? ""}
      </p>

      <div className={styles.actions}>
        <button className="btn btn-go" type="submit" disabled={pending || !ready}>
          {pending ? "Creating…" : "Create venue"}
        </button>
      </div>
    </form>
  );
}
