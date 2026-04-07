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
  color?: string;
  delay?: number;
  subtitle?: string;
  className?: string;
}

const COLOR_PRESETS: Record<string, { stroke: string; fill: string; glow: string; dot: string; accent: string }> = {
  cyan: {
    stroke: "oklch(0.82 0.19 195)",
    fill: "oklch(0.82 0.19 195)",
    glow: "shadow-[0_0_24px_oklch(0.78_0.17_195_/_12%)]",
    dot: "bg-[oklch(0.82_0.19_195)]",
    accent: "oklch(0.78 0.17 195)",
  },
  indigo: {
    stroke: "oklch(0.68 0.20 280)",
    fill: "oklch(0.68 0.20 280)",
    glow: "shadow-[0_0_24px_oklch(0.68_0.20_280_/_12%)]",
    dot: "bg-[oklch(0.68_0.20_280)]",
    accent: "oklch(0.68 0.20 280)",
  },
  emerald: {
    stroke: "oklch(0.78 0.20 155)",
    fill: "oklch(0.78 0.20 155)",
    glow: "shadow-[0_0_24px_oklch(0.75_0.19_155_/_12%)]",
    dot: "bg-[oklch(0.78_0.20_155)]",
    accent: "oklch(0.75 0.19 155)",
  },
  amber: {
    stroke: "oklch(0.82 0.18 85)",
    fill: "oklch(0.82 0.18 85)",
    glow: "shadow-[0_0_24px_oklch(0.80_0.17_85_/_12%)]",
    dot: "bg-[oklch(0.82_0.18_85)]",
    accent: "oklch(0.80 0.17 85)",
  },
  rose: {
    stroke: "oklch(0.70 0.22 340)",
    fill: "oklch(0.70 0.22 340)",
    glow: "shadow-[0_0_24px_oklch(0.68_0.22_340_/_12%)]",
    dot: "bg-[oklch(0.70_0.22_340)]",
    accent: "oklch(0.68 0.22 340)",
  },
  violet: {
    stroke: "oklch(0.72 0.18 300)",
    fill: "oklch(0.72 0.18 300)",
    glow: "shadow-[0_0_24px_oklch(0.72_0.18_300_/_12%)]",
    dot: "bg-[oklch(0.72_0.18_300)]",
    accent: "oklch(0.72 0.18 300)",
  },
};

export function KPICard({
  label,
  value,
  trend,
  sparklineData,
  anomaly = false,
  anomalyTooltip,
  color = "cyan",
  delay = 0,
  subtitle,
  className,
}: KPICardProps) {
  const trendInfo = trend != null ? frameTrend(trend) : null;
  const preset = COLOR_PRESETS[color] || COLOR_PRESETS.cyan;
  const gradientId = `spark-${color}-${label.replace(/\s/g, "")}`;

  return (
    <Card
      className={cn(
        "glass-card gradient-border border-border/30 transition-all duration-500",
        "animate-fade-slide-up group",
        "hover:border-border/50",
        anomaly && "border-amber-500/30",
        className
      )}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <CardContent className="p-5 relative overflow-hidden">
        {/* Subtle color accent in top-left corner */}
        <div
          className="absolute -top-12 -left-12 w-24 h-24 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.10] transition-opacity duration-700"
          style={{ backgroundColor: preset.accent }}
        />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <div
                className={cn("h-1.5 w-1.5 rounded-full data-dot", preset.dot)}
                style={{ boxShadow: `0 0 6px ${preset.accent}` }}
              />
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.15em]">
                {label}
              </p>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight tabular-nums">
                {value}
              </p>
              {subtitle && (
                <span className="text-[10px] text-muted-foreground">{subtitle}</span>
              )}
              {anomaly && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle
                      size={14}
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
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md backdrop-blur-sm",
                    trend && trend > 0
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                      : trend && trend < 0
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                        : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/10"
                  )}
                >
                  {trendInfo.label}
                </span>
                <span className="text-[10px] text-muted-foreground/60">vs prev</span>
              </div>
            )}
          </div>

          {sparklineData && sparklineData.length > 1 && (
            <div className="w-24 h-14 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity duration-500">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparklineData}>
                  <defs>
                    <linearGradient
                      id={gradientId}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={preset.fill}
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="100%"
                        stopColor={preset.fill}
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={preset.stroke}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    animationDuration={1200}
                    animationEasing="ease-out"
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
