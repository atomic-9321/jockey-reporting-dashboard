"""Fetch ad-level data from Meta Marketing API including creative previews.

Usage:
    python tools/meta_fetch_ads.py [--region eu|uk|all] [--start YYYY-MM-DD] [--end YYYY-MM-DD]
"""

import os
import sys
import json
import argparse
import logging
from datetime import date

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.utils.meta_client import fetch_ad_insights, fetch_ad_creative_thumbnails
from tools.utils.blob_client import upload_json, download_json, write_refresh_status, append_to_log
from tools.utils.data_quality import deduplicate_by_key
from tools.utils.date_utils import six_months_ago

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REGIONS = {
    "eu": {
        "account_id": os.getenv("META_EU_ACCOUNT_ID"),
        "currency": "EUR",
        "filename": "meta_eu_ads.json",
    },
    "uk": {
        "account_id": os.getenv("META_UK_ACCOUNT_ID"),
        "currency": "GBP",
        "filename": "meta_uk_ads.json",
    },
}


def fetch_and_save(region: str, start_date: date, end_date: date) -> bool:
    """Fetch ad data for a region, including creative thumbnails.

    Returns True on success.
    """
    config = REGIONS.get(region)
    if not config:
        logger.error(f"Unknown region: {region}")
        return False

    account_id = config["account_id"]
    if not account_id:
        logger.error(f"META_{region.upper()}_ACCOUNT_ID not set in .env")
        return False

    logger.info(f"Fetching {region.upper()} ads: {start_date} to {end_date}")

    try:
        # Step 1: Fetch ad insights
        ads = fetch_ad_insights(account_id, start_date, end_date)
        ads = deduplicate_by_key(ads, ["ad_id"])

        logger.info(f"Fetched {len(ads)} {region.upper()} ads")

        # Step 2: Fetch creative thumbnails (batch)
        ad_ids = [ad["ad_id"] for ad in ads]
        logger.info(f"Fetching creative thumbnails for {len(ad_ids)} ads...")
        thumbnails = fetch_ad_creative_thumbnails(account_id, ad_ids)

        # Merge thumbnails into ad data
        for ad in ads:
            ad["creative_thumbnail_url"] = thumbnails.get(ad["ad_id"])

        output = {
            "region": region.upper(),
            "currency": config["currency"],
            "date_range": {
                "start": str(start_date),
                "end": str(end_date),
            },
            "fetched_at": date.today().isoformat(),
            "ad_count": len(ads),
            "ads": ads,
        }

        upload_json(config["filename"], output)
        write_refresh_status(f"meta_ads_{region}", success=True)
        append_to_log(f"SUCCESS: Fetched {len(ads)} {region.upper()} ads with creatives")
        logger.info(f"Saved {len(ads)} {region.upper()} ads")
        return True

    except Exception as e:
        error_msg = f"FAILED: {region.upper()} ads — {str(e)}"
        write_refresh_status(f"meta_ads_{region}", success=False, error=str(e))
        append_to_log(error_msg)
        logger.error(error_msg)
        return False


def main():
    parser = argparse.ArgumentParser(description="Fetch Meta ad data with creatives")
    parser.add_argument("--region", choices=["eu", "uk", "all"], default="all")
    parser.add_argument("--start", type=str, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", type=str, help="End date (YYYY-MM-DD)")
    args = parser.parse_args()

    start_date = date.fromisoformat(args.start) if args.start else six_months_ago()
    end_date = date.fromisoformat(args.end) if args.end else date.today()

    regions = ["eu", "uk"] if args.region == "all" else [args.region]
    results = {}

    for region in regions:
        results[region] = fetch_and_save(region, start_date, end_date)

    for region, success in results.items():
        status = "OK" if success else "FAILED"
        logger.info(f"{region.upper()}: {status}")

    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
