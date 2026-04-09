"use client";

import { useEffect, useState } from "react";
import { WeekSelector } from "@/components/reports/WeekSelector";
import { MetricsTable } from "@/components/reports/MetricsTable";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { PyramidFunnel } from "@/components/charts/PyramidFunnel";
import { KPICard } from "@/components/charts/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegion } from "@/hooks/useRegion";
import { EcosystemOverview } from "@/components/ecosystem/ChannelSection";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_SYMBOL,
  ECOSYSTEM_CHANNELS,
  cwKeyToMonth,
} from "@/lib/constants";
import {
  aggregateMetrics,
  buildFunnel,
  getAvailableCWs,
  computeWoWChange,
  getEcosystemForCW,
  aggregateEcosystemDaily,
  cwKeyToDateRange,
} from "@/lib/metrics";
import type { CampaignData, Campaign, EcosystemData } from "@/lib/types";

export default function WeeklyReportPage() {
  const { region, currency } = useRegion();
  const [data, setData] = useState<CampaignData | null>(null);
  const [ecosystem, setEcosystem] = useState<EcosystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${region.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.campaigns);
        setEcosystem(d.ecosystem);
        const cws = getAvailableCWs(d.campaigns?.campaigns || []);
        setSelectedWeek(cws[cws.length - 1] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-secondary/30" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 bg-secondary/30" />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-secondary/30" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl bg-secondary/30" />
      </div>
    );
  }

  if (!data || !data.campaigns || data.campaigns.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No campaign data available for {region}.</p>
      </div>
    );
  }

  const campaigns: Campaign[] = data.campaigns;
  const availableCWs = getAvailableCWs(campaigns);

  if (!selectedWeek) return null;

  const weekIdx = availableCWs.indexOf(selectedWeek);
  const previousCW = weekIdx > 0 ? availableCWs[weekIdx - 1] : null;

  const weekMetrics = aggregateMetrics(
    campaigns.map((c) => c.weekly_breakdown[selectedWeek]).filter(Boolean)
  );

  const prevMetrics = previousCW
    ? aggregateMetrics(
        campaigns.map((c) => c.weekly_breakdown[previousCW]).filter(Boolean)
      )
    : null;

  const wowChanges = prevMetrics ? computeWoWChange(weekMetrics, prevMetrics) : null;
  const funnel = buildFunnel(weekMetrics);

  const campaignRows = campaigns
    .map((c) => ({
      name: c.campaign_name,
      metrics: c.weekly_breakdown[selectedWeek] || {
        spend: null, impressions: null, clicks: null, ctr: null,
        purchases: null, purchase_value: null, roas: null, cpa: null,
        add_to_cart: null, checkout_initiated: null, payment_info_added: null,
        content_view: null, landing_page_view: null, reach: null,
      },
    }))
    .filter((c) => c.metrics.spend !== null && c.metrics.spend > 0)
    .sort((a, b) => (b.metrics.spend ?? 0) - (a.metrics.spend ?? 0));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Weekly Report</h1>
        <p className="text-sm text-muted-foreground/70 font-mono">
          Jockey {region} &middot; Performance by calendar week ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Week Selector */}
      <WeekSelector
        weeks={availableCWs}
        selected={selectedWeek}
        onSelect={setSelectedWeek}
      />

      {/* Meta KPIs */}
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground/80">Meta</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Investment" value={formatCurrency(weekMetrics.spend, currency)} trend={wowChanges?.spend ?? null} color="indigo" delay={0} />
        <KPICard label="Revenue" value={formatCurrency(weekMetrics.purchase_value, currency)} trend={wowChanges?.purchase_value ?? null} color="emerald" delay={75} />
        <KPICard label="Ad ROAS" value={weekMetrics.roas !== null ? `${weekMetrics.roas}x` : "N/A"} trend={wowChanges?.roas ?? null} color="cyan" delay={150} />
        <KPICard label="Purchases" value={formatNumber(weekMetrics.purchases)} trend={wowChanges?.purchases ?? null} color="amber" delay={225} />
        <KPICard label="CPA" value={formatCurrency(weekMetrics.cpa, currency)} trend={wowChanges?.cpa ?? null} color="rose" delay={300} />
        <KPICard label="CTR" value={formatPercent(weekMetrics.ctr)} color="violet" delay={375} />
      </div>

      {/* Funnel */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-300">
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel</CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">{selectedWeek}</p>
        </CardHeader>
        <CardContent>
          <PyramidFunnel steps={funnel} />
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-375">
        <CardHeader>
          <CardTitle className="text-base">Campaign Breakdown</CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {campaignRows.length} campaigns &middot; {selectedWeek}
          </p>
        </CardHeader>
        <CardContent>
          <MetricsTable campaigns={campaignRows} currency={currency} />
        </CardContent>
      </Card>

      {/* Ecosystem Channel Data */}
      {(() => {
        // Try daily aggregation first, fallback to monthly
        const cwRange = cwKeyToDateRange(selectedWeek);
        const dailyEco = aggregateEcosystemDaily(ecosystem, cwRange.start, cwRange.end);
        const monthlyEco = getEcosystemForCW(ecosystem, selectedWeek);
        const ecoRow = dailyEco || monthlyEco;

        // Previous period for comparison
        const prevEcoRow = previousCW ? getEcosystemForCW(ecosystem, previousCW) : null;
        const ecoLabel = dailyEco ? selectedWeek : monthlyEco ? `${cwKeyToMonth(selectedWeek)} (monthly)` : "";

        if (!ecoRow) return null;
        return (
          <div className="space-y-2 animate-fade-slide-up delay-375">
            <div className="flex items-center gap-2 pt-2">
              <div className="h-px flex-1 bg-border/30" />
              <span className="text-xs text-muted-foreground/50 font-mono uppercase tracking-wider">
                Ecosystem &middot; {ecoLabel}
              </span>
              <div className="h-px flex-1 bg-border/30" />
            </div>
            <EcosystemOverview
              row={ecoRow}
              previousRow={prevEcoRow}
              currency={currency}
              channels={ECOSYSTEM_CHANNELS}
              periodLabel={ecoLabel}
            />
          </div>
        );
      })()}

      {/* AI Insights + Creative Recommendations */}
      <ReportInsights
        region={region}
        period={selectedWeek}
        periodType="weekly"
        campaignNames={campaignRows.map((c) => c.name)}
      />
    </div>
  );
}
