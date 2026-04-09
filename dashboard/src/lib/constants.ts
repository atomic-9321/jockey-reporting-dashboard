import type { Region, Currency, EcoChannelKey, ChannelMetrics, WebshopMetrics } from "./types";

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
  "webshop.total_conversions": { source: "ecosystem", label: "Store Orders" },
  "webshop.total_revenue": { source: "ecosystem", label: "Store Revenue" },
  "webshop.total_cpa": { source: "ecosystem", label: "Store CPA" },
  "webshop.profit": { source: "ecosystem", label: "Store Profit" },
  "webshop.total_roas": { source: "ecosystem", label: "Blended ROAS" },
  "webshop.aov": { source: "ecosystem", label: "Store AOV" },
  // Ecosystem channels
  "email.ad_spend": { source: "ecosystem", label: "Email Spend" },
  "email.total_conversions": { source: "ecosystem", label: "Email Conversions" },
  "email.total_revenue": { source: "ecosystem", label: "Email Revenue" },
  "email.total_roas": { source: "ecosystem", label: "Email ROAS" },
  "google.ad_spend": { source: "ecosystem", label: "Google Spend" },
  "google.total_conversions": { source: "ecosystem", label: "Google Conversions" },
  "google.total_revenue": { source: "ecosystem", label: "Google Revenue" },
  "google.total_roas": { source: "ecosystem", label: "Google ROAS" },
};

// ── Ecosystem Channel Display Config ──

export type MetricFormat = "currency" | "number" | "ratio" | "percent";

export interface ChannelMetricConfig {
  field: keyof ChannelMetrics | keyof WebshopMetrics;
  label: string;
  format: MetricFormat;
}

export interface ChannelConfig {
  key: EcoChannelKey;
  label: string;
  color: "cyan" | "indigo" | "emerald" | "amber" | "rose" | "violet";
  metrics: ChannelMetricConfig[];
}

const PAID_CHANNEL_METRICS: ChannelMetricConfig[] = [
  { field: "ad_spend", label: "Ad Spend", format: "currency" },
  { field: "total_conversions", label: "Conversions", format: "number" },
  { field: "total_revenue", label: "Revenue", format: "currency" },
  { field: "total_roas", label: "ROAS", format: "ratio" },
  { field: "total_cpa", label: "CPA", format: "currency" },
  { field: "profit", label: "Profit", format: "currency" },
];

export const ECOSYSTEM_CHANNELS: ChannelConfig[] = [
  {
    key: "webshop",
    label: "Store / Webshop (Source of Truth)",
    color: "emerald",
    metrics: [
      { field: "total_conversions", label: "Orders", format: "number" },
      { field: "total_revenue", label: "Revenue", format: "currency" },
      { field: "total_roas", label: "Blended ROAS", format: "ratio" },
      { field: "total_cpa", label: "CPA", format: "currency" },
      { field: "profit", label: "Profit", format: "currency" },
      { field: "aov", label: "AOV", format: "currency" },
    ],
  },
  {
    key: "total_summary",
    label: "All Channels (Total)",
    color: "indigo",
    metrics: PAID_CHANNEL_METRICS,
  },
  {
    key: "email",
    label: "Email Marketing",
    color: "amber",
    metrics: [
      { field: "total_conversions", label: "Conversions", format: "number" },
      { field: "total_revenue", label: "Revenue", format: "currency" },
      { field: "pct_of_revenue", label: "% of Revenue", format: "percent" },
      { field: "aov", label: "AOV", format: "currency" },
    ],
  },
  {
    key: "google",
    label: "Google Ads",
    color: "rose",
    metrics: PAID_CHANNEL_METRICS,
  },
];

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
