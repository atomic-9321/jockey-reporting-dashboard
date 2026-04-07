"""Orchestrator: refresh all data sources independently.

Each source refreshes independently. If one fails, others still proceed.
Retries 3 times with exponential backoff before marking as failed.
Checks Meta token age and sends notifications if near expiry.

Usage:
    python tools/refresh_all_data.py [--region eu|uk|all]
"""

import os
import sys
import time
import argparse
import logging
from datetime import date, timedelta

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.utils.meta_client import _check_token_age
from tools.utils.notifications import notify
from tools.utils.blob_client import upload_json, append_to_log
from tools.utils.date_utils import six_months_ago

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BACKOFF_SECONDS = [5, 15, 45]


def retry_task(task_name, task_fn, *args, **kwargs):
    """Run a task with retries and exponential backoff.

    Returns (success: bool, error: str or None)
    """
    for attempt in range(MAX_RETRIES):
        try:
            result = task_fn(*args, **kwargs)
            if result:
                return True, None
            else:
                error = f"{task_name} returned False"
        except Exception as e:
            error = str(e)

        if attempt < MAX_RETRIES - 1:
            wait = BACKOFF_SECONDS[attempt]
            logger.warning(f"{task_name} failed (attempt {attempt + 1}/{MAX_RETRIES}). Retrying in {wait}s...")
            append_to_log(f"RETRY: {task_name} attempt {attempt + 1} — {error}")
            time.sleep(wait)
        else:
            logger.error(f"{task_name} failed after {MAX_RETRIES} attempts: {error}")

    return False, error


def main():
    parser = argparse.ArgumentParser(description="Refresh all data sources")
    parser.add_argument("--region", choices=["eu", "uk", "all"], default="all")
    parser.add_argument("--days-back", type=int, default=30,
                        help="Days to look back for refresh (default: 30)")
    args = parser.parse_args()

    start_time = time.time()
    regions = ["eu", "uk"] if args.region == "all" else [args.region]
    end_date = date.today()
    start_date = end_date - timedelta(days=args.days_back)

    logger.info(f"Starting data refresh: {start_date} to {end_date}")
    logger.info(f"Regions: {', '.join(r.upper() for r in regions)}")
    append_to_log(f"REFRESH START: regions={regions}, range={start_date} to {end_date}")

    # Check Meta token age first
    token_status = _check_token_age()
    if token_status == "critical":
        notify("Meta API token expires in less than 5 days! Renew immediately.", "critical")
    elif token_status == "warning":
        notify("Meta API token expires in less than 10 days. Please renew soon.", "warning")

    # Import fetch functions
    from tools.meta_fetch_campaigns import fetch_and_save as fetch_campaigns
    from tools.meta_fetch_ads import fetch_and_save as fetch_ads
    from tools.sheets_fetch_ecosystem import fetch_and_save as fetch_sheets

    results = {}

    # Refresh each source independently
    for region in regions:
        # Meta Campaigns
        task_name = f"{region.upper()} campaigns"
        success, error = retry_task(task_name, fetch_campaigns, region, start_date, end_date)
        results[f"meta_campaigns_{region}"] = {"success": success, "error": error}

        # Meta Ads
        task_name = f"{region.upper()} ads"
        success, error = retry_task(task_name, fetch_ads, region, start_date, end_date)
        results[f"meta_ads_{region}"] = {"success": success, "error": error}

        # Google Sheets
        task_name = f"{region.upper()} Ecosystem ROAS"
        success, error = retry_task(task_name, fetch_sheets, region)
        results[f"sheets_{region}"] = {"success": success, "error": error}

    # Summary
    elapsed = round(time.time() - start_time, 1)
    logger.info(f"\n{'='*50}")
    logger.info(f"REFRESH COMPLETE ({elapsed}s)")
    logger.info(f"{'='*50}")

    all_success = True
    failures = []

    for source, result in results.items():
        status = "OK" if result["success"] else "FAILED"
        logger.info(f"  {source}: {status}")
        if not result["success"]:
            all_success = False
            failures.append(f"{source}: {result['error']}")

    if failures:
        failure_msg = f"Data refresh completed with failures:\n" + "\n".join(f"  - {f}" for f in failures)
        notify(failure_msg, "warning")
        append_to_log(f"REFRESH DONE with failures: {', '.join(f.split(':')[0] for f in failures)}")
    else:
        append_to_log(f"REFRESH DONE: all sources OK ({elapsed}s)")

    # Save overall refresh status
    upload_json("refresh_status.json", {
        "last_refresh": date.today().isoformat(),
        "elapsed_seconds": elapsed,
        "all_success": all_success,
        "sources": results,
    })

    sys.exit(0 if all_success else 1)


if __name__ == "__main__":
    main()
