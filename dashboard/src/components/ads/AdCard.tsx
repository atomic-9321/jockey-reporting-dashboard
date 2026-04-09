"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, PlayCircle, Layers, AlertTriangle, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ad, AdMetrics, Currency, Region, AdAgeGenderBreakdown } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/constants";
import { cwKeyToDateRange } from "@/lib/metrics";
import { getFunnelStageColor, getAwarenessColor, getTypeColor } from "@/lib/ad-name-parser";
import { cn } from "@/lib/utils";

/** Compute the earliest start and latest end date across the ad's CW keys. */
function adDateRange(ad: Ad): { start: string; end: string } | null {
  const cwKeys = Object.keys(ad.weekly_breakdown ?? {});
  if (!cwKeys.length) return null;
  let earliest = Infinity;
  let latest = -Infinity;
  for (const cw of cwKeys) {
    try {
      const { start, end } = cwKeyToDateRange(cw);
      if (start.getTime() < earliest) earliest = start.getTime();
      if (end.getTime() > latest) latest = end.getTime();
    } catch { /* skip unparseable CWs */ }
  }
  if (!isFinite(earliest)) return null;
  const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
  return { start: fmt(earliest), end: fmt(latest) };
}

interface AdCardProps {
  ad: Ad;
  metrics: AdMetrics;
  currency: Currency;
  region: Region;
  onClick?: () => void;
}

const FORMAT_BORDER: Record<string, string> = {
  video: "border-l-cyan-400/40",
  static: "border-l-violet-400/40",
  carousel: "border-l-amber-400/40",
};

const STAGE_ACCENT: Record<string, string> = {
  TOF: "from-cyan-500/10 to-transparent",
  MOF: "from-indigo-500/10 to-transparent",
  BOF: "from-emerald-500/10 to-transparent",
};

function FormatIcon({ format, size = 14 }: { format: string; size?: number }) {
  switch (format) {
    case "video":
      return <PlayCircle size={size} />;
    case "carousel":
      return <Layers size={size} />;
    default:
      return <ImageIcon size={size} />;
  }
}

// ── Shared fetch queue to avoid flooding Meta API ──────────────────────────

const ageGenderCache = new Map<string, AdAgeGenderBreakdown[]>();

type QueueItem = {
  url: string;
  cacheKey: string;
  resolve: (data: AdAgeGenderBreakdown[]) => void;
  reject: (err: Error) => void;
};

const queue: QueueItem[] = [];
let running = 0;
const MAX_CONCURRENT = 3;

function enqueue(url: string, cacheKey: string): Promise<AdAgeGenderBreakdown[]> {
  return new Promise((resolve, reject) => {
    queue.push({ url, cacheKey, resolve, reject });
    processQueue();
  });
}

function processQueue() {
  while (running < MAX_CONCURRENT && queue.length > 0) {
    const item = queue.shift()!;
    running++;
    fetch(item.url)
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then((json) => {
        const ag: AdAgeGenderBreakdown[] = json?.age_gender ?? [];
        // Only cache if we got actual data
        if (ag.length > 0) {
          ageGenderCache.set(item.cacheKey, ag);
        }
        item.resolve(ag);
      })
      .catch((err) => item.reject(err))
      .finally(() => {
        running--;
        processQueue();
      });
  }
}

