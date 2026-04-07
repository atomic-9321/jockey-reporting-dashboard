"""Meta Marketing API client wrapper with pagination, rate limiting, and retry logic."""

import os
import time
import logging
from datetime import date, timedelta
from typing import Dict, List, Optional, Any

from facebook_business.api import FacebookAdsApi
from facebook_business.adobjects.adaccount import AdAccount
from facebook_business.adobjects.campaign import Campaign
from facebook_business.adobjects.ad import Ad
from facebook_business.adobjects.adcreative import AdCreative
from facebook_business.exceptions import FacebookRequestError
from dotenv import load_dotenv

from .date_utils import date_to_meta_format, get_calendar_week, cw_label

load_dotenv()

logger = logging.getLogger(__name__)

# Retry configuration
MAX_RETRIES = 3
BACKOFF_MULTIPLIER = 5  # 5s, 15s, 45s

# Campaign-level fields to fetch
CAMPAIGN_FIELDS = [
    "campaign_name",
    "campaign_id",
    "objective",
    "status",
]

CAMPAIGN_INSIGHT_FIELDS = [
    "campaign_name",
    "campaign_id",
    "spend",
    "impressions",
    "clicks",
    "ctr",
    "actions",
    "action_values",
    "cost_per_action_type",
    "reach",
]

# Ad-level fields
AD_FIELDS = [
    "id",
    "name",
    "status",
    "effective_status",
    "creative",
    "campaign_id",
    "adset_id",
]

AD_INSIGHT_FIELDS = [
    "ad_id",
    "ad_name",
    "campaign_name",
    "adset_name",
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "actions",
    "action_values",
    "cost_per_action_type",
    "video_30_sec_watched_actions",
    "video_p100_watched_actions",
    "video_play_actions",
]


def _check_token_age():
    """Check Meta token age and warn if approaching expiry."""
    created_at = os.getenv("META_TOKEN_CREATED_AT")
    if not created_at:
        logger.warning("META_TOKEN_CREATED_AT not set in .env — cannot track token expiry")
        return

    from datetime import datetime
    created = datetime.strptime(created_at, "%Y-%m-%d").date()
    age_days = (date.today() - created).days

    if age_days >= 55:
        logger.error(f"Meta token is {age_days} days old — EXPIRES SOON (60-day limit). Renew immediately!")
        return "critical"
    elif age_days >= 50:
        logger.warning(f"Meta token is {age_days} days old — renewal recommended within 10 days")
        return "warning"
    else:
        logger.info(f"Meta token is {age_days} days old — OK")
        return "ok"


def init_api() -> FacebookAdsApi:
    """Initialize the Meta API client."""
    access_token = os.getenv("META_ACCESS_TOKEN")
    if not access_token:
        raise ValueError("META_ACCESS_TOKEN not set in .env")

    _check_token_age()

    api = FacebookAdsApi.init(
        app_id=None,
        app_secret=None,
        access_token=access_token,
    )
    return api


def _retry_with_backoff(func, *args, **kwargs):
    """Execute a function with exponential backoff retry on rate limit errors."""
    for attempt in range(MAX_RETRIES):
        try:
            return func(*args, **kwargs)
        except FacebookRequestError as e:
            if e.api_error_code() in (4, 17, 32, 613) or "rate limit" in str(e).lower():
                wait_time = BACKOFF_MULTIPLIER * (3 ** attempt)
                logger.warning(f"Rate limited (attempt {attempt + 1}/{MAX_RETRIES}). Waiting {wait_time}s...")
                time.sleep(wait_time)
                if attempt == MAX_RETRIES - 1:
                    raise
            else:
                raise


def _extract_action_value(actions: Optional[List[Dict]], action_type: str) -> Optional[float]:
    """Extract a specific action value from Meta's actions array. Returns None if not found."""
    if not actions:
        return None
    for action in actions:
        if action.get("action_type") == action_type:
            try:
                return float(action["value"])
            except (ValueError, KeyError):
                return None
    return None


