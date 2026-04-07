"use client";

import Image from "next/image";
import { Image as ImageIcon, PlayCircle, Layers, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Ad, AdMetrics, Currency } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/constants";
import { getFunnelStageColor, getAwarenessColor, getTypeColor } from "@/lib/ad-name-parser";
import { cn } from "@/lib/utils";

interface AdCardProps {
  ad: Ad;
  metrics: AdMetrics;
  currency: Currency;
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

export function AdCard({ ad, metrics, currency, onClick }: AdCardProps) {
  const isVideo = ad.parsed_name.format === "video";
  const format = ad.parsed_name.format;
  const stage = ad.parsed_name.funnel_stage;

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
          <Image
            src={ad.creative_thumbnail_url}
            alt={ad.ad_name}
            fill
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            quality={85}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
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
