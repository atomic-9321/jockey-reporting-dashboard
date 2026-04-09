"""Fetch Ecosystem ROAS data from Google Sheets.

Handles the 2-row merged-cell header structure:
  Row 0: Section names (merged across columns) — e.g. "SOURCE OF TRUTH/ WEBSHOP"
  Row 1: Metric sub-headers — e.g. "Total Revenue", "AOV"
  Row 2+: Data rows (monthly aggregates, then daily)

Usage:
    python tools/sheets_fetch_ecosystem.py [--region eu|uk|all]
"""

import os
import re
import sys
import json
import argparse
import logging
from datetime import date
from typing import Any, Dict, List, Optional, Tuple

from dotenv import load_dotenv

load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.utils.sheets_client import read_sheet_raw, get_sheet_names
from tools.utils.blob_client import upload_json, download_json, write_refresh_status, append_to_log
from tools.utils.date_utils import parse_month_label, parse_daily_date

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

# Map raw section names (from row 0) to normalized channel keys
SECTION_NORMALIZE = {
    "source of truth/ webshop": "webshop",
    "source of truth/webshop": "webshop",
    "total summary of yellow sections (do not edit)": "total_summary",
    "total summary of yellow sections": "total_summary",
    "total summary  of channels-> yellow sections (do not edit)": "total_summary",
    "total summary of channels-> yellow sections (do not edit)": "total_summary",
    "email": "email",
    "meta (tracked purchases)": "meta",
    "meta": "meta",
    "google": "google",
    "pinterest": "pinterest",
    "tiktok": "tiktok",
    "totals": "totals",
}

# Normalize metric sub-header names
METRIC_NORMALIZE = {
    "date": "date",
    "optimization log": "optimization_log",
    "total conversions": "total_conversions",
    "total revenue": "total_revenue",
    "total cpa": "total_cpa",
    "total\nroas": "total_roas",
    "total roas": "total_roas",
    "profit": "profit",
    "aov": "aov",
    "ad spend": "ad_spend",
    "% of revenue": "pct_of_revenue",
    "% of spend": "pct_of_spend",
}

CHANNEL_KEYS = ["webshop", "total_summary", "email", "meta", "google", "pinterest", "tiktok"]


def normalize_section(raw: str) -> str:
    """Normalize a section header to a channel key."""
    if not raw:
        return "unknown"
    cleaned = raw.strip().lower()
    # Remove common suffixes
    cleaned = re.sub(r"\s*\(do not edit\)", "", cleaned)
    for pattern, key in SECTION_NORMALIZE.items():
        if pattern in cleaned or cleaned in pattern:
            return key
    return cleaned.replace(" ", "_")


def normalize_metric(raw: str) -> str:
    """Normalize a metric sub-header to a snake_case key."""
    if not raw:
        return "unknown"
    cleaned = raw.strip().lower().replace("\n", " ").strip()
    return METRIC_NORMALIZE.get(cleaned, cleaned.replace(" ", "_").replace("%", "pct"))


def build_headers(row0: List[Any], row1: List[Any]) -> List[Tuple[str, str]]:
    """Build composite headers from the 2-row header structure.

    Returns list of (section_key, metric_key) tuples, one per column.
    Forward-fills row0 to handle merged cells (empty = continues previous section).
    """
    max_cols = max(len(row0), len(row1))
    headers = []

    current_section = "unknown"
    for i in range(max_cols):
        # Forward-fill section from row 0
        cell0 = row0[i] if i < len(row0) else None
        if cell0 is not None and str(cell0).strip():
            current_section = normalize_section(str(cell0))

        # Metric from row 1
        cell1 = row1[i] if i < len(row1) else None
        metric = normalize_metric(str(cell1)) if cell1 is not None else f"col_{i}"

        headers.append((current_section, metric))

    return headers


def classify_date(raw_date: str, fallback_year: int) -> Tuple[Optional[str], Optional[str], str]:
    """Classify a date value as monthly or daily.

    Returns (monthly_period, daily_date, row_type).
    row_type is 'monthly', 'daily', or 'skip'.
    """
    if not raw_date or not isinstance(raw_date, str):
        return None, None, "skip"

    raw_date = str(raw_date).strip()
    if not raw_date:
        return None, None, "skip"

    # Try monthly first
    monthly = parse_month_label(raw_date, fallback_year=fallback_year)
    if monthly:
        return monthly, None, "monthly"

    # Try daily
    daily = parse_daily_date(raw_date, fallback_year=fallback_year)
    if daily:
        return None, daily, "daily"

    return None, None, "skip"


