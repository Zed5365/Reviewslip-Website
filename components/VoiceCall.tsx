"use client";

import { useEffect } from "react";

import { PORTAL_VOICE_API, PORTAL_VOICE_SITE, VOICE_URL } from "@/lib/site";

import styles from "./VoiceCall.module.css";

/**
 * A call button in the browser, and a voice message when nobody is free.
 *
 * Two phones answer, depending on who is being called:
 *
 *   a venue        Reviewslip's own softphone (the review app's
 *                  voice-call.js), answered on the venue's phone page.
 *   "reviewslip"   Sales and Support, answered by our team on the Vibe
 *                  Crafted portal softphone they already sit on — so nobody
 *                  signs in to a second phone. Its widget is the portal's.
 *
 * Each widget binds its own attribute (data-rs-call, the portal's
 * data-voice-call) by one click listener on the document and shows a button
 * only once its line answers the status check. So the phone link, when there
 * is one, stays beside it as the fallback, and CSS hides the link the moment
 * the button appears.
 */

declare global {
  interface Window {
    ReviewslipVoice?: { refresh: () => void };
    VOICE_REFRESH?: () => void;
    VOICE_CALLER?: string;
  }
}

/** Loads a widget's script once; later renders only ask it to look again. */
function useScript(id: string, src: string, data: Record<string, string>, refresh: () => void) {
  const key = JSON.stringify(data);
  useEffect(() => {
    if (document.getElementById(id)) {
      refresh();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.defer = true;
    Object.assign(script.dataset, JSON.parse(key));
    document.body.appendChild(script);
  }, [id, src, key, refresh]);
}

const refreshOwn = () => window.ReviewslipVoice?.refresh();
const refreshPortal = () => window.VOICE_REFRESH?.();

function OwnWidget() {
  useScript("rs-voice-call", `${VOICE_URL}/voice-call.js`, { voiceApi: VOICE_URL }, refreshOwn);
  return null;
}

/**
 * The portal's widget, for Sales and Support. It reads its site from its own
 * script tag once per page load — always ours here, so that never changes.
 * No floating bubble: these pages carry their own buttons.
 */
function PortalWidget({ caller }: { caller?: string }) {
  useEffect(() => {
    if (caller) window.VOICE_CALLER = caller;
  }, [caller]);
  useScript(
    "vcs-voice-widget",
    `${PORTAL_VOICE_API}/assets/voice-widget.js`,
    { voiceApi: PORTAL_VOICE_API, voiceSite: PORTAL_VOICE_SITE, voiceFab: "off" },
    refreshPortal
  );
  return null;
}

export default function VoiceCall({
  line,
  team,
  label,
  leaveLabel,
  fallbackHref,
  fallbackLabel,
  phone,
  className,
  caller,
  icon,
}: {
  /** A venue's address, or "reviewslip" for Sales and Support. */
  line: string;
  team: "sales" | "support";
  /** The button while someone can answer: "Call Reservations". */
  label: string;
  /** The button when only a message can be left. */
  leaveLabel?: string;
  /** A tel: link shown until (and unless) the call button appears. */
  fallbackHref?: string | null;
  fallbackLabel?: string;
  /** The number as written, offered in the panel if the browser cannot call. */
  phone?: string | null;
  className?: string;
  /** Who is calling, shown to the person who answers. */
  caller?: string;
  icon?: React.ReactNode;
}) {
  const portal = line === "reviewslip";

  const fallback = fallbackHref ? (
    <a className={`${className ?? ""} ${styles.fallback}`} href={fallbackHref}>
      {icon} {fallbackLabel ?? label}
    </a>
  ) : null;

  if (portal) {
    return (
      <span className={styles.pair}>
        <PortalWidget caller={caller} />
        <button type="button" className={`${className ?? ""} ${styles.call}`} data-voice-call data-voice-team={team} hidden>
          {icon} <span data-voice-label>{label}</span>
        </button>
        {fallback}
      </span>
    );
  }

  return (
    <span className={styles.pair}>
      <OwnWidget />
      <button
        type="button"
        className={`${className ?? ""} ${styles.call}`}
        data-rs-call
        data-voice-line={line}
        data-voice-team={team}
        data-voice-leave={leaveLabel}
        data-voice-caller={caller}
        data-voice-phone={phone || undefined}
        hidden
      >
        {icon} <span data-voice-label>{label}</span>
      </button>
      {fallback}
    </span>
  );
}
