"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WeekSelectorProps {
  weeks: string[];
  selected: string | null;
  onSelect: (cw: string) => void;
}

export function WeekSelector({ weeks, selected, onSelect }: WeekSelectorProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {weeks.map((cw) => (
        <Badge
          key={cw}
          variant={selected === cw ? "default" : "outline"}
          className={cn(
            "cursor-pointer shrink-0 px-3 py-1.5 text-xs font-medium transition-all",
            selected === cw
              ? "bg-primary text-primary-foreground glow-cyan"
              : "hover:bg-secondary"
          )}
          onClick={() => onSelect(cw)}
        >
          {cw}
        </Badge>
      ))}
    </div>
  );
}
