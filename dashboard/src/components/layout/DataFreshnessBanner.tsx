"use client";

import { AlertTriangle } from "lucide-react";

export function DataFreshnessBanner() {
  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs">
      <AlertTriangle size={14} />
      <span>
        Data temporarily delayed — showing most recent available data
      </span>
    </div>
  );
}
