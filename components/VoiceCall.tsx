"use client";

import { useEffect } from "react";

import styles from "./VoiceCall.module.css";

/**
 * A call button through the Vibe Crafted softphone: an in-browser call to a
 * site's Sales or Support team, or a voicemail when nobody is free.
 *
 * The widget (portal.vibecraftedsoftware.com/assets/voice-widget.js) binds
 * every [data-voice-call] element by a click listener on the document, shows a
 * button only once that team answers its status check, and keeps it hidden on
 * a browser that cannot place a call. So the phone link, when there is one,
 * stays beside it as the fallback, and CSS hides the link the moment the button
 * appears.
 *
 * One site per page load: the widget reads its site from its own script tag,
 * once. This site navigates without reloading, so a guest going from one
 * venue's page to another's, or to Reviewslip's own pages, would otherwise ring
 * the first site. The script is injected here rather than in the layout, and a
 * page that needs a different site than the one already loaded reloads itself
 * once — the only way to give the widget a fresh start.
 */

const WIDGET = "https://portal.vibecraftedsoftware.com/assets/voice-widget.js";
const API = "https://portal.vibecraftedsoftware.com";

declare global {
  interface Window {
    VOICE_REFRESH?: () => void;
    VOICE_CALLER?: string;
    VOICE_I18N?: Record<string, string>;
    __voiceSite?: string;
  }
}

/**
 * The widget's own words for the button, by its keys: callTeam ("Call
 * {team}"), teamSales, teamSupport, leave. Read by the widget each time it
 * labels a button, so setting them before it next polls is enough.
 */
export type VoiceWords = Partial<Record<"callTeam" | "teamSales" | "teamSupport" | "leave", string>>;

function useWidget(site: string, caller: string | undefined, words: VoiceWords | undefined) {
  const wordsKey = JSON.stringify(words ?? {});
  useEffect(() => {
    if (!site) return;
    if (caller) window.VOICE_CALLER = caller;
    if (wordsKey !== "{}") window.VOICE_I18N = { ...(window.VOICE_I18N ?? {}), ...JSON.parse(wordsKey) };

    const loaded = window.__voiceSite;
    if (loaded && loaded !== site) {
      window.location.reload();
      return;
    }
    if (loaded === site) {
      // Already running: a button this render added waits for the next poll
      // for its label and visibility unless asked now.
      window.VOICE_REFRESH?.();
      return;
    }

    window.__voiceSite = site;
    const script = document.createElement("script");
    script.src = WIDGET;
    script.defer = true;
    script.dataset.voiceApi = API;
    script.dataset.voiceSite = site;
    // These pages carry their own buttons; a floating bubble would be a second
    // way to ring the same people, following the reader down the page.
    script.dataset.voiceFab = "off";
    document.body.appendChild(script);
  }, [site, caller, wordsKey]);
}

export default function VoiceCall({
  site,
  team,
  label,
  fallbackHref,
  fallbackLabel,
  className,
  caller,
  icon,
  words,
}: {
  /** The softphone site key; empty means no softphone, only the fallback. */
  site: string | null | undefined;
  team: "sales" | "support";
  label: string;
  /** A tel: link shown until (and unless) the softphone button appears. */
  fallbackHref?: string | null;
  fallbackLabel?: string;
  className?: string;
  /** Who is calling, shown to the person who answers. */
  caller?: string;
  icon?: React.ReactNode;
  words?: VoiceWords;
}) {
  useWidget(site ?? "", caller, words);

  if (!site) {
    return fallbackHref ? (
      <a className={className} href={fallbackHref}>
        {icon} {fallbackLabel ?? label}
      </a>
    ) : null;
  }

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
