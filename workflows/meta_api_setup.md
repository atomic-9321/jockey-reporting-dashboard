# Meta Marketing API Setup

## Objective
Set up and maintain Meta API access for fetching campaign and ad data from Jockey EU and UK ad accounts.

## Prerequisites
- Meta Business Manager access to both Jockey EU and Jockey UK ad accounts
- A Meta App with Marketing API permissions

## Setup Steps

### 1. Create a Meta App (if not already done)
1. Go to https://developers.facebook.com/apps/
2. Create a new app (type: Business)
3. Add the "Marketing API" product

### 2. Generate a Long-Lived Access Token
1. Go to https://developers.facebook.com/tools/explorer/
2. Select your app
3. Request permissions: `ads_read`, `ads_management`, `read_insights`
4. Generate a **User Token**
5. Exchange for a long-lived token (60-day expiry):
   ```
   GET https://graph.facebook.com/v19.0/oauth/access_token?
     grant_type=fb_exchange_token&
     client_id={app-id}&
     client_secret={app-secret}&
     fb_exchange_token={short-lived-token}
   ```
6. Copy the long-lived token to `.env` as `META_ACCESS_TOKEN`

### 3. Get Ad Account IDs
1. In Meta Business Manager, go to Business Settings > Accounts > Ad Accounts
2. Copy the account IDs for EU and UK (format: `act_XXXXXXXXXX`)
3. Add to `.env` as `META_EU_ACCOUNT_ID` and `META_UK_ACCOUNT_ID`

### 4. Set Token Creation Date
Add to `.env`: `META_TOKEN_CREATED_AT=YYYY-MM-DD` (today's date)

## Token Renewal Process

**Tokens expire after 60 days.** The system tracks token age automatically:
- **Day 50**: Warning notification via Slack/email
- **Day 55**: Critical alert

### To Renew:
1. Go to Graph API Explorer
2. Generate a new short-lived token
3. Exchange for long-lived token (step 2 above)
4. Update `META_ACCESS_TOKEN` in `.env` and Vercel env vars
5. Update `META_TOKEN_CREATED_AT` to today's date
6. Test: `python tools/meta_fetch_campaigns.py --region eu --start 2026-04-01 --end 2026-04-06`

## Rate Limits
- Standard tier: 200 calls per hour per ad account
- The tools implement exponential backoff (5s, 15s, 45s)
- If consistently rate-limited, the refresh interval degrades from 6h to 12h

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| OAuthException (code 190) | Token expired | Renew token (see above) |
| Rate limit (code 4/17/32) | Too many requests | Wait and retry (automatic) |
| Permission denied (code 10) | Missing permission | Re-authorize with required scopes |
| Invalid account ID | Wrong account ID format | Ensure format is `act_XXXXXXXXXX` |
