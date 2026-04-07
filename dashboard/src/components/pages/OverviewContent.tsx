"use client";

import { useRegion } from "@/hooks/useRegion";
import { KPICard } from "@/components/charts/KPICard";
import { FunnelChart } from "@/components/charts/FunnelChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  CURRENCY_MAP,
  CURRENCY_SYMBOL,
} from "@/lib/constants";
import type { CampaignMetrics, FunnelStep } from "@/lib/types";

// Demo data — will be replaced with real data from API
function getDemoMetrics(): CampaignMetrics {
  return {
    spend: 12450.0,
    impressions: 1850000,
    clicks: 42300,
    ctr: 2.29,
    purchases: 385,
    purchase_value: 28750.0,
    roas: 2.31,
    cpa: 32.34,
    add_to_cart: 2150,
    checkout_initiated: 1280,
    payment_info_added: 980,
    content_view: 68500,
    landing_page_view: 35200,
    reach: 1200000,
  };
}

function getDemoFunnel(): FunnelStep[] {
  return [
    { key: "impressions", label: "Impressions", value: 1850000, previous_value: null, drop_off_percent: null, conversion_from_top: 100 },
    { key: "clicks", label: "Clicks", value: 42300, previous_value: 1850000, drop_off_percent: 97.71, conversion_from_top: 2.29 },
    { key: "landing_page_view", label: "Website Views", value: 35200, previous_value: 42300, drop_off_percent: 16.78, conversion_from_top: 1.90 },
    { key: "add_to_cart", label: "Add to Cart", value: 2150, previous_value: 35200, drop_off_percent: 93.89, conversion_from_top: 0.12 },
    { key: "checkout_initiated", label: "Checkout", value: 1280, previous_value: 2150, drop_off_percent: 40.47, conversion_from_top: 0.07 },
    { key: "payment_info_added", label: "Payment Info", value: 980, previous_value: 1280, drop_off_percent: 23.44, conversion_from_top: 0.05 },
    { key: "purchases", label: "Purchases", value: 385, previous_value: 980, drop_off_percent: 60.71, conversion_from_top: 0.02 },
  ];
}

function getDemoSparkline(): Array<{ value: number }> {
  return [
    { value: 2800 },
    { value: 3200 },
    { value: 2950 },
    { value: 3500 },
  ];
}

export function OverviewContent() {
  const { region, currency } = useRegion();
  const metrics = getDemoMetrics();
  const funnel = getDemoFunnel();
  const sparkline = getDemoSparkline();

  return (
    <div className="space-y-6">
      {/* Region indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-sm font-medium text-muted-foreground">
          Showing data for Jockey {region} ({CURRENCY_SYMBOL[currency]})
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Ad Investment"
          value={formatCurrency(metrics.spend, currency)}
          trend={8.5}
          sparklineData={sparkline}
        />
        <KPICard
          label="Ad Revenue"
          value={formatCurrency(metrics.purchase_value, currency)}
          trend={12.3}
          sparklineData={sparkline}
        />
        <KPICard
          label="Ad ROAS"
          value={metrics.roas !== null ? `${metrics.roas}x` : "N/A"}
          trend={3.5}
          sparklineData={sparkline}
        />
        <KPICard
          label="Ad Purchases"
          value={formatNumber(metrics.purchases)}
          trend={15.2}
          sparklineData={sparkline}
        />
        <KPICard
          label="CPA"
          value={formatCurrency(metrics.cpa, currency)}
          trend={-5.1}
        />
        <KPICard
          label="Impressions"
          value={formatNumber(metrics.impressions)}
          trend={2.8}
          sparklineData={sparkline}
        />
      </div>

      {/* Funnel */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Conversion Funnel
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Full journey from impression to purchase
          </p>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={funnel} />
        </CardContent>
      </Card>

      {/* Data notice */}
      <p className="text-xs text-muted-foreground text-center">
        Connect your Meta API credentials and Google Sheets to see real data.
        Currently showing demo values.
      </p>
    </div>
  );
}
