import type { Region, Currency } from "./types";

// ── CW to Month (ISO-correct) ──

export function cwKeyToMonth(cwKey: string): string {
  const [yearStr, cwStr] = cwKey.split("-CW");
  const year = parseInt(yearStr, 10);
  const cw = parseInt(cwStr, 10);
  // ISO: week 1 contains Jan 4. Find Monday of that week, then offset.
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // Mon=1..Sun=7
  const week1Monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const targetMonday = new Date(week1Monday.getTime() + (cw - 1) * 7 * 86400000);
  // Use Thursday of the ISO week to determine which month the week belongs to
  const thursday = new Date(targetMonday.getTime() + 3 * 86400000);
  const m = thursday.getMonth() + 1;
  return `${thursday.getFullYear()}-${String(m).padStart(2, "0")}`;
}

// ── Currency ──

export const CURRENCY_MAP: Record<Region, Currency> = {
  EU: "EUR",
  UK: "GBP",
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  EUR: "\u20AC",
  GBP: "\u00A3",
};

export function formatCurrency(
  value: number | null,
  currency: Currency
): string {
  if (value === null) return "N/A";
  const symbol = CURRENCY_SYMBOL[currency];
  return `${symbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number | null): string {
  if (value === null) return "N/A";
  return value.toLocaleString("en-US");
}

export function formatPercent(value: number | null): string {
  if (value === null) return "N/A";
  return `${value.toFixed(2)}%`;
}

// ── Metric Source of Truth ──

export type MetricSource = "meta" | "ecosystem";

export const METRIC_SOURCE_MAP: Record<string, { source: MetricSource; label: string }> = {
  spend: { source: "meta", label: "Ad Investment" },
  impressions: { source: "meta", label: "Impressions" },
  clicks: { source: "meta", label: "Clicks" },
  ctr: { source: "meta", label: "CTR" },
  purchases: { source: "meta", label: "Ad Purchases" },
  purchase_value: { source: "meta", label: "Ad Revenue" },
  roas: { source: "meta", label: "Ad ROAS" },
  cpa: { source: "meta", label: "CPA" },
  add_to_cart: { source: "meta", label: "Add to Cart" },
  checkout_initiated: { source: "meta", label: "Checkout" },
  payment_info_added: { source: "meta", label: "Payment Info" },
  content_view: { source: "meta", label: "Content Views" },
  landing_page_view: { source: "meta", label: "Landing Page Views" },
  reach: { source: "meta", label: "Reach" },
  hook_rate: { source: "meta", label: "Hook Rate" },
  hold_rate: { source: "meta", label: "Hold Rate" },
  conversion_rate: { source: "meta", label: "Conversion Rate" },
  // Ecosystem ROAS (store-level)
  store_revenue: { source: "ecosystem", label: "Store Revenue" },
  store_orders: { source: "ecosystem", label: "Store Orders" },
  blended_roas: { source: "ecosystem", label: "Blended ROAS" },
  aov: { source: "ecosystem", label: "AOV" },
  new_customers: { source: "ecosystem", label: "New Customers" },
  returning_customers: { source: "ecosystem", label: "Returning Customers" },
};

// ── Positive Language ──

export const POSITIVE_LANGUAGE: Record<string, string> = {
  failure: "learning",
  failed: "tested",
  waste: "investment",
  wasted: "invested",
  lose: "redirect",
  loss: "opportunity",
  losing: "exploring",
  decline: "adjustment",
  declined: "adjusted",
  drop: "shift",
  dropped: "shifted",
  decrease: "optimization opportunity",
  decreased: "being optimized",
  worse: "room for growth",
  worst: "highest potential",
  underperforming: "opportunity area",
  poor: "developing",
  bad: "evolving",
  negative: "transitional",
  problem: "opportunity",
  issue: "focus area",
  down: "adjusting",
};

// ── Trend Framing ──

export function frameTrend(change: number): {
  label: string;
  color: string;
} {
  if (change > 0) {
    return { label: `+${change.toFixed(1)}%`, color: "text-emerald-400" };
  }
  if (change < 0) {
    return {
      label: `${change.toFixed(1)}%`,
      color: "text-amber-400",
    };
  }
  return { label: "0%", color: "text-zinc-400" };
}

// ── Top Ads ──

export const TOP_ADS_COUNT = 3;
export const MIN_SPEND_THRESHOLD = 50; // In the account's currency

// ── Funnel Steps ──

export const FUNNEL_STEPS = [
  { key: "impressions", label: "Impressions" },
  { key: "clicks", label: "Unique Link Clicks" },
  { key: "landing_page_view", label: "Website Views" },
  { key: "add_to_cart", label: "Add to Cart" },
  { key: "checkout_initiated", label: "Checkout" },
  { key: "payment_info_added", label: "Payment Info" },
  { key: "purchases", label: "Purchases" },
] as const;

// ── Stale Data Threshold ──

export const STALE_DATA_HOURS = 12;

// ── AI Agent ──

export const AI_MAX_TOKENS = 3000;
export const AI_TEMPERATURE = 0.3;
export const AI_PROMPT_VERSION = "v1";
