import { NextRequest, NextResponse } from "next/server";
import type { Region, AdAgeGenderBreakdown } from "@/lib/types";

const META_API_BASE = "https://graph.facebook.com/v21.0";

const ACCOUNT_IDS: Record<Region, string> = {
  EU: process.env.META_EU_ACCOUNT_ID ?? "",
  UK: process.env.META_UK_ACCOUNT_ID ?? "",
};

function extractActionValue(
  actions: Array<{ action_type: string; value: string }> | undefined,
  actionType: string,
): number {
  if (!actions) return 0;
  const found = actions.find((a) => a.action_type === actionType);
  return found ? parseFloat(found.value) || 0 : 0;
}

// Cache: region -> { data, expires }
const cache = new Map<string, { data: Record<string, AdAgeGenderBreakdown[]>; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 min

/**
 * Batch endpoint: fetches age/gender breakdowns for ALL ads in the account
 * in a single Meta API call. Returns { [ad_id]: AdAgeGenderBreakdown[] }.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const regionStr = searchParams.get("region")?.toUpperCase() as Region | undefined;

    if (!regionStr || (regionStr !== "EU" && regionStr !== "UK")) {
      return NextResponse.json({ error: "Missing or invalid region" }, { status: 400 });
    }

    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "META_ACCESS_TOKEN not configured" }, { status: 500 });
    }

    const accountId = ACCOUNT_IDS[regionStr];
    if (!accountId) {
      return NextResponse.json({ error: `No account ID for region ${regionStr}` }, { status: 500 });
    }

    // Check cache
    const cached = cache.get(regionStr);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Date range from params or default last 30 days
    const endDate = searchParams.get("end_date") ?? new Date().toISOString().slice(0, 10);
    const startDate =
      searchParams.get("start_date") ??
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

    const timeRange = JSON.stringify({ since: startDate, until: endDate });
    const fields = "ad_id,spend,impressions,clicks,actions,action_values,purchase_roas";

    // Single call: all ads, broken down by age + gender, level=ad
    // Meta paginates at 25 by default; request up to 500
    let url =
      `${META_API_BASE}/${accountId}/insights?` +
      `breakdowns=age,gender&fields=${fields}` +
      `&time_range=${encodeURIComponent(timeRange)}` +
      `&level=ad&limit=500` +
      `&action_attribution_windows=${encodeURIComponent('["28d_click","1d_view"]')}` +
      `&access_token=${token}`;

    const byAd: Record<string, AdAgeGenderBreakdown[]> = {};

    // Paginate through all results
    let pages = 0;
    const MAX_PAGES = 10;
    while (url && pages < MAX_PAGES) {
      const resp = await fetch(url, { headers: { "Content-Type": "application/json" } });
      if (!resp.ok) break;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await resp.json();
      if (!json.data) break;

      for (const row of json.data) {
        const adId = row.ad_id;
        if (!adId) continue;

        const spend = parseFloat(row.spend || "0");
        const purchaseValue = extractActionValue(row.action_values, "purchase");

        let roas: number | null = null;
        const purchaseRoas = row.purchase_roas;
        if (Array.isArray(purchaseRoas) && purchaseRoas.length > 0) {
          roas = Math.round(parseFloat(purchaseRoas[0].value || "0") * 100) / 100;
        } else if (spend > 0 && purchaseValue > 0) {
          roas = Math.round((purchaseValue / spend) * 100) / 100;
        }

        if (!byAd[adId]) byAd[adId] = [];
        byAd[adId].push({
          age: row.age ?? "unknown",
          gender: row.gender ?? "unknown",
          spend: Math.round(spend * 100) / 100,
          impressions: parseInt(row.impressions || "0", 10),
          purchases: extractActionValue(row.actions, "purchase"),
          roas,
        });
      }

      url = json.paging?.next ?? null;
      pages++;
    }

    console.log(`[ad-demographics] region=${regionStr} ads=${Object.keys(byAd).length} pages=${pages}`);

    if (Object.keys(byAd).length > 0) {
      cache.set(regionStr, { data: byAd, expires: Date.now() + CACHE_TTL });
    }

    return NextResponse.json(byAd);
  } catch (error) {
    console.error("Ad demographics batch error:", error);
    return NextResponse.json({ error: "Failed to fetch demographics" }, { status: 500 });
  }
}
