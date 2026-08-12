"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { CONTACT_EMAIL, CONTACT_FORM_ENDPOINT } from "@/lib/site";
import styles from "./ContactForm.module.css";

type Status = "idle" | "sending" | "success" | "error";

interface Fields {
  name: string;
  email: string;
  business: string;
  locations: string;
  message: string;
}

const EMPTY: Fields = {
  name: "",
  email: "",
  business: "",
  locations: "",
  message: "",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({
  f,
  compact = false,
  heading,
  submitLabel,
}: {
  f: Dictionary["contact"]["form"];
  /** Sign-up variant: name + email + business only, no locations or message. */
  compact?: boolean;
  /** Override the form heading (defaults to f.heading). */
  heading?: string;
  /** Override the submit button label (defaults to f.submit). */
  submitLabel?: string;
}) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>(
    {}
  );
  const [status, setStatus] = useState<Status>("idle");

  const update = (key: keyof Fields, value: string) => {
    setFields((cur) => ({ ...cur, [key]: value }));
    if (errors[key]) setErrors((cur) => ({ ...cur, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof Fields, string>> = {};
    if (!fields.name.trim()) next.name = f.errRequired;
    if (!fields.email.trim()) next.email = f.errRequired;
    else if (!EMAIL_RE.test(fields.email.trim())) next.email = f.errEmail;
    if (!compact && !fields.message.trim()) next.message = f.errRequired;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendViaMailto = () => {
    const lines = [
      `Name: ${fields.name}`,
      `Email: ${fields.email}`,
      fields.business ? `Business: ${fields.business}` : null,
      fields.locations ? `Locations: ${fields.locations}` : null,
      "",
      fields.message,
    ].filter((l) => l !== null);
    const subject = `Reviewslip enquiry — ${fields.name}`;
    const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
    window.location.href = href;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    if (!validate()) return;

    setStatus("sending");
    try {
      if (CONTACT_FORM_ENDPOINT) {
        const res = await fetch(CONTACT_FORM_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(fields),
        });
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
      } else {
        // No backend configured: hand off to the visitor's email client.
        sendViaMailto();
      }
      setStatus("success");
      setFields(EMPTY);
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className={styles.success} role="status">
        <div className={styles.successIcon} aria-hidden="true">
          ✓
        </div>
        <h3 className={styles.successTitle}>{f.successTitle}</h3>
        <p className={styles.successBody}>{f.successBody}</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h3 className={styles.heading}>{heading ?? f.heading}</h3>

      {status === "error" && (
        <div className={styles.errorBanner} role="alert">
          <strong>{f.errorTitle}</strong>
          <span>{f.errorBody}</span>
        </div>
      )}

      <div className={styles.row}>
        <Field
          id="cf-name"
          label={f.name}
          error={errors.name}
          value={fields.name}
          onChange={(v) => update("name", v)}
          placeholder={f.namePlaceholder}
          autoComplete="name"
          required
        />
        <Field
          id="cf-email"
          label={f.email}
          error={errors.email}
          value={fields.email}
          onChange={(v) => update("email", v)}
          placeholder={f.emailPlaceholder}
          type="email"
          autoComplete="email"
          required
        />
      </div>

      {compact ? (
        <Field
          id="cf-business"
          label={f.business}
          value={fields.business}
          onChange={(v) => update("business", v)}
          placeholder={f.businessPlaceholder}
          autoComplete="organization"
        />
      ) : (
        <div className={styles.row}>
          <Field
            id="cf-business"
            label={f.business}
            value={fields.business}
            onChange={(v) => update("business", v)}
            placeholder={f.businessPlaceholder}
            autoComplete="organization"
          />
          <Field
            id="cf-locations"
            label={f.locations}
            value={fields.locations}
            onChange={(v) => update("locations", v)}
            type="number"
            inputMode="numeric"
            min={1}
          />
        </div>
      )}

      {!compact && (
        <div className={styles.field}>
          <label htmlFor="cf-message" className={styles.label}>
            {f.message}
          </label>
          <textarea
            id="cf-message"
            className={`${styles.input} ${styles.textarea} ${
              errors.message ? styles.invalid : ""
            }`}
            value={fields.message}
            onChange={(e) => update("message", e.target.value)}
            placeholder={f.messagePlaceholder}
            rows={5}
            aria-invalid={!!errors.message}
          />
          {errors.message && (
            <span className={styles.errorText}>{errors.message}</span>
          )}
        </div>
      )}

      <button
        type="submit"
        className={`btn btn-go ${styles.submit}`}
        disabled={status === "sending"}
      >
        {status === "sending" ? f.sending : submitLabel ?? f.submit}
      </button>

      <p className={styles.orEmail}>
        {f.orEmail}{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
  autoComplete,
  inputMode,
  min,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  inputMode?: "numeric";
  min?: number;
}) {
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
        {required && <span className={styles.req} aria-hidden="true"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${error ? styles.invalid : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        min={min}
        aria-invalid={!!error}
      />
      {error && <span className={styles.errorText}>{error}</span>}
    </div>
  );
}
