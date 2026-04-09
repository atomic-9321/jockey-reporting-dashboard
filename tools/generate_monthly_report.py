"""Generate a standalone HTML monthly performance report by aggregating calendar weeks.

Usage:
    python tools/generate_monthly_report.py --month 2026-03
    python tools/generate_monthly_report.py --month 2026-03 --region eu
"""

import argparse
import json
import logging
import os
import re
import sys
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from tools.utils.date_utils import cw_to_date_range, get_calendar_week, cw_label, get_all_cws
from tools.utils.blob_client import download_json
from tools.utils.insights import generate_ai_insights
from tools.generate_weekly_report import (
    REGION_CONFIG,
    _safe_float,
    _safe_int,
    _shorten_campaign_name,
    _detect_funnel_stage,
    load_campaign_data,
    load_ad_data,
    load_ecosystem_data,
    find_ecosystem_row,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TEMPLATE_PATH = PROJECT_ROOT / "tools" / "templates" / "weekly_report_template.html"
OUTPUT_DIR = PROJECT_ROOT / ".tmp" / "reports"

MONTH_NAMES = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]


def parse_month_key(month_key: str) -> Tuple[int, int]:
    """Parse '2026-03' into (2026, 3)."""
    m = re.match(r"(\d{4})-(\d{2})", month_key)
    if not m:
        raise ValueError(f"Invalid month format: {month_key}. Expected YYYY-MM")
    return int(m.group(1)), int(m.group(2))


def get_cws_for_month(year: int, month: int) -> List[Tuple[str, float]]:
    """Get all CW keys that fall within a given month, with proration weights.

    Returns a list of (cw_label, weight) tuples. Boundary weeks that span two
    months are prorated by the fraction of days that fall within this month
    (e.g. a week with 2 of 7 days in-month gets weight 2/7 ≈ 0.286).
    """
    from datetime import timedelta

    month_start = date(year, month, 1)
    if month == 12:
        month_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(year, month + 1, 1) - timedelta(days=1)

    seen: set[Tuple[int, int]] = set()
    cws: List[Tuple[int, int]] = []
    current = month_start
    while current <= month_end:
        ycw = get_calendar_week(current)
        if ycw not in seen:
            seen.add(ycw)
            cws.append(ycw)
        current += timedelta(days=1)

    result: List[Tuple[str, float]] = []
    for y, w in cws:
        week_start, week_end = cw_to_date_range(y, w)
        # Clamp to month boundaries
        overlap_start = max(week_start, month_start)
        overlap_end = min(week_end, month_end)
        in_month_days = (overlap_end - overlap_start).days + 1
        weight = in_month_days / 7.0
        result.append((cw_label(y, w), weight))

    return result


def aggregate_campaign_metrics(
    campaign: Dict, cw_weights: List[Tuple[str, float]]
) -> Optional[Dict]:
    """Aggregate a campaign's metrics across multiple calendar weeks.

    Boundary weeks are prorated by their weight (fraction of days in-month).
    """
    breakdown = campaign.get("weekly_breakdown", {})

    totals = {
        "spend": 0.0,
        "purchases": 0.0,
        "purchase_value": 0.0,
        "impressions": 0.0,
        "reach": 0.0,
        "clicks": 0.0,
        "add_to_cart": 0.0,
        "checkout_initiated": 0.0,
        "payment_info_added": 0.0,
        "content_view": 0.0,
        "landing_page_view": 0.0,
    }

    weeks_with_data = 0
    for cw_key, weight in cw_weights:
        metrics = breakdown.get(cw_key)
        if not metrics:
            continue
        weeks_with_data += 1
        for key in totals:
            val = metrics.get(key)
            if val is not None:
                totals[key] += float(val) * weight

    if weeks_with_data == 0:
        return None

    return totals


