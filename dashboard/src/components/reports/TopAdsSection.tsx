"use client";

import { Trophy, Image as ImageIcon, PlayCircle, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TopAd } from "@/lib/types";
import type { Currency } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/constants";
import { getFunnelStageColor } from "@/lib/ad-name-parser";
import { cn } from "@/lib/utils";

interface TopAdsSectionProps {
  ads: TopAd[];
  currency: Currency;
}

const RANK_COLORS = [
  "text-amber-400",   // 1st
  "text-zinc-300",    // 2nd
  "text-amber-600",   // 3rd
];

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

export function TopAdsSection({ ads, currency }: TopAdsSectionProps) {
  if (ads.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        No ads meet the minimum investment threshold for this period
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {ads.map((ad) => (
        <Card
          key={ad.ad_id}
          className="glass-card border-border/50 hover:border-primary/20 transition-all"
        >
          <CardContent className="p-4 space-y-3">
            {/* Rank + Name */}
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full bg-secondary shrink-0",
                  RANK_COLORS[ad.rank - 1]
                )}
              >
                <Trophy size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{ad.ad_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ad.campaign_name}
                </p>
              </div>
            </div>

            {/* Preview */}
            <div className="aspect-video rounded-lg bg-secondary/50 overflow-hidden">
              {ad.creative_thumbnail_url ? (
                <img
                  src={ad.creative_thumbnail_url}
                  alt={ad.ad_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FormatIcon format={ad.parsed_name.format} />
                  <span className="text-xs">{ad.parsed_name.format}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  getFunnelStageColor(ad.parsed_name.funnel_stage)
                )}
              >
                {ad.parsed_name.funnel_stage}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                <FormatIcon format={ad.parsed_name.format} />
                <span className="ml-1">{ad.parsed_name.format}</span>
              </Badge>
              {!ad.parsed_name.parse_success && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/30 text-amber-400"
                >
                  naming mismatch
                </Badge>
              )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div>
                <p className="text-[10px] text-muted-foreground">Purchases</p>
                <p className="text-sm font-semibold">
                  {formatNumber(ad.period_metrics.purchases)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Ad ROAS</p>
                <p className="text-sm font-semibold">
                  {ad.period_metrics.roas !== null
                    ? `${ad.period_metrics.roas}x`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground">Investment</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(ad.period_metrics.spend, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
