"use client";

import { useActionState, useState } from "react";

import type { VenueState } from "@/app/actions/venue";
import type { VenueSettings } from "@/lib/api";
import styles from "./dash.module.css";

type Action = (state: VenueState, formData: FormData) => Promise<VenueState>;

const EMPTY: VenueState = {};

/** Says where an inherited value came from, so nothing looks like a mystery. */
function Origin({ source }: { source: string }) {
  if (source === "subscriber") return null;
  return (
    <em className={styles.origin}>
      {source === "env" ? "inherited" : "default"}
    </em>
  );
}

export function SettingsForm({
  action,
  name,
  settings,
}: {
  action: Action;
  name: string;
  settings: VenueSettings;
}) {
  const [state, formAction, pending] = useActionState(action, EMPTY);

  // The one genuinely interactive part: a list that grows and shrinks. Each row
  // is an input of the same name, so the action reads them with getAll.
  const [details, setDetails] = useState<string[]>(
    settings.safeDetails.value.length ? settings.safeDetails.value : [""]
  );
  const full = details.length >= settings.limits.safeDetails;

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
          defaultValue={name}
          maxLength={120}
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="googleUrl">
          Google review link
          <Origin source={settings.googleUrl.source} />
        </label>
        <input
          className={styles.input}
          id="googleUrl"
          name="googleUrl"
          type="url"
          defaultValue={settings.googleUrl.value}
          placeholder="https://www.google.com/maps?cid=…"
        />
        <span className={styles.hint}>
          Where Proceed to Google sends the guest. Without it, they get a review
          and nowhere to post it.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tripadvisorUrl">
          Tripadvisor link
          <Origin source={settings.tripadvisorUrl.source} />
        </label>
        <input
          className={styles.input}
          id="tripadvisorUrl"
          name="tripadvisorUrl"
          type="url"
          defaultValue={settings.tripadvisorUrl.value}
        />
        <span className={styles.hint}>
          Optional. Leave it empty and the button stays off the page.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="kind">
          What this place is
          <Origin source={settings.kind.source} />
        </label>
        <input
          className={styles.input}
          id="kind"
          name="kind"
          defaultValue={settings.kind.value}
          maxLength={120}
          placeholder="a small lodge"
        />
        <span className={styles.hint}>
          How a review refers to it, mid-sentence.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="place">
          Where it is
          <Origin source={settings.place.source} />
        </label>
        <input
          className={styles.input}
          id="place"
          name="place"
          defaultValue={settings.place.value}
          maxLength={160}
          placeholder="San Kamphaeng, Chiang Mai, Thailand"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Details reviews may use
          <Origin source={settings.safeDetails.source} />
        </span>
        <div className={styles.rows}>
          {details.map((detail, index) => (
            <div className={styles.row} key={index}>
              <input
                className={styles.input}
                name="safeDetails"
                defaultValue={detail}
                maxLength={180}
                placeholder="something a guest could see for themselves"
              />
              <button
                type="button"
                className={styles.rowRemove}
                aria-label="Remove detail"
                onClick={() =>
                  setDetails(details.filter((_, i) => i !== index))
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className="btn btn-quiet"
            disabled={full}
            onClick={() => setDetails([...details, ""])}
          >
            {full ? `${settings.limits.safeDetails} is the maximum` : "Add detail"}
          </button>
        </div>
        <span className={styles.hint}>
          The only things a review is allowed to claim about this venue. A wrong
          one is repeated in every review from then on, not just one — so no
          numbers, no awards, no staff or dish names. Empty the list to fall back
          to the defaults.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="websiteUrl">
          Venue website
          <Origin source={settings.websiteUrl.source} />
        </label>
        <input
          className={styles.input}
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          defaultValue={settings.websiteUrl.value}
        />
        <span className={styles.hint}>Guests never see it.</span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="model">
          Model
          <Origin source={settings.model.source} />
        </label>
        <input
          className={styles.input}
          id="model"
          name="model"
          defaultValue={settings.model.value}
          placeholder="anthropic/claude-haiku-4.5"
          spellCheck={false}
        />
        <span className={styles.hint}>
          Any slug from openrouter.ai/models. Checked before it saves.
        </span>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="apiKey">
          OpenRouter key
          <Origin source={settings.apiKey.source} />
        </label>
        <input
          className={styles.input}
          id="apiKey"
          name="apiKey"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={settings.apiKey.set ? "Unchanged" : "sk-or-v1-…"}
        />
        <span className={styles.hint}>
          {settings.apiKey.set
            ? `Currently ${settings.apiKey.hint}. Leave blank to keep it.`
            : "Not set — this venue uses the platform key."}
        </span>
      </div>

      <p
        className={`${styles.notice} ${
          state.error ? styles.noticeError : styles.noticeOk
        }`}
        aria-live="polite"
      >
        {state.error ?? state.warning ?? (state.ok ? "Saved." : "")}
      </p>

      <div className={styles.actions}>
        <button className="btn btn-go" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
