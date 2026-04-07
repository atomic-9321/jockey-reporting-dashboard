"use client";

import { useRegion } from "@/hooks/useRegion";
import { cn } from "@/lib/utils";

export function RegionToggle() {
  const { region, setRegion } = useRegion();

  return (
    <div className="flex items-center bg-secondary/50 rounded-lg p-[3px] border border-border/30 backdrop-blur-sm">
      <button
        onClick={() => setRegion("EU")}
        className={cn(
          "relative px-3.5 py-1 text-xs font-semibold rounded-md transition-all duration-300",
          region === "EU"
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.78_0.17_195_/_20%)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EU
      </button>
      <button
        onClick={() => setRegion("UK")}
        className={cn(
          "relative px-3.5 py-1 text-xs font-semibold rounded-md transition-all duration-300",
          region === "UK"
            ? "bg-primary text-primary-foreground shadow-[0_0_12px_oklch(0.78_0.17_195_/_20%)]"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        UK
      </button>
    </div>
  );
}
