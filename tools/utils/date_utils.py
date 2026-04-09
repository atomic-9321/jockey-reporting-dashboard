"""Calendar week and date range utilities."""

import re
from datetime import datetime, timedelta, date
from typing import Optional, Tuple, List


def get_calendar_week(d: date) -> Tuple[int, int]:
    """Return (year, calendar_week) for a given date using ISO 8601."""
    iso = d.isocalendar()
    return iso[0], iso[1]


def cw_to_date_range(year: int, cw: int) -> Tuple[date, date]:
    """Convert a calendar week to (start_date, end_date) — Monday to Sunday."""
    jan4 = date(year, 1, 4)
    start_of_week1 = jan4 - timedelta(days=jan4.weekday())
    start = start_of_week1 + timedelta(weeks=cw - 1)
    end = start + timedelta(days=6)
    return start, end


def get_all_cws(start_date: date, end_date: date) -> List[Tuple[int, int]]:
    """Return all (year, cw) tuples between start_date and end_date."""
    cws = []
    current = start_date
    seen = set()
    while current <= end_date:
        ycw = get_calendar_week(current)
        if ycw not in seen:
            seen.add(ycw)
            cws.append(ycw)
        current += timedelta(days=7)
    return cws


def cw_label(year: int, cw: int) -> str:
    """Return a human-readable label like '2026-CW14'."""
    return f"{year}-CW{cw:02d}"


def date_to_meta_format(d: date) -> str:
    """Format date for Meta API (YYYY-MM-DD)."""
    return d.strftime("%Y-%m-%d")


def get_months_in_range(start_date: date, end_date: date) -> List[Tuple[int, int]]:
    """Return all (year, month) tuples in range."""
    months = []
    current = start_date.replace(day=1)
    while current <= end_date:
        months.append((current.year, current.month))
        if current.month == 12:
            current = current.replace(year=current.year + 1, month=1)
        else:
            current = current.replace(month=current.month + 1)
    return months


# ── Month Label Parsing (for ecosystem sheets) ──

MONTH_MAP = {
    "january": 1, "januar": 1, "jan": 1,
    "february": 2, "februar": 2, "feb": 2,
    "march": 3, "maerz": 3, "märz": 3, "mar": 3,
    "april": 4, "apr": 4,
    "may": 5, "mai": 5,
    "june": 6, "juni": 6, "jun": 6,
    "july": 7, "juli": 7, "jul": 7,
    "august": 8, "aug": 8,
    "september": 9, "sep": 9, "sept": 9,
    "october": 10, "oktober": 10, "oct": 10, "okt": 10,
    "november": 11, "nov": 11,
    "december": 12, "dezember": 12, "dec": 12, "dez": 12,
}


def parse_month_label(label: str, fallback_year: Optional[int] = None) -> Optional[str]:
    """Parse a month label like 'March 2025' or 'Dezember 2024' into 'YYYY-MM'.

    Handles: 'March 2025', 'Dezember 2024', 'February', 'Mai 2025'.
    If no year in the label, uses fallback_year (or current year).
    Returns None if unparseable.
    """
    if not label or not isinstance(label, str):
        return None
    label = label.strip()

    # Try "Month Year" or just "Month"
    parts = label.split()
    month_str = parts[0].lower().rstrip(",")
    month_num = MONTH_MAP.get(month_str)
    if month_num is None:
        return None

    year = fallback_year or date.today().year
    if len(parts) >= 2:
        try:
            year = int(parts[-1])
        except ValueError:
            pass

    return f"{year}-{month_num:02d}"


def parse_daily_date(label: str, fallback_year: Optional[int] = None) -> Optional[str]:
    """Parse a daily date label into 'YYYY-MM-DD'.

    Handles formats like:
    - 'Thursday, August 1'
    - 'Monday, August 5'
    - 'Sunday, June 8'
    - '01/03/2025'
    Returns None if unparseable.
    """
    if not label or not isinstance(label, str):
        return None
    label = label.strip()

    # Try "DayOfWeek, Month Day" format
    match = re.match(r"(?:\w+),?\s+(\w+)\s+(\d{1,2})", label)
    if match:
        month_str = match.group(1).lower()
        day = int(match.group(2))
        month_num = MONTH_MAP.get(month_str)
        if month_num:
            year = fallback_year or date.today().year
            try:
                return date(year, month_num, day).isoformat()
            except ValueError:
                return None

    # Try DD/MM/YYYY
    match = re.match(r"(\d{1,2})/(\d{1,2})/(\d{4})", label)
    if match:
        day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        try:
            return date(year, month, day).isoformat()
        except ValueError:
            return None

    return None


def date_to_cw(date_str: str) -> str:
    """Convert 'YYYY-MM-DD' to 'YYYY-CWNN' (ISO calendar week)."""
    d = date.fromisoformat(date_str)
    iso_year, iso_week, _ = d.isocalendar()
    return f"{iso_year}-CW{iso_week:02d}"


def six_months_ago() -> date:
    """Return the date 6 months ago from today."""
    today = date.today()
    month = today.month - 6
    year = today.year
    if month <= 0:
        month += 12
        year -= 1
    try:
        return date(year, month, today.day)
    except ValueError:
        # Handle months with fewer days (e.g., Feb 30 -> Feb 28)
        return date(year, month + 1, 1) - timedelta(days=1)
