"use client";

import { useEffect, useState, useMemo } from "react";
import { useRegion } from "@/hooks/useRegion";
import { KPICard } from "@/components/charts/KPICard";
import { PyramidFunnel } from "@/components/charts/PyramidFunnel";
import { EcosystemOverview } from "@/components/ecosystem/ChannelSection";
import { DateRangePicker, type DateRange } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_SYMBOL,
  ECOSYSTEM_CHANNELS,
} from "@/lib/constants";
import {
  aggregateMetrics,
  buildFunnel,
  getAvailableCWs,
  computeWoWChange,
  cwKeysForDateRange,
  getEcosystemForMonth,
  cwKeyToDateRange,
} from "@/lib/metrics";
import { cwKeyToMonth } from "@/lib/constants";
import type { CampaignData, EcosystemData } from "@/lib/types";

export function OverviewContent() {
  const { region, currency } = useRegion();
  const [data, setData] = useState<CampaignData | null>(null);
  const [ecosystem, setEcosystem] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${region.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.campaigns);
        setEcosystem(d.ecosystem);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (!data || !data.campaigns || data.campaigns.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">No campaign data available for {region}.</p>
        <p className="text-xs mt-1 text-muted-foreground/60">Run the data refresh to pull from Meta API.</p>
      </div>
    );
  }

  const campaigns = data.campaigns;
  const availableCWs = getAvailableCWs(campaigns);

  // Determine the last complete CW: if the latest CW hasn't ended yet, use the one before it
  function getLastCompleteCW(cws: string[]): string {
    const latest = cws[cws.length - 1];
    const { end } = cwKeyToDateRange(latest);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (end >= today && cws.length > 1) {
      return cws[cws.length - 2];
    }
    return latest;
  }

  // Compute selected CW keys based on date range
  const selectedCWKeys = dateRange
    ? cwKeysForDateRange(availableCWs, dateRange.startDate, dateRange.endDate)
    : [getLastCompleteCW(availableCWs)];

  // For comparison: compute a prior period of the same length
  const selectedIdx = selectedCWKeys.map((cw) => availableCWs.indexOf(cw)).filter((i) => i >= 0);
  const periodLength = selectedCWKeys.length;
  const minIdx = Math.min(...selectedIdx);
  const previousCWKeys =
    minIdx >= periodLength
      ? availableCWs.slice(minIdx - periodLength, minIdx)
      : null;

  const selectedMetrics = aggregateMetrics(
    selectedCWKeys.flatMap((cw) =>
      campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
    )
  );

  const previousMetrics = previousCWKeys
    ? aggregateMetrics(
        previousCWKeys.flatMap((cw) =>
          campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
        )
      )
    : null;

  const wowChanges = previousMetrics ? computeWoWChange(selectedMetrics, previousMetrics) : null;
  const funnel = buildFunnel(selectedMetrics);

  // Sparklines: always show last 6 available weeks
  const recentCWs = availableCWs.slice(-6);

  function buildSparkline(key: "spend" | "purchase_value" | "purchases" | "impressions" | "roas" | "cpa") {
    return recentCWs.map((cw) => {
      const agg = aggregateMetrics(
        campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
      );
      return { value: agg[key] ?? 0 };
    });
  }

  const periodLabel = dateRange
    ? `${selectedCWKeys.length} weeks selected`
    : availableCWs[availableCWs.length - 1];

  // Ecosystem data: resolve for the selected period's month
  const selectedMonth = cwKeyToMonth(selectedCWKeys[selectedCWKeys.length - 1]);
  const ecoRow = getEcosystemForMonth(ecosystem, selectedMonth);

  // Previous month for comparison
  const prevMonth = previousCWKeys
    ? cwKeyToMonth(previousCWKeys[previousCWKeys.length - 1])
    : null;
  const prevEcoRow = prevMonth
    ? getEcosystemForMonth(ecosystem, prevMonth)
    : null;

  return (
    <div className="space-y-8">
      {/* Region indicator + Date Range */}
      <div className="relative z-10 flex items-center justify-between animate-fade-in flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-primary data-dot shadow-[0_0_6px_oklch(0.78_0.17_195_/_40%)]" />
            <span className="text-sm font-medium text-foreground/80">
              Jockey {region}
            </span>
            <span className="text-xs text-muted-foreground/60 font-mono">
              {CURRENCY_SYMBOL[currency]}
            </span>
          </div>
          <span className="text-xs text-muted-foreground/50 font-mono">
            {periodLabel} &middot; {availableCWs.length}w
          </span>
        </div>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Meta KPI Grid */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground/80">Meta</h3>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        <KPICard
          label="Ad Investment"
          value={formatCurrency(selectedMetrics.spend, currency)}
          trend={wowChanges?.spend ?? null}
          sparklineData={buildSparkline("spend")}
          color="indigo"
          delay={0}
        />
        <KPICard
          label="Ad Revenue"
          value={formatCurrency(selectedMetrics.purchase_value, currency)}
          trend={wowChanges?.purchase_value ?? null}
          sparklineData={buildSparkline("purchase_value")}
          color="emerald"
          delay={75}
        />
        <KPICard
          label="Ad ROAS"
          value={selectedMetrics.roas !== null ? `${selectedMetrics.roas}x` : "N/A"}
          trend={wowChanges?.roas ?? null}
          sparklineData={buildSparkline("roas")}
          color="cyan"
          delay={150}
        />
        <KPICard
          label="Ad Purchases"
          value={formatNumber(selectedMetrics.purchases)}
          trend={wowChanges?.purchases ?? null}
          sparklineData={buildSparkline("purchases")}
          color="amber"
          delay={225}
        />
        <KPICard
          label="CPA"
          value={formatCurrency(selectedMetrics.cpa, currency)}
          trend={wowChanges?.cpa ?? null}
          sparklineData={buildSparkline("cpa")}
          color="rose"
          delay={300}
        />
        <KPICard
          label="Impressions"
          value={formatNumber(selectedMetrics.impressions)}
          trend={wowChanges?.impressions ?? null}
          sparklineData={buildSparkline("impressions")}
          color="violet"
          delay={375}
        />
      </div>

      {/* Funnel — PyramidFunnel */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-300">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Conversion Funnel
              </CardTitle>
              <p className="text-xs text-muted-foreground/70 mt-0.5 font-mono">
                Impression &rarr; Purchase &middot; {periodLabel}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary neon-text tabular-nums">
                {funnel[funnel.length - 1]?.conversion_from_top?.toFixed(2) ?? "\u2014"}%
              </p>
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                conversion
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PyramidFunnel steps={funnel} />
        </CardContent>
      </Card>

      {/* Ecosystem Channel Data */}
      {ecoRow && (
        <div className="space-y-2 animate-fade-slide-up delay-375">
          <div className="flex items-center gap-2 pt-2">
            <div className="h-px flex-1 bg-border/30" />
            <span className="text-xs text-muted-foreground/50 font-mono uppercase tracking-wider">
              Ecosystem &middot; {selectedMonth}
            </span>
            <div className="h-px flex-1 bg-border/30" />
          </div>
          <EcosystemOverview
            row={ecoRow}
            previousRow={prevEcoRow}
            currency={currency}
            channels={ECOSYSTEM_CHANNELS}
            periodLabel={selectedMonth}
          />
        </div>
      )}
    </div>
  );
}
