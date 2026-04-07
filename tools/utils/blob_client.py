"""Vercel Blob storage client for uploading and downloading JSON data.

In development, falls back to local .tmp/data/ files.
In production, uses Vercel Blob API.
"""

import os
import json
import logging
from typing import Any, Optional
from datetime import datetime

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

LOCAL_DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "data")
LOCAL_LOGS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", ".tmp", "logs")


def _is_production() -> bool:
    """Check if we're running in production (Vercel Blob token available)."""
    return bool(os.getenv("BLOB_READ_WRITE_TOKEN"))


def _ensure_local_dirs():
    """Ensure local directories exist for development."""
    os.makedirs(LOCAL_DATA_DIR, exist_ok=True)
    os.makedirs(LOCAL_LOGS_DIR, exist_ok=True)


def upload_json(filename: str, data: Any) -> str:
    """Upload JSON data to Vercel Blob or local file.

    Args:
        filename: The blob/file name (e.g., 'meta_eu_campaigns.json')
        data: The data to serialize as JSON

    Returns:
        The URL or path where the data was stored
    """
    json_str = json.dumps(data, indent=2, default=str)

    if _is_production():
        try:
            import requests

            token = os.getenv("BLOB_READ_WRITE_TOKEN")
            resp = requests.put(
                f"https://blob.vercel-storage.com/{filename}",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                    "x-api-version": "7",
                },
                data=json_str,
            )
            resp.raise_for_status()
            result = resp.json()
            url = result.get("url", "")
            logger.info(f"Uploaded {filename} to Vercel Blob: {url}")
            return url
        except Exception as e:
            logger.error(f"Vercel Blob upload failed for {filename}: {e}")
            # Fall back to local
            logger.info("Falling back to local storage")

    # Local storage
    _ensure_local_dirs()
    filepath = os.path.join(LOCAL_DATA_DIR, filename)
    with open(filepath, "w") as f:
        f.write(json_str)
    logger.info(f"Saved {filename} locally: {filepath}")
    return filepath


def download_json(filename: str) -> Optional[Any]:
    """Download JSON data from Vercel Blob or local file.

    Returns:
        Parsed JSON data, or None if not found
    """
    if _is_production():
        try:
            import requests

            token = os.getenv("BLOB_READ_WRITE_TOKEN")
            # List blobs to find the URL
            resp = requests.get(
                "https://blob.vercel-storage.com",
                headers={
                    "Authorization": f"Bearer {token}",
                    "x-api-version": "7",
                },
                params={"prefix": filename},
            )
            resp.raise_for_status()
            blobs = resp.json().get("blobs", [])

            if blobs:
                blob_url = blobs[0]["url"]
                data_resp = requests.get(blob_url)
                data_resp.raise_for_status()
                return data_resp.json()
        except Exception as e:
            logger.error(f"Vercel Blob download failed for {filename}: {e}")

    # Local storage
    filepath = os.path.join(LOCAL_DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)

    return None


def read_local_json(filename: str) -> Optional[Any]:
    """Read a JSON file from local .tmp/data/ directory."""
    filepath = os.path.join(LOCAL_DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            return json.load(f)
    return None


def write_refresh_status(source: str, success: bool, error: Optional[str] = None):
    """Update the refresh status for a data source."""
    status_file = "refresh_status.json"
    current = download_json(status_file) or {}

    current[source] = {
        "last_attempt": datetime.utcnow().isoformat(),
        "success": success,
        "error": error,
    }

    if success:
        current[source]["last_success"] = datetime.utcnow().isoformat()
    elif source in current and "last_success" in current.get(source, {}):
        # Preserve last successful timestamp on failure
        pass

    upload_json(status_file, current)


def append_to_log(message: str):
    """Append a message to the refresh log."""
    _ensure_local_dirs()
    log_file = os.path.join(LOCAL_LOGS_DIR, "refresh.log")
    timestamp = datetime.utcnow().isoformat()
    with open(log_file, "a") as f:
        f.write(f"[{timestamp}] {message}\n")
