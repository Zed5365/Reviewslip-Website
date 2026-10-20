"use client";

import { useEffect } from "react";

import { PORTAL_VOICE_API, PORTAL_VOICE_SITE } from "@/lib/site";

import styles from "./VoiceCall.module.css";

/**
 * A call button in the browser, through the Vibe Crafted portal softphone:
 * our team answers it there, on the phone they already work on, so nobody
 * signs in to anything else. A voice message when nobody is free.
 *
 * Every button on this site rings the one portal site, PORTAL_VOICE_SITE —
 * Sales on the public pages, Support for customers and booked guests. A
 * venue's buttons ring us too, on the venue's behalf: `caller` says which
 * venue, and the guest, so whoever picks up knows before they say hello.
 *
 * The widget (the portal's voice-widget.js) binds every [data-voice-call] by
 * one click listener on the document and shows a button only once its list
 * answers the status check. So the phone link, when there is one, stays
 * beside it as the fallback, and CSS hides the link the moment the button
 * appears. It reads its site once per page load — always ours here.
 */

declare global {
  interface Window {
    VOICE_REFRESH?: () => void;
    VOICE_CALLER?: string;
    VOICE_I18N?: Record<string, string>;
  }
}

/**
 * The widget's own words for the button, by its keys: callTeam ("Call
 * {team}"), teamSales, teamSupport, leave. Read each time it labels a button.
 */
export type VoiceWords = Partial<Record<"callTeam" | "teamSales" | "teamSupport" | "leave", string>>;

const SCRIPT_ID = "vcs-voice-widget";

function useWidget(caller: string | undefined, words: VoiceWords | undefined) {
  const wordsKey = JSON.stringify(words ?? {});
  useEffect(() => {
    // Who is calling and the button's words are page-wide for the widget, so
    // each page sets its own as it opens.
    window.VOICE_CALLER = caller ?? "";
    window.VOICE_I18N = { ...(window.VOICE_I18N ?? {}), ...JSON.parse(wordsKey) };

    if (document.getElementById(SCRIPT_ID)) {
      // Already running: a button this page added waits for the next poll for
      // its label and visibility unless asked now.
      window.VOICE_REFRESH?.();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${PORTAL_VOICE_API}/assets/voice-widget.js`;
    script.defer = true;
    script.dataset.voiceApi = PORTAL_VOICE_API;
    script.dataset.voiceSite = PORTAL_VOICE_SITE;
    // These pages carry their own buttons; a floating bubble would be a second
    // way to ring the same people, following the reader down the page.
    script.dataset.voiceFab = "off";
    document.body.appendChild(script);
  }, [caller, wordsKey]);
}

export default function VoiceCall({
  team,
  label,
  words,
  caller,
  fallbackHref,
  fallbackLabel,
  className,
  icon,
}: {
  /** Which of the portal site's lists rings: Sales or Support. */
  team: "sales" | "support";
  /** The button until the widget writes its own label: "Call Sales". */
  label: string;
  words?: VoiceWords;
  /** Who is calling and about what, shown to the person who answers. */
  caller?: string;
  /** A tel: link shown until (and unless) the call button appears. */
  fallbackHref?: string | null;
  fallbackLabel?: string;
  className?: string;
  icon?: React.ReactNode;
}) {
  useWidget(caller, words);

  return (
    <span className={styles.pair}>
      <button type="button" className={`${className ?? ""} ${styles.call}`} data-voice-call data-voice-team={team} hidden>
        {icon} <span data-voice-label>{label}</span>
      </button>
      {fallbackHref ? (
        <a className={`${className ?? ""} ${styles.fallback}`} href={fallbackHref}>
          {icon} {fallbackLabel ?? label}
        </a>
      ) : null}
    </span>
  );
}