def _parse_campaign_insight(row: Dict) -> Dict[str, Any]:
    """Parse a single campaign insight row into our normalized format."""
    actions = row.get("actions", [])
    action_values = row.get("action_values", [])
    cost_per_action = row.get("cost_per_action_type", [])

    spend = float(row.get("spend", 0)) if row.get("spend") else None
    impressions = int(row.get("impressions", 0)) if row.get("impressions") else None
    clicks = int(row.get("clicks", 0)) if row.get("clicks") else None
    ctr = float(row.get("ctr", 0)) if row.get("ctr") else None

    purchases = _extract_action_value(actions, "purchase")
    purchase_value = _extract_action_value(action_values, "purchase")
    add_to_cart = _extract_action_value(actions, "add_to_cart")
    checkout = _extract_action_value(actions, "initiate_checkout")
    payment_info = _extract_action_value(actions, "add_payment_info")
    content_view = _extract_action_value(actions, "view_content")
    landing_page_view = _extract_action_value(actions, "landing_page_view")

    # Compute ROAS and CPA deterministically
    roas = None
    if purchase_value is not None and spend and spend > 0:
        roas = round(purchase_value / spend, 2)

    cpa = None
    if purchases and purchases > 0 and spend:
        cpa = round(spend / purchases, 2)

    return {
        "spend": spend,
        "impressions": impressions,
        "clicks": clicks,
        "ctr": round(ctr, 2) if ctr is not None else None,
        "purchases": purchases,
        "purchase_value": purchase_value,
        "roas": roas,
        "cpa": cpa,
        "add_to_cart": add_to_cart,
        "checkout_initiated": checkout,
        "payment_info_added": payment_info,
        "content_view": content_view,
        "landing_page_view": landing_page_view,
        "reach": int(row.get("reach", 0)) if row.get("reach") else None,
    }


def fetch_campaign_insights(
    account_id: str,
    start_date: date,
    end_date: date,
) -> List[Dict[str, Any]]:
    """Fetch campaign-level insights for a date range."""
    init_api()
    account = AdAccount(account_id)

    params = {
        "time_range": {
            "since": date_to_meta_format(start_date),
            "until": date_to_meta_format(end_date),
        },
        "time_increment": 1,  # Daily breakdown for CW aggregation
        "level": "campaign",
    }

    def _fetch():
        return account.get_insights(
            fields=CAMPAIGN_INSIGHT_FIELDS,
            params=params,
        )

    raw_insights = _retry_with_backoff(_fetch)

    campaigns = {}
    for row in raw_insights:
        row_dict = dict(row)
        campaign_id = row_dict.get("campaign_id")
        row_date = row_dict.get("date_start")

        if not campaign_id or not row_date:
            continue

        parsed_date = date.fromisoformat(row_date)
        year, cw = get_calendar_week(parsed_date)
        cw_key = cw_label(year, cw)

        if campaign_id not in campaigns:
            campaigns[campaign_id] = {
                "campaign_id": campaign_id,
                "campaign_name": row_dict.get("campaign_name", "Unknown"),
                "weekly_breakdown": {},
            }

        metrics = _parse_campaign_insight(row_dict)

        if cw_key not in campaigns[campaign_id]["weekly_breakdown"]:
            campaigns[campaign_id]["weekly_breakdown"][cw_key] = metrics
        else:
            # Aggregate daily data into weekly
            existing = campaigns[campaign_id]["weekly_breakdown"][cw_key]
            for key in ["spend", "impressions", "clicks", "purchases", "purchase_value",
                        "add_to_cart", "checkout_initiated", "payment_info_added",
                        "content_view", "landing_page_view", "reach"]:
                if metrics[key] is not None:
                    if existing[key] is None:
                        existing[key] = metrics[key]
                    else:
                        existing[key] += metrics[key]

            # Recompute derived metrics
            if existing["impressions"] and existing["clicks"]:
                existing["ctr"] = round(existing["clicks"] / existing["impressions"] * 100, 2)
            if existing["purchase_value"] and existing["spend"] and existing["spend"] > 0:
                existing["roas"] = round(existing["purchase_value"] / existing["spend"], 2)
            if existing["purchases"] and existing["purchases"] > 0 and existing["spend"]:
                existing["cpa"] = round(existing["spend"] / existing["purchases"], 2)

    return list(campaigns.values())


