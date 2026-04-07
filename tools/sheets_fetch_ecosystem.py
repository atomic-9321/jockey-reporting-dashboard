"""Fetch Ecosystem ROAS data from Google Sheets.

Usage:
    python tools/sheets_fetch_ecosystem.py [--region eu|uk|all]
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

from tools.utils.sheets_client import read_sheet, get_sheet_names
from tools.utils.blob_client import upload_json, download_json, write_refresh_status, append_to_log
from tools.utils.data_quality import sanitize_metric

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

REGIONS = {
    "eu": {
        "spreadsheet_id": os.getenv("GOOGLE_SHEETS_EU_ID"),
        "currency": "EUR",
        "filename": "sheets_eu_ecosystem.json",
    },
    "uk": {
        "spreadsheet_id": os.getenv("GOOGLE_SHEETS_UK_ID"),
        "currency": "GBP",
        "filename": "sheets_uk_ecosystem.json",
    },
}

# Expected columns in the Ecosystem ROAS sheet
# (adjust these once we see the actual sheet structure)
EXPECTED_COLUMNS = [
    # These are the most common store-level metrics.
    # Schema validation will flag if any are missing.
    # We'll refine this list once we see the actual spreadsheet.
]


def parse_ecosystem_data(rows, currency):
    """Parse raw sheet rows into structured weekly data.

    The sheet is organized by Calendar Weeks. We detect CW labels
    in the data and group metrics accordingly.
    """
    weeks = []

    for row in rows:
        # Try to identify the calendar week from the row
        # Common patterns: "CW14", "Week 14", "Calendar Week 14", or a date column
        week_data = {
            "raw": row,
            "metrics": {},
        }

        for key, value in row.items():
            key_lower = key.lower().strip()

            # Detect CW identifier
            if any(term in key_lower for term in ["week", "cw", "calendar"]):
                week_data["calendar_week"] = str(value) if value is not None else None
                continue

            # Sanitize numeric metrics
            sanitized = sanitize_metric(value)
            if sanitized is not None or value is None:
                week_data["metrics"][key] = sanitized
            else:
                week_data["metrics"][key] = value  # Keep as string if not numeric

        weeks.append(week_data)

    return weeks


def fetch_and_save(region: str) -> bool:
    """Fetch Ecosystem ROAS data for a region.

    Returns True on success.
    """
    config = REGIONS.get(region)
    if not config:
        logger.error(f"Unknown region: {region}")
        return False

    spreadsheet_id = config["spreadsheet_id"]
    if not spreadsheet_id:
        logger.error(f"GOOGLE_SHEETS_{region.upper()}_ID not set in .env")
        return False

    logger.info(f"Fetching {region.upper()} Ecosystem ROAS sheet")

    try:
        # First, discover sheet names
        sheet_names = get_sheet_names(spreadsheet_id)
        logger.info(f"Found sheets: {sheet_names}")

        all_data = {}

        for sheet_name in sheet_names:
            # Read the entire sheet
            range_name = f"'{sheet_name}'!A1:Z1000"
            rows = read_sheet(
                spreadsheet_id,
                range_name,
                expected_columns=EXPECTED_COLUMNS if EXPECTED_COLUMNS else None,
            )

            if rows is None:
                # Schema validation failed — keep last good data
                logger.error(f"Schema validation failed for sheet '{sheet_name}'")
                continue

            if rows == []:
                logger.warning(f"Sheet '{sheet_name}' is empty")
                continue

            parsed = parse_ecosystem_data(rows, config["currency"])
            all_data[sheet_name] = parsed
            logger.info(f"Parsed {len(parsed)} rows from '{sheet_name}'")

        output = {
            "region": region.upper(),
            "currency": config["currency"],
            "spreadsheet_id": spreadsheet_id,
            "fetched_at": date.today().isoformat(),
            "sheets": all_data,
        }

        upload_json(config["filename"], output)
        write_refresh_status(f"sheets_ecosystem_{region}", success=True)
        append_to_log(f"SUCCESS: Fetched {region.upper()} Ecosystem ROAS ({len(all_data)} sheets)")
        logger.info(f"Saved {region.upper()} Ecosystem ROAS data")
        return True

    except Exception as e:
        error_msg = f"FAILED: {region.upper()} Ecosystem ROAS — {str(e)}"
        write_refresh_status(f"sheets_ecosystem_{region}", success=False, error=str(e))
        append_to_log(error_msg)
        logger.error(error_msg)
        return False


def main():
    parser = argparse.ArgumentParser(description="Fetch Ecosystem ROAS from Google Sheets")
    parser.add_argument("--region", choices=["eu", "uk", "all"], default="all")
    args = parser.parse_args()

    regions = ["eu", "uk"] if args.region == "all" else [args.region]
    results = {}

    for region in regions:
        results[region] = fetch_and_save(region)

    for region, success in results.items():
        status = "OK" if success else "FAILED"
        logger.info(f"{region.upper()}: {status}")

    if all(results.values()):
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