def build_monthly_campaign_entry(
    idx: int,
    campaign: Dict,
    cw_weights: List[Tuple[str, float]],
    region_cfg: Dict,
    ad_data: Optional[Dict],
    end_date: date,
) -> Optional[Dict]:
    """Build a single campaign entry aggregated across a month."""
    totals = aggregate_campaign_metrics(campaign, cw_weights)
    if not totals:
        return None

    name = campaign.get("campaign_name", "Unknown")
    spend = totals["spend"]
    purchases = totals["purchases"]
    purchase_value = totals["purchase_value"]
    impressions = int(totals["impressions"])
    reach = int(totals["reach"])
    clicks = int(totals["clicks"])

    roas = round(purchase_value / spend, 2) if spend > 0 and purchase_value else 0.0
    cpp = round(spend / purchases, 2) if purchases > 0 else 0.0
    aov = round(purchase_value / purchases, 2) if purchases > 0 else 0.0
    ctr = round(clicks / impressions * 100, 2) if impressions > 0 else 0.0
    frequency = round(impressions / reach, 2) if reach and reach > 0 else 0.0

    # Count ads
    video_count = 0
    static_count = 0
    top_ad_name = "—"
    top_ad_purchases = -1

    if ad_data and "ads" in ad_data:
        seen_ads = set()
        for ad in ad_data["ads"]:
            if ad.get("campaign_name") == name:
                ad_id = ad.get("ad_id", "")
                if ad_id in seen_ads:
                    continue
                seen_ads.add(ad_id)

                ad_name_lower = ad.get("ad_name", "").lower()
                if any(kw in ad_name_lower for kw in ["video", "ugc", "reel"]):
                    video_count += 1
                else:
                    static_count += 1

                # Aggregate ad metrics across the month (prorated)
                ad_total_spend = 0.0
                ad_total_purchases = 0.0
                for cw_key, weight in cw_weights:
                    ad_metrics = ad.get("weekly_breakdown", {}).get(cw_key, {})
                    ad_total_spend += _safe_float(ad_metrics.get("spend")) * weight
                    ad_total_purchases += _safe_float(ad_metrics.get("purchases")) * weight

                if ad_total_spend >= 20 and ad_total_purchases > top_ad_purchases:
                    top_ad_purchases = ad_total_purchases
                    top_ad_name = ad.get("ad_name", "—")

    return {
        "id": idx,
        "reportDate": end_date.isoformat(),
        "accountName": region_cfg["account_name"],
        "campaignName": name,
        "shortName": _shorten_campaign_name(name),
        "dateRange": "",
        "spend": round(spend, 2),
        "purchases": int(purchases),
        "purchaseValue": round(purchase_value, 2),
        "roas": roas,
        "costPerPurchase": cpp,
        "avgOrderValue": aov,
        "insight": "",
        "funnelStage": _detect_funnel_stage(name),
        "frequency": frequency,
        "adFormatSplit": f"{video_count} video / {static_count} static",
        "topPerformingAd": top_ad_name[:120],
        "nextStep1": "",
        "nextStep2": "",
        "nextStep3": "",
        "nextStep4": "",
    }


def build_monthly_store_data(
    eco_data: Optional[Dict],
    cw_weights: List[Tuple[str, float]],
    region_cfg: Dict,
    end_date: date,
) -> Dict:
    """Aggregate store data across multiple weeks, prorating boundary weeks."""
    if not eco_data:
        return {
            "reportDate": end_date.isoformat(),
            "accountName": region_cfg["account_name"],
            "totalConversions": 0,
            "totalRevenue": 0,
            "totalCPA": None,
            "profit": 0,
            "totalROAS": None,
            "aov": 0,
        }

    total_revenue = 0.0
    total_conversions = 0.0
    total_profit = 0.0

    for cw_key, weight in cw_weights:
        m = re.match(r"(\d{4})-CW(\d+)", cw_key)
        if not m:
            continue
        cw_year = int(m.group(1))
        cw_num = int(m.group(2))
        row = find_ecosystem_row(eco_data, cw_num, year=cw_year)
        if not row:
            continue

        rev = _safe_float(row.get("Total Revenue", row.get("total_revenue", 0)))
        conv = _safe_float(row.get("Total Conversions", row.get("total_conversions", 0)))
        profit = _safe_float(row.get("Profit", row.get("profit", 0)))

        total_revenue += rev * weight
        total_conversions += conv * weight
        total_profit += profit * weight

    total_conversions_int = int(round(total_conversions))
    # Derive AOV from monthly totals so high-volume weeks are weighted correctly
    monthly_aov = round(total_revenue / total_conversions, 2) if total_conversions > 0 else 0

    # ROAS and CPA require campaign spend — set to None here, computed in build_monthly_region_data
    return {
        "reportDate": end_date.isoformat(),
        "accountName": region_cfg["account_name"],
        "totalConversions": total_conversions_int,
        "totalRevenue": round(total_revenue, 2),
        "totalCPA": None,
        "profit": round(total_profit, 2),
        "totalROAS": None,
        "aov": monthly_aov,
    }


