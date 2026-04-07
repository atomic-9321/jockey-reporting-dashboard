"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface Preset {
  label: string;
  value: string;
  days: number | null; // null = all time
}

const PRESETS: Preset[] = [
  { label: "Last 3 days", value: "last3", days: 3 },
  { label: "Last 7 days", value: "last7", days: 7 },
  { label: "Last 14 days", value: "last14", days: 14 },
  { label: "Last 30 days", value: "last30", days: 30 },
  { label: "All Time", value: "all", days: null },
];

interface DateRangePickerProps {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
  className?: string;
}

function toInputDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function applyPreset(preset: Preset) {
    setActivePreset(preset.value);
    if (preset.days === null) {
      onChange(null);
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - preset.days);
      onChange({ startDate: start, endDate: end });
    }
    setCustomStart("");
    setCustomEnd("");
    setOpen(false);
  }

  function applyCustomRange() {
    if (!customStart || !customEnd) return;
    const start = new Date(customStart + "T00:00:00");
    const end = new Date(customEnd + "T23:59:59");
    if (start > end) return;
    setActivePreset("custom");
    onChange({ startDate: start, endDate: end });
    setOpen(false);
  }

  const displayLabel =
    activePreset === "custom" && value
      ? `${toInputDate(value.startDate)} \u2013 ${toInputDate(value.endDate)}`
      : PRESETS.find((p) => p.value === activePreset)?.label ?? "All Time";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 h-9 px-3.5 rounded-lg text-xs font-medium",
          "cyber-input border border-border/30 hover:border-primary/20 transition-all duration-300",
          "text-foreground/80 hover:text-foreground",
          open && "border-primary/30 shadow-[0_0_12px_oklch(0.78_0.17_195_/_10%)]"
        )}
      >
        <Calendar size={13} className="text-primary/60" />
        <span className="font-mono">{displayLabel}</span>
        <ChevronDown
          size={12}
          className={cn(
            "text-muted-foreground/50 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-50 w-64 rounded-xl glass-card border border-border/30 shadow-xl shadow-black/40 p-2 animate-fade-in">
          {/* Presets */}
          <div className="space-y-0.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => applyPreset(preset)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-200",
                  activePreset === preset.value
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-foreground/70 hover:bg-secondary/30 hover:text-foreground"
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-border/20 my-2" />

          {/* Custom range */}
          <div className="px-3 py-2 space-y-2">
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest font-mono">
              Custom Range
            </p>
            <div className="flex gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="flex-1 h-8 px-2 rounded-md cyber-input text-xs font-mono text-foreground/80 border border-border/20 focus:border-primary/30 focus:outline-none"
              />
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="flex-1 h-8 px-2 rounded-md cyber-input text-xs font-mono text-foreground/80 border border-border/20 focus:border-primary/30 focus:outline-none"
              />
            </div>
            <button
              onClick={applyCustomRange}
              disabled={!customStart || !customEnd}
              className={cn(
                "w-full h-8 rounded-lg text-xs font-medium transition-all duration-300",
                customStart && customEnd
                  ? "bg-primary/15 text-primary hover:bg-primary/25 border border-primary/20"
                  : "bg-secondary/20 text-muted-foreground/30 cursor-not-allowed border border-border/10"
              )}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
