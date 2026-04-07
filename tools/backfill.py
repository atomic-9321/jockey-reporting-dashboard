"""Historical backfill: pull last 6 months of data from Meta.

Repeatable for any specific calendar week if data was bad.

Usage:
    python tools/backfill.py [--region eu|uk|all] [--months 6] [--cw 2026-CW14]
"""

import os
import sys
import argparse
import logging
from datetime import date

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.utils.date_utils import six_months_ago, cw_to_date_range
from tools.meta_fetch_campaigns import fetch_and_save as fetch_campaigns
from tools.meta_fetch_ads import fetch_and_save as fetch_ads

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def parse_cw(cw_str: str):
    """Parse a CW string like '2026-CW14' into (year, cw)."""
    parts = cw_str.split("-CW")
    if len(parts) != 2:
        raise ValueError(f"Invalid CW format: {cw_str}. Expected format: YYYY-CWNN")
    return int(parts[0]), int(parts[1])


def main():
    parser = argparse.ArgumentParser(description="Backfill historical Meta data")
    parser.add_argument("--region", choices=["eu", "uk", "all"], default="all")
    parser.add_argument("--months", type=int, default=6, help="Months to look back")
    parser.add_argument("--cw", type=str, help="Specific CW to re-fetch (e.g., 2026-CW14)")
    args = parser.parse_args()

    regions = ["eu", "uk"] if args.region == "all" else [args.region]

    if args.cw:
        year, cw = parse_cw(args.cw)
        start_date, end_date = cw_to_date_range(year, cw)
        logger.info(f"Re-fetching specific week: {args.cw} ({start_date} to {end_date})")
    else:
        today = date.today()
        month = today.month - args.months
        year = today.year
        if month <= 0:
            month += 12
            year -= 1
        try:
            start_date = date(year, month, today.day)
        except ValueError:
            from calendar import monthrange
            start_date = date(year, month, monthrange(year, month)[1])
        end_date = today
        logger.info(f"Backfilling {args.months} months: {start_date} to {end_date}")

    results = {"campaigns": {}, "ads": {}}

    for region in regions:
        logger.info(f"\n{'='*50}")
        logger.info(f"Backfilling {region.upper()}")
        logger.info(f"{'='*50}")

        results["campaigns"][region] = fetch_campaigns(region, start_date, end_date)
        results["ads"][region] = fetch_ads(region, start_date, end_date)

    # Summary
    logger.info(f"\n{'='*50}")
    logger.info("BACKFILL SUMMARY")
    logger.info(f"{'='*50}")
    all_success = True
    for data_type in ["campaigns", "ads"]:
        for region, success in results[data_type].items():
            status = "OK" if success else "FAILED"
            logger.info(f"  {region.upper()} {data_type}: {status}")
            if not success:
                all_success = False

    sys.exit(0 if all_success else 1)


if __name__ == "__main__":
    main()