def build_monthly_region_data(
    region: str,
    year: int,
    month: int,
    cw_weights: List[Tuple[str, float]],
) -> Optional[Dict]:
    """Build the full data object for one region for a month."""
    cfg = REGION_CONFIG[region]
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    from datetime import timedelta
    end_date = end_date - timedelta(days=1)
    date_range_str = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"

    campaign_data = load_campaign_data(region)
    ad_data = load_ad_data(region)
    eco_data = load_ecosystem_data(region)

    store = build_monthly_store_data(eco_data, cw_weights, cfg, end_date)

    campaigns = []
    total_spend = 0.0
    idx = 1

    if campaign_data and "campaigns" in campaign_data:
        for campaign in campaign_data["campaigns"]:
            entry = build_monthly_campaign_entry(idx, campaign, cw_weights, cfg, ad_data, end_date)
            if entry:
                entry["dateRange"] = date_range_str
                campaigns.append(entry)
                total_spend += entry["spend"]
                idx += 1

    campaigns.sort(key=lambda c: c["spend"], reverse=True)
    for i, c in enumerate(campaigns):
        c["id"] = i + 1

    if not campaigns:
        logger.warning(f"No campaign data found for {region} in {year}-{month:02d}")

    # Compute store ROAS/CPA from actual ad spend
    if total_spend > 0:
        store["totalROAS"] = round(store["totalRevenue"] / total_spend, 2) if store["totalRevenue"] else 0
        store["totalCPA"] = round(total_spend / store["totalConversions"], 2) if store["totalConversions"] else 0
    else:
        # No spend data — flag as unavailable rather than emitting misleading zeros
        logger.warning(
            f"No campaign spend data for {region} in {year}-{month:02d}. "
            f"Store ROAS/CPA cannot be computed."
        )
        store["totalROAS"] = 0
        store["totalCPA"] = 0

    return {
        "currency": cfg["currency"],
        "totalSpendRef": round(total_spend, 2),
        "store": store,
        "campaigns": campaigns,
    }


def generate_default_monthly_insights(region_data: Dict) -> None:
    """Generate basic insights for monthly report when AI is unavailable."""
    for c in region_data["campaigns"]:
        if c["insight"]:
            continue

        roas = c["roas"]
        spend = c["spend"]
        purchases = c["purchases"]

        if spend == 0:
            c["insight"] = "No spend recorded this month. Evaluate reactivation potential."
        elif roas >= 3:
            c["insight"] = f"Excellent monthly ROAS of {roas}x with {purchases} total purchases. Strong candidate for increased investment."
        elif roas >= 2:
            c["insight"] = f"Solid {roas}x monthly ROAS meeting benchmark. {purchases} purchases demonstrate consistent delivery."
        elif roas > 0:
            c["insight"] = f"Below-target {roas}x monthly ROAS. Review creative rotation and audience strategy for next month."
        else:
            c["insight"] = f"No conversions from {round(spend)} monthly spend. Urgent creative and targeting review required."

        if roas >= 2.5:
            c["nextStep1"] = "Plan 20-30% budget increase for next month"
            c["nextStep2"] = "Develop 3-4 new creative concepts based on winning angles"
            c["nextStep3"] = "Expand to new audience segments based on purchaser data"
            c["nextStep4"] = "Test higher AOV product bundles"
        elif roas >= 1.5:
            c["nextStep1"] = "Maintain current investment level"
            c["nextStep2"] = "Refresh creative assets to prevent fatigue"
            c["nextStep3"] = "A/B test landing page variations"
            c["nextStep4"] = "Review audience overlap and consolidate"
        elif spend > 0:
            c["nextStep1"] = "Reduce budget and shift to testing mode"
            c["nextStep2"] = "Develop entirely new creative concepts"
            c["nextStep3"] = "Narrow to highest-intent audiences"
            c["nextStep4"] = "Consider restructuring campaign objectives"
        else:
            c["nextStep1"] = "Assess strategic value before reactivation"
            c["nextStep2"] = "Prepare fresh creative assets"
            c["nextStep3"] = "Define minimum test budget and success criteria"
            c["nextStep4"] = "Align with current brand messaging direction"