export function AdCard({ ad, metrics, currency, region, onClick }: AdCardProps) {
  const isVideo = ad.parsed_name.format === "video";
  const format = ad.parsed_name.format;
  const stage = ad.parsed_name.funnel_stage;

  // Fetch age/gender data via throttled queue
  const [ageGender, setAgeGender] = useState<AdAgeGenderBreakdown[] | null>(
    () => ageGenderCache.get(`${ad.ad_id}:${region}`) ?? null
  );
  const [agLoading, setAgLoading] = useState(false);
  const [agError, setAgError] = useState(false);

  useEffect(() => {
    const cacheKey = `${ad.ad_id}:${region}`;
    if (ageGenderCache.has(cacheKey)) {
      setAgeGender(ageGenderCache.get(cacheKey)!);
      return;
    }

    let cancelled = false;
    setAgLoading(true);
    setAgError(false);

    const range = adDateRange(ad);
    const dateParams = range
      ? `&start_date=${range.start}&end_date=${range.end}`
      : "";
    const url = `/api/ad-insights?ad_id=${ad.ad_id}&region=${region}${dateParams}`;

    enqueue(url, cacheKey)
      .then((ag) => {
        if (!cancelled) setAgeGender(ag);
      })
      .catch(() => {
        if (!cancelled) setAgError(true);
      })
      .finally(() => {
        if (!cancelled) setAgLoading(false);
      });

    return () => { cancelled = true; };
  }, [ad.ad_id, region]);

  return (
    <Card
      className={cn(
        "glass-card border-border/30 hover:border-primary/15 transition-all duration-400 overflow-hidden group",
        "border-l-2",
        FORMAT_BORDER[format] ?? "border-l-border/30",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      {/* Stage accent gradient */}
      <div
        className={cn(
          "h-0.5 w-full bg-gradient-to-r",
          STAGE_ACCENT[stage] ?? "from-border/20 to-transparent"
        )}
      />

      {/* Preview */}
      <div className="aspect-video relative bg-secondary/20 overflow-hidden">
        {ad.creative_thumbnail_url ? (
          <img
            src={ad.creative_thumbnail_url}
            alt={ad.ad_name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              img.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {/* Placeholder */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground/50",
            ad.creative_thumbnail_url ? "hidden" : ""
          )}
        >
          <FormatIcon format={format} size={20} />
          <span className="text-xs capitalize">{format || "Ad Preview"}</span>
          <span className="text-[10px] text-muted-foreground/30 max-w-[80%] truncate text-center font-mono">
            {ad.ad_name}
          </span>
        </div>

        {/* Format icon overlay */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white/80 text-[10px] font-mono">
          <FormatIcon format={format} size={10} />
          <span className="capitalize">{format}</span>
        </div>

        {/* Hover gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      <CardContent className="p-4 space-y-3">
        {/* Name + Hook Angle + Avatar */}
        <div className="space-y-1">
          <p className="text-sm font-semibold truncate" title={ad.ad_name}>
            {ad.parsed_name.parse_success
              ? ad.parsed_name.product_name
              : ad.ad_name}
          </p>
          {ad.parsed_name.parse_success && ad.parsed_name.hook_angle && (
            <p
              className="text-sm italic text-primary/70 leading-snug line-clamp-2"
              title={ad.parsed_name.hook_angle}
            >
              &ldquo;{ad.parsed_name.hook_angle}&rdquo;
            </p>
          )}
          <p className="text-xs text-muted-foreground/50 truncate font-mono">
            {ad.parsed_name.parse_success
              ? `${ad.parsed_name.avatar} \u00B7 ${ad.parsed_name.joc_id}`
              : ad.campaign_name}
          </p>
        </div>

        {/* Tags — funnel stage + awareness prominent, rest secondary */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant="outline"
            className={cn(
              "text-xs px-2 py-0.5 font-medium border-border/30",
              getFunnelStageColor(ad.parsed_name.funnel_stage)
            )}
          >
            {ad.parsed_name.funnel_stage}
          </Badge>
          {ad.parsed_name.parse_success && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs px-2 py-0.5 font-medium border-border/30",
                getAwarenessColor(ad.parsed_name.awareness_level)
              )}
            >
              {ad.parsed_name.awareness_level}
            </Badge>
          )}
          {ad.parsed_name.parse_success && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] px-1.5 py-0 border-border/30",
                getTypeColor(ad.parsed_name.creative_type)
              )}
            >
              {ad.parsed_name.creative_type}
            </Badge>
          )}
          {!ad.parsed_name.parse_success && (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-500/20 text-amber-400/80"
                >
                  <AlertTriangle size={10} className="mr-0.5" />
                  naming
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  Ad name doesn&apos;t match expected naming convention
                </p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Metrics grid */}
        <div
          className={cn(
            "grid gap-x-3 gap-y-1.5 pt-3 border-t border-border/20",
            isVideo ? "grid-cols-2" : "grid-cols-2"
          )}
        >
          <MetricRow label="Investment" value={formatCurrency(metrics.spend, currency)} />
          <MetricRow label="CTR" value={formatPercent(metrics.ctr)} />
          <MetricRow label="Conv. Rate" value={formatPercent(metrics.conversion_rate)} />
          <MetricRow
            label="Ad ROAS"
            value={metrics.roas !== null ? `${metrics.roas}x` : "N/A"}
          />
          {isVideo && (
            <>
              <MetricRow
                label="Hook Rate"
                value={formatPercent(metrics.hook_rate)}
                highlight
              />
              <MetricRow
                label="Hold Rate"
                value={formatPercent(metrics.hold_rate)}
                highlight
              />
            </>
          )}
        </div>

        {/* Age & Gender Spend Breakdown */}
        <AgeGenderMini
          data={ageGender}
          loading={agLoading}
          error={agError}
          currency={currency}
          totalSpend={metrics.spend}
        />
      </CardContent>
    </Card>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p
        className={cn(
          "text-[10px] uppercase tracking-wider font-mono",
          highlight
            ? "text-cyan-400/60"
            : "text-muted-foreground/50"
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "text-xs font-medium tabular-nums",
          value === "N/A" ? "text-muted-foreground/30" : ""
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AgeGenderMini({
  data,
  loading,
  error,
  currency,
  totalSpend,
}: {
  data: AdAgeGenderBreakdown[] | null;
  loading: boolean;
  error: boolean;
  currency: Currency;
  totalSpend: number | null;
}) {
  if (loading) {
    return (
      <div className="pt-3 border-t border-border/20">
        <div className="rounded-lg bg-gradient-to-b from-muted/5 to-transparent p-2.5">
          <div className="flex items-center gap-1.5 mb-3">
            <div className="h-3 w-20 bg-muted/15 rounded animate-pulse" />
          </div>
          <div className="space-y-2.5 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between">
                  <div className="h-2.5 w-10 bg-muted/12 rounded" />
                  <div className="h-2.5 w-16 bg-muted/12 rounded" />
                </div>
                <div className="h-1.5 bg-muted/8 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-3 border-t border-border/20">
        <div className="flex items-center gap-1.5 py-1">
          <Users size={10} className="text-muted-foreground/25" />
          <span className="text-[10px] text-muted-foreground/25 font-mono">
            Demographics unavailable
          </span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) return null;

  // Aggregate spend + purchases by age group, split by gender
  type AgeGroup = {
    male: number; female: number; total: number;
    malePurchaseVal: number; femalePurchaseVal: number; totalPurchaseVal: number;
  };
  const ageMap = new Map<string, AgeGroup>();
  for (const row of data) {
    const existing = ageMap.get(row.age) ?? {
      male: 0, female: 0, total: 0,
      malePurchaseVal: 0, femalePurchaseVal: 0, totalPurchaseVal: 0,
    };
    const purchaseVal = row.roas !== null ? row.spend * row.roas : 0;
    if (row.gender === "male") {
      existing.male += row.spend;
      existing.malePurchaseVal += purchaseVal;
    } else if (row.gender === "female") {
      existing.female += row.spend;
      existing.femalePurchaseVal += purchaseVal;
    }
    existing.total += row.spend;
    existing.totalPurchaseVal += purchaseVal;
    ageMap.set(row.age, existing);
  }

  // Sort by total spend descending, show top 4
  const sorted = Array.from(ageMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);

  const maxSpend = Math.max(...sorted.map(([, v]) => v.total), 1);

  // Find the best-performing age group by ROAS for highlighting
  let bestRoasAge = "";
  let bestRoas = 0;
  for (const [age, vals] of sorted) {
    const roas = vals.total > 0 ? vals.totalPurchaseVal / vals.total : 0;
    if (roas > bestRoas) { bestRoas = roas; bestRoasAge = age; }
  }

  // Totals for the summary row
  const grandTotal = sorted.reduce((s, [, v]) => s + v.total, 0);
  const grandMale = sorted.reduce((s, [, v]) => s + v.male, 0);
  const grandFemale = sorted.reduce((s, [, v]) => s + v.female, 0);
  const maleRatio = grandTotal > 0 ? Math.round((grandMale / grandTotal) * 100) : 0;
  const femaleRatio = grandTotal > 0 ? Math.round((grandFemale / grandTotal) * 100) : 0;

  return (
    <div className="pt-3 border-t border-border/20">
      <div className="rounded-lg bg-gradient-to-b from-muted/8 to-transparent border border-border/10 p-2.5">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Users size={10} className="text-primary/50" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">
              Demographics
            </span>
          </div>
          <div className="flex items-center gap-0.5 text-[9px] font-mono text-muted-foreground/40">
            <span className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              M {maleRatio}%
            </span>
            <span className="text-border/30 mx-0.5">/</span>
            <span className="inline-flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              F {femaleRatio}%
            </span>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[36px_1fr_44px_32px] gap-1.5 items-center mb-1 px-0.5">
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground/30 font-mono">Age</span>
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground/30 font-mono">Spend</span>
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground/30 font-mono text-right">Amt</span>
          <span className="text-[8px] uppercase tracking-widest text-muted-foreground/30 font-mono text-right">ROAS</span>
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {sorted.map(([age, vals], idx) => {
            const roas = vals.total > 0
              ? Math.round((vals.totalPurchaseVal / vals.total) * 100) / 100
              : 0;
            const malePct = vals.total > 0 ? (vals.male / vals.total) * 100 : 0;
            const barScale = vals.total / maxSpend;
            const isBest = age === bestRoasAge && bestRoas >= 1;

            return (
              <div
                key={age}
                className={cn(
                  "grid grid-cols-[36px_1fr_44px_32px] gap-1.5 items-center rounded-md px-0.5 py-[5px] transition-all duration-300",
                  isBest
                    ? "bg-emerald-500/10 shadow-[inset_0_0_0_1px_oklch(0.75_0.19_155_/_0.15)]"
                    : idx % 2 === 0 ? "bg-transparent" : "bg-muted/3"
                )}
              >
                {/* Age label */}
                <span className={cn(
                  "text-[10px] font-semibold font-mono tabular-nums",
                  isBest ? "text-emerald-400/90" : "text-foreground/60"
                )}>
                  {age}
                </span>

                {/* Stacked bar */}
                <div className="h-[7px] bg-muted/8 rounded-full overflow-hidden flex">
                  <div
                    className={cn(
                      "h-full transition-all duration-700 ease-out",
                      isBest ? "bg-indigo-400/90" : "bg-indigo-400/60"
                    )}
                    style={{ width: `${(malePct / 100) * barScale * 100}%` }}
                    title={`Male: ${formatCurrency(vals.male, currency)}`}
                  />
                  <div
                    className={cn(
                      "h-full transition-all duration-700 ease-out",
                      isBest ? "bg-rose-400/90" : "bg-rose-400/60"
                    )}
                    style={{ width: `${((100 - malePct) / 100) * barScale * 100}%` }}
                    title={`Female: ${formatCurrency(vals.female, currency)}`}
                  />
                </div>

                {/* Spend amount */}
                <span className="text-[10px] tabular-nums text-muted-foreground/50 text-right font-mono">
                  {formatCurrency(vals.total, currency)}
                </span>

                {/* ROAS */}
                <span
                  className={cn(
                    "text-[10px] font-bold tabular-nums text-right",
                    roas >= 2 ? "text-emerald-400" :
                    roas >= 1 ? "text-amber-400/80" :
                    roas > 0 ? "text-muted-foreground/40" :
                    "text-muted-foreground/20"
                  )}
                >
                  {roas > 0 ? `${roas}x` : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
