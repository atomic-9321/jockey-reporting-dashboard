"""Data quality controls: deduplication, anomaly detection, null handling."""

import logging
from typing import Dict, List, Optional, Any, Tuple

logger = logging.getLogger(__name__)

# Anomaly threshold: flag metrics that change >500% week-over-week
ANOMALY_THRESHOLD = 5.0  # 500%


def deduplicate_by_key(
    records: List[Dict[str, Any]],
    key_fields: List[str],
) -> List[Dict[str, Any]]:
    """Deduplicate records by composite key, keeping the last occurrence.

    Args:
        records: List of record dicts
        key_fields: Fields that form the composite dedup key

    Returns:
        Deduplicated list (order preserved, last wins)
    """
    seen = {}
    for record in records:
        key = tuple(record.get(f) for f in key_fields)
        seen[key] = record

    deduped = list(seen.values())
    removed = len(records) - len(deduped)
    if removed > 0:
        logger.info(f"Deduplicated: removed {removed} duplicate records")

    return deduped


def detect_anomalies(
    current_metrics: Dict[str, Optional[float]],
    previous_metrics: Dict[str, Optional[float]],
    metric_keys: Optional[List[str]] = None,
) -> Dict[str, Dict[str, Any]]:
    """Detect metrics with >500% week-over-week change.

    Returns:
        Dict of flagged metrics: {metric_name: {current, previous, change_pct, flagged: True}}
    """
    if metric_keys is None:
        metric_keys = [
            "spend", "impressions", "clicks", "purchases",
            "purchase_value", "roas", "cpa", "add_to_cart",
            "checkout_initiated",
        ]

    flags = {}
    for key in metric_keys:
        current = current_metrics.get(key)
        previous = previous_metrics.get(key)

        if current is None or previous is None:
            continue
        if previous == 0:
            # If previous was 0 and current is non-zero, flag it
            if current > 0:
                flags[key] = {
                    "current": current,
                    "previous": previous,
                    "change_pct": None,  # Infinite change
                    "flagged": True,
                    "reason": "Changed from zero to non-zero",
                }
            continue

        change_pct = abs((current - previous) / previous)
        if change_pct > ANOMALY_THRESHOLD:
            flags[key] = {
                "current": current,
                "previous": previous,
                "change_pct": round(change_pct * 100, 1),
                "flagged": True,
                "reason": f"Changed {round(change_pct * 100, 1)}% week-over-week",
            }

    return flags


def merge_with_last_good(
    new_data: Optional[Dict[str, Any]],
    last_good_data: Optional[Dict[str, Any]],
) -> Tuple[Dict[str, Any], bool]:
    """Merge new data with last good data, preferring new data when available.

    Returns:
        (merged_data, is_fresh) — is_fresh is True if new_data was used
    """
    if new_data is not None:
        return new_data, True

    if last_good_data is not None:
        logger.warning("Using last good data — new fetch failed")
        return last_good_data, False

    logger.error("No data available — both new and last good are None")
    return {}, False


def sanitize_metric(value: Any) -> Optional[float]:
    """Convert a metric value to float or None.

    - None, empty string, 'N/A' -> None (unavailable)
    - 0 -> 0.0 (genuine zero)
    - Numeric string -> float
    """
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        value = value.strip()
        if value in ("", "N/A", "n/a", "-", "--"):
            return None
        try:
            return float(value.replace(",", ""))
        except ValueError:
            return None
    return None


def validate_refresh_data(data: Dict[str, Any], required_keys: List[str]) -> bool:
    """Validate that refresh data has all required top-level keys."""
    missing = [k for k in required_keys if k not in data]
    if missing:
        logger.error(f"Refresh data missing required keys: {missing}")
        return False
    return True