def generate_monthly_report(month_key: str, regions: List[str] = None) -> str:
    """Generate a complete HTML monthly report."""
    year, month = parse_month_key(month_key)

    # Validate month is complete
    from datetime import timedelta
    if month == 12:
        month_end = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        month_end = date(year, month + 1, 1) - timedelta(days=1)

    if date.today() <= month_end:
        raise ValueError(
            f"{MONTH_NAMES[month]} {year} is not yet complete. "
            f"Reports can only be generated for completed months."
        )

    if regions is None:
        regions = ["uk", "eu"]

    cw_weights = get_cws_for_month(year, month)
    cw_labels = [label for label, _ in cw_weights]
    logger.info(f"Month {month_key} spans {len(cw_weights)} calendar weeks: {', '.join(cw_labels)}")

    data_obj = {}
    for region in regions:
        logger.info(f"Building monthly data for {region.upper()} — {month_key}")
        region_data = build_monthly_region_data(region, year, month, cw_weights)
        if region_data:
            # Generate AI insights directly, fall back to templates
            insights = generate_ai_insights(region_data, region, month_key, "monthly")
            if insights:
                from tools.generate_weekly_report import inject_ai_insights
                inject_ai_insights(region_data, insights)
                logger.info(f"AI insights generated for {region.upper()}")
            else:
                generate_default_monthly_insights(region_data)
                logger.info(f"Using template insights for {region.upper()}")

            data_obj[region] = region_data

    if not data_obj:
        raise RuntimeError(f"No data available for any region in {month_key}")

    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Report template not found at {TEMPLATE_PATH}")

    template = TEMPLATE_PATH.read_text(encoding="utf-8")

    data_json = json.dumps(data_obj, ensure_ascii=False, indent=None)
    start_date = date(year, month, 1)
    subtitle = (
        f"{MONTH_NAMES[month]} {year} · "
        f"{start_date.strftime('%-d %b')} – {month_end.strftime('%-d %b %Y')} · "
        f"Generated {date.today().strftime('%-d %B %Y')}"
    )

    html = template.replace("__DATA_PLACEHOLDER__", data_json)
    html = html.replace("__SUBTITLE_PLACEHOLDER__", subtitle)

    return html


def save_monthly_report(html: str, year: int, month: int) -> Path:
    """Save the monthly report HTML."""
    month_name = MONTH_NAMES[month]
    filename = f"Monthly_Report_{month_name}_{year}.html"

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_path = OUTPUT_DIR / filename
    output_path.write_text(html, encoding="utf-8")

    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate monthly performance report HTML")
    parser.add_argument("--month", required=True, help="Month key, e.g. 2026-03")
    parser.add_argument("--region", default="all", choices=["all", "eu", "uk"],
                        help="Region(s) to include (default: all)")
    args = parser.parse_args()

    regions = ["uk", "eu"] if args.region == "all" else [args.region]

    try:
        year, month = parse_month_key(args.month)
        logger.info(f"Generating monthly report for {MONTH_NAMES[month]} {year}")

        html = generate_monthly_report(args.month, regions)
        output_path = save_monthly_report(html, year, month)

        logger.info(f"Report saved to: {output_path}")
        print(f"\n Report generated: {output_path}")

    except ValueError as e:
        logger.error(str(e))
        print(f"\n {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Monthly report generation failed: {e}", exc_info=True)
        print(f"\n Monthly report generation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
