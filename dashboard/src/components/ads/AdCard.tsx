"use client";

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
}

function FormatIcon({ format }: { format: string }) {
  switch (format) {
    case "video":
      return <PlayCircle size={14} />;
    case "carousel":
      return <Layers size={14} />;
    default:
      return <ImageIcon size={14} />;
  }
}

export function AdCard({ ad, metrics, currency }: AdCardProps) {
  const isVideo = ad.parsed_name.format === "video";

  return (
    <Card className="glass-card border-border/50 hover:border-primary/20 transition-all duration-300 overflow-hidden">
      {/* Preview */}
      <div className="aspect-video relative bg-secondary/30">
        {ad.creative_thumbnail_url ? (
          <img
            src={ad.creative_thumbnail_url}
            alt={ad.ad_name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        {/* Placeholder (shown when no image or on error) */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground",
            ad.creative_thumbnail_url ? "hidden" : ""
          )}
        >
          <FormatIcon format={ad.parsed_name.format} />
          <span className="text-xs">{ad.parsed_name.format || "Ad Preview"}</span>
          <span className="text-[10px] text-muted-foreground/60 max-w-[80%] truncate text-center">
            {ad.ad_name}
          </span>
        </div>
      </div>

      <CardContent className="p-3 space-y-2.5">
        {/* Name + Hook */}
        <div>
          <p className="text-sm font-medium truncate" title={ad.ad_name}>
            {ad.parsed_name.parse_success
              ? ad.parsed_name.product_name
              : ad.ad_name}
          </p>
          {ad.parsed_name.parse_success && ad.parsed_name.hook_angle && (
            <p className="text-xs text-primary/70 truncate" title={ad.parsed_name.hook_angle}>
              {ad.parsed_name.hook_angle}
            </p>
          )}
          <p className="text-xs text-muted-foreground truncate">
            {ad.parsed_name.parse_success
              ? `${ad.parsed_name.avatar} \u00B7 ${ad.parsed_name.joc_id}`
              : ad.campaign_name}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              getFunnelStageColor(ad.parsed_name.funnel_stage)
            )}
          >
            {ad.parsed_name.funnel_stage}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {ad.parsed_name.format}
          </Badge>
          {ad.parsed_name.parse_success && (
            <>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", getTypeColor(ad.parsed_name.creative_type))}
              >
                {ad.parsed_name.creative_type}
              </Badge>
              <Badge
                variant="outline"
                className={cn("text-[10px] px-1.5 py-0", getAwarenessColor(ad.parsed_name.awareness_level))}
              >
                {ad.parsed_name.awareness_level}
              </Badge>
            </>
          )}
          {!ad.parsed_name.parse_success && (
            <Tooltip>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-400"
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
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-1 border-t border-border/30">
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
              />
              <MetricRow
                label="Hold Rate"
                value={formatPercent(metrics.hold_rate)}
              />
            </>
          )}
          {!isVideo && (
            <>
              <MetricRow label="Hook Rate" value="N/A" />
              <MetricRow label="Hold Rate" value="N/A" />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-xs font-medium",
          value === "N/A" ? "text-muted-foreground" : ""
        )}
      >
        {value}
      </p>
    </div>
  );
}
