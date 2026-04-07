"use client";

import { RefreshCw, Clock } from "lucide-react";
import { RegionToggle } from "./RegionToggle";
import { DataFreshnessBanner } from "./DataFreshnessBanner";
import { Button } from "@/components/ui/button";
import { useRegion } from "@/hooks/useRegion";

interface HeaderProps {
  lastRefreshed?: string;
  isStale?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function Header({
  lastRefreshed,
  isStale = false,
  onRefresh,
  refreshing = false,
}: HeaderProps) {
  const { region } = useRegion();

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border">
      {isStale && <DataFreshnessBanner />}
      <div className="flex items-center justify-between h-14 px-4 md:px-6">
        {/* Left: Page title area (filled by page) */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold md:hidden text-primary">
            JOCKEY
          </h1>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock size={12} />
              {lastRefreshed}
            </span>
          )}

          <RegionToggle />

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={refreshing}
              className="gap-1.5"
            >
              <RefreshCw
                size={14}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
