"use client";

import { useState } from "react";
import { Sparkles, Lightbulb, Palette, Loader2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Region, ReportInsightResult } from "@/lib/types";

interface ReportInsightsProps {
  region: Region;
  period: string;
  periodType: "weekly" | "monthly";
  campaignNames: string[];
}

export function ReportInsights({
  region,
  period,
  periodType,
  campaignNames,
}: ReportInsightsProps) {
  const [data, setData] = useState<ReportInsightResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
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
      if (!res.ok) throw new Error("Failed to generate insights");
      const result: ReportInsightResult = await res.json();
      setData(result);
    } catch {
      setError("Unable to generate insights. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!data && !loading) {
    return (
      <Card className="glass-card border-border/30 animate-fade-slide-up">
        <CardContent className="py-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Sparkles size={20} className="text-primary/50" />
            <span className="text-sm">AI-powered insights for this report</span>
          </div>
          <Button
            onClick={generate}
            className="gap-2 shadow-[0_0_15px_oklch(0.78_0.17_195_/_15%)]"
          >
            <Sparkles size={14} />
            Generate Insights
          </Button>
          {error && (
            <p className="text-xs text-amber-400/80 flex items-center gap-1">
              <AlertTriangle size={12} /> {error}
            </p>
          )}
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
            Analyzing performance data with all strategy context...
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
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary/70">
                AI
              </Badge>
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
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-emerald-500/20 text-emerald-400/70"
              >
                RAG
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground/50 font-mono">
              Based on Creative Strategy Brain &middot; avatar &times; angle &times; product
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

      {/* Metadata */}
      <p className="text-[10px] text-muted-foreground/30 text-right font-mono">
        Generated {new Date(data.generated_at).toLocaleString()} &middot; {data.prompt_version}
      </p>

      {/* Regenerate */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={generate}
          disabled={loading}
          className="gap-1.5 text-xs border-border/30"
        >
          <Sparkles size={12} />
          Regenerate
        </Button>
      </div>
    </div>
  );
}
