"use client";

import { useState } from "react";
import { WeekSelector } from "@/components/reports/WeekSelector";
import { TopAdsSection } from "@/components/reports/TopAdsSection";
import { MetricsTable } from "@/components/reports/MetricsTable";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { KPICard } from "@/components/charts/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegion } from "@/hooks/useRegion";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import type { FunnelStep, TopAd, CampaignMetrics } from "@/lib/types";

// Demo data — replaced by real data when API is connected
const DEMO_WEEKS = [
  "2026-CW10", "2026-CW11", "2026-CW12", "2026-CW13", "2026-CW14",
];

const DEMO_METRICS: CampaignMetrics = {
  spend: 3200, impressions: 450000, clicks: 10500, ctr: 2.33,
  purchases: 95, purchase_value: 7125, roas: 2.23, cpa: 33.68,
  add_to_cart: 540, checkout_initiated: 320, payment_info_added: 245,
  content_view: 17000, landing_page_view: 8800, reach: 300000,
};

const DEMO_FUNNEL: FunnelStep[] = [
  { key: "impressions", label: "Impressions", value: 450000, previous_value: null, drop_off_percent: null, conversion_from_top: 100 },
  { key: "clicks", label: "Clicks", value: 10500, previous_value: 450000, drop_off_percent: 97.67, conversion_from_top: 2.33 },
  { key: "landing_page_view", label: "Website Views", value: 8800, previous_value: 10500, drop_off_percent: 16.19, conversion_from_top: 1.96 },
  { key: "add_to_cart", label: "Add to Cart", value: 540, previous_value: 8800, drop_off_percent: 93.86, conversion_from_top: 0.12 },
  { key: "checkout_initiated", label: "Checkout", value: 320, previous_value: 540, drop_off_percent: 40.74, conversion_from_top: 0.07 },
  { key: "payment_info_added", label: "Payment Info", value: 245, previous_value: 320, drop_off_percent: 23.44, conversion_from_top: 0.05 },
  { key: "purchases", label: "Purchases", value: 95, previous_value: 245, drop_off_percent: 61.22, conversion_from_top: 0.02 },
];

const DEMO_CAMPAIGNS = [
  { name: "Jockey Spring Collection - TOF", metrics: { ...DEMO_METRICS, spend: 1200, purchases: 35, roas: 2.5 } as CampaignMetrics },
  { name: "Retargeting - BOF", metrics: { ...DEMO_METRICS, spend: 800, purchases: 42, roas: 4.1 } as CampaignMetrics },
  { name: "New Arrivals - MOF", metrics: { ...DEMO_METRICS, spend: 1200, purchases: 18, roas: 1.2 } as CampaignMetrics },
];

export default function WeeklyReportPage() {
  const { region, currency } = useRegion();
  const [selectedWeek, setSelectedWeek] = useState(DEMO_WEEKS[DEMO_WEEKS.length - 1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Weekly Report</h1>
        <p className="text-sm text-muted-foreground">
          Jockey {region} — Performance by calendar week ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Week Selector */}
      <WeekSelector
        weeks={DEMO_WEEKS}
        selected={selectedWeek}
        onSelect={setSelectedWeek}
      />

      {/* KPIs for selected week */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Investment" value={formatCurrency(DEMO_METRICS.spend, currency)} />
        <KPICard label="Revenue" value={formatCurrency(DEMO_METRICS.purchase_value, currency)} />
        <KPICard label="Ad ROAS" value={DEMO_METRICS.roas ? `${DEMO_METRICS.roas}x` : "N/A"} />
        <KPICard label="Purchases" value={formatNumber(DEMO_METRICS.purchases)} />
        <KPICard label="CPA" value={formatCurrency(DEMO_METRICS.cpa, currency)} />
        <KPICard label="CTR" value={formatPercent(DEMO_METRICS.ctr)} />
      </div>

      {/* Funnel */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Conversion Funnel — {selectedWeek}</CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={DEMO_FUNNEL} />
        </CardContent>
      </Card>

      {/* Top 3 Ads */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Top Performing Ads</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Ranked by purchases (min {CURRENCY_SYMBOL[currency]}50 investment threshold)
        </p>
        <TopAdsSection ads={[]} currency={currency} />
      </div>

      {/* Campaign Table */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Campaign Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <MetricsTable campaigns={DEMO_CAMPAIGNS} currency={currency} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Demo data shown. Connect API credentials for real metrics.
      </p>
    </div>
  );
}
