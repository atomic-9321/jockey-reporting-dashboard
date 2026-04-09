"use client";

import { KPICard } from "@/components/charts/KPICard";
import {
  formatCurrency,
  formatNumber,
  type ChannelConfig,
  type MetricFormat,
} from "@/lib/constants";
import type { Currency, ChannelMetrics, WebshopMetrics, EcosystemPeriodRow, EcoChannelKey } from "@/lib/types";

function formatMetricValue(
  value: number | null,
  format: MetricFormat,
  currency: Currency
): string {
  if (value === null) return "N/A";
  switch (format) {
    case "currency":
      return formatCurrency(value, currency);
    case "number":
      return formatNumber(value);
    case "ratio":
      return `${value.toFixed(2)}x`;
    case "percent":
      return `${value.toFixed(2)}%`;
    default:
      return String(value);
  }
}

interface ChannelSectionProps {
  config: ChannelConfig;
  row: EcosystemPeriodRow | null;
  previousRow?: EcosystemPeriodRow | null;
  currency: Currency;
  periodLabel?: string;
}

export function ChannelSection({
  config,
  row,
  previousRow,
  currency,
  periodLabel,
}: ChannelSectionProps) {
  if (!row) return null;

  const channelData = row[config.key as keyof EcosystemPeriodRow] as
    | ChannelMetrics
    | WebshopMetrics
    | undefined;
  if (!channelData) return null;

  // Check if channel has any non-null data
  const hasData = Object.values(channelData).some(
    (v) => v !== null && v !== undefined
  );
  if (!hasData) return null;

  const prevData = previousRow
    ? (previousRow[config.key as keyof EcosystemPeriodRow] as
        | ChannelMetrics
        | WebshopMetrics
        | undefined)
    : null;

  // Compute trends
  function getTrend(field: string): number | null {
    if (!prevData) return null;
    const curr = (channelData as unknown as Record<string, number | null>)[field];
    const prev = (prevData as unknown as Record<string, number | null>)[field];
    if (curr === null || prev === null || prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 10000) / 100;
  }

  return (
    <div className="space-y-3 animate-fade-slide-up">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-foreground/80">
          {config.label}
        </h3>
        {periodLabel && (
          <span className="text-[10px] text-muted-foreground/50 font-mono">
            {periodLabel}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {config.metrics.map((m, i) => {
          const value = (channelData as unknown as Record<string, number | null>)[m.field];
          return (
            <KPICard
              key={m.field}
              label={m.label}
              value={formatMetricValue(value, m.format, currency)}
              trend={getTrend(m.field)}
              color={config.color}
              delay={i * 50}
            />
          );
        })}
      </div>
    </div>
  );
}

interface EcosystemOverviewProps {
  row: EcosystemPeriodRow | null;
  previousRow?: EcosystemPeriodRow | null;
  currency: Currency;
  channels: ChannelConfig[];
  periodLabel?: string;
}

export function EcosystemOverview({
  row,
  previousRow,
  currency,
  channels,
  periodLabel,
}: EcosystemOverviewProps) {
  if (!row) return null;

  return (
    <div className="space-y-6">
      {channels.map((ch) => (
        <ChannelSection
          key={ch.key}
          config={ch}
          row={row}
          previousRow={previousRow}
          currency={currency}
          periodLabel={periodLabel}
        />
      ))}
    </div>
  );
}
