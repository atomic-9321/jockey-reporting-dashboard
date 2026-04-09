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
    "unique_actions",
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
    "unique_actions",
    "action_values",
    "cost_per_action_type",
    "video_30_sec_watched_actions",
    "video_p100_watched_actions",
    "video_play_actions",
    "video_thruplay_watched_actions",
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

    # Use unique_link_click from unique_actions (deduplicated per person)
    unique_actions = row.get("unique_actions", [])
    unique_link_clicks = _extract_action_value(unique_actions, "link_click")
    clicks = int(unique_link_clicks) if unique_link_clicks is not None else None

    # Recompute CTR from unique link clicks
    ctr = None
    if clicks is not None and impressions and impressions > 0:
        ctr = round(clicks / impressions * 100, 2)

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
        "action_attribution_windows": ["28d_click", "1d_view"],
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
        "action_attribution_windows": ["28d_click", "1d_view"],
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
        # video_play_actions = any play (even 0s) — used as denominator for hold rate
        # video_thruplay = 15s or completion (whichever first) — better quality signal
        # Hook rate = 3-second views / impressions (% who watched past 3s)
        # Hold rate = completions / 3-second views (% who finished after hooking)
        video_plays = _extract_action_value(row_dict.get("video_play_actions"), "video_view")
        video_3s = _extract_action_value(row_dict.get("video_thruplay_watched_actions"), "video_view")
        video_complete = _extract_action_value(row_dict.get("video_p100_watched_actions"), "video_view")

        # Fallback: if thruplay not available (None), use video_play_actions for hook rate
        # Note: 0 thruplays is valid — only fall back when it's actually None
        hook_source = video_3s if video_3s is not None else video_plays

        impressions = metrics.get("impressions")
        hook_rate = None
        hold_rate = None

        if hook_source is not None and impressions and impressions > 0:
            hook_rate = round(hook_source / impressions * 100, 2)
        if video_complete is not None and hook_source and hook_source > 0:
            hold_rate = round(video_complete / hook_source * 100, 2)

        metrics["hook_rate"] = hook_rate
        metrics["hold_rate"] = hold_rate
        metrics["video_plays"] = video_plays
        metrics["video_completions"] = video_complete
        metrics["video_thruplay"] = video_3s

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
                        "video_plays", "video_completions", "video_thruplay"]:
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
            # Hook rate: thruplay (3s views) / impressions — fallback to video_plays
            # Use explicit None check — 0 thruplays is valid (not missing)
            hook_src = existing.get("video_thruplay") if existing.get("video_thruplay") is not None else existing.get("video_plays")
            if hook_src and existing.get("impressions") and existing["impressions"] > 0:
                existing["hook_rate"] = round(hook_src / existing["impressions"] * 100, 2)
            # Hold rate: completions / thruplay (3s views)
            if existing.get("video_completions") and hook_src and hook_src > 0:
                existing["hold_rate"] = round(existing["video_completions"] / hook_src * 100, 2)
            if existing.get("purchases") and existing.get("clicks") and existing["clicks"] > 0:
                existing["conversion_rate"] = round(existing["purchases"] / existing["clicks"] * 100, 2)

    return list(ads.values())


def fetch_ad_age_gender_breakdown(
    account_id: str,
    ad_id: str,
    start_date: date,
    end_date: date,
) -> List[Dict[str, Any]]:
    """Fetch age/gender breakdown for a specific ad. Returns list of {age, gender, spend, impressions, purchases, roas}."""
    init_api()
    account = AdAccount(account_id)

    params = {
        "time_range": {
            "since": date_to_meta_format(start_date),
            "until": date_to_meta_format(end_date),
        },
        "filtering": [{"field": "ad.id", "operator": "EQUAL", "value": ad_id}],
        "breakdowns": ["age", "gender"],
        "level": "ad",
        "action_attribution_windows": ["28d_click", "1d_view"],
    }

    fields = ["spend", "impressions", "clicks", "actions", "action_values"]

    def _fetch():
        return account.get_insights(fields=fields, params=params)

    raw = _retry_with_backoff(_fetch)
    results = []

    for row in raw:
        row_dict = dict(row)
        spend = float(row_dict.get("spend", 0)) if row_dict.get("spend") else 0
        impressions = int(row_dict.get("impressions", 0)) if row_dict.get("impressions") else 0
        purchases = _extract_action_value(row_dict.get("actions"), "purchase") or 0
        purchase_value = _extract_action_value(row_dict.get("action_values"), "purchase") or 0
        roas = round(purchase_value / spend, 2) if spend > 0 else None

        results.append({
            "age": row_dict.get("age", "unknown"),
            "gender": row_dict.get("gender", "unknown"),
            "spend": round(spend, 2),
            "impressions": impressions,
            "purchases": int(purchases),
            "roas": roas,
        })

    return results


