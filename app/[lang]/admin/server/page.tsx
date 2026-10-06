import type { Metadata } from "next";

import PageHeader from "@/components/app-shell/PageHeader";
import { call, sessionToken } from "@/lib/customer";

export const metadata: Metadata = {
  title: "Server",
  robots: { index: false, follow: false, nocache: true },
};

interface Problem {
  key: string;
  severity: "warning" | "critical";
  summary: string;
  since?: number;
}

interface Readings {
  at: string;
  host: string;
  services: { name: string; state: string }[];
  http: { name: string; ok: boolean; status: number; ms: number; error?: string }[];
  system: {
    diskUsedPct: number | null;
    diskFreeGb: number | null;
    memoryTotalMb: number;
    memoryAvailablePct: number | null;
    swapTotalMb: number | null;
    swapUsedPct: number | null;
    load1: number | null;
    cores: number;
    uptimeHours: number;
  };
  postgres:
    | { ok: true; maxConnections: number; connections: number; longestQuerySeconds: number; idleInTransactionSeconds: number; sizeMb: number; cacheHitPct: number }
    | { ok: false; error: string };
  certificates: { host: string; ok: boolean; daysLeft?: number; error?: string }[];
  backup: { installed: boolean; result?: string | null; hoursAgo?: number | null } | null;
}

interface Health {
  /** The review app's clock when it answered: every "ago" on the page is measured from it. */
  now: number;
  live: {
    status: "ok" | "down";
    database: { ok: boolean; ms: number; error?: string };
    failures5m: number;
    uptimeSeconds: number;
    schema: number | null;
    pool: { total: number; idle: number; waiting: number };
    memoryMb: number;
  };
  monitor: { lastRun: string | null; problems: Problem[]; readings: Readings | null } | null;
}

function ago(iso: string | number | null | undefined, now: number): string {
  if (!iso) return "—";
  const minutes = Math.round((now - (typeof iso === "number" ? iso : Date.parse(iso))) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 90) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return hours < 48 ? `${hours} h ago` : `${Math.round(hours / 24)} days ago`;
}

function Tile({ label, value, note, attention }: { label: string; value: string; note?: string; attention?: boolean }) {
  return (
    <div className={`admin-tile${attention ? " admin-tile-attention" : ""}`}>
      <span className="admin-tile-label">{label}</span>
      <span className="admin-tile-value">{value}</span>
      {note ? <span className="admin-tile-note">{note}</span> : null}
    </div>
  );
}

/**
 * The box and both apps, as the monitor last saw them, plus what the review
 * app can see right now.
 *
 * Attention is for the things somebody has to act on and that clear when they
 * do — an open problem, a stale monitor — never for a number that is merely
 * high.
 */
