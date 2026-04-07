"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Insights</h1>
          <p className="text-sm text-muted-foreground">
            Jockey {region} — AI-powered analysis ({CURRENCY_SYMBOL[currency]})
          </p>
        </div>
        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="gap-2"
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
        <Card className="border-amber-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-amber-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* No insight yet */}
      {!insight && !generating && !error && (
        <Card className="glass-card border-border/50">
          <CardContent className="p-12 flex flex-col items-center justify-center text-center">
            <Sparkles size={40} className="text-primary/40 mb-4" />
            <h2 className="text-lg font-semibold mb-2">
              Ready to Generate Insights
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Click &quot;Generate Insights&quot; to analyze current period data.
              The AI agent will provide a summary, key findings, opportunities,
              and actionable next steps — all backed by real data.
            </p>
            <div className="flex gap-2 mt-4">
              <Badge variant="outline" className="text-xs">
                Zero hallucinations
              </Badge>
              <Badge variant="outline" className="text-xs">
                Positive language
              </Badge>
              <Badge variant="outline" className="text-xs">
                Data-backed
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {generating && (
        <Card className="glass-card border-border/50">
          <CardContent className="p-12 flex flex-col items-center justify-center">
            <Loader2 size={32} className="animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">
              Analyzing data and generating insights...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insight Result */}
      {insight && !generating && (
        <div className="space-y-4">
          {/* Summary */}
          <Card className="glass-card border-primary/20 glow-cyan">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insight.summary}</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Key Findings */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Key Findings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.key_findings.map((finding, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-primary shrink-0">
                        {i + 1}.
                      </span>
                      {finding}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle className="text-sm">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {insight.opportunities.map((opp, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-emerald-400 shrink-0">
                        {i + 1}.
                      </span>
                      {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <Card className="glass-card border-emerald-500/20">
            <CardHeader>
              <CardTitle className="text-sm text-emerald-400">
                Recommended Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {insight.next_steps.map((step, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="text-emerald-400 shrink-0">
                      {i + 1}.
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Generated: {new Date(insight.generated_at).toLocaleString()} | Prompt: {insight.prompt_version}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerate}
              className="gap-1 text-xs"
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
