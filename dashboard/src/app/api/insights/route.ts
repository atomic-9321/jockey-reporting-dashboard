import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildSystemPrompt,
  buildDataPrompt,
  buildReportSystemPrompt,
  buildReportDataPrompt,
  CURRENT_PROMPT_VERSION,
} from "@/lib/context/prompt-templates";
import type { InsightDataPayload, ReportDataPayload } from "@/lib/context/prompt-templates";
import { loadCampaigns, loadAds, loadAnnotations, loadInsightHistory } from "@/lib/data-loader";
import {
  aggregateCampaignsByWeek,
  buildFunnel,
  getTopAds,
  computeWoWChange,
  flagAnomalies,
  getAvailableCWs,
  aggregateMetrics,
} from "@/lib/metrics";
import { AI_MAX_TOKENS, AI_TEMPERATURE, CURRENCY_MAP } from "@/lib/constants";
import type { Region, InsightResult, ReportInsightResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { region: regionStr, period, period_type, mode } = body as {
      region: string;
      period: string;
      period_type: "weekly" | "monthly";
      mode?: "default" | "report";
    };

    const region = regionStr.toUpperCase() as Region;
    if (region !== "EU" && region !== "UK") {
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Insights temporarily unavailable — API not configured" },
        { status: 503 }
      );
    }

    // Load data
    const [campaignData, adData, annotations, history] = await Promise.all([
      loadCampaigns(region),
      loadAds(region),
      loadAnnotations(),
      loadInsightHistory(),
    ]);

    if (!campaignData || !adData) {
      return NextResponse.json(
        { error: "No data available for the requested region" },
        { status: 404 }
      );
    }

    const currency = CURRENCY_MAP[region];
    const campaigns = campaignData.campaigns;
    const ads = adData.ads;

    // Get available weeks and compute metrics
    const availableCWs = getAvailableCWs(campaigns);
    const currentMetrics = aggregateCampaignsByWeek(campaigns, period);

    // Previous period for comparison
    const currentIdx = availableCWs.indexOf(period);
    const previousCW = currentIdx > 0 ? availableCWs[currentIdx - 1] : null;
    const previousMetrics = previousCW
      ? aggregateCampaignsByWeek(campaigns, previousCW)
      : null;

    const wowChanges = previousMetrics
      ? computeWoWChange(currentMetrics, previousMetrics)
      : null;

    const funnel = buildFunnel(currentMetrics);
    const topAds = getTopAds(ads, [period]);
    const anomalies = previousMetrics
      ? flagAnomalies(currentMetrics, previousMetrics)
      : [];

    // Filter annotations for this period
    const periodAnnotations = annotations.filter(
      (a) => a.region === region && a.calendar_week === period
    );

    // Get last 4 historical summaries
    const historicalSummaries = history
      .filter((h) => h.region === region)
      .slice(-4)
      .map((h) => h.summary);

    const basePayload: InsightDataPayload = {
      region,
      currency,
      period,
      period_type,
      current_metrics: currentMetrics,
      previous_metrics: previousMetrics,
      wow_changes: wowChanges,
      funnel,
      top_ads: topAds.map((ad) => ({
        rank: ad.rank,
        ad_name: ad.ad_name,
        funnel_stage: ad.parsed_name.funnel_stage,
        format: ad.parsed_name.format,
        purchases: ad.period_metrics.purchases,
        roas: ad.period_metrics.roas,
        spend: ad.period_metrics.spend,
      })),
      anomaly_flags: anomalies,
      annotations: periodAnnotations,
      historical_summaries: historicalSummaries,
    };

    // Build prompts based on mode
    let systemPrompt: string;
    let dataPrompt: string;

    if (mode === "report") {
      // Build per-campaign breakdowns
      const campaignBreakdowns = campaigns
        .map((c) => {
          const metrics = c.weekly_breakdown[period];
          if (!metrics || metrics.spend === null || metrics.spend <= 0) return null;
          const prevMetrics = previousCW ? c.weekly_breakdown[previousCW] : null;
          const changes = prevMetrics ? computeWoWChange(metrics, prevMetrics) : null;
          return {
            campaign_name: c.campaign_name,
            metrics,
            wow_changes: changes,
          };
        })
        .filter(Boolean) as ReportDataPayload["campaign_breakdowns"];

      systemPrompt = await buildReportSystemPrompt();
      const reportPayload: ReportDataPayload = {
        ...basePayload,
        campaign_breakdowns: campaignBreakdowns,
      };
      dataPrompt = buildReportDataPrompt(reportPayload);
    } else {
      systemPrompt = await buildSystemPrompt();
      dataPrompt = buildDataPrompt(basePayload);
    }

    // Call Claude API
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: mode === "report" ? 4000 : AI_MAX_TOKENS,
      temperature: AI_TEMPERATURE,
      system: systemPrompt,
      messages: [{ role: "user", content: dataPrompt }],
    });

    // Parse response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (mode === "report") {
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

        const result: ReportInsightResult = {
          overall_insights: parsed?.overall_insights || [],
          campaign_insights: parsed?.campaign_insights || {},
          creative_recommendations: parsed?.creative_recommendations || [],
          generated_at: new Date().toISOString(),
          prompt_version: CURRENT_PROMPT_VERSION,
          region,
          period,
        };
        return NextResponse.json(result);
      } catch {
        const result: ReportInsightResult = {
          overall_insights: [responseText.slice(0, 500)],
          campaign_insights: {},
          creative_recommendations: [],
          generated_at: new Date().toISOString(),
          prompt_version: CURRENT_PROMPT_VERSION,
          region,
          period,
        };
        return NextResponse.json(result);
      }
    }

    // Default mode — original behavior
    let parsedInsight: InsightResult;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      parsedInsight = {
        summary: parsed?.summary || "Analysis complete.",
        key_findings: parsed?.key_findings || [],
        opportunities: parsed?.opportunities || [],
        next_steps: parsed?.next_steps || [],
        generated_at: new Date().toISOString(),
        prompt_version: CURRENT_PROMPT_VERSION,
        region,
        period,
      };
    } catch {
      parsedInsight = {
        summary: responseText.slice(0, 500),
        key_findings: [],
        opportunities: [],
        next_steps: [],
        generated_at: new Date().toISOString(),
        prompt_version: CURRENT_PROMPT_VERSION,
        region,
        period,
      };
    }

    return NextResponse.json(parsedInsight);
  } catch (error) {
    console.error("Insights generation failed:", error);
    return NextResponse.json(
      { error: "Insights temporarily unavailable — please try again shortly." },
      { status: 500 }
    );
  }
}
