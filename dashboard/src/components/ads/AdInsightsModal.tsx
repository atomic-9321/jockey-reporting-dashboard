"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Users, LayoutGrid, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/constants";
import { getFunnelStageColor } from "@/lib/ad-name-parser";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import type {
  Ad,
  AdMetrics,
  Currency,
  Region,
  AdInsightsBreakdown,
  AdAgeGenderBreakdown,
  AdPlacementBreakdown,
} from "@/lib/types";

interface AdInsightsModalProps {
  ad: Ad | null;
  metrics: AdMetrics | null;
  currency: Currency;
  region: Region;
  open: boolean;
  onClose: () => void;
}

export function AdInsightsModal({
  ad,
  metrics,
  currency,
  region,
  open,
  onClose,
}: AdInsightsModalProps) {
  const [data, setData] = useState<AdInsightsBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !ad) {
      setData(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/ad-insights?ad_id=${ad.ad_id}&region=${region}`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json: AdInsightsBreakdown) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, ad?.ad_id, region]);

  if (!ad || !metrics) return null;

  const isVideo = ad.parsed_name.format === "video";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="sm:max-w-2xl overflow-y-auto"
      >
        <SheetHeader className="border-b border-border/20 pb-4">
          <div className="flex gap-4 items-start">
            {/* Thumbnail */}
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary/20 flex-shrink-0 relative">
              {ad.creative_thumbnail_url ? (
                <Image
                  src={ad.creative_thumbnail_url}
                  alt={ad.ad_name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  quality={95}
                  unoptimized
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground/40 text-xs">
                  No preview
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="truncate text-base">
                {ad.parsed_name.parse_success
                  ? ad.parsed_name.product_name
                  : ad.ad_name}
              </SheetTitle>
              <SheetDescription className="mt-1 truncate">
                {ad.parsed_name.hook_angle
                  ? `"${ad.parsed_name.hook_angle}"`
                  : ad.campaign_name}
              </SheetDescription>
              <div className="flex gap-1.5 mt-2">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    getFunnelStageColor(ad.parsed_name.funnel_stage),
                  )}
                >
                  {ad.parsed_name.funnel_stage}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {ad.parsed_name.format}
                </Badge>
              </div>
            </div>
          </div>
          {/* Key metrics row */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            <MiniMetric
              label="Spend"
              value={formatCurrency(metrics.spend, currency)}
            />
            <MiniMetric
              label="ROAS"
              value={metrics.roas !== null ? `${metrics.roas}x` : "N/A"}
            />
            <MiniMetric label="CTR" value={formatPercent(metrics.ctr)} />
            <MiniMetric
              label="Conv. Rate"
              value={formatPercent(metrics.conversion_rate)}
            />
          </div>
        </SheetHeader>

        <div className="space-y-5 px-4 pb-6">
          {loading && <LoadingSkeleton />}
          {error && (
            <div className="text-center text-muted-foreground/50 py-8 text-sm">
              Could not load breakdown data
            </div>
          )}
          {data && !loading && (
            <>
              <AgeGenderSection data={data.age_gender} currency={currency} />
              <div className="border-t border-border/10" />
              <PlacementSection
                data={data.placements}
                currency={currency}
              />
              {isVideo && data.video_retention && (
                <>
                  <div className="border-t border-border/10" />
                  <RetentionSection data={data.video_retention} />
                </>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-lg p-2.5 border border-border/20">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono">
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SectionTitle({
  children,
  icon,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/10 text-primary/60">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-foreground/80">{children}</h3>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="h-3 w-32 bg-muted/20 rounded mb-3" />
          <div className="h-40 bg-muted/10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ── Age & Gender Section ────────────────────────────────────────────────────

function AgeGenderSection({
  data,
  currency,
}: {
  data: AdAgeGenderBreakdown[];
  currency: Currency;
}) {
  if (!data.length) {
    return (
      <div>
        <SectionTitle icon={<Users size={14} />}>Age & Gender Breakdown</SectionTitle>
        <p className="text-sm text-muted-foreground/40">Insufficient data</p>
      </div>
    );
  }

  // Group by age, then split male/female with weighted ROAS
  const ageMap = new Map<
    string,
    { male: number; female: number; total: number; totalPurchaseVal: number }
  >();

  for (const row of data) {
    const existing = ageMap.get(row.age) ?? {
      male: 0,
      female: 0,
      total: 0,
      totalPurchaseVal: 0,
    };
    const spend = row.spend;
    if (row.gender === "male") existing.male += spend;
    else if (row.gender === "female") existing.female += spend;
    existing.total += spend;
    existing.totalPurchaseVal += row.roas !== null ? spend * row.roas : 0;
    ageMap.set(row.age, existing);
  }

  const ages = Array.from(ageMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  return (
    <div>
      <SectionTitle icon={<Users size={14} />}>Age & Gender Breakdown</SectionTitle>
      <div className="glass-card rounded-lg border border-border/20 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/15">
              <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-normal px-3 py-2 w-[72px]">Age</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-normal px-3 py-2">Male</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-normal px-3 py-2">Female</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-normal px-3 py-2">Total</th>
              <th className="text-right text-[10px] uppercase tracking-wider text-muted-foreground/50 font-mono font-normal px-3 py-2 w-[60px]">ROAS</th>
            </tr>
          </thead>
          <tbody>
            {ages.map(([age, vals]) => {
              const roas = vals.total > 0
                ? Math.round((vals.totalPurchaseVal / vals.total) * 100) / 100
                : null;
              return (
                <tr
                  key={age}
                  className="border-b border-border/10 last:border-0"
                >
                  <td className="text-xs font-medium px-3 py-2.5">{age}</td>
                  <td className="text-xs tabular-nums text-right px-3 py-2.5 text-indigo-400/80">
                    {formatCurrency(vals.male, currency)}
                  </td>
                  <td className="text-xs tabular-nums text-right px-3 py-2.5 text-rose-400/80">
                    {formatCurrency(vals.female, currency)}
                  </td>
                  <td className="text-xs tabular-nums text-right font-medium px-3 py-2.5">
                    {formatCurrency(vals.total, currency)}
                  </td>
                  <td
                    className={cn(
                      "text-xs tabular-nums text-right font-semibold px-3 py-2.5",
                      roas !== null && roas >= 2
                        ? "text-emerald-400"
                        : roas !== null && roas >= 1
                          ? "text-amber-400/80"
                          : "text-muted-foreground/50",
                    )}
                  >
                    {roas !== null && roas > 0 ? `${roas}x` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SpendBar({
  value,
  max,
  currency,
  color,
}: {
  value: number;
  max: number;
  currency: Currency;
  color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-4 bg-muted/10 rounded overflow-hidden">
        <div
          className={cn("h-full rounded", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] tabular-nums text-muted-foreground/50 w-14 text-right">
        {formatCurrency(value, currency)}
      </span>
    </div>
  );
}

// ── Placement Section ───────────────────────────────────────────────────────

function PlacementSection({
  data,
  currency,
}: {
  data: AdPlacementBreakdown[];
  currency: Currency;
}) {
  if (!data.length) {
    return (
      <div>
        <SectionTitle icon={<LayoutGrid size={14} />}>Placement Breakdown</SectionTitle>
        <p className="text-sm text-muted-foreground/40">Insufficient data</p>
      </div>
    );
  }

  // Sort by spend descending, take top 8
  const sorted = [...data].sort((a, b) => b.spend - a.spend).slice(0, 8);

  const chartData = sorted.map((p) => ({
    name: p.label,
    roas: p.roas ?? 0,
    spend: p.spend,
    platform: p.platform,
  }));

  return (
    <div>
      <SectionTitle icon={<LayoutGrid size={14} />}>Placement Breakdown</SectionTitle>
      <div className="glass-card rounded-lg border border-border/20 p-4">
        {/* Legend */}
        <div className="flex gap-4 mb-3 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500/80" />
            ROAS
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" />
            Spend
          </span>
        </div>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0 0 / 0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="roas"
                orientation="left"
                tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}x`}
              />
              <YAxis
                yAxisId="spend"
                orientation="right"
                tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.01 280)",
                  border: "1px solid oklch(0.25 0 0)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                labelStyle={{ color: "oklch(0.85 0 0)" }}
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === "roas") return [`${v}x`, "ROAS"];
                  return [formatCurrency(v, currency), "Spend"];
                }}
              />
              <Bar
                yAxisId="roas"
                dataKey="roas"
                fill="oklch(0.72 0.16 280 / 0.8)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                yAxisId="spend"
                dataKey="spend"
                fill="oklch(0.75 0.19 155 / 0.8)"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Video Retention Section ─────────────────────────────────────────────────