def fetch_ad_insights(
    account_id: str,
    start_date: date,
    end_date: date,
) -> List[Dict[str, Any]]:
    """Fetch ad-level insights with creative info for a date range."""
    init_api()
    account = AdAccount(account_id)

    params = {
        "time_range": {
            "since": date_to_meta_format(start_date),
            "until": date_to_meta_format(end_date),
        },
        "time_increment": 1,
        "level": "ad",
    }

    def _fetch():
        return account.get_insights(
            fields=AD_INSIGHT_FIELDS,
            params=params,
        )

    raw_insights = _retry_with_backoff(_fetch)

    ads = {}
    for row in raw_insights:
        row_dict = dict(row)
        ad_id = row_dict.get("ad_id")
        row_date = row_dict.get("date_start")

        if not ad_id or not row_date:
            continue

        parsed_date = date.fromisoformat(row_date)
        year, cw = get_calendar_week(parsed_date)
        cw_key = cw_label(year, cw)

        if ad_id not in ads:
            ads[ad_id] = {
                "ad_id": ad_id,
                "ad_name": row_dict.get("ad_name", "Unknown"),
                "campaign_name": row_dict.get("campaign_name", "Unknown"),
                "adset_name": row_dict.get("adset_name", "Unknown"),
                "creative_thumbnail_url": None,  # Populated separately
                "weekly_breakdown": {},
            }

        metrics = _parse_campaign_insight(row_dict)

        # Video-specific metrics (computed deterministically)
        video_plays = _extract_action_value(row_dict.get("video_play_actions"), "video_view")
        video_30s = _extract_action_value(row_dict.get("video_30_sec_watched_actions"), "video_view")
        video_complete = _extract_action_value(row_dict.get("video_p100_watched_actions"), "video_view")

        impressions = metrics.get("impressions")
        hook_rate = None
        hold_rate = None

        if video_plays is not None and impressions and impressions > 0:
            hook_rate = round(video_plays / impressions * 100, 2)
        if video_complete is not None and video_plays and video_plays > 0:
            hold_rate = round(video_complete / video_plays * 100, 2)

        metrics["hook_rate"] = hook_rate
        metrics["hold_rate"] = hold_rate
        metrics["video_plays"] = video_plays
        metrics["video_completions"] = video_complete

        # Conversion rate
        clicks = metrics.get("clicks")
        purchases = metrics.get("purchases")
        if purchases is not None and clicks and clicks > 0:
            metrics["conversion_rate"] = round(purchases / clicks * 100, 2)
        else:
            metrics["conversion_rate"] = None

        if cw_key not in ads[ad_id]["weekly_breakdown"]:
            ads[ad_id]["weekly_breakdown"][cw_key] = metrics
        else:
            existing = ads[ad_id]["weekly_breakdown"][cw_key]
            for key in ["spend", "impressions", "clicks", "purchases", "purchase_value",
                        "add_to_cart", "checkout_initiated", "payment_info_added",
                        "content_view", "landing_page_view", "reach",
                        "video_plays", "video_completions"]:
                if metrics.get(key) is not None:
                    if existing.get(key) is None:
                        existing[key] = metrics[key]
                    else:
                        existing[key] += metrics[key]

            # Recompute derived
            if existing.get("impressions") and existing.get("clicks"):
                existing["ctr"] = round(existing["clicks"] / existing["impressions"] * 100, 2)
            if existing.get("purchase_value") and existing.get("spend") and existing["spend"] > 0:
                existing["roas"] = round(existing["purchase_value"] / existing["spend"], 2)
            if existing.get("purchases") and existing["purchases"] > 0 and existing.get("spend"):
                existing["cpa"] = round(existing["spend"] / existing["purchases"], 2)
            if existing.get("video_plays") and existing.get("impressions") and existing["impressions"] > 0:
                existing["hook_rate"] = round(existing["video_plays"] / existing["impressions"] * 100, 2)
            if existing.get("video_completions") and existing.get("video_plays") and existing["video_plays"] > 0:
                existing["hold_rate"] = round(existing["video_completions"] / existing["video_plays"] * 100, 2)
            if existing.get("purchases") and existing.get("clicks") and existing["clicks"] > 0:
                existing["conversion_rate"] = round(existing["purchases"] / existing["clicks"] * 100, 2)

    return list(ads.values())


def fetch_ad_creative_thumbnails(account_id: str, ad_ids: List[str]) -> Dict[str, Optional[str]]:
    """Fetch creative thumbnail URLs for a list of ad IDs. Returns {ad_id: url_or_None}."""
    import requests

    init_api()
    thumbnails = {}

    for ad_id in ad_ids:
        try:
            ad = Ad(ad_id)
            creative_data = _retry_with_backoff(
                ad.api_get,
                fields=["creative{thumbnail_url,effective_object_story_id}"],
            )
            creative = creative_data.get("creative", {})
            url = creative.get("thumbnail_url")

            # Validate URL is still accessible
            if url:
                try:
                    resp = requests.head(url, timeout=5, allow_redirects=True)
                    if resp.status_code != 200:
                        url = None
                except requests.RequestException:
                    url = None

            thumbnails[ad_id] = url
        except Exception as e:
            logger.warning(f"Failed to fetch creative for ad {ad_id}: {e}")
            thumbnails[ad_id] = None

    return thumbnails
