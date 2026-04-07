/**
 * ALL calculations happen here. The AI agent never does math.
 *
 * This module computes: funnel percentages, top ads ranking,
 * weekly/monthly aggregations, WoW changes, and anomaly flags.
 */

import type {
  Ad,
  AdMetrics,
  Campaign,
  CampaignMetrics,
  FunnelStep,
  TopAd,
  AnomalyFlag,
} from "./types";
import { FUNNEL_STEPS, MIN_SPEND_THRESHOLD, TOP_ADS_COUNT, cwKeyToMonth } from "./constants";

// ── Null-safe arithmetic ──

function safeAdd(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  return (a ?? 0) + (b ?? 0);
}

function safeDiv(
  numerator: number | null,
  denominator: number | null
): number | null {
  if (numerator === null || denominator === null || denominator === 0)
    return null;
  return numerator / denominator;
}

// ── Aggregate Metrics ──

export function aggregateMetrics(
  metricsList: CampaignMetrics[]
): CampaignMetrics {
  const result: CampaignMetrics = {
    spend: null,
    impressions: null,
    clicks: null,
    ctr: null,
    purchases: null,
    purchase_value: null,
    roas: null,
    cpa: null,
    add_to_cart: null,
    checkout_initiated: null,
    payment_info_added: null,
    content_view: null,
    landing_page_view: null,
    reach: null,
  };

  for (const m of metricsList) {
    for (const key of [
      "spend",
      "impressions",
      "clicks",
      "purchases",
      "purchase_value",
      "add_to_cart",
      "checkout_initiated",
      "payment_info_added",
      "content_view",
      "landing_page_view",
      "reach",
    ] as const) {
      result[key] = safeAdd(result[key], m[key]);
    }
  }

  // Recompute derived metrics
  result.ctr =
    safeDiv(result.clicks, result.impressions) !== null
      ? Math.round(safeDiv(result.clicks, result.impressions)! * 10000) / 100
      : null;
  result.roas = safeDiv(result.purchase_value, result.spend)
    ? Math.round(safeDiv(result.purchase_value, result.spend)! * 100) / 100
    : null;
  result.cpa = safeDiv(result.spend, result.purchases)
    ? Math.round(safeDiv(result.spend, result.purchases)! * 100) / 100
    : null;

  return result;
}

export function aggregateAdMetrics(metricsList: AdMetrics[]): AdMetrics {
  const base = aggregateMetrics(metricsList) as AdMetrics;

  let totalVideoPlays: number | null = null;
  let totalVideoCompletions: number | null = null;

  for (const m of metricsList) {
    totalVideoPlays = safeAdd(totalVideoPlays, m.video_plays);
    totalVideoCompletions = safeAdd(totalVideoCompletions, m.video_completions);
  }

  base.video_plays = totalVideoPlays;
  base.video_completions = totalVideoCompletions;
  base.hook_rate =
    safeDiv(totalVideoPlays, base.impressions) !== null
      ? Math.round(safeDiv(totalVideoPlays, base.impressions)! * 10000) / 100
      : null;
  base.hold_rate =
    safeDiv(totalVideoCompletions, totalVideoPlays) !== null
      ? Math.round(
          safeDiv(totalVideoCompletions, totalVideoPlays)! * 10000
        ) / 100
      : null;
  base.conversion_rate =
    safeDiv(base.purchases, base.clicks) !== null
      ? Math.round(safeDiv(base.purchases, base.clicks)! * 10000) / 100
      : null;

  return base;
}

// ── Weekly/Monthly Aggregation ──

export function aggregateCampaignsByWeek(
  campaigns: Campaign[],
  cw: string
): CampaignMetrics {
  const weekMetrics = campaigns
    .map((c) => c.weekly_breakdown[cw])
    .filter(Boolean);
  return aggregateMetrics(weekMetrics);
}

export function aggregateCampaignsByMonth(
  campaigns: Campaign[],
  year: number,
  month: number
): CampaignMetrics {
  const targetMonth = `${year}-${String(month).padStart(2, "0")}`;
  const allWeekMetrics: CampaignMetrics[] = [];

  for (const campaign of campaigns) {
    for (const [key, metrics] of Object.entries(campaign.weekly_breakdown)) {
      if (cwKeyToMonth(key) === targetMonth) {
        allWeekMetrics.push(metrics);
      }
    }
  }

  return aggregateMetrics(allWeekMetrics);
}

export function getAdMetricsForWeek(ad: Ad, cw: string): AdMetrics | null {
  return ad.weekly_breakdown[cw] ?? null;
}

export function getAdMetricsForPeriod(
  ad: Ad,
  cwKeys: string[]
): AdMetrics {
  const weekMetrics = cwKeys
    .map((cw) => ad.weekly_breakdown[cw])
    .filter(Boolean);
  return aggregateAdMetrics(weekMetrics);
}

// ── Funnel ──

