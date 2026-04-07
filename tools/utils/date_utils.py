"""Calendar week and date range utilities."""

from datetime import datetime, timedelta, date
from typing import Tuple, List


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
