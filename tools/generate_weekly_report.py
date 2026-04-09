"""Generate a standalone HTML weekly performance report for a given calendar week.

Usage:
    python tools/generate_weekly_report.py --cw 2026-CW14
    python tools/generate_weekly_report.py --cw 2026-CW15 --region eu
"""

import argparse
import json
import logging
import os
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Ensure project root on path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from tools.utils.date_utils import cw_to_date_range, get_calendar_week, cw_label
from tools.utils.blob_client import download_json
from tools.utils.insights import generate_ai_insights

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

TEMPLATE_PATH = PROJECT_ROOT / "tools" / "templates" / "weekly_report_template.html"
WEEKS_DIR = PROJECT_ROOT / "weeks"

# ── Mapping helpers ───────────────────────────────────────────────────────────

REGION_CONFIG = {
    "uk": {"currency": "£", "account_name": "Jockey UK", "file_prefix": "uk"},
    "eu": {"currency": "€", "account_name": "Jockey EU", "file_prefix": "eu"},
}

# Tokens to remove from campaign name segments
_STRIP_TOKENS = {
    "hero", "dpa", "cbo", "abo", "km", "pgs", "autooptimizer",
    "opur", "testing", "uk", "eu", "de", "rm", "all",
}


def _shorten_campaign_name(name: str) -> str:
    """Derive a short display name from a full campaign name."""
    # Split on | or / delimiters
    parts = re.split(r"\s*[\|/]\s*", name)
    kept = []
    for part in parts:
        cleaned = part.strip()
        if not cleaned:
            continue
        # Remove leading # from tokens like #PGS
        token = re.sub(r"^#", "", cleaned).strip()
        # Skip if it's a known noise token
        if token.lower() in _STRIP_TOKENS:
            continue
        # Skip pure numbers (year/month codes like 2024, 202603, 322)
        if re.match(r"^\d+$", token):
            continue
        # Skip emoji-only or very short non-descriptive tokens
        if len(token) <= 2 and not token.isalpha():
            continue
        kept.append(cleaned)
    result = " ".join(kept).strip()
    # Remove leading "KM -" or "KM l" patterns and trailing region/dash
    result = re.sub(r"^KM\s*[-l]\s*", "", result, flags=re.IGNORECASE).strip()
    result = re.sub(r"\s*-\s*(UK|EU|DE)\s*$", "", result, flags=re.IGNORECASE).strip()
    # Remove leading emoji
    result = re.sub(r"^[\U0001f300-\U0001f9ff\u2600-\u26ff]+\s*", "", result).strip()
    if not result:
        # All segments were noise — construct a meaningful fallback
        lower = name.lower()
        if "dpa" in lower and "rm" in lower:
            region_tag = "EU" if "eu" in lower else "UK" if "uk" in lower else ""
            result = f"DPA Remarketing {region_tag}".strip()
        elif "dpa" in lower:
            region_tag = "EU" if "eu" in lower else "UK" if "uk" in lower else ""
            year_match = re.search(r"\b(20\d{2})", name)
            year_tag = f"({year_match.group(1)})" if year_match else ""
            result = f"DPA Catalogue {region_tag} {year_tag}".strip()
        elif "sales" in lower:
            region_tag = "EU" if "eu" in lower else "UK" if "uk" in lower else ""
            result = f"Sales Campaign {region_tag}".strip()
        else:
            result = name  # Give up, use original
    return result


