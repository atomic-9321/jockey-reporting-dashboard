"use client";

import { useEffect, useState } from "react";
import { PyramidFunnel } from "@/components/charts/PyramidFunnel";
import { KPICard } from "@/components/charts/KPICard";
import { MetricsTable } from "@/components/reports/MetricsTable";
import { ReportInsights } from "@/components/reports/ReportInsights";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegion } from "@/hooks/useRegion";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_SYMBOL,
  cwKeyToMonth,
} from "@/lib/constants";
import {
  aggregateMetrics,
  buildFunnel,
  getAvailableCWs,
  getAvailableMonths,
  computeWoWChange,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { CampaignData, Campaign } from "@/lib/types";

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[parseInt(m)]} ${year}`;
}

function getCWsForMonth(allCWs: string[], monthStr: string): string[] {
  return allCWs.filter((cw) => cwKeyToMonth(cw) === monthStr);
}

export default function MonthlyReportPage() {
  const { region, currency } = useRegion();
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${region.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.campaigns);
        const cws = getAvailableCWs(d.campaigns?.campaigns || []);
        const months = getAvailableMonths(cws);
        setSelectedMonth(months[months.length - 1] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-secondary/30" />
        <Skeleton className="h-8 w-full max-w-md bg-secondary/30" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-secondary/30" />
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.campaigns) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No data available for {region}.</p>
      </div>
    );
  }

  const campaigns: Campaign[] = data.campaigns;
  const allCWs = getAvailableCWs(campaigns);
  const months = getAvailableMonths(allCWs);

  if (!selectedMonth) return null;

  const monthCWs = getCWsForMonth(allCWs, selectedMonth);
  const monthIdx = months.indexOf(selectedMonth);
  const prevMonth = monthIdx > 0 ? months[monthIdx - 1] : null;
  const prevMonthCWs = prevMonth ? getCWsForMonth(allCWs, prevMonth) : [];

  const monthMetrics = aggregateMetrics(
    monthCWs.flatMap((cw) =>
      campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
    )
  );

  const prevMetrics = prevMonthCWs.length > 0
    ? aggregateMetrics(
        prevMonthCWs.flatMap((cw) =>
          campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
        )
      )
    : null;

  const momChanges = prevMetrics ? computeWoWChange(monthMetrics, prevMetrics) : null;
  const funnel = buildFunnel(monthMetrics);

  const campaignRows = campaigns
    .map((c) => ({
      name: c.campaign_name,
      metrics: aggregateMetrics(
        monthCWs.map((cw) => c.weekly_breakdown[cw]).filter(Boolean)
      ),
    }))
    .filter((c) => c.metrics.spend !== null && c.metrics.spend > 0)
    .sort((a, b) => (b.metrics.spend ?? 0) - (a.metrics.spend ?? 0));

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
        <p className="text-sm text-muted-foreground/70 font-mono">
          Jockey {region} &middot; Aggregated monthly performance ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {months.map((month) => (
          <Badge
            key={month}
            variant={selectedMonth === month ? "default" : "outline"}
            className={cn(
              "cursor-pointer shrink-0 px-3 py-1.5 text-xs font-medium transition-all duration-300",
              selectedMonth === month
                ? "bg-primary text-primary-foreground badge-glow"
                : "hover:bg-secondary/50 hover:border-primary/20 border-border/30"
            )}
            onClick={() => setSelectedMonth(month)}
          >
            {formatMonthLabel(month)}
          </Badge>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Investment" value={formatCurrency(monthMetrics.spend, currency)} trend={momChanges?.spend ?? null} color="indigo" delay={0} />
        <KPICard label="Revenue" value={formatCurrency(monthMetrics.purchase_value, currency)} trend={momChanges?.purchase_value ?? null} color="emerald" delay={75} />
        <KPICard label="Ad ROAS" value={monthMetrics.roas !== null ? `${monthMetrics.roas}x` : "N/A"} trend={momChanges?.roas ?? null} color="cyan" delay={150} />
        <KPICard label="Purchases" value={formatNumber(monthMetrics.purchases)} trend={momChanges?.purchases ?? null} color="amber" delay={225} />
        <KPICard label="CPA" value={formatCurrency(monthMetrics.cpa, currency)} trend={momChanges?.cpa ?? null} color="rose" delay={300} />
        <KPICard label="CTR" value={formatPercent(monthMetrics.ctr)} color="violet" delay={375} />
      </div>

      {/* Funnel */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-300">
        <CardHeader>
          <CardTitle className="text-base">
            Monthly Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {formatMonthLabel(selectedMonth)} &middot; {monthCWs.length} weeks
          </p>
        </CardHeader>
        <CardContent>
          <PyramidFunnel steps={funnel} />
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-375">
        <CardHeader>
          <CardTitle className="text-base">Campaign Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsTable campaigns={campaignRows} currency={currency} />
        </CardContent>
      </Card>

      {/* AI Insights + Creative Recommendations */}
      <ReportInsights
        region={region}
        period={monthCWs[monthCWs.length - 1] || selectedMonth}
        periodType="monthly"
        campaignNames={campaignRows.map((c) => c.name)}
      />
    </div>
  );
}
