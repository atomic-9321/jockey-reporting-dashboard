/**
 * Versioned prompt templates for the AI Insights agent.
 *
 * The AI never does math — all calculations are pre-computed in metrics.ts
 * and passed as data. The AI only interprets pre-calculated numbers.
 */

import { promises as fs } from "fs";
import path from "path";
import type {
  Region,
  CampaignMetrics,
  FunnelStep,
  TopAd,
  AnomalyFlag,
  Annotation,
  InsightResult,
} from "../types";
import { CURRENCY_SYMBOL, METRIC_SOURCE_MAP } from "../constants";
import type { Currency } from "../types";

export const CURRENT_PROMPT_VERSION = "v1";

// ── Load context files ──

async function loadContextFile(filename: string): Promise<string> {
  try {
    const filepath = path.join(process.cwd(), "src", "lib", "context", filename);
    return await fs.readFile(filepath, "utf-8");
  } catch {
    return "[Context file not available]";
  }
}

// ── Build system prompt ──

export async function buildSystemPrompt(): Promise<string> {
  const brandContext = await loadContextFile("brand-context.md");
  const positiveLanguage = await loadContextFile("positive-language.md");

  return `You are the Jockey Reporting AI Agent. You analyze advertising performance data for Jockey EU and UK markets.

## Your Rules — STRICTLY FOLLOW THESE

1. **NEVER do math.** All numbers in the data are pre-calculated. Only reference the exact numbers provided. Do not add, subtract, multiply, divide, or estimate any values.
2. **NEVER invent data.** If a metric is not in the provided data, say "data not available." Do not guess or approximate.
3. **ALWAYS cite specific numbers.** Every insight must reference a specific metric and its exact value from the data payload.
4. **Use ONLY positive language.** Follow the positive language rules below exactly.
5. **Be concise and actionable.** Each insight should be 1-2 sentences. Each next step should be specific and actionable.

## Brand Context
${brandContext}

## Positive Language Rules
${positiveLanguage}

## Output Format
You MUST respond with valid JSON in this exact structure:
{
  "summary": "2-3 sentence overview of the period's performance",
  "key_findings": ["finding 1 with exact numbers", "finding 2", "finding 3"],
  "opportunities": ["opportunity 1 with context", "opportunity 2"],
  "next_steps": ["specific actionable step 1", "step 2", "step 3"]
}`;
}

// ── Build data prompt ──

export interface InsightDataPayload {
  region: Region;
  currency: Currency;
  period: string;
  period_type: "weekly" | "monthly";
  current_metrics: CampaignMetrics;
  previous_metrics: CampaignMetrics | null;
  wow_changes: Record<string, number | null> | null;
  funnel: FunnelStep[];
  top_ads: Array<{
    rank: number;
    ad_name: string;
    funnel_stage: string;
    format: string;
    purchases: number | null;
    roas: number | null;
    spend: number | null;
  }>;
  anomaly_flags: AnomalyFlag[];
  annotations: Annotation[];
  historical_summaries: string[];
}

