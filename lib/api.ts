import "server-only";

/**
 * The review app's customer API.
 *
 * That app owns the database — accounts, venues, usage — and this site is a
 * client of it. Nothing here talks to Postgres directly: two codebases writing
 * one schema is how schemas rot.
 *
 * Calls go over loopback on the same box, so there is no TLS and no latency
 * worth caching around. The session token comes from the browser's httpOnly
 * cookie and is forwarded as a bearer, which means the review app verifies who
 * the caller is rather than taking this site's word for it.
 */

const BASE = process.env.REVIEW_API_URL ?? "http://127.0.0.1:3000";

export interface ApiError extends Error {
  status: number;
}

function apiError(status: number, message: string): ApiError {
  return Object.assign(new Error(message), { status });
}

interface CallOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

export async function call<T>(path: string, options: CallOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  let res: Response;
  try {
    res = await fetch(`${BASE}/api/customer${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      // Account and usage data is per-request and changes under us; a cached
      // dashboard is a wrong dashboard.
      cache: "no-store",
    });
  } catch {
    throw apiError(503, "Could not reach the service. Try again in a moment.");
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw apiError(
      res.status,
      typeof data?.error === "string" ? data.error : "Something went wrong."
    );
  }

  return data as T;
}

/* ------------------------------------------------------------------- shapes */

export interface Account {
  id: number;
  email: string;
  username: string;
  plan: string;
  status: string;
  createdAt: string;
}

export interface VenueUsage {
  reviews: number;
  tokens: number;
  tokenLimit: number;
}

export interface VenueSummary {
  slug: string;
  name: string;
  status: string;
  url: string;
  createdAt: string;
  usage: VenueUsage;
  ready: boolean;
  plan: string;
}

export interface Me {
  account: Account;
  plan: {
    id: string;
    name: string;
    venues: number | null;
    reviewAllowance: number;
    tokensPerMonthPerVenue: number;
  };
  usage: { reviewsThisMonth: number; venues: number };
  canAddVenue: boolean;
  venues: VenueSummary[];
}

export interface Session {
  account: Account;
  token: string;
  expiresAt: string;
}

/** A setting as the review app describes it: the value, and where it came from. */
export interface Setting<T> {
  value: T;
  source: "subscriber" | "env" | "default";
}

export interface VenueSettings {
  apiKey: { set: boolean; hint: string; source: string };
  model: Setting<string>;
  googleUrl: Setting<string>;
  tripadvisorUrl: Setting<string>;
  websiteUrl: Setting<string>;
  categories: Setting<{ id: string; label: string; focus: string }[]>;
  kind: Setting<string>;
  place: Setting<string>;
  safeDetails: Setting<string[]>;
  limits: { categories: number; safeDetails: number };
}

export interface VenueDetail {
  venue: {
    slug: string;
    name: string;
    status: string;
    url: string;
    createdAt: string;
  };
  settings: VenueSettings;
  stats: {
    month: { reviews: number; tokens: number; tokenLimit: number };
    lifetime: { reviews: number; tokens: number; lastAt: string | null };
    daily: { day: string; reviews: number; tokens: number }[];
    byCategory: { category: string; reviews: number }[];
  };
}
