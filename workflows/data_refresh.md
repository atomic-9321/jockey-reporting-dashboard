# Data Refresh Workflow

## Objective
Keep dashboard data fresh by periodically fetching from Meta Marketing API and Google Sheets.

## Schedule
- **Primary**: Every 6 hours via GitHub Action or external cron
- **Fallback**: Every 12 hours if Meta API rate-limits
- **Manual**: "Refresh Now" button in dashboard (admin only)

## How It Works

### Automated Refresh
```bash
python tools/refresh_all_data.py --region all --days-back 30
```

This runs all fetchers independently:
1. Meta Campaigns (EU) -> `meta_eu_campaigns.json`
2. Meta Campaigns (UK) -> `meta_uk_campaigns.json`
3. Meta Ads (EU) -> `meta_eu_ads.json`
4. Meta Ads (UK) -> `meta_uk_ads.json`
5. Google Sheets (EU) -> `sheets_eu_ecosystem.json`
6. Google Sheets (UK) -> `sheets_uk_ecosystem.json`

### Key Behaviors
- **Independent sources**: If Meta fails, Sheets still refreshes (and vice versa)
- **Retry logic**: 3 retries with exponential backoff (5s, 15s, 45s)
- **Idempotent**: Running twice never creates duplicates (dedup by ID+date)
- **Last good data**: On failure, dashboard keeps showing previous successful data
- **Token age check**: Warns at day 50, alerts at day 55 of 60-day Meta token cycle

### What Gets Updated
- JSON data files in Vercel Blob (production) or `.tmp/data/` (local)
- `refresh_status.json` with per-source timestamps and error states
- `.tmp/logs/refresh.log` with detailed execution log

## Historical Backfill
For first setup or re-fetching bad data:
```bash
# Full 6-month backfill
python tools/backfill.py --region all --months 6

# Re-fetch a specific calendar week
python tools/backfill.py --region eu --cw 2026-CW14
```

## Manual Refresh
Via dashboard API (admin only):
```
POST /api/refresh
```

## Monitoring
- Dashboard header shows "Last updated" per data source
- Amber banner if any source is >12 hours stale
- Slack/email notifications for failures and token expiry

## Failure Scenarios

| Scenario | Behavior |
|----------|----------|
| Meta API down | Keep last good Meta data, refresh Sheets normally |
| Meta rate limited | Retry 3x with backoff, then fail gracefully |
| Meta token expired | Alert notification, keep last good data |
| Google Sheets schema changed | Keep last good Sheets data, log error |
| Partial failure | Keep successful sources, retry failed ones |
| Network timeout | Retry with backoff |

## GitHub Action Setup (for production)
Create `.github/workflows/refresh.yml`:
```yaml
name: Data Refresh
on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - run: pip install -r tools/requirements.txt
      - run: python tools/refresh_all_data.py --region all
        env:
          META_ACCESS_TOKEN: ${{ secrets.META_ACCESS_TOKEN }}
          META_EU_ACCOUNT_ID: ${{ secrets.META_EU_ACCOUNT_ID }}
          META_UK_ACCOUNT_ID: ${{ secrets.META_UK_ACCOUNT_ID }}
          GOOGLE_SHEETS_EU_ID: ${{ secrets.GOOGLE_SHEETS_EU_ID }}
          GOOGLE_SHEETS_UK_ID: ${{ secrets.GOOGLE_SHEETS_UK_ID }}
          BLOB_READ_WRITE_TOKEN: ${{ secrets.BLOB_READ_WRITE_TOKEN }}
          META_TOKEN_CREATED_AT: ${{ secrets.META_TOKEN_CREATED_AT }}
```