export function buildDataPrompt(payload: InsightDataPayload): string {
  const symbol = CURRENCY_SYMBOL[payload.currency];

  let prompt = `## Analysis Request
Region: ${payload.region}
Period: ${payload.period} (${payload.period_type})
Currency: ${payload.currency} (${symbol})

## Current Period Metrics (${payload.period})
${formatMetrics(payload.current_metrics, symbol)}
`;

  if (payload.previous_metrics && payload.wow_changes) {
    prompt += `
## Previous Period Comparison
${formatMetrics(payload.previous_metrics, symbol)}

## Week-over-Week Changes (pre-calculated)
${formatChanges(payload.wow_changes)}
`;
  }

  prompt += `
## Full Funnel (pre-calculated percentages)
${payload.funnel
  .map(
    (step) =>
      `- ${step.label}: ${step.value !== null ? step.value.toLocaleString() : "N/A"} ${
        step.drop_off_percent !== null
          ? `(${step.drop_off_percent}% drop from previous step)`
          : ""
      } ${
        step.conversion_from_top !== null
          ? `[${step.conversion_from_top}% of total]`
          : ""
      }`
  )
  .join("\n")}
`;

  if (payload.top_ads.length > 0) {
    prompt += `
## Top ${payload.top_ads.length} Performing Ads (ranked by purchases, min ${symbol}50 investment)
${payload.top_ads
  .map(
    (ad) =>
      `${ad.rank}. "${ad.ad_name}" — ${ad.funnel_stage} ${ad.format} — Purchases: ${ad.purchases}, Ad ROAS: ${ad.roas}, Investment: ${symbol}${ad.spend}`
  )
  .join("\n")}
`;
  }

  if (payload.anomaly_flags.length > 0) {
    prompt += `
## Anomaly Flags (metrics with significant changes — verify before referencing)
${payload.anomaly_flags
  .map((f) => `- ${f.metric}: ${f.reason} (current: ${f.current}, previous: ${f.previous})`)
  .join("\n")}
NOTE: Flagged metrics may be data artifacts. Mention them as "notable changes to verify" rather than definitive findings.
`;
  }

  if (payload.annotations.length > 0) {
    prompt += `
## Known Context for This Period
${payload.annotations.map((a) => `- [${a.category}] ${a.note}`).join("\n")}
Reference these when they explain metric changes.
`;
  }

  if (payload.historical_summaries.length > 0) {
    prompt += `
## Previous Period Summaries (for context — do not repeat these insights)
${payload.historical_summaries.map((s, i) => `Period ${i + 1}: ${s}`).join("\n")}
Build on these — reference trends across periods when relevant, but provide NEW insights.
`;
  }

  prompt += `
## Reminder
- Only reference numbers that appear in the data above
- All percentages and comparisons are pre-calculated — do not recalculate
- Use positive, constructive language
- Respond with valid JSON only`;

  return prompt;
}

// ── Report-mode prompts (extended insights for weekly/monthly reports) ──

export async function buildReportSystemPrompt(): Promise<string> {
  const [
    brandContext,
    positiveLanguage,
    creativeBrain,
    brandBible,
    productCatalog,
    kpiBenchmarks,
    funnelStrategy,
    testingLog,
    namingConventions,
  ] = await Promise.all([
    loadContextFile("brand-context.md"),
    loadContextFile("positive-language.md"),
    loadContextFile("jockey_creative_brain_rag.md"),
    loadContextFile("01-brand-bible.md"),
    loadContextFile("02-product-catalog.md"),
    loadContextFile("03-kpi-benchmarks.md"),
    loadContextFile("05-funnel-strategy.md"),
    loadContextFile("04-testing-log.md"),
    loadContextFile("naming-conventions.md"),
  ]);

  return `You are the Jockey Reporting AI Agent. You analyze advertising performance data for Jockey EU and UK markets and provide strategic creative recommendations.

## Your Rules — STRICTLY FOLLOW THESE

1. **NEVER do math.** All numbers in the data are pre-calculated. Only reference the exact numbers provided. Do not add, subtract, multiply, divide, or estimate any values.
2. **NEVER invent data.** If a metric is not in the provided data, say "data not available." Do not guess or approximate.
3. **ALWAYS cite specific numbers.** Every insight must reference a specific metric and its exact value from the data payload.
4. **Use ONLY positive language.** Follow the positive language rules below exactly.
5. **Be concise and actionable.** Each insight should be 1-2 sentences. Each recommendation should be specific and actionable.
6. **Reference creative angles from the Creative Brain when making recommendations.** Use the angle names and strategies below.
7. **Reference the Testing Log before suggesting next steps.** Never suggest a test that was already run unless results were inconclusive.
8. **Use Naming Conventions to identify avatars, angles, and funnel stages from ad names.**

## Brand Context
${brandContext}

## Positive Language Rules
${positiveLanguage}

## Creative Strategy Brain (RAG)
${creativeBrain}

## Brand Bible
${brandBible}

## Product Catalog
${productCatalog}

## KPI Benchmarks
${kpiBenchmarks}

## Funnel Strategy
${funnelStrategy}

## Testing Log
${testingLog}

## Naming Conventions
${namingConventions}

## Output Format
You MUST respond with valid JSON in this exact structure:
{
  "overall_insights": ["insight 1 with exact numbers and context", "insight 2", "insight 3"],
  "campaign_insights": {
    "Campaign Name 1": "1 important insight about this specific campaign with exact numbers",
    "Campaign Name 2": "1 important insight about this specific campaign with exact numbers"
  },
  "creative_recommendations": [
    "recommendation 1 referencing specific creative angles from the Creative Brain",
    "recommendation 2 with specific avatar + angle + product suggestions",
    "recommendation 3 with actionable next test to run"
  ]
}`;
}

