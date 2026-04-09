import { NextRequest, NextResponse } from "next/server";
import type { Region, AdInsightsBreakdown } from "@/lib/types";

const META_API_BASE = "https://graph.facebook.com/v21.0";

const ACCOUNT_IDS: Record<Region, string> = {
  EU: process.env.META_EU_ACCOUNT_ID ?? "",
  UK: process.env.META_UK_ACCOUNT_ID ?? "",
};

const PLACEMENT_LABELS: Record<string, string> = {
  "instagram|feed": "IG Feed",
  "instagram|story": "IG Stories",
  "instagram|reels_overlay": "IG Reels",
  "instagram|explore": "IG Explore",
  "instagram|profile_feed": "IG Profile",
  "facebook|feed": "FB Feed",
  "facebook|story": "FB Stories",
  "facebook|marketplace": "FB Marketplace",
  "facebook|video_feeds": "FB Video",
  "facebook|right_hand_column": "FB Right Column",
  "audience_network|classic": "Audience Network",
  "messenger|messenger_inbox": "Messenger",
};

function extractActionValue(
  actions: Array<{ action_type: string; value: string }> | undefined,
  actionType: string,
): number {
  if (!actions) return 0;
  const found = actions.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) || 0 : 0;
}

// Simple in-memory cache (5 min TTL)
const cache = new Map<string, { data: AdInsightsBreakdown; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function metaFetch(url: string, token: string, retries = 2): Promise<any> {
  const sep = url.includes("?") ? "&" : "?";
  const resp = await fetch(`${url}${sep}access_token=${token}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const err = await resp.text();
    // Retry on rate limit (code 17) with exponential backoff
    if (resp.status === 400 && retries > 0) {
      try {
        const parsed = JSON.parse(err);
        if (parsed?.error?.code === 17) {
          const delay = (3 - retries) * 3000; // 3s, 6s
          await new Promise((r) => setTimeout(r, delay));
          return metaFetch(url, token, retries - 1);
        }
      } catch { /* not JSON, fall through */ }
    }
    throw new Error(`Meta API ${resp.status}: ${err}`);
  }
  return resp.json();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get("ad_id");
    const regionStr = searchParams.get("region")?.toUpperCase() as Region | undefined;

    if (!adId || !regionStr || (regionStr !== "EU" && regionStr !== "UK")) {
      return NextResponse.json(
        { error: "Missing or invalid ad_id / region" },
        { status: 400 },
      );
    }

    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json(
        { error: "META_ACCESS_TOKEN not configured" },
        { status: 500 },
      );
    }

    const accountId = ACCOUNT_IDS[regionStr];
    if (!accountId) {
      return NextResponse.json(
        { error: `No account ID for region ${regionStr}` },
        { status: 500 },
      );
    }

    // Check cache
    const cacheKey = `${adId}:${regionStr}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Default date range: last 30 days
    const endDate = searchParams.get("end_date") ?? new Date().toISOString().slice(0, 10);
    const startDate =
      searchParams.get("start_date") ??
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    const filtering = JSON.stringify([
      { field: "ad.id", operator: "EQUAL", value: adId },
    ]);
    const baseFields = "spend,impressions,clicks,actions,action_values,purchase_roas";

    // Parallel requests: age/gender, placement, video retention
    const [ageGenderResult, placementResult, retentionResult] =
      await Promise.allSettled([
        // Age + Gender breakdown
        metaFetch(
          `${META_API_BASE}/${accountId}/insights?filtering=${encodeURIComponent(filtering)}&breakdowns=age,gender&fields=${baseFields}&time_range=${encodeURIComponent(timeRange)}&level=ad&action_attribution_windows=["28d_click","1d_view"]`,
          token,
        ),
        // Placement breakdown
        metaFetch(
          `${META_API_BASE}/${accountId}/insights?filtering=${encodeURIComponent(filtering)}&breakdowns=publisher_platform,platform_position&fields=${baseFields}&time_range=${encodeURIComponent(timeRange)}&level=ad&action_attribution_windows=["28d_click","1d_view"]`,
          token,
        ),
        // Video retention curve
        metaFetch(
          `${META_API_BASE}/${adId}/insights?fields=video_play_curve_actions&time_range=${encodeURIComponent(timeRange)}&action_attribution_windows=["28d_click","1d_view"]`,
          token,
        ),
      ]);

    // Parse age/gender
    const ageGender: AdInsightsBreakdown["age_gender"] = [];
    if (ageGenderResult.status === "fulfilled" && ageGenderResult.value.data) {
      for (const row of ageGenderResult.value.data) {
        const spend = parseFloat(row.spend || "0");
        const purchaseValue = extractActionValue(row.action_values, "purchase");

        // Prefer Meta's purchase_roas if available, fall back to manual calculation
        let roas: number | null = null;
        const purchaseRoas = row.purchase_roas;
        if (Array.isArray(purchaseRoas) && purchaseRoas.length > 0) {
          roas = Math.round(parseFloat(purchaseRoas[0].value || "0") * 100) / 100;
        } else if (spend > 0 && purchaseValue > 0) {
          roas = Math.round((purchaseValue / spend) * 100) / 100;
        }

        ageGender.push({
          age: row.age ?? "unknown",
          gender: row.gender ?? "unknown",
          spend: Math.round(spend * 100) / 100,
          impressions: parseInt(row.impressions || "0", 10),
          purchases: extractActionValue(row.actions, "purchase"),
          roas,
        });
      }
    }

    // Parse placements
    const placements: AdInsightsBreakdown["placements"] = [];
    if (placementResult.status === "fulfilled" && placementResult.value.data) {
      for (const row of placementResult.value.data) {
        const spend = parseFloat(row.spend || "0");
        const purchaseValue = extractActionValue(row.action_values, "purchase");
        const platform = row.publisher_platform ?? "unknown";
        const position = row.platform_position ?? "unknown";
        const label =
          PLACEMENT_LABELS[`${platform}|${position}`] ??
          `${platform} ${position}`.replace(/_/g, " ");

        let placementRoas: number | null = null;
        const purchaseRoas = row.purchase_roas;
        if (Array.isArray(purchaseRoas) && purchaseRoas.length > 0) {
          placementRoas = Math.round(parseFloat(purchaseRoas[0].value || "0") * 100) / 100;
        } else if (spend > 0 && purchaseValue > 0) {
          placementRoas = Math.round((purchaseValue / spend) * 100) / 100;
        }

        placements.push({
          platform,
          position,
          label,
          spend: Math.round(spend * 100) / 100,
          impressions: parseInt(row.impressions || "0", 10),
          roas: placementRoas,
        });
      }
    }

    // Parse video retention
    let videoRetention: AdInsightsBreakdown["video_retention"] = null;
    if (retentionResult.status === "fulfilled" && retentionResult.value.data) {
      for (const row of retentionResult.value.data) {
        const curveActions = row.video_play_curve_actions;
        if (curveActions && Array.isArray(curveActions)) {
          for (const entry of curveActions) {
            const values = entry.value;
            if (values && Array.isArray(values)) {
              videoRetention = {
                duration_seconds: null,
                curve: values.map((v: number | string, i: number) => ({
                  pct_index: i,
                  retention: typeof v === "number" ? v : parseFloat(v) || 0,
                })),
              };
              break;
            }
          }
        }
      }
    }

    const result: AdInsightsBreakdown = {
      ad_id: adId,
      age_gender: ageGender,
      placements,
      video_retention: videoRetention,
    };

    console.log(`[ad-insights] ad=${adId} age_gender=${ageGender.length} placements=${placements.length}`);

    // Only cache if we got meaningful data — empty results may be due to rate limiting
    const hasData = ageGender.length > 0 || placements.length > 0 || videoRetention !== null;
    if (hasData) {
      cache.set(cacheKey, { data: result, expires: Date.now() + CACHE_TTL });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ad insights API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ad insights" },
      { status: 500 },
    );
  }
}
