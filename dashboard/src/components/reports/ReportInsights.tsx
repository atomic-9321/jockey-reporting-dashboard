"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Lightbulb, Palette, Loader2, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cwKeyToDateRange } from "@/lib/metrics";
import type { Region, ReportInsightResult } from "@/lib/types";

interface ReportInsightsProps {
  region: Region;
  period: string;
  periodType: "weekly" | "monthly";
  campaignNames: string[];
}

/** Check if a calendar week is complete (today is past its Sunday). */
function isWeekComplete(cwKey: string): boolean {
  try {
    const { end } = cwKeyToDateRange(cwKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today > end;
  } catch {
    return true; // If we can't parse, don't block
  }
}

export function ReportInsights({
  region,
  period,
  periodType,
}: ReportInsightsProps) {
  const [data, setData] = useState<ReportInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string>("");
  const cache = useRef<Map<string, ReportInsightResult>>(new Map());

  // Detect if the selected period is an incomplete week
  const isIncomplete = useMemo(() => {
    if (periodType === "weekly") return !isWeekComplete(period);
    return false;
  }, [period, periodType]);

  async function generate() {
    const key = `${region}-${period}-${periodType}`;

    // Return cached result — insights are generated once and never change
    if (cache.current.has(key)) {
      setData(cache.current.get(key)!);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          period,
          period_type: periodType,
          mode: "report",
        }),
      });
      if (res.status === 404) {
        // Not generated yet — show "not available" message
        setError("not_generated");
        return;
      }
      if (!res.ok) throw new Error("Failed to load insights");
      const result: ReportInsightResult = await res.json();
      cache.current.set(key, result);
      setData(result);
    } catch {
      setError("Insights temporarily unavailable. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate on mount and when region/period changes
  useEffect(() => {
    const key = `${region}-${period}-${periodType}`;
    if (key !== lastKey.current) {
      lastKey.current = key;
      // If cached, set immediately — no loading flash
      if (cache.current.has(key)) {
        setData(cache.current.get(key)!);
      } else if (isIncomplete) {
        // Don't generate insights for incomplete weeks
        setData(null);
        setLoading(false);
        setError(null);
      } else {
        setData(null);
        generate();
      }
    }
  }, [region, period, periodType, isIncomplete]);

  // Show message for incomplete (current) week
  if (isIncomplete) {
    return (
      <Card className="glass-card border-border/30 animate-fade-slide-up">
        <CardContent className="py-8 flex flex-col items-center gap-3">
          <Clock size={20} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground/60">
            Weekly insights not yet available
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="glass-card border-border/30 animate-fade-slide-up">
        <CardContent className="py-12 flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-primary" />
          <p className="text-sm text-muted-foreground/60">
            Analyzing performance data...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error === "not_generated" && !data) {
    return (
      <Card className="glass-card border-border/30 animate-fade-slide-up">
        <CardContent className="py-8 flex flex-col items-center gap-3">
          <Clock size={20} className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground/60">
            Weekly insights not yet available
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className="glass-card border-border/30 animate-fade-slide-up">
        <CardContent className="py-8 flex flex-col items-center gap-3">
          <p className="text-xs text-amber-400/80 flex items-center gap-1">
            <AlertTriangle size={12} /> {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4 animate-fade-slide-up">
      {/* Overall Insights */}
      {data.overall_insights.length > 0 && (
        <Card className="glass-card border-primary/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-primary" />
              <CardTitle className="text-base">Key Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overall_insights.map((insight, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-3 rounded-lg bg-primary/5 border border-primary/8"
              >
                <span className="text-xs font-bold text-primary/60 font-mono mt-0.5 shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {insight}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Campaign Insights */}
      {Object.keys(data.campaign_insights).length > 0 && (
        <Card className="glass-card border-border/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400/80" />
              <CardTitle className="text-base">Campaign Insights</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(data.campaign_insights).map(
              ([campaignName, insight]) => (
                <div
                  key={campaignName}
                  className="p-3 rounded-lg bg-secondary/10 border border-border/15"
                >
                  <p className="text-xs font-medium text-foreground/60 font-mono truncate mb-1">
                    {campaignName}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {insight}
                  </p>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Creative Recommendations */}
      {data.creative_recommendations.length > 0 && (
        <Card className="glass-card border-emerald-500/10">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Palette size={16} className="text-emerald-400" />
              <CardTitle className="text-base">Creative Recommendations</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground/50 font-mono">
              Based on brand strategy &middot; avatar &times; angle &times; product
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.creative_recommendations.map((rec, i) => (
              <div
                key={i}
                className="flex gap-3 items-start p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
              >
                <span className="text-xs font-bold text-emerald-400/60 font-mono mt-0.5 shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {rec}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