export default async function ServerPage() {
  const token = await sessionToken();
  const health = await call<Health>("/admin/health", { token });
  const { live, monitor, now } = health;
  const r = monitor?.readings ?? null;
  const problems = monitor?.problems ?? [];
  // Twice the five-minute interval, plus slack: past this the timer has stopped.
  const stale = monitor?.lastRun ? now - Date.parse(monitor.lastRun) > 15 * 60_000 : true;

  return (
    <>
      <PageHeader
        title="Server"
        sub={
          monitor?.lastRun
            ? `${r?.host ?? "server"} · checked ${ago(monitor.lastRun, now)} · problems email info@reviewslip.com`
            : "The monitor has not run yet — see docs/monitoring.md to install it"
        }
      />
      <div className="page-body">
        <div className="admin-tiles">
          <Tile
            label="Status"
            value={live.status !== "ok" ? "Down" : problems.length ? `${problems.length} problem${problems.length === 1 ? "" : "s"}` : "Healthy"}
            note={stale ? "monitor not running" : `monitor ran ${ago(monitor?.lastRun, now)}`}
            attention={live.status !== "ok" || problems.length > 0 || stale}
          />
          <Tile
            label="Database"
            value={live.database.ok ? `${live.database.ms} ms` : "Down"}
            note={`schema ${live.schema ?? "?"} · ${live.pool.total} of 5 connections open`}
            attention={!live.database.ok}
          />
          <Tile
            label="Disk"
            value={r?.system.diskUsedPct != null ? `${r.system.diskUsedPct}%` : "—"}
            note={r?.system.diskFreeGb != null ? `${r.system.diskFreeGb} GB free` : undefined}
          />
          <Tile
            label="Memory"
            value={r?.system.memoryAvailablePct != null ? `${r.system.memoryAvailablePct}% free` : "—"}
            note={
              r
                ? `${r.system.memoryTotalMb} MB · swap ${r.system.swapTotalMb == null ? "—" : r.system.swapTotalMb ? `${r.system.swapUsedPct}% of ${r.system.swapTotalMb} MB` : "none"}`
                : undefined
            }
          />
        </div>

        <section className="group-box" aria-labelledby="problems-title">
          <h2 id="problems-title">Open Problems</h2>
          {problems.length === 0 ? (
            <p style={{ margin: 0, color: "var(--muted-foreground)" }}>
              {monitor ? "Nothing wrong at the last check." : "No readings yet."}
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr><th>Severity</th><th>Problem</th><th>Since</th></tr>
              </thead>
              <tbody>
                {problems.map((p) => (
                  <tr key={p.key}>
                    <td style={{ color: p.severity === "critical" ? "var(--destructive)" : undefined, fontWeight: 600 }}>
                      {p.severity === "critical" ? "Critical" : "Warning"}
                    </td>
                    <td>{p.summary}</td>
                    <td>{ago(p.since, now)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="group-box" aria-labelledby="app-title">
          <h2 id="app-title">Review App, Right Now</h2>
          <table className="admin-table">
            <tbody>
              <tr><td>Database</td><td>{live.database.ok ? `Answering in ${live.database.ms} ms` : `Down — ${live.database.error}`}</td></tr>
              <tr><td>Server errors, last 5 min</td><td>{live.failures5m}</td></tr>
              <tr><td>Connections</td><td>{live.pool.total} open, {live.pool.idle} idle, {live.pool.waiting} waiting</td></tr>
              <tr><td>Up for</td><td>{ago(now - live.uptimeSeconds * 1000, now).replace(" ago", "")}</td></tr>
              <tr><td>Memory used</td><td>{live.memoryMb} MB</td></tr>
            </tbody>
          </table>
        </section>

        {r && (
          <>
            <section className="group-box" aria-labelledby="services-title">
              <h2 id="services-title">Services and Pages</h2>
              <table className="admin-table">
                <thead><tr><th>Check</th><th>State</th></tr></thead>
                <tbody>
                  {r.services.map((s) => (
                    <tr key={s.name}><td>{s.name}</td><td>{s.state}</td></tr>
                  ))}
                  {r.http.map((h) => (
                    <tr key={h.name}>
                      <td>{h.name}</td>
                      <td>{h.ok ? `OK · ${h.ms} ms` : `Down — ${h.error ?? `HTTP ${h.status}`}`}</td>
                    </tr>
                  ))}
                  {r.certificates.map((c) => (
                    <tr key={c.host}>
                      <td>Certificate · {c.host}</td>
                      <td>{c.ok ? `${c.daysLeft} days left` : c.error}</td>
                    </tr>
                  ))}
                  {r.backup?.installed && (
                    <tr>
                      <td>Nightly backup</td>
                      <td>
                        {r.backup.result ?? "not run since boot"}
                        {r.backup.hoursAgo != null ? ` · ${Math.round(r.backup.hoursAgo)} h ago` : ""}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="group-box" aria-labelledby="db-title">
              <h2 id="db-title">Postgres and the Box</h2>
              <table className="admin-table">
                <tbody>
                  {r.postgres.ok ? (
                    <>
                      <tr><td>Connections</td><td>{r.postgres.connections} of {r.postgres.maxConnections}</td></tr>
                      <tr><td>Database size</td><td>{r.postgres.sizeMb} MB</td></tr>
                      <tr><td>Cache hit rate</td><td>{r.postgres.cacheHitPct}%</td></tr>
                      <tr><td>Longest running query</td><td>{r.postgres.longestQuerySeconds} s</td></tr>
                      <tr><td>Oldest open transaction</td><td>{r.postgres.idleInTransactionSeconds} s</td></tr>
                    </>
                  ) : (
                    <tr><td>Postgres</td><td>Down — {r.postgres.error}</td></tr>
                  )}
                  <tr><td>Load (1 min)</td><td>{r.system.load1 != null ? `${r.system.load1.toFixed(2)} on ${r.system.cores} cores` : "—"}</td></tr>
                  <tr><td>Box up for</td><td>{r.system.uptimeHours} h</td></tr>
                </tbody>
              </table>
            </section>
          </>
        )}
      </div>
    </>
  );
}
