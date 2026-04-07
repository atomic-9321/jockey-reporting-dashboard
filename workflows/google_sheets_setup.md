# Google Sheets API Setup

## Objective
Set up Google Sheets API access to read Ecosystem ROAS spreadsheets for Jockey EU and UK.

## Prerequisites
- Google Cloud project with Sheets API enabled
- OAuth 2.0 credentials (Desktop app type)
- Read access to both EU and UK Ecosystem ROAS spreadsheets

## Setup Steps

### 1. Create Google Cloud Project
1. Go to https://console.cloud.google.com/
2. Create a new project (e.g., "Jockey Reporting")
3. Enable the Google Sheets API: APIs & Services > Library > search "Google Sheets API" > Enable

### 2. Create OAuth Credentials
1. Go to APIs & Services > Credentials
2. Create Credentials > OAuth Client ID
3. Application type: Desktop application
4. Download the JSON file as `credentials.json`
5. Place it in the project root (it's gitignored)

### 3. First-Time Authorization
1. Run: `python tools/sheets_fetch_ecosystem.py --region eu`
2. A browser window will open asking for Google account authorization
3. Authorize with the account that has access to the spreadsheets
4. This creates `token.json` (also gitignored) for future requests

### 4. Configure Spreadsheet IDs
1. Open each Ecosystem ROAS spreadsheet in Google Sheets
2. Copy the spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
3. Add to `.env`:
   - `GOOGLE_SHEETS_EU_ID=your_eu_spreadsheet_id`
   - `GOOGLE_SHEETS_UK_ID=your_uk_spreadsheet_id`

## Spreadsheet Schema

The tool reads all tabs in the spreadsheet. It expects data organized by Calendar Weeks with metrics as columns.

### Schema Validation
- The tool validates column headers on each fetch
- If the schema changes (columns renamed/removed), the tool:
  1. Logs the error
  2. Keeps the last good data
  3. Flags the issue in refresh status
  4. Does NOT overwrite good data with bad data

### To Update Expected Columns
Edit `EXPECTED_COLUMNS` in `tools/sheets_fetch_ecosystem.py` when the spreadsheet structure changes.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| credentials.json not found | Missing OAuth file | Download from Google Cloud Console |
| token.json expired | Refresh token invalid | Delete token.json and re-authorize |
| 403 Forbidden | No access to spreadsheet | Share the spreadsheet with the OAuth account |
| Schema validation failed | Column names changed | Update EXPECTED_COLUMNS or fix the sheet |
