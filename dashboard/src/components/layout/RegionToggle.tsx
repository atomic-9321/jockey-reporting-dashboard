"use client";

import { useRegion } from "@/hooks/useRegion";
import { cn } from "@/lib/utils";

export function RegionToggle() {
  const { region, setRegion } = useRegion();

  return (
    <div className="flex items-center bg-secondary rounded-lg p-0.5">
      <button
        onClick={() => setRegion("EU")}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
          region === "EU"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        EU
      </button>
      <button
        onClick={() => setRegion("UK")}
        className={cn(
          "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200",
          region === "UK"
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        UK
      </button>
    </div>
  );
}
