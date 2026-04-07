"use client";

import { FunnelChart } from "@/components/charts/FunnelChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegion } from "@/hooks/useRegion";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { FunnelStep } from "@/lib/types";

const DEMO_FUNNEL: FunnelStep[] = [
  { key: "impressions", label: "Impressions", value: 1850000, previous_value: null, drop_off_percent: null, conversion_from_top: 100 },
  { key: "clicks", label: "Clicks", value: 42300, previous_value: 1850000, drop_off_percent: 97.71, conversion_from_top: 2.29 },
  { key: "landing_page_view", label: "Website Views", value: 35200, previous_value: 42300, drop_off_percent: 16.78, conversion_from_top: 1.90 },
  { key: "add_to_cart", label: "Add to Cart", value: 2150, previous_value: 35200, drop_off_percent: 93.89, conversion_from_top: 0.12 },
  { key: "checkout_initiated", label: "Checkout", value: 1280, previous_value: 2150, drop_off_percent: 40.47, conversion_from_top: 0.07 },
  { key: "payment_info_added", label: "Payment Info", value: 980, previous_value: 1280, drop_off_percent: 23.44, conversion_from_top: 0.05 },
  { key: "purchases", label: "Purchases", value: 385, previous_value: 980, drop_off_percent: 60.71, conversion_from_top: 0.02 },
];

export default function FunnelPage() {
  const { region, currency } = useRegion();

  // Find the biggest drop-off step
  const biggestDrop = DEMO_FUNNEL.reduce(
    (max, step) =>
      step.drop_off_percent !== null &&
      (max === null || step.drop_off_percent > (max.drop_off_percent ?? 0))
        ? step
        : max,
    null as FunnelStep | null
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funnel Analysis</h1>
        <p className="text-sm text-muted-foreground">
          Jockey {region} — Full conversion journey ({CURRENCY_SYMBOL[currency]})
        </p>
      </div>

      {/* Main Funnel */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="text-base">
            Full Funnel: Impressions to Purchase
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            7 stages with drop-off percentages and conversion rates from top of funnel
          </p>
        </CardHeader>
        <CardContent>
          <FunnelChart steps={DEMO_FUNNEL} />
        </CardContent>
      </Card>

      {/* Optimization Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">
              Highest Optimization Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            {biggestDrop ? (
              <div className="space-y-2">
                <p className="text-lg font-bold text-amber-400">
                  {biggestDrop.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {biggestDrop.drop_off_percent?.toFixed(1)}% shift from previous
                  step represents the largest optimization opportunity in the funnel.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No funnel data available
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="text-sm">Overall Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">
              {DEMO_FUNNEL[DEMO_FUNNEL.length - 1]?.conversion_from_top?.toFixed(
                2
              )}
              %
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              From impression to purchase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop note */}
      <p className="text-xs text-muted-foreground text-center md:hidden">
        For detailed funnel comparison, view on desktop.
      </p>

      <p className="text-xs text-muted-foreground text-center">
        Demo data shown. Connect API credentials for real metrics.
      </p>
    </div>
  );
}
