"use client";

import type { FunnelStep } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatNumber, formatPercent } from "@/lib/constants";

interface FunnelChartProps {
  steps: FunnelStep[];
  className?: string;
}

// Color gradient from wide (top) to narrow (bottom)
const STEP_COLORS = [
  "from-cyan-500/30 to-cyan-500/10 border-cyan-500/30",
  "from-cyan-400/25 to-cyan-400/8 border-cyan-400/25",
  "from-teal-400/25 to-teal-400/8 border-teal-400/25",
  "from-indigo-400/25 to-indigo-400/8 border-indigo-400/25",
  "from-indigo-500/25 to-indigo-500/8 border-indigo-500/25",
  "from-violet-400/25 to-violet-400/8 border-violet-400/25",
  "from-emerald-500/30 to-emerald-500/10 border-emerald-500/30",
];

const STEP_TEXT_COLORS = [
  "text-cyan-400",
  "text-cyan-300",
  "text-teal-300",
  "text-indigo-300",
  "text-indigo-400",
  "text-violet-300",
  "text-emerald-400",
];

export function FunnelChart({ steps, className }: FunnelChartProps) {
  const maxValue = steps[0]?.value ?? 1;

  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => {
        const widthPercent =
          step.value !== null && maxValue > 0
            ? Math.max((step.value / maxValue) * 100, 8)
            : 8;

        return (
          <div key={step.key} className="flex items-center gap-4">
            {/* Step label */}
            <div className="w-32 shrink-0 text-right">
              <p
                className={cn(
                  "text-sm font-medium",
                  STEP_TEXT_COLORS[index] || "text-foreground"
                )}
              >
                {step.label}
              </p>
            </div>

            {/* Bar */}
            <div className="flex-1 relative">
              <div
                className={cn(
                  "h-10 rounded-lg bg-gradient-to-r border transition-all duration-500",
                  STEP_COLORS[index] || STEP_COLORS[0]
                )}
                style={{ width: `${widthPercent}%` }}
              >
                <div className="flex items-center justify-between h-full px-3">
                  <span className="text-sm font-semibold">
                    {formatNumber(step.value)}
                  </span>
                  {step.conversion_from_top !== null && index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {formatPercent(step.conversion_from_top)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Drop-off indicator */}
            <div className="w-20 shrink-0 text-right">
              {step.drop_off_percent !== null && index > 0 ? (
                <span className="text-xs text-amber-400/80">
                  -{formatPercent(step.drop_off_percent)}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
