"use client";

import { RefreshCw, Clock, Zap } from "lucide-react";
import { RegionToggle } from "./RegionToggle";
import { DataFreshnessBanner } from "./DataFreshnessBanner";
import { Button } from "@/components/ui/button";

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
  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/60 backdrop-blur-2xl">
      {/* Subtle top neon line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      {isStale && <DataFreshnessBanner />}
      <div className="flex items-center justify-between h-14 px-4 md:px-8">
        {/* Left: Mobile brand */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center md:hidden shadow-[0_0_12px_oklch(0.78_0.17_195_/_20%)]">
            <span className="text-[12px] font-black text-white">J</span>
          </div>
          {/* Status beacon (desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/5 border border-primary/10">
              <Zap size={10} className="text-primary" />
              <span className="text-[10px] font-medium text-primary/80 tracking-wider uppercase">
                Live
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          {lastRefreshed && (
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground/70 font-mono">
              <Clock size={10} className="text-primary/40" />
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
              className="gap-1.5 h-8 text-xs border-border/40 bg-secondary/30 hover:bg-primary/8 hover:border-primary/20 hover:text-primary transition-all duration-300"
            >
              <RefreshCw
                size={12}
                className={refreshing ? "animate-spin" : ""}
              />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          )}
        </div>
      </div>
      {/* Bottom subtle glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </header>
  );
}