export interface ReportDataPayload extends InsightDataPayload {
  campaign_breakdowns: Array<{
    campaign_name: string;
    metrics: import("../types").CampaignMetrics;
    wow_changes: Record<string, number | null> | null;
  }>;
}

export function buildReportDataPrompt(payload: ReportDataPayload): string {
  const symbol = CURRENCY_SYMBOL[payload.currency];

  let prompt = buildDataPrompt(payload);

  prompt += `

## Per-Campaign Breakdowns
${payload.campaign_breakdowns
  .map(
    (c) => `### ${c.campaign_name}
${formatMetrics(c.metrics, symbol)}${
      c.wow_changes
        ? `
Changes: ${formatChanges(c.wow_changes)}`
        : ""
    }`
  )
  .join("\n\n")}

## Instructions for This Report
1. Provide exactly 3 overall insights about the account's performance, using ALL the context documents provided (brand strategy, funnel strategy, KPI benchmarks).
2. Provide exactly 1 important insight for EACH campaign listed above, referencing specific metrics.
3. Provide exactly 3 creative recommendations using the Creative Strategy Brain angles. Reference specific angle names (e.g., "Call-Out", "Before/After", "Calm Testimonial") and tie them to specific products, avatars, and funnel stages.
4. Respond with valid JSON only.`;

  return prompt;
}

// ── Helpers ──

function formatMetrics(metrics: CampaignMetrics, symbol: string): string {
  const lines: string[] = [];

  const metricEntries: Array<[string, number | null, string]> = [
    ["Ad Investment", metrics.spend, `${symbol}{val}`],
    ["Impressions", metrics.impressions, "{val}"],
    ["Clicks", metrics.clicks, "{val}"],
    ["CTR", metrics.ctr, "{val}%"],
    ["Ad Purchases", metrics.purchases, "{val}"],
    ["Ad Revenue", metrics.purchase_value, `${symbol}{val}`],
    ["Ad ROAS", metrics.roas, "{val}x"],
    ["CPA", metrics.cpa, `${symbol}{val}`],
    ["Add to Cart", metrics.add_to_cart, "{val}"],
    ["Checkout", metrics.checkout_initiated, "{val}"],
    ["Payment Info", metrics.payment_info_added, "{val}"],
    ["Landing Page Views", metrics.landing_page_view, "{val}"],
  ];

  for (const [label, value, fmt] of metricEntries) {
    if (value !== null) {
      const formatted = fmt.replace(
        "{val}",
        typeof value === "number" ? value.toLocaleString() : String(value)
      );
      lines.push(`- ${label}: ${formatted}`);
    } else {
      lines.push(`- ${label}: N/A`);
    }
  }

  return lines.join("\n");
}

function formatChanges(changes: Record<string, number | null>): string {
  return Object.entries(changes)
    .map(([key, val]) => {
      const label = METRIC_SOURCE_MAP[key]?.label || key;
      if (val === null) return `- ${label}: no comparison available`;
      const sign = val >= 0 ? "+" : "";
      return `- ${label}: ${sign}${val}%`;
    })
    .join("\n");
}