def fetch_ad_placement_breakdown(
    account_id: str,
    ad_id: str,
    start_date: date,
    end_date: date,
) -> List[Dict[str, Any]]:
    """Fetch placement breakdown for a specific ad. Returns list of {platform, position, label, spend, impressions, roas}."""
    init_api()
    account = AdAccount(account_id)

    params = {
        "time_range": {
            "since": date_to_meta_format(start_date),
            "until": date_to_meta_format(end_date),
        },
        "filtering": [{"field": "ad.id", "operator": "EQUAL", "value": ad_id}],
        "breakdowns": ["publisher_platform", "platform_position"],
        "level": "ad",
        "action_attribution_windows": ["28d_click", "1d_view"],
    }

    fields = ["spend", "impressions", "clicks", "actions", "action_values"]

    def _fetch():
        return account.get_insights(fields=fields, params=params)

    raw = _retry_with_backoff(_fetch)

    # Map raw positions to display labels
    LABEL_MAP = {
        ("instagram", "feed"): "IG Feed",
        ("instagram", "story"): "IG Stories",
        ("instagram", "reels_overlay"): "IG Reels",
        ("instagram", "explore"): "IG Explore",
        ("instagram", "profile_feed"): "IG Profile",
        ("facebook", "feed"): "FB Feed",
        ("facebook", "story"): "FB Stories",
        ("facebook", "marketplace"): "FB Marketplace",
        ("facebook", "video_feeds"): "FB Video",
        ("facebook", "right_hand_column"): "FB Right Column",
        ("audience_network", "classic"): "Audience Network",
        ("messenger", "messenger_inbox"): "Messenger",
    }

    results = []
    for row in raw:
        row_dict = dict(row)
        platform = row_dict.get("publisher_platform", "unknown")
        position = row_dict.get("platform_position", "unknown")

        spend = float(row_dict.get("spend", 0)) if row_dict.get("spend") else 0
        impressions = int(row_dict.get("impressions", 0)) if row_dict.get("impressions") else 0
        purchases = _extract_action_value(row_dict.get("actions"), "purchase") or 0
        purchase_value = _extract_action_value(row_dict.get("action_values"), "purchase") or 0
        roas = round(purchase_value / spend, 2) if spend > 0 else None

        label = LABEL_MAP.get((platform, position), f"{platform} {position}".title())

        results.append({
            "platform": platform,
            "position": position,
            "label": label,
            "spend": round(spend, 2),
            "impressions": impressions,
            "roas": roas,
        })

    return results


def fetch_ad_video_retention(
    ad_id: str,
    start_date: date,
    end_date: date,
) -> Optional[Dict[str, Any]]:
    """Fetch video retention curve for an ad. Returns {curve: [{pct_index, retention}]} or None."""
    init_api()
    ad = Ad(ad_id)

    params = {
        "time_range": {
            "since": date_to_meta_format(start_date),
            "until": date_to_meta_format(end_date),
        },
        "action_attribution_windows": ["28d_click", "1d_view"],
    }

    try:
        def _fetch():
            return ad.get_insights(fields=["video_play_curve_actions"], params=params)

        raw = _retry_with_backoff(_fetch)

        for row in raw:
            row_dict = dict(row)
            curve_data = row_dict.get("video_play_curve_actions")
            if curve_data and isinstance(curve_data, list):
                # video_play_curve_actions returns a list of dicts with 'action_type' and 'value'
                # The 'value' is a list of retention percentages at each percentile of video length
                for entry in curve_data:
                    values = entry.get("value")
                    if values and isinstance(values, list):
                        curve = [
                            {"pct_index": i, "retention": float(v)}
                            for i, v in enumerate(values)
                        ]
                        return {"duration_seconds": None, "curve": curve}

        return None
    except Exception as e:
        logger.warning(f"Could not fetch video retention for ad {ad_id}: {e}")
        return None


def fetch_ad_creative_thumbnails(account_id: str, ad_ids: List[str]) -> Dict[str, Optional[str]]:
    """Fetch high-quality creative image URLs for a list of ad IDs.

    Priority order:
    1. Instagram media_url (full resolution)
    2. Creative thumbnail_url (low-res fallback)

    Returns {ad_id: url_or_None}.
    """
    import requests

    init_api()
    token = os.getenv("META_ACCESS_TOKEN")
    thumbnails = {}

    for ad_id in ad_ids:
        try:
            url = None

            # Use direct Graph API call to get creative fields (SDK doesn't handle nested fields well)
            ad_resp = requests.get(
                f"https://graph.facebook.com/v21.0/{ad_id}",
                params={
                    "fields": "creative{thumbnail_url,effective_instagram_media_id}",
                    "access_token": token,
                },
                timeout=15,
            )
            if ad_resp.status_code != 200:
                thumbnails[ad_id] = None
                continue

            creative = ad_resp.json().get("creative", {})

            # Try high-res: Instagram media
            ig_media_id = creative.get("effective_instagram_media_id")
            if ig_media_id:
                try:
                    ig_resp = requests.get(
                        f"https://graph.facebook.com/v21.0/{ig_media_id}",
                        params={"fields": "media_type,media_url,thumbnail_url", "access_token": token},
                        timeout=10,
                    )
                    if ig_resp.status_code == 200:
                        ig_data = ig_resp.json()
                        media_type = ig_data.get("media_type", "")
                        if media_type == "VIDEO":
                            # For videos, use the video thumbnail (still image)
                            url = ig_data.get("thumbnail_url")
                        else:
                            # For images/carousels, use the full-res media_url
                            url = ig_data.get("media_url") or ig_data.get("thumbnail_url")
                except Exception as e:
                    logger.debug(f"IG media fetch failed for ad {ad_id}: {e}")

            # Fallback: creative thumbnail_url
            if not url:
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