function RetentionSection({
  data,
}: {
  data: NonNullable<AdInsightsBreakdown["video_retention"]>;
}) {
  if (!data.curve.length) {
    return (
      <div>
        <SectionTitle icon={<Play size={14} />}>Video Retention</SectionTitle>
        <p className="text-sm text-muted-foreground/40">
          No retention data available
        </p>
      </div>
    );
  }

  // The curve has ~100 data points (percentiles of video length)
  // Map to approximate seconds if duration known, else show %
  const hasDuration = data.duration_seconds !== null && data.duration_seconds > 0;

  const chartData = data.curve.map((point) => ({
    label: hasDuration
      ? `${Math.round((point.pct_index / 100) * data.duration_seconds!)}s`
      : `${point.pct_index}%`,
    time: hasDuration
      ? Math.round((point.pct_index / 100) * data.duration_seconds!)
      : point.pct_index,
    retention: Math.round(point.retention * 10) / 10,
  }));

  // Find 3s hook mark and 15s thruplay mark as pct_index
  const hookIndex = hasDuration
    ? Math.round((3 / data.duration_seconds!) * 100)
    : null;
  const thruplayIndex = hasDuration
    ? Math.round((15 / data.duration_seconds!) * 100)
    : null;

  return (
    <div>
      <SectionTitle icon={<Play size={14} />}>Video Retention</SectionTitle>
      <div className="glass-card rounded-lg border border-border/20 p-4">
        <div className="flex gap-4 mb-3 text-[10px] text-muted-foreground/50">
          <span>
            Retention % across video length
            {hasDuration ? ` (${data.duration_seconds}s)` : ""}
          </span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 5, right: 10, bottom: 5, left: 5 }}
            >
              <defs>
                <linearGradient
                  id="retentionGrad"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="oklch(0.72 0.16 280)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="oklch(0.72 0.16 280)"
                    stopOpacity={0.02}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.3 0 0 / 0.15)"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) =>
                  hasDuration ? `${v}s` : `${v}%`
                }
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "oklch(0.6 0 0)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.15 0.01 280)",
                  border: "1px solid oklch(0.25 0 0)",
                  borderRadius: "8px",
                  fontSize: "11px",
                }}
                formatter={(value) => [`${Number(value)}%`, "Retention"]}
                labelFormatter={(label) =>
                  hasDuration ? `${label}s` : `${label}%`
                }
              />
              {hookIndex !== null && hookIndex <= 100 && (
                <ReferenceLine
                  x={hasDuration ? 3 : hookIndex}
                  stroke="oklch(0.78 0.17 195 / 0.6)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Hook (3s)",
                    position: "top",
                    fill: "oklch(0.78 0.17 195)",
                    fontSize: 9,
                  }}
                />
              )}
              {thruplayIndex !== null && thruplayIndex <= 100 && (
                <ReferenceLine
                  x={hasDuration ? 15 : thruplayIndex}
                  stroke="oklch(0.75 0.19 155 / 0.6)"
                  strokeDasharray="4 4"
                  label={{
                    value: "Thruplay (15s)",
                    position: "top",
                    fill: "oklch(0.75 0.19 155)",
                    fontSize: 9,
                  }}
                />
              )}
              <Area
                type="monotone"
                dataKey="retention"
                stroke="oklch(0.72 0.16 280)"
                strokeWidth={2}
                fill="url(#retentionGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
