"""Fetch campaign-level data from Meta Marketing API.

Usage:
    python tools/meta_fetch_campaigns.py [--region eu|uk|all] [--start YYYY-MM-DD] [--end YYYY-MM-DD]
"""

import os
import sys
import json
import argparse
import logging
from datetime import date

from dotenv import load_dotenv

load_dotenv()

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.utils.meta_client import fetch_campaign_insights
from tools.utils.blob_client import upload_json, download_json, write_refresh_status, append_to_log
from tools.utils.data_quality import deduplicate_by_key
from tools.utils.date_utils import six_months_ago

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REGIONS = {
    "eu": {
        "account_id": os.getenv("META_EU_ACCOUNT_ID"),
        "currency": "EUR",
        "filename": "meta_eu_campaigns.json",
    },
    "uk": {
        "account_id": os.getenv("META_UK_ACCOUNT_ID"),
        "currency": "GBP",
        "filename": "meta_uk_campaigns.json",
    },
}


def fetch_and_save(region: str, start_date: date, end_date: date) -> bool:
    """Fetch campaign data for a region and save to blob/local.

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

    logger.info(f"Fetching {region.upper()} campaigns: {start_date} to {end_date}")

    try:
        campaigns = fetch_campaign_insights(account_id, start_date, end_date)

        # Deduplicate by campaign_id
        campaigns = deduplicate_by_key(campaigns, ["campaign_id"])

        output = {
            "region": region.upper(),
            "currency": config["currency"],
            "date_range": {
                "start": str(start_date),
                "end": str(end_date),
            },
            "fetched_at": date.today().isoformat(),
            "campaign_count": len(campaigns),
            "campaigns": campaigns,
        }

        upload_json(config["filename"], output)
        write_refresh_status(f"meta_campaigns_{region}", success=True)
        append_to_log(f"SUCCESS: Fetched {len(campaigns)} {region.upper()} campaigns")
        logger.info(f"Saved {len(campaigns)} {region.upper()} campaigns")
        return True

    except Exception as e:
        error_msg = f"FAILED: {region.upper()} campaigns — {str(e)}"
        write_refresh_status(f"meta_campaigns_{region}", success=False, error=str(e))
        append_to_log(error_msg)
        logger.error(error_msg)
        return False


def main():
    parser = argparse.ArgumentParser(description="Fetch Meta campaign data")
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

    # Summary
    for region, success in results.items():
        status = "OK" if success else "FAILED"
        logger.info(f"{region.upper()}: {status}")

    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
