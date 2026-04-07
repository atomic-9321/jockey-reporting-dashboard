# Weekly Report Generation

## Objective

Generate a standalone HTML weekly performance report for a completed calendar week. The report includes store KPIs, paid media metrics, campaign breakdowns, AI insights, and next-step recommendations for both UK and EU regions.

## Prerequisites

1. **Data must be fresh**: Run `python tools/refresh_all_data.py` first to ensure `.tmp/data/` has current campaign, ad, and ecosystem data.
2. **Calendar week must be complete**: The tool will refuse to generate a report for a week that hasn't ended yet (today must be past the CW's Sunday).
3. **For AI insights** (optional): The Next.js dashboard must be running locally (`npm run dev` in `dashboard/`) so the tool can call `/api/insights`.

## Usage

```bash
# Generate report for a specific calendar week (both regions)
python tools/generate_weekly_report.py --cw 2026-CW14

# Generate for a single region
python tools/generate_weekly_report.py --cw 2026-CW15 --region uk

# EU only
python tools/generate_weekly_report.py --cw 2026-CW15 --region eu
```

## What It Does

1. **Validates** the CW is complete (past its Sunday end date)
2. **Loads** campaign data, ad data, and ecosystem/store data from `.tmp/data/` JSON files
3. **Builds** the report DATA object per region:
   - Store-level KPIs from Google Sheets ecosystem data
   - Campaign metrics from Meta API data (spend, ROAS, purchases, CPA, AOV, frequency)
   - Ad format split (video/static count) and top-performing ad per campaign
   - Short campaign names via automatic prefix stripping
   - Funnel stage detection from campaign name patterns
4. **Fetches AI insights** from `/api/insights` (report mode) if the dashboard is running, otherwise generates template-based insights from performance thresholds
5. **Injects** data into the HTML template and saves the output

## Output

Reports are saved to:
```
.tmp/reports/Weekly_Report_CW{nn}_{MonDD}_{MonDD}_{Year}.html
```

Example: `.tmp/reports/Weekly_Report_CW14_Mar30_Apr05_2026.html`

The HTML file is fully self-contained (no external dependencies except the Google Fonts CDN) and can be:
- Opened directly in any browser
- Sent via email as an attachment
- Uploaded to Google Drive or shared storage

## Report Features

- **Region toggle**: Switch between UK and EU data
- **Store KPIs**: Revenue, Profit, Conversions, ROAS, AOV, CPA
- **Paid Media KPIs**: Total Spend, Purchases, Revenue, Blended ROAS, Avg Frequency
- **Spend vs Revenue chart**: Horizontal bar chart per campaign
- **Funnel breakdown**: TOF/MOF/BOF stage aggregation
- **Campaign cards**: Expandable with full metrics, AI insights, and 4 next steps
- **Sort controls**: ROAS, Spend, Revenue, Purchases, CPP, AOV, Frequency

## Automation

To automate weekly generation, run on Monday mornings after the data refresh:

```bash
# In a cron job or GitHub Action (Monday 8am):
python tools/refresh_all_data.py --region all
python tools/generate_weekly_report.py --cw $(python -c "
from datetime import date; from tools.utils.date_utils import get_calendar_week, cw_label
d = date.today(); y, w = get_calendar_week(d)
print(cw_label(y, w - 1))
")
```

## Template Customization

The HTML template lives at `tools/templates/weekly_report_template.html`. It contains all CSS and JS rendering logic. The only dynamic parts are:
- `__DATA_PLACEHOLDER__` — replaced with the JSON data object
- `__SUBTITLE_PLACEHOLDER__` — replaced with the date range and generation date

To modify the report design, edit the template directly. The `DATA` structure must match the expected shape (see the CW14 reference report for the exact schema).
