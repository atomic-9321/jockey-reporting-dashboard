"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { frameTrend } from "@/lib/constants";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface KPICardProps {
  label: string;
  value: string;
  trend?: number | null;
  sparklineData?: Array<{ value: number }>;
  anomaly?: boolean;
  anomalyTooltip?: string;
  className?: string;
}

export function KPICard({
  label,
  value,
  trend,
  sparklineData,
  anomaly = false,
  anomalyTooltip,
  className,
}: KPICardProps) {
  const trendInfo = trend != null ? frameTrend(trend) : null;

  return (
    <Card
      className={cn(
        "glass-card border-border/50 hover:border-primary/20 transition-all duration-300",
        anomaly && "border-amber-500/30",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {anomaly && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle
                      size={16}
                      className="text-amber-400 animate-pulse"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">
                      {anomalyTooltip ||
                        "Significant change detected \u2014 verify in Ads Manager"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {trendInfo && (
              <p className={cn("text-xs font-medium", trendInfo.color)}>
                {trendInfo.label} vs previous
              </p>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className="w-20 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient
                      id="sparkGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="oklch(0.75 0.15 195)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor="oklch(0.75 0.15 195)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="oklch(0.75 0.15 195)"
                    strokeWidth={1.5}
                    fill="url(#sparkGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
