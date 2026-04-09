"""Google Sheets API client with schema validation."""

import os
import json
import logging
from typing import Dict, List, Optional, Any

from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
TOKEN_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "token.json")
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "credentials.json")


def get_sheets_service():
    """Authenticate and return a Google Sheets service instance.

    Supports two auth modes:
    - Service account: set GOOGLE_SERVICE_ACCOUNT_JSON env var (used in CI)
    - OAuth: uses credentials.json + token.json (used locally)
    """
    # 1. Service account JSON (CI option A)
    sa_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        info = json.loads(sa_json)
        creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
        return build("sheets", "v4", credentials=creds)

    # 2. OAuth token from env var (CI option B — no key file needed)
    token_json = os.getenv("GOOGLE_OAUTH_TOKEN_JSON")
    if token_json:
        info = json.loads(token_json)
        creds = Credentials.from_authorized_user_info(info, SCOPES)
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return build("sheets", "v4", credentials=creds)

    # 3. OAuth from local files (development)
    creds = None

    if os.path.exists(TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CREDENTIALS_PATH):
                raise FileNotFoundError(
                    f"credentials.json not found at {CREDENTIALS_PATH}. "
                    "Download it from Google Cloud Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_PATH, "w") as token:
            token.write(creds.to_json())

    return build("sheets", "v4", credentials=creds)


def _parse_cell(value: Any) -> Any:
    """Parse a single cell value: convert numeric strings, currencies, percentages."""
    if value is None:
        return None
    if not isinstance(value, str):
        return value
    value = value.strip()
    if value == "" or value == "-" or value == "--":
        return None
    if value.startswith("#"):  # #REF!, #DIV/0!, etc.
        return None
    try:
        if value.endswith("%"):
            return float(value.rstrip("%"))
        if value.startswith(("$", "€", "£")):
            return float(value[1:].replace(",", ""))
        cleaned = value.replace(",", "")
        f = float(cleaned)
        return int(f) if f == int(f) else f
    except ValueError:
        return value  # Keep as string


def read_sheet_raw(
    spreadsheet_id: str,
    range_name: str,
) -> List[List[Any]]:
    """Read a range from a Google Sheet and return as raw 2D list.

    Each inner list is one row. Cell values are parsed via _parse_cell().
    Useful for sheets with merged/multi-row headers where dict conversion
    would lose columns.
    """
    service = get_sheets_service()

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )

    values = result.get("values", [])
    parsed = []
    for row in values:
        parsed.append([_parse_cell(cell) for cell in row])
    return parsed


def validate_schema(headers: List[str], expected_columns: List[str]) -> bool:
    """Validate that the sheet has the expected column headers.

    Returns True if all expected columns are present (order doesn't matter).
    """
    headers_lower = [h.strip().lower() for h in headers]
    expected_lower = [c.strip().lower() for c in expected_columns]

    missing = [c for c in expected_lower if c not in headers_lower]
    if missing:
        logger.error(f"Schema validation failed. Missing columns: {missing}")
        logger.error(f"Found columns: {headers}")
        return False

    return True


def read_sheet(
    spreadsheet_id: str,
    range_name: str,
    expected_columns: Optional[List[str]] = None,
) -> Optional[List[Dict[str, Any]]]:
    """Read a range from a Google Sheet and return as list of dicts.

    Args:
        spreadsheet_id: The Google Sheets ID
        range_name: The range to read (e.g. 'Sheet1!A1:Z100')
        expected_columns: If provided, validate headers match these columns

    Returns:
        List of dicts (one per row), or None if schema validation fails
    """
    service = get_sheets_service()

    result = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=range_name)
        .execute()
    )

    values = result.get("values", [])
    if not values or len(values) < 2:
        logger.warning(f"Sheet {spreadsheet_id} range {range_name} is empty or has only headers")
        return []

    headers = values[0]

    # Schema validation
    if expected_columns and not validate_schema(headers, expected_columns):
        logger.error("Schema mismatch — keeping last good data, not overwriting")
        return None

    rows = []
    for row_values in values[1:]:
        row_dict = {}
        for i, header in enumerate(headers):
            value = row_values[i] if i < len(row_values) else None
            row_dict[header.strip()] = _parse_cell(value)
        rows.append(row_dict)

    return rows


def get_sheet_names(spreadsheet_id: str) -> List[str]:
    """Return all sheet/tab names in a spreadsheet."""
    service = get_sheets_service()
    meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    return [sheet["properties"]["title"] for sheet in meta.get("sheets", [])]
