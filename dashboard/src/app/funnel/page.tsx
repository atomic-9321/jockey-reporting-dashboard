"use client";

import { useEffect, useState } from "react";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { PyramidFunnel } from "@/components/charts/PyramidFunnel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRegion } from "@/hooks/useRegion";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import {
  aggregateMetrics,
  buildFunnel,
  getAvailableCWs,
} from "@/lib/metrics";
import type { CampaignData, Campaign, FunnelStep } from "@/lib/types";

export default function FunnelPage() {
  const { region, currency } = useRegion();
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/data/${region.toLowerCase()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d.campaigns);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [region]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 bg-secondary/30" />
        <Skeleton className="h-96 rounded-xl bg-secondary/30" />
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
  const availableCWs = getAvailableCWs(campaigns);
  const latestCW = availableCWs[availableCWs.length - 1];

  const latestMetrics = aggregateMetrics(
    campaigns.map((c) => c.weekly_breakdown[latestCW]).filter(Boolean)
  );
  const funnel = buildFunnel(latestMetrics);

  const allMetrics = aggregateMetrics(
    availableCWs.flatMap((cw) =>
      campaigns.map((c) => c.weekly_breakdown[cw]).filter(Boolean)
    )
  );
  const allTimeFunnel = buildFunnel(allMetrics);

  const biggestDrop = funnel.reduce(
    (max, step) =>
      step.drop_off_percent !== null &&
      (max === null || step.drop_off_percent > (max.drop_off_percent ?? 0))
        ? step
        : max,
    null as FunnelStep | null
  );

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold tracking-tight">Funnel Analysis</h1>
        <p className="text-sm text-muted-foreground/70 font-mono">
          Jockey {region} &middot; Full conversion journey ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Latest Week — Pyramid Funnel (hero visual) */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up">
        <CardHeader>
          <CardTitle className="text-base">
            Current Week Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {latestCW} &middot; 7 stages with drop-off
          </p>
        </CardHeader>
        <CardContent>
          <PyramidFunnel steps={funnel} />
        </CardContent>
      </Card>

      {/* Latest Week — Detailed bar breakdown */}
      <Card className="glass-card border-border/30 animate-fade-slide-up delay-75">
        <CardHeader>
          <CardTitle className="text-base">
            Detailed Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            {latestCW} &middot; Step-by-step metrics
          </p>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={funnel} />
        </CardContent>
      </Card>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-border/30 animate-fade-slide-up delay-150">
          <CardHeader>
            <CardTitle className="text-sm text-amber-400/90">
              Highest Optimization Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biggestDrop ? (
              <div className="space-y-2">
                <p className="text-xl font-bold text-amber-400 neon-text-emerald" style={{ textShadow: '0 0 7px oklch(0.80 0.17 85 / 40%), 0 0 20px oklch(0.80 0.17 85 / 15%)' }}>
                  {biggestDrop.label}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  <span className="text-amber-400/90 font-mono font-semibold">{biggestDrop.drop_off_percent?.toFixed(1)}%</span> shift from previous
                  step represents the largest optimization opportunity.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50">No data</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/10 animate-fade-slide-up delay-225">
          <CardHeader>
            <CardTitle className="text-sm">Overall Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-primary neon-text tabular-nums">
              {funnel[funnel.length - 1]?.conversion_from_top?.toFixed(2) ?? "N/A"}%
            </p>
            <p className="text-sm text-muted-foreground/60 mt-1 font-mono">
              Impression &rarr; Purchase &middot; {latestCW}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* All-Time — Pyramid Funnel */}
      <Card className="glass-card gradient-border border-border/30 animate-fade-slide-up delay-300">
        <CardHeader>
          <CardTitle className="text-base">
            All-Time Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            Aggregated across {availableCWs.length} weeks
          </p>
        </CardHeader>
        <CardContent>
          <PyramidFunnel steps={allTimeFunnel} />
        </CardContent>
      </Card>

      {/* All-Time — Detailed bar breakdown */}
      <Card className="glass-card border-border/30 animate-fade-slide-up delay-375">
        <CardHeader>
          <CardTitle className="text-base">
            All-Time Detailed Breakdown
          </CardTitle>
          <p className="text-xs text-muted-foreground/60 font-mono">
            Aggregated across {availableCWs.length} weeks &middot; Step-by-step metrics
          </p>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={allTimeFunnel} />
        </CardContent>
      </Card>
    </div>
  );
}