def _detect_funnel_stage(name: str) -> str:
    """Detect funnel stage from campaign name patterns."""
    upper = name.upper()
    if "DPA" in upper or "SALES" in upper or "RM" in upper:
        return "BOF"
    if "MOF" in upper or "RETARGET" in upper:
        return "MOF"
    # Default HERO campaigns to TOF
    return "TOF"


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert a value to float, treating None as default."""
    if val is None:
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


def _safe_int(val: Any, default: int = 0) -> int:
    if val is None:
        return default
    try:
        return int(float(val))
    except (ValueError, TypeError):
        return default


# ── CW parsing & validation ──────────────────────────────────────────────────

def parse_cw_key(cw_key: str) -> Tuple[int, int]:
    """Parse '2026-CW14' into (2026, 14)."""
    m = re.match(r"(\d{4})-CW(\d{1,2})", cw_key)
    if not m:
        raise ValueError(f"Invalid CW key format: {cw_key}. Expected YYYY-CW##")
    return int(m.group(1)), int(m.group(2))


def is_cw_complete(year: int, cw: int) -> bool:
    """Check if a calendar week has ended (today is past the CW's Sunday)."""
    start, end = cw_to_date_range(year, cw)
    return date.today() > end


def prev_cw_key(year: int, cw: int) -> str:
    """Get the previous calendar week key."""
    if cw > 1:
        return cw_label(year, cw - 1)
    # First week: go to last week of previous year
    dec31 = date(year - 1, 12, 31)
    prev_year, prev_cw = get_calendar_week(dec31)
    return cw_label(prev_year, prev_cw)


# ── Data loading ──────────────────────────────────────────────────────────────

def load_campaign_data(region: str) -> Optional[Dict]:
    """Load campaign JSON data for a region."""
    filename = f"meta_{region}_campaigns.json"
    data = download_json(filename)
    if not data:
        logger.warning(f"No campaign data found for {region} ({filename})")
    return data


def load_ad_data(region: str) -> Optional[Dict]:
    """Load ad JSON data for a region."""
    filename = f"meta_{region}_ads.json"
    data = download_json(filename)
    if not data:
        logger.warning(f"No ad data found for {region} ({filename})")
    return data


def load_ecosystem_data(region: str) -> Optional[Dict]:
    """Load ecosystem (store) data from Google Sheets."""
    filename = f"sheets_{region}_ecosystem.json"
    data = download_json(filename)
    if not data:
        logger.warning(f"No ecosystem data found for {region} ({filename})")
    return data


def find_ecosystem_row(eco_data: Dict, cw_num: int, year: Optional[int] = None) -> Optional[Dict]:
    """Aggregate daily ecosystem rows that fall within a calendar week.

    Args:
        eco_data: Ecosystem data dict with "sheets" key containing daily rows.
        cw_num: Calendar week number to match.
        year: ISO year for the calendar week. Defaults to current year.

    Returns:
        Aggregated total_summary metrics dict, or None if no data found.
    """
    if not eco_data or "sheets" not in eco_data:
        return None

    if year is None:
        year = date.today().year

    start_date, end_date = cw_to_date_range(year, cw_num)
    start_str = start_date.isoformat()
    end_str = end_date.isoformat()

    # Collect daily rows within the CW date range across all sheets
    matching_rows = []
    for sheet_name, sheet_data in eco_data["sheets"].items():
        if not isinstance(sheet_data, dict):
            continue
        for row in sheet_data.get("daily", []):
            row_date = row.get("date", "")
            if start_str <= row_date <= end_str:
                matching_rows.append(row)

    if not matching_rows:
        return None

    # Aggregate total_summary metrics across matching days
    additive_keys = ["ad_spend", "total_conversions", "total_revenue", "profit"]
    totals: Dict[str, float] = {}

    for row in matching_rows:
        summary = row.get("total_summary", {})
        if not summary:
            continue
        for key in additive_keys:
            val = summary.get(key)
            if val is not None:
                try:
                    totals[key] = totals.get(key, 0) + float(val)
                except (ValueError, TypeError):
                    pass

    if not totals:
        return None

    # Compute derived metrics
    revenue = totals.get("total_revenue", 0)
    conversions = totals.get("total_conversions", 0)
    spend = totals.get("ad_spend", 0)
    profit = totals.get("profit", 0)

    return {
        "total_revenue": round(revenue, 2),
        "total_conversions": round(conversions),
        "total_cpa": round(spend / conversions, 2) if conversions > 0 else 0,
        "profit": round(profit, 2),
        "total_roas": round(revenue / spend, 2) if spend > 0 else 0,
        "aov": round(revenue / conversions, 2) if conversions > 0 else 0,
    }


# ── Report data building ─────────────────────────────────────────────────────

def build_campaign_entry(
    idx: int,
    campaign: Dict,
    cw_key: str,
    region_cfg: Dict,
    ad_data: Optional[Dict],
    end_date: date,
) -> Optional[Dict]:
    """Build a single campaign entry for the report DATA object."""
    breakdown = campaign.get("weekly_breakdown", {})
    metrics = breakdown.get(cw_key)

    if not metrics:
        return None

    name = campaign.get("campaign_name", "Unknown")
    spend = _safe_float(metrics.get("spend"))
    purchases = _safe_float(metrics.get("purchases"))
    purchase_value = _safe_float(metrics.get("purchase_value"))
    impressions = _safe_int(metrics.get("impressions"))
    reach = _safe_int(metrics.get("reach"))
    clicks = _safe_int(metrics.get("clicks"))

    roas = round(purchase_value / spend, 2) if spend > 0 and purchase_value else 0.0
    cpp = round(spend / purchases, 2) if purchases > 0 else 0.0
    aov = round(purchase_value / purchases, 2) if purchases > 0 else 0.0
    ctr = round(clicks / impressions * 100, 2) if impressions > 0 else 0.0
    frequency = round(impressions / reach, 2) if reach and reach > 0 else 0.0

    # Count video vs static ads in this campaign
    video_count = 0
    static_count = 0
    top_ad_name = "—"
    top_ad_roas = -1

    if ad_data and "ads" in ad_data:
        for ad in ad_data["ads"]:
            if ad.get("campaign_name") == name:
                ad_metrics = ad.get("weekly_breakdown", {}).get(cw_key, {})
                ad_spend = _safe_float(ad_metrics.get("spend"))

                # Detect format from ad name or parsed name
                ad_name_lower = ad.get("ad_name", "").lower()
                if any(kw in ad_name_lower for kw in ["video", "ugc", "reel"]):
                    video_count += 1
                else:
                    static_count += 1

                # Track top-performing ad by ROAS (min spend threshold)
                if ad_spend >= 10:
                    ad_roas = _safe_float(ad_metrics.get("roas"))
                    ad_purchases = _safe_float(ad_metrics.get("purchases"))
                    if ad_purchases > top_ad_roas:
                        top_ad_roas = ad_purchases
                        top_ad_name = ad.get("ad_name", "—")

    return {
        "id": idx,
        "reportDate": end_date.isoformat(),
        "accountName": region_cfg["account_name"],
        "campaignName": name,
        "shortName": _shorten_campaign_name(name),
        "dateRange": "",  # Filled by caller
        "spend": round(spend, 2),
        "purchases": int(purchases),
        "purchaseValue": round(purchase_value, 2),
        "roas": roas,
        "costPerPurchase": cpp,
        "avgOrderValue": aov,
        "insight": "",  # Filled by AI or left empty
        "funnelStage": _detect_funnel_stage(name),
        "frequency": frequency,
        "adFormatSplit": f"{video_count} video / {static_count} static",
        "topPerformingAd": top_ad_name[:120],
        "nextStep1": "",
        "nextStep2": "",
        "nextStep3": "",
        "nextStep4": "",
    }


def build_store_data(
    eco_metrics: Optional[Dict],
    region_cfg: Dict,
    end_date: date,
) -> Dict:
    """Build the store section of the DATA object from ecosystem data."""
    if not eco_metrics:
        return {
            "reportDate": end_date.isoformat(),
            "accountName": region_cfg["account_name"],
            "totalConversions": 0,
            "totalRevenue": 0,
            "totalCPA": 0,
            "profit": 0,
            "totalROAS": 0,
            "aov": 0,
        }

    revenue = _safe_float(eco_metrics.get("Total Revenue", eco_metrics.get("total_revenue", 0)))
    conversions = _safe_int(eco_metrics.get("Total Conversions", eco_metrics.get("total_conversions", 0)))
    cpa = _safe_float(eco_metrics.get("Total CPA", eco_metrics.get("total_cpa", 0)))
    profit = _safe_float(eco_metrics.get("Profit", eco_metrics.get("profit", 0)))
    roas = _safe_float(eco_metrics.get("Total ROAS", eco_metrics.get("total_roas", 0)))
    aov = _safe_float(eco_metrics.get("AOV", eco_metrics.get("aov", 0)))

    return {
        "reportDate": end_date.isoformat(),
        "accountName": region_cfg["account_name"],
        "totalConversions": conversions,
        "totalRevenue": round(revenue, 2),
        "totalCPA": round(cpa, 2),
        "profit": round(profit, 2),
        "totalROAS": round(roas, 2),
        "aov": round(aov, 2),
    }


def build_region_data(
    region: str,
    cw_key: str,
    year: int,
    cw: int,
) -> Optional[Dict]:
    """Build the full data object for one region."""
    cfg = REGION_CONFIG[region]
    start_date, end_date = cw_to_date_range(year, cw)
    date_range_str = f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"

    # Load data files
    campaign_data = load_campaign_data(region)
    ad_data = load_ad_data(region)
    eco_data = load_ecosystem_data(region)

    # Build store section
    eco_row = find_ecosystem_row(eco_data, cw, year) if eco_data else None
    store = build_store_data(eco_row, cfg, end_date)

    # Build campaigns
    campaigns = []
    total_spend = 0.0
    idx = 1

    if campaign_data and "campaigns" in campaign_data:
        for campaign in campaign_data["campaigns"]:
            entry = build_campaign_entry(idx, campaign, cw_key, cfg, ad_data, end_date)
            if entry:
                entry["dateRange"] = date_range_str
                campaigns.append(entry)
                total_spend += entry["spend"]
                idx += 1

    # Sort by spend descending (active first)
    campaigns.sort(key=lambda c: c["spend"], reverse=True)

    # Re-index after sort
    for i, c in enumerate(campaigns):
        c["id"] = i + 1

    if not campaigns:
        logger.warning(f"No campaign data found for {region} in {cw_key}")

    # Compute paid media revenue as % of total store revenue
    total_paid_revenue = sum(c["purchaseValue"] for c in campaigns)
    pct_of_revenue = round(total_paid_revenue / store["totalRevenue"] * 100, 1) if store["totalRevenue"] > 0 else 0.0
    store["pctOfRevenue"] = pct_of_revenue

    return {
        "currency": cfg["currency"],
        "totalSpendRef": round(total_spend, 2),
        "store": store,
        "campaigns": campaigns,
    }



def inject_ai_insights(region_data: Dict, insights: Dict) -> None:
    """Inject AI-generated insights into campaign entries."""
    campaign_insights = insights.get("campaign_insights", {})
    overall = insights.get("overall_insights", [])
    recommendations = insights.get("creative_recommendations", [])

    for campaign in region_data["campaigns"]:
        name = campaign["campaignName"]
        if name in campaign_insights:
            campaign["insight"] = campaign_insights[name]

        # Use recommendations as next steps if available
        if not campaign["nextStep1"] and recommendations:
            for i, rec in enumerate(recommendations[:4]):
                campaign[f"nextStep{i+1}"] = rec


def generate_default_insights(region_data: Dict) -> None:
    """Generate basic template insights when AI is unavailable."""
    for c in region_data["campaigns"]:
        if c["insight"]:
            continue

        roas = c["roas"]
        spend = c["spend"]
        purchases = c["purchases"]
        cpp = c["costPerPurchase"]

        if spend == 0:
            c["insight"] = f"Campaign inactive with zero spend this period. Review reactivation strategy."
        elif roas >= 3:
            c["insight"] = f"Strong {roas}x ROAS with {purchases} purchases — approaching scale threshold. Monitor CPA stability during budget increases."
        elif roas >= 2:
            c["insight"] = f"On-target {roas}x ROAS meeting the 2x benchmark. {purchases} purchases at {c['avgOrderValue']} AOV shows consistent performance."
        elif roas > 0:
            c["insight"] = f"Below-target {roas}x ROAS with {cpp} CPA. Creative and targeting refinement recommended to improve efficiency."
        else:
            c["insight"] = f"Zero conversions from {round(spend, 0)} spend — requires immediate creative or targeting review."

        # Default next steps based on performance
        if roas >= 2.5:
            c["nextStep1"] = "Scale budget by 20% given strong ROAS performance"
            c["nextStep2"] = "Test new creative angles to expand winning audience"
            c["nextStep3"] = "Introduce bundle offers to lift AOV"
            c["nextStep4"] = "Expand lookalike audiences from purchaser data"
        elif roas >= 1.5:
            c["nextStep1"] = "Maintain current budget and monitor consistency"
            c["nextStep2"] = "Refresh creative assets to combat potential fatigue"
            c["nextStep3"] = "Test audience refinements to improve conversion rate"
            c["nextStep4"] = "Review product catalog for optimization opportunities"
        elif spend > 0:
            c["nextStep1"] = "Reduce budget and test new creative concepts"
            c["nextStep2"] = "Narrow audience targeting to warmer segments"
            c["nextStep3"] = "Create urgency or value-focused messaging variants"
            c["nextStep4"] = "Review and reallocate budget to higher-performing campaigns"
        else:
            c["nextStep1"] = "Review strategic relevance before reactivation"
            c["nextStep2"] = "Prepare updated creative assets"
            c["nextStep3"] = "Define clear testing budget and KPI targets"
            c["nextStep4"] = "Align messaging with current top-performing campaigns"


# ── HTML generation ───────────────────────────────────────────────────────────

def format_subtitle(year: int, cw: int, start_date: date, end_date: date) -> str:
    """Format the subtitle line for the report header."""
    start_str = start_date.strftime("%-d %b")
    end_str = end_date.strftime("%-d %b %Y")
    generated = date.today().strftime("%-d %B %Y")
    return f"{start_str} – {end_str} · CW{cw} · Generated {generated}"


def generate_report(cw_key: str, regions: List[str] = None) -> str:
    """Generate a complete HTML report for the given calendar week."""
    year, cw = parse_cw_key(cw_key)

    # Validate CW is complete
    if not is_cw_complete(year, cw):
        start, end = cw_to_date_range(year, cw)
        raise ValueError(
            f"CW{cw} ({start} to {end}) is not yet complete. "
            f"Today is {date.today()}. Reports can only be generated for completed weeks."
        )

    if regions is None:
        regions = ["uk", "eu"]

    start_date, end_date = cw_to_date_range(year, cw)

    # Build data for each region
    data_obj = {}
    for region in regions:
        logger.info(f"Building data for {region.upper()} — {cw_key}")
        region_data = build_region_data(region, cw_key, year, cw)
        if region_data:
            # Try AI insights, fall back to templates
            insights = generate_ai_insights(region_data, region, cw_key, "weekly")
            if insights:
                inject_ai_insights(region_data, insights)
                logger.info(f"AI insights injected for {region.upper()}")
            else:
                generate_default_insights(region_data)
                logger.info(f"Using template insights for {region.upper()} (AI unavailable)")

            data_obj[region] = region_data

    if not data_obj:
        raise RuntimeError(f"No data available for any region in {cw_key}")

    # Load template
    if not TEMPLATE_PATH.exists():
        raise FileNotFoundError(f"Report template not found at {TEMPLATE_PATH}")

    template = TEMPLATE_PATH.read_text(encoding="utf-8")

    # Inject data
    data_json = json.dumps(data_obj, ensure_ascii=False, indent=None)
    html = template.replace("__DATA_PLACEHOLDER__", data_json)
    html = html.replace("__SUBTITLE_PLACEHOLDER__", format_subtitle(year, cw, start_date, end_date))

    return html


def save_report(html: str, year: int, cw: int) -> Path:
    """Save the report HTML to weeks/CW##_MonDD_MonDD_YYYY/."""
    start_date, end_date = cw_to_date_range(year, cw)
    start_str = start_date.strftime("%b%d")
    end_str = end_date.strftime("%b%d")

    week_folder = WEEKS_DIR / f"CW{cw:02d}_{start_str}_{end_str}_{year}"
    week_folder.mkdir(parents=True, exist_ok=True)

    filename = f"Weekly_Report_CW{cw:02d}_{start_str}_{end_str}_{year}.html"
    output_path = week_folder / filename
    output_path.write_text(html, encoding="utf-8")

    return output_path


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Generate weekly performance report HTML")
    parser.add_argument("--cw", required=True, help="Calendar week key, e.g. 2026-CW14")
    parser.add_argument("--region", default="all", choices=["all", "eu", "uk"],
                        help="Region(s) to include (default: all)")
    args = parser.parse_args()

    regions = ["uk", "eu"] if args.region == "all" else [args.region]

    try:
        year, cw = parse_cw_key(args.cw)
        logger.info(f"Generating report for {args.cw} (regions: {', '.join(r.upper() for r in regions)})")

        html = generate_report(args.cw, regions)
        output_path = save_report(html, year, cw)

        logger.info(f"Report saved to: {output_path}")
        print(f"\n✅ Report generated: {output_path}")

    except ValueError as e:
        logger.error(str(e))
        print(f"\n❌ {e}")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Report generation failed: {e}", exc_info=True)
        print(f"\n❌ Report generation failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
