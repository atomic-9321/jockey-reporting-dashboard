// Core types for the Jockey Reporting Dashboard
// null = metric unavailable/failed to load, 0 = genuine zero

export type Region = "EU" | "UK";

export type Currency = "EUR" | "GBP";

export type FunnelStage = "TOF" | "MOF" | "BOF" | "UNKNOWN";

export type AdFormat = "static" | "video" | "carousel" | "unknown";

// ── Metrics ──

export interface CampaignMetrics {
  spend: number | null;
  impressions: number | null;
  clicks: number | null;
  ctr: number | null;
  purchases: number | null;
  purchase_value: number | null;
  roas: number | null;
  cpa: number | null;
  add_to_cart: number | null;
  checkout_initiated: number | null;
  payment_info_added: number | null;
  content_view: number | null;
  landing_page_view: number | null;
  reach: number | null;
}

export interface AdMetrics extends CampaignMetrics {
  hook_rate: number | null;
  hold_rate: number | null;
  conversion_rate: number | null;
  video_plays: number | null;
  video_completions: number | null;
}

// ── Campaign ──

export interface Campaign {
  campaign_id: string;
  campaign_name: string;
  weekly_breakdown: Record<string, CampaignMetrics>; // keyed by "2026-CW14"
}

export interface CampaignData {
  region: Region;
  currency: Currency;
  date_range: { start: string; end: string };
  fetched_at: string;
  campaign_count: number;
  campaigns: Campaign[];
}

// ── Ad ──

export type AwarenessLevel = "Solution Aware" | "Product/Brand Aware" | "Most Aware" | "Unknown";

export type CreativeType = "New Concept" | "Iteration" | "Unknown";

export type Placement = "MP" | "Feed" | "Stories" | "Reels" | "Unknown";

export interface ParsedAdName {
  month_week: string;       // e.g. "March #05"
  joc_id: string;           // e.g. "Joc 165"
  market: string;           // "UK" or "EU"
  hook_angle: string;       // e.g. "Visual proof of smoothing"
  brand: string;            // "Jockey"
  avatar: string;           // e.g. "The Active Comparer"
  product_name: string;     // e.g. "Back Smoothing Bra"
  creative_type: CreativeType;
  format: AdFormat;
  funnel_stage: FunnelStage;
  awareness_level: AwarenessLevel;
  placement: Placement;
  promo_code: string | null;
  raw_name: string;
  parse_success: boolean;
}

export interface Ad {
  ad_id: string;
  ad_name: string;
  campaign_name: string;
  adset_name: string;
  creative_thumbnail_url: string | null;
  parsed_name: ParsedAdName;
  weekly_breakdown: Record<string, AdMetrics>;
}

export interface AdData {
  region: Region;
  currency: Currency;
  date_range: { start: string; end: string };
  fetched_at: string;
  ad_count: number;
  ads: Ad[];
}

// ── Funnel ──

export interface FunnelStep {
  key: string;
  label: string;
  value: number | null;
  previous_value: number | null;
  drop_off_percent: number | null; // % drop from previous step
  conversion_from_top: number | null; // % of impressions
}

// ── Ecosystem (Google Sheets) ──

export interface EcosystemWeek {
  calendar_week: string | null;
  metrics: Record<string, number | string | null>;
  raw: Record<string, unknown>;
}

export interface EcosystemData {
  region: Region;
  currency: Currency;
  spreadsheet_id: string;
  fetched_at: string;
  sheets: Record<string, EcosystemWeek[]>;
}

// ── Annotations ──

export type AnnotationCategory =
  | "offer_change"
  | "tracking_issue"
  | "landing_page"
  | "stock_issue"
  | "campaign_context"
  | "other";

export interface Annotation {
  id: string;
  region: Region;
  calendar_week: string;
  note: string;
  category: AnnotationCategory;
  created_at: string;
  created_by: string;
}

// ── AI Insights ──

export interface InsightResult {
  summary: string;
  key_findings: string[];
  opportunities: string[];
  next_steps: string[];
  generated_at: string;
  prompt_version: string;
  region: Region;
  period: string;
}

// ── Report Insights (extended) ──

export interface ReportInsightResult {
  overall_insights: string[];
  campaign_insights: Record<string, string>;
  creative_recommendations: string[];
  generated_at: string;
  prompt_version: string;
  region: Region;
  period: string;
}

// ── Refresh Status ──

export interface SourceStatus {
  last_attempt: string;
  success: boolean;
  error: string | null;
  last_success?: string;
}

export interface RefreshStatus {
  last_refresh: string;
  elapsed_seconds: number;
  all_success: boolean;
  sources: Record<string, SourceStatus>;
}

// ── Anomaly ──

export interface AnomalyFlag {
  metric: string;
  current: number;
  previous: number;
  change_pct: number | null;
  reason: string;
}

// ── Top Ads ──

export interface TopAd extends Ad {
  rank: number;
  ranking_metric: string;
  ranking_value: number;
  period_metrics: AdMetrics;
}

// ── Ad Insights Breakdowns ──

export interface AdAgeGenderBreakdown {
  age: string;
  gender: "male" | "female" | "unknown";
  spend: number;
  impressions: number;
  purchases: number;
  roas: number | null;
}

export interface AdPlacementBreakdown {
  platform: string;
  position: string;
  label: string;
  spend: number;
  impressions: number;
  roas: number | null;
}

export interface AdVideoRetention {
  duration_seconds: number | null;
  curve: Array<{ pct_index: number; retention: number }>;
}

export interface AdInsightsBreakdown {
  ad_id: string;
  age_gender: AdAgeGenderBreakdown[];
  placements: AdPlacementBreakdown[];
  video_retention: AdVideoRetention | null;
}

// ── Dashboard Page Props ──

export interface DashboardContext {
  region: Region;
  currency: Currency;
}
