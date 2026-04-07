"use client";

import type { FunnelStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/constants";

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

const STEP_COLORS = [
  {
    bar: "from-cyan-400/40 to-cyan-500/8",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    glow: "shadow-[inset_0_0_20px_oklch(0.82_0.19_195_/_8%)]",
    accent: "oklch(0.82 0.19 195)",
  },
  {
    bar: "from-cyan-300/35 to-cyan-400/6",
    text: "text-cyan-300",
    dot: "bg-cyan-300",
    glow: "shadow-[inset_0_0_20px_oklch(0.78_0.17_195_/_6%)]",
    accent: "oklch(0.78 0.17 195)",
  },
  {
    bar: "from-teal-300/35 to-teal-400/6",
    text: "text-teal-300",
    dot: "bg-teal-300",
    glow: "shadow-[inset_0_0_20px_oklch(0.75_0.17_170_/_6%)]",
    accent: "oklch(0.75 0.17 170)",
  },
  {
    bar: "from-indigo-400/35 to-indigo-400/6",
    text: "text-indigo-300",
    dot: "bg-indigo-300",
    glow: "shadow-[inset_0_0_20px_oklch(0.68_0.18_275_/_6%)]",
    accent: "oklch(0.68 0.18 275)",
  },
  {
    bar: "from-violet-400/35 to-violet-400/6",
    text: "text-violet-300",
    dot: "bg-violet-300",
    glow: "shadow-[inset_0_0_20px_oklch(0.70_0.17_300_/_6%)]",
    accent: "oklch(0.70 0.17 300)",
  },
  {
    bar: "from-purple-400/35 to-purple-400/6",
    text: "text-purple-300",
    dot: "bg-purple-300",
    glow: "shadow-[inset_0_0_20px_oklch(0.68_0.18_310_/_6%)]",
    accent: "oklch(0.68 0.18 310)",
  },
  {
    bar: "from-emerald-400/40 to-emerald-500/8",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    glow: "shadow-[inset_0_0_20px_oklch(0.78_0.20_155_/_8%)]",
    accent: "oklch(0.78 0.20 155)",
  },
];

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const maxValue = steps[0]?.value ?? 1;

  return (
    <div className={cn("space-y-3", className)}>
      {steps.map((step, index) => {
        const widthPercent =
          step.value !== null && maxValue > 0
            ? Math.max((step.value / maxValue) * 100, 10)
            : 10;

        const colors = STEP_COLORS[index] || STEP_COLORS[0];

        return (
          <div
            key={step.key}
            className="flex items-center gap-3 animate-fade-slide-up group"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            {/* Step label */}
            <div className="w-28 shrink-0 text-right flex items-center justify-end gap-2">
              <span className={cn("text-[13px] font-medium transition-all duration-300", colors.text)}>
                {step.label}
              </span>
              <div
                className={cn("h-1.5 w-1.5 rounded-full shrink-0", colors.dot)}
                style={{ boxShadow: `0 0 5px ${colors.accent}` }}
              />
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div
                className={cn(
                  "h-10 rounded-lg bg-gradient-to-r border border-white/[0.04] transition-all duration-700 ease-out relative overflow-hidden",
                  colors.bar,
                  colors.glow
                )}
                style={{ width: `${widthPercent}%` }}
              >
                {/* Inner shimmer effect */}
                <div className="absolute inset-0 animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="flex items-center justify-between h-full px-3 relative z-10">
                  <span className="text-[13px] font-semibold tabular-nums">
                    {formatNumber(step.value)}
                  </span>
                  {step.conversion_from_top !== null && index > 0 && (
                    <span className="text-[10px] text-muted-foreground/70 tabular-nums font-mono">
                      {formatPercent(step.conversion_from_top)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Drop-off */}
            <div className="w-16 shrink-0 text-right">
              {step.drop_off_percent !== null && index > 0 ? (
                <span className="text-[11px] text-amber-400/80 tabular-nums font-mono">
                  -{formatPercent(step.drop_off_percent)}
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/30">&mdash;</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
