"use client";

import { useState } from "react";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { KPICard } from "@/components/charts/KPICard";
import { MetricsTable } from "@/components/reports/MetricsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRegion } from "@/hooks/useRegion";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import type { CampaignMetrics, FunnelStep } from "@/lib/types";
import { cn } from "@/lib/utils";

const DEMO_MONTHS = ["2026-01", "2026-02", "2026-03", "2026-04"];

const DEMO_METRICS: CampaignMetrics = {
  spend: 12450, impressions: 1850000, clicks: 42300, ctr: 2.29,
  purchases: 385, purchase_value: 28750, roas: 2.31, cpa: 32.34,
  add_to_cart: 2150, checkout_initiated: 1280, payment_info_added: 980,
  content_view: 68500, landing_page_view: 35200, reach: 1200000,
};

const DEMO_FUNNEL: FunnelStep[] = [
  { key: "impressions", label: "Impressions", value: 1850000, previous_value: null, drop_off_percent: null, conversion_from_top: 100 },
  { key: "clicks", label: "Clicks", value: 42300, previous_value: 1850000, drop_off_percent: 97.71, conversion_from_top: 2.29 },
  { key: "landing_page_view", label: "Website Views", value: 35200, previous_value: 42300, drop_off_percent: 16.78, conversion_from_top: 1.90 },
  { key: "add_to_cart", label: "Add to Cart", value: 2150, previous_value: 35200, drop_off_percent: 93.89, conversion_from_top: 0.12 },
  { key: "checkout_initiated", label: "Checkout", value: 1280, previous_value: 2150, drop_off_percent: 40.47, conversion_from_top: 0.07 },
  { key: "payment_info_added", label: "Payment Info", value: 980, previous_value: 1280, drop_off_percent: 23.44, conversion_from_top: 0.05 },
  { key: "purchases", label: "Purchases", value: 385, previous_value: 980, drop_off_percent: 60.71, conversion_from_top: 0.02 },
];

function formatMonthLabel(month: string): string {
  const [year, m] = month.split("-");
  const names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${names[parseInt(m)]} ${year}`;
}

export default function MonthlyReportPage() {
  const { region, currency } = useRegion();
  const [selectedMonth, setSelectedMonth] = useState(DEMO_MONTHS[DEMO_MONTHS.length - 1]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monthly Report</h1>
        <p className="text-sm text-muted-foreground">
          Jockey {region} — Aggregated monthly performance ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DEMO_MONTHS.map((month) => (
          <Badge
            key={month}
            variant={selectedMonth === month ? "default" : "outline"}
            className={cn(
              "cursor-pointer shrink-0 px-3 py-1.5 text-xs font-medium transition-all",
              selectedMonth === month
                ? "bg-primary text-primary-foreground glow-cyan"
                : "hover:bg-secondary"
            )}
            onClick={() => setSelectedMonth(month)}
          >
            {formatMonthLabel(month)}
          </Badge>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Investment" value={formatCurrency(DEMO_METRICS.spend, currency)} trend={5.2} />
        <KPICard label="Revenue" value={formatCurrency(DEMO_METRICS.purchase_value, currency)} trend={8.7} />
        <KPICard label="Ad ROAS" value={`${DEMO_METRICS.roas}x`} trend={3.3} />
        <KPICard label="Purchases" value={formatNumber(DEMO_METRICS.purchases)} trend={12.1} />
        <KPICard label="CPA" value={formatCurrency(DEMO_METRICS.cpa, currency)} trend={-2.4} />
        <KPICard label="CTR" value={formatPercent(DEMO_METRICS.ctr)} trend={1.1} />
      </div>

      {/* Funnel */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">
            Monthly Funnel — {formatMonthLabel(selectedMonth)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={DEMO_FUNNEL} />
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        Demo data shown. Connect API credentials for real metrics.
      </p>
    </div>
  );
}