export function buildFunnel(
  metrics: CampaignMetrics
): FunnelStep[] {
  const steps: FunnelStep[] = [];
  let previousValue: number | null = null;
  const topValue = metrics.impressions;

  for (const step of FUNNEL_STEPS) {
    const value = metrics[step.key as keyof CampaignMetrics] as number | null;

    const dropOff =
      previousValue !== null && previousValue > 0 && value !== null
        ? Math.round((1 - value / previousValue) * 10000) / 100
        : null;

    const conversionFromTop =
      topValue !== null && topValue > 0 && value !== null
        ? Math.round((value / topValue) * 10000) / 100
        : null;

    steps.push({
      key: step.key,
      label: step.label,
      value,
      previous_value: previousValue,
      drop_off_percent: dropOff,
      conversion_from_top: conversionFromTop,
    });

    previousValue = value;
  }

  return steps;
}

// ── Top Ads ──

export function getTopAds(
  ads: Ad[],
  cwKeys: string[],
  count: number = TOP_ADS_COUNT,
  minSpend: number = MIN_SPEND_THRESHOLD
): TopAd[] {
  const adsWithMetrics = ads
    .map((ad) => {
      const periodMetrics = getAdMetricsForPeriod(ad, cwKeys);
      return { ...ad, period_metrics: periodMetrics };
    })
    // Filter by minimum spend
    .filter(
      (ad) =>
        ad.period_metrics.spend !== null &&
        ad.period_metrics.spend >= minSpend
    )
    // Filter by having at least one purchase
    .filter(
      (ad) =>
        ad.period_metrics.purchases !== null &&
        ad.period_metrics.purchases > 0
    );

  // Sort by purchases descending, break ties by ROAS
  adsWithMetrics.sort((a, b) => {
    const aPurchases = a.period_metrics.purchases ?? 0;
    const bPurchases = b.period_metrics.purchases ?? 0;
    if (bPurchases !== aPurchases) return bPurchases - aPurchases;
    const aRoas = a.period_metrics.roas ?? 0;
    const bRoas = b.period_metrics.roas ?? 0;
    return bRoas - aRoas;
  });

  return adsWithMetrics.slice(0, count).map((ad, index) => ({
    ...ad,
    rank: index + 1,
    ranking_metric: "purchases",
    ranking_value: ad.period_metrics.purchases ?? 0,
    period_metrics: ad.period_metrics,
  }));
}

// ── Week-over-Week Change ──

export function computeWoWChange(
  current: CampaignMetrics,
  previous: CampaignMetrics
): Record<string, number | null> {
  const changes: Record<string, number | null> = {};
  const keys: (keyof CampaignMetrics)[] = [
    "spend",
    "impressions",
    "clicks",
    "purchases",
    "purchase_value",
    "roas",
    "cpa",
    "add_to_cart",
    "checkout_initiated",
  ];

  for (const key of keys) {
    const curr = current[key];
    const prev = previous[key];

    if (curr === null || prev === null || prev === 0) {
      changes[key] = null;
    } else {
      changes[key] = Math.round(((curr - prev) / prev) * 10000) / 100;
    }
  }

  return changes;
}

// ── Anomaly Detection ──

const ANOMALY_THRESHOLD = 500; // 500%

export function flagAnomalies(
  current: CampaignMetrics,
  previous: CampaignMetrics
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = [];
  const changes = computeWoWChange(current, previous);

  for (const [metric, changePct] of Object.entries(changes)) {
    if (changePct !== null && Math.abs(changePct) > ANOMALY_THRESHOLD) {
      const curr = current[metric as keyof CampaignMetrics];
      const prev = previous[metric as keyof CampaignMetrics];
      if (typeof curr === "number" && typeof prev === "number") {
        flags.push({
          metric,
          current: curr,
          previous: prev,
          change_pct: changePct,
          reason: `Changed ${Math.abs(changePct).toFixed(1)}% week-over-week`,
        });
      }
    }
  }

  return flags;
}

// ── Date Range to CW Keys ──

export function cwKeyToDateRange(cwKey: string): { start: Date; end: Date } {
  const [yearStr, cwStr] = cwKey.split("-CW");
  const year = parseInt(yearStr, 10);
  const cw = parseInt(cwStr, 10);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const week1Monday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  const targetMonday = new Date(
    week1Monday.getTime() + (cw - 1) * 7 * 86400000
  );
  const targetSunday = new Date(targetMonday.getTime() + 6 * 86400000);
  return { start: targetMonday, end: targetSunday };
}

export function cwKeysForDateRange(
  allCWs: string[],
  startDate: Date,
  endDate: Date
): string[] {
  const start = startDate.getTime();
  const end = endDate.getTime();
  return allCWs.filter((cw) => {
    const range = cwKeyToDateRange(cw);
    // CW overlaps if its end is >= start AND its start is <= end
    return range.end.getTime() >= start && range.start.getTime() <= end;
  });
}

// ── Available Calendar Weeks ──

export function getAvailableCWs(campaigns: Campaign[]): string[] {
  const cwSet = new Set<string>();
  for (const campaign of campaigns) {
    for (const cw of Object.keys(campaign.weekly_breakdown)) {
      cwSet.add(cw);
    }
  }
  return Array.from(cwSet).sort();
}

export function getAvailableMonths(cws: string[]): string[] {
  // Extract unique year-month combinations from CW keys
  // This is approximate but sufficient for navigation
  const months = new Set<string>();
  for (const cw of cws) {
    months.add(cwKeyToMonth(cw));
  }
  return Array.from(months).sort();
}
