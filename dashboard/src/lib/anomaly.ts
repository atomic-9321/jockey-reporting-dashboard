/**
 * Anomaly detection utilities for the dashboard.
 * Flags metrics with >500% week-over-week changes.
 */

import type { AnomalyFlag, CampaignMetrics } from "./types";

const ANOMALY_THRESHOLD = 500; // 500%

export function isAnomaly(flag: AnomalyFlag): boolean {
  return flag.change_pct !== null && Math.abs(flag.change_pct) > ANOMALY_THRESHOLD;
}

export function getAnomalyTooltip(flag: AnomalyFlag): string {
  if (flag.change_pct === null) {
    return "Significant change detected \u2014 verify in Ads Manager";
  }
  const direction = flag.change_pct > 0 ? "increased" : "decreased";
  return `${direction} ${Math.abs(flag.change_pct).toFixed(1)}% vs previous week \u2014 verify in Ads Manager`;
}

export function hasAnomalies(flags: AnomalyFlag[]): boolean {
  return flags.length > 0;
}

export function getAnomalyForMetric(
  flags: AnomalyFlag[],
  metric: string
): AnomalyFlag | undefined {
  return flags.find((f) => f.metric === metric);
}