def row_to_channels(values: List[Any], headers: List[Tuple[str, str]]) -> Dict[str, Dict[str, Any]]:
    """Convert a data row into a dict of channel -> metrics."""
    channels: Dict[str, Dict[str, Any]] = {}

    for i, (section, metric) in enumerate(headers):
        if section == "totals":
            continue  # Date and log columns handled separately

        value = values[i] if i < len(values) else None

        if section not in channels:
            channels[section] = {}
        channels[section][metric] = value

    return channels


def ensure_all_channels(channels: Dict) -> Dict:
    """Ensure all expected channel keys exist, fill missing with empty dicts."""
    for key in CHANNEL_KEYS:
        if key not in channels:
            channels[key] = {}
    return channels


def parse_sheet(raw_rows: List[List[Any]], fallback_year: int) -> Dict:
    """Parse a single sheet's raw rows into structured monthly + daily data."""
    if len(raw_rows) < 3:
        return {"monthly": [], "daily": []}

    row0 = raw_rows[0]
    row1 = raw_rows[1]
    data_rows = raw_rows[2:]

    headers = build_headers(row0, row1)

    # Find the date column index (totals.date)
    date_idx = None
    for i, (section, metric) in enumerate(headers):
        if section == "totals" and metric == "date":
            date_idx = i
            break
    if date_idx is None:
        date_idx = 0  # Fallback to first column

    monthly = []
    daily = []
    hit_separator = False  # After first blank row, we're in the daily section

    for row in data_rows:
        if not row or len(row) == 0:
            hit_separator = True
            continue

        raw_date = row[date_idx] if date_idx < len(row) else None
        if raw_date is None or (isinstance(raw_date, str) and not raw_date.strip()):
            hit_separator = True
            continue

        raw_date_str = str(raw_date).strip()

        if not hit_separator:
            # Before the separator: these are the real monthly rows
            monthly_period = parse_month_label(raw_date_str, fallback_year=fallback_year)
            if monthly_period:
                channels = row_to_channels(row, headers)
                channels = ensure_all_channels(channels)
                monthly.append({
                    "period": monthly_period,
                    "period_label": raw_date_str,
                    "date_raw": raw_date_str,
                    **channels,
                })
        else:
            # After the separator: daily data (skip month-name subtotals)
            daily_date = parse_daily_date(raw_date_str, fallback_year=fallback_year)
            if daily_date:
                channels = row_to_channels(row, headers)
                channels = ensure_all_channels(channels)
                daily.append({
                    "date": daily_date,
                    "date_raw": raw_date_str,
                    **channels,
                })
            # else: skip subtotal rows like "August", "März" etc.

    return {"monthly": monthly, "daily": daily}


def fetch_and_save(region: str) -> bool:
    """Fetch Ecosystem ROAS data for a region. Returns True on success."""
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
        sheet_names = get_sheet_names(spreadsheet_id)
        logger.info(f"Found sheets: {sheet_names}")

        all_data = {}
        current_year = date.today().year

        for sheet_name in sheet_names:
            # Determine fallback year from sheet name if possible
            fallback_year = current_year
            year_match = re.search(r"20\d{2}", sheet_name)
            if year_match:
                fallback_year = int(year_match.group())

            # Read the full sheet with extended range for all columns
            range_name = f"'{sheet_name}'!A1:BZ1000"
            raw_rows = read_sheet_raw(spreadsheet_id, range_name)

            if not raw_rows or len(raw_rows) < 3:
                logger.warning(f"Sheet '{sheet_name}' has insufficient data ({len(raw_rows)} rows)")
                continue

            parsed = parse_sheet(raw_rows, fallback_year)
            all_data[sheet_name] = parsed
            logger.info(
                f"Parsed '{sheet_name}': {len(parsed['monthly'])} monthly rows, "
                f"{len(parsed['daily'])} daily rows"
            )

        output = {
            "region": region.upper(),
            "currency": config["currency"],
            "spreadsheet_id": spreadsheet_id,
            "fetched_at": date.today().isoformat(),
            "channels": CHANNEL_KEYS,
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
