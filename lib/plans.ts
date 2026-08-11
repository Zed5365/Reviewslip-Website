/**
 * Plan configuration — the single source of truth for what the marketing site
 * and the customer dashboard display.
 *
 * The review app keeps its own copy of the *limits* in `plans.js`, because it
 * is the thing that actually enforces them and it cannot import from here.
 * Change a limit in one, change it in the other.
 */

export type PlanId = "starter" | "pro" | "enterprise" | "agency";

export type BillingCycle = "monthly" | "yearly";

export interface Plan {
  id: PlanId;
  name: string;
  /** Monthly price in USD. `null` when the plan is priced per venue. */
  priceMonthly: number | null;
  /** Total annual price in USD. `null` when the plan is priced per venue. */
  priceYearly: number | null;
  /** Set instead of the two above: billed per venue, per month. */
  pricePerVenueMonthly?: number;
  tagline: string;
  /** Marketing bullet list. */
  features: string[];
  /** What support looks like on this tier, in a few words. */
  support: string;
  /** Machine-readable limits. Mirrored in the review app's plans.js. */
  limits: {
    venues: number | "unlimited";
    /** Reviews a month. Per venue on plans priced per venue. */
    reviewsPerMonth: number;
    reviewsArePerVenue: boolean;
    /** OpenRouter tokens a month, per venue. */
    tokensPerMonthPerVenue: number;
  };
  /** Highlighted as the recommended tier on the pricing page. */
  recommended?: boolean;
  cta: string;
  ctaHref: string;
}

/** Pricing is real now. The dashboard shows plans; it does not sell them yet. */
export const PLACEHOLDER_PRICING = false;

/** Where a plan's button goes when the plan is self-serve. */
export const SIGNUP_HREF = "/signup";
export const CONTACT_HREF = "/contact";

/** One million tokens a month, per venue, on every tier. */
export const TOKENS_PER_MONTH_PER_VENUE = 1_000_000;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 12,
    priceYearly: 120,
    tagline: "For a single location getting started.",
    features: [
      "1 venue",
      "1,500 reviews a month",
      "QR code + shareable review link",
      "AI-assisted review drafts",
      "Copy & post to Google in one tap",
    ],
    support: "Email support",
    limits: {
      venues: 1,
      reviewsPerMonth: 1_500,
      reviewsArePerVenue: false,
      tokensPerMonthPerVenue: TOKENS_PER_MONTH_PER_VENUE,
    },
    cta: "Start with Starter",
    ctaHref: SIGNUP_HREF,
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 29,
    priceYearly: 290,
    tagline: "For growing businesses with a few locations.",
    features: [
      "Up to 3 venues",
      "4,500 reviews a month",
      "QR code + shareable review link",
      "AI-assisted review drafts",
      "Copy & post to Google in one tap",
    ],
    support: "Priority email support",
    limits: {
      venues: 3,
      reviewsPerMonth: 4_500,
      reviewsArePerVenue: false,
      tokensPerMonthPerVenue: TOKENS_PER_MONTH_PER_VENUE,
    },
    recommended: true,
    cta: "Choose Pro",
    ctaHref: SIGNUP_HREF,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceMonthly: 79,
    priceYearly: 790,
    tagline: "For multi-location businesses.",
    features: [
      "Up to 10 venues",
      "15,000 reviews a month",
      "QR code + shareable review link",
      "AI-assisted review drafts",
      "Copy & post to Google in one tap",
    ],
    support: "Same-day support and a setup call",
    limits: {
      venues: 10,
      reviewsPerMonth: 15_000,
      reviewsArePerVenue: false,
      tokensPerMonthPerVenue: TOKENS_PER_MONTH_PER_VENUE,
    },
    cta: "Choose Enterprise",
    ctaHref: SIGNUP_HREF,
  },
  {
    id: "agency",
    name: "Agency",
    priceMonthly: null,
    priceYearly: null,
    pricePerVenueMonthly: 6,
    tagline: "For agencies running many venues for clients.",
    features: [
      "Unlimited venues",
      "1,500 reviews a month, per venue",
      "QR code + shareable review link",
      "AI-assisted review drafts",
      "Copy & post to Google in one tap",
    ],
    support: "A direct line, and we onboard your venues",
    limits: {
      venues: "unlimited",
      reviewsPerMonth: 1_500,
      reviewsArePerVenue: true,
      tokensPerMonthPerVenue: TOKENS_PER_MONTH_PER_VENUE,
    },
    cta: "Talk to us",
    ctaHref: CONTACT_HREF,
  },
];

/** Two months free on the annual bill, on every fixed-price tier. */
export const YEARLY_SAVINGS_LABEL = "2 months free";

export function planById(id: string): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/**
 * Price for a plan under the chosen billing cycle. Per-venue plans ignore the
 * cycle — "from $6/venue/mo" is the same sentence either way.
 */
export function priceFor(
  plan: Plan,
  cycle: BillingCycle
): { amount: string; suffix: string; prefix?: string } {
  if (plan.pricePerVenueMonthly !== undefined) {
    return {
      prefix: "from",
      amount: `$${plan.pricePerVenueMonthly}`,
      suffix: "/venue/mo",
    };
  }

  const value = cycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
  if (value === null) return { amount: "Custom", suffix: "" };
  if (value === 0) return { amount: "Free", suffix: "" };
  return { amount: `$${value}`, suffix: cycle === "yearly" ? "/yr" : "/mo" };
}

/** How many reviews a month an account gets, given how many venues it runs. */
export function reviewAllowance(plan: Plan, venueCount: number): number {
  return plan.limits.reviewsArePerVenue
    ? plan.limits.reviewsPerMonth * Math.max(venueCount, 1)
    : plan.limits.reviewsPerMonth;
}
