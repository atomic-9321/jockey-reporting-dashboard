"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Zap, Target, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRegion } from "@/hooks/useRegion";
import { CURRENCY_SYMBOL } from "@/lib/constants";
import type { InsightResult } from "@/lib/types";

export default function InsightsPage() {
  const { region, currency } = useRegion();
  const [generating, setGenerating] = useState(false);
  const [insight, setInsight] = useState<InsightResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          period: "2026-CW14",
          period_type: "weekly",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      setInsight(data);
    } catch {
      setError("Insights temporarily unavailable — please try again shortly.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground/70 font-mono">
            Jockey {region} &middot; AI-powered analysis ({CURRENCY_SYMBOL[currency]})
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2 shadow-[0_0_16px_oklch(0.78_0.17_195_/_15%)] hover:shadow-[0_0_24px_oklch(0.78_0.17_195_/_25%)] transition-all duration-300"
        >
          {generating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {generating ? "Generating..." : "Generate Insights"}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <p className="text-sm text-amber-400/90">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No insight yet */}
      {!insight && !generating && !error && (
        <Card className="glass-card border-border/30 holo-border">
          <CardContent className="p-16 flex flex-col items-center justify-center text-center">
            <div className="relative mb-6">
              <Sparkles size={48} className="text-primary/30 animate-float" />
              <div className="absolute inset-0 blur-xl bg-primary/10 rounded-full" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Ready to Generate Insights
            </h2>
            <p className="text-sm text-muted-foreground/60 max-w-md">
              Click &quot;Generate Insights&quot; to analyze current period data.
              The AI agent will provide a summary, key findings, opportunities,
              and actionable next steps — all backed by real data.
            </p>
            <div className="flex gap-2 mt-5">
              <Badge variant="outline" className="text-xs border-border/30 text-muted-foreground/60">
                Zero hallucinations
              </Badge>
              <Badge variant="outline" className="text-xs border-border/30 text-muted-foreground/60">
                Positive language
              </Badge>
              <Badge variant="outline" className="text-xs border-border/30 text-muted-foreground/60">
                Data-backed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {generating && (
        <Card className="glass-card border-primary/10">
          <CardContent className="p-16 flex flex-col items-center justify-center">
            <div className="relative">
              <Loader2 size={36} className="animate-spin text-primary mb-4" />
              <div className="absolute inset-0 blur-2xl bg-primary/10 rounded-full" />
            </div>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Analyzing data and generating insights...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insight Result */}
      {insight && !generating && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="glass-card border-primary/15 glow-cyan animate-fade-slide-up">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="neon-text">Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-foreground/90">{insight.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            <Card className="glass-card border-border/30 animate-fade-slide-up delay-150">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target size={14} className="text-primary/70" />
                  Key Findings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {insight.key_findings.map((finding, i) => (
                    <li key={i} className="text-sm flex gap-2.5">
                      <span className="text-primary/80 shrink-0 font-mono text-xs mt-0.5">
                        0{i + 1}
                      </span>
                      <span className="text-foreground/80">{finding}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="glass-card border-border/30 animate-fade-slide-up delay-225">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp size={14} className="text-emerald-400/70" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {insight.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm flex gap-2.5">
                      <span className="text-emerald-400/80 shrink-0 font-mono text-xs mt-0.5">
                        0{i + 1}
                      </span>
                      <span className="text-foreground/80">{opp}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="glass-card border-emerald-500/10 animate-fade-slide-up delay-300">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap size={14} className="text-emerald-400" />
                <span className="text-emerald-400 neon-text-emerald">
                  Recommended Next Steps
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2.5">
                {insight.next_steps.map((step, i) => (
                  <li key={i} className="text-sm flex gap-2.5">
                    <span className="text-emerald-400/80 shrink-0 font-mono text-xs mt-0.5">
                      0{i + 1}
                    </span>
                    <span className="text-foreground/80">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground/40 font-mono">
            <span>
              {new Date(insight.generated_at).toLocaleString()} &middot; {insight.prompt_version}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="gap-1 text-xs text-muted-foreground/50 hover:text-primary"
            >
              <RefreshCw size={12} />
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
