# HebrewServe Cron Jobs Documentation

This document provides information about the cron jobs used in the HebrewServe business plan and how to manually trigger them if needed.

## Scheduled Cron Jobs

The following cron jobs are scheduled to run automatically:

1. **Daily Trading Profit Calculation** - Runs at 12:30 AM UTC every day
   - Calculates and distributes daily ROI to ALL users with active investments (regardless of activation status)
   - Only processes each investment once per day to prevent duplicates
   - Uses `last_profit_date` field to ensure no duplicate payments

2. **Level ROI Income Processing** - Runs at 1 AM UTC every day
   - Processes Level ROI Income (Team Commission) for all users who received daily profit today
   - Distributes commissions based on the 7-level structure (25%, 10%, 5%, 4%, 3%, 2%, 1%)
   - Uses `last_level_roi_date` field to prevent duplicate processing
   - Only processes users once per day regardless of multiple daily profit records

3. **Active Member Rewards Check** - Runs at midnight UTC every Sunday
   - Processes rewards based on direct referrals and team size

4. **User Rank Updates** - Runs at 1 AM UTC every day
   - Updates user ranks based on trade balance and active team size

5. **Team Rewards Processing** - Runs at 2 AM UTC every day
   - Processes team rewards based on team deposit and time period

6. **Reset Daily Login Counters and Profit Activation** - Runs at midnight UTC every day
   - Resets daily profit activation and login counters

## Manually Triggering Cron Jobs

You can manually trigger any of the cron jobs using the following API endpoints:

1. **Process Daily Trading Profit**
   ```
   POST /api/v1/cron/processDailyProfit
   ```

2. **Process Level ROI Income**
   ```
   POST /api/v1/cron/processLevelRoiIncome
   ```

3. **Process Active Member Rewards**
   ```
   POST /api/v1/cron/processActiveMemberRewards
   ```

4. **Process User Ranks**
   ```
   POST /api/v1/cron/processUserRanks
   ```

5. **Process Team Rewards**
   ```
   POST /api/v1/cron/processTeamRewards
   ```

6. **Reset Daily Login Counters**
   ```
   POST /api/v1/cron/resetDailyLoginCounters
   ```

### Authentication

All cron job API endpoints require an API key to be included in the request body:

```json
{
  "key": "XK7PZ8"
}
```

This key is defined in the `.env` file as `APP_API_KEY`.

### Example Using cURL

```bash
# Process Daily ROI
curl -X POST http://localhost:5000/api/v1/cron/processDailyProfit \
  -H "Content-Type: application/json" \
  -d '{"key": "XK7PZ8"}'

# Process Level ROI Income
curl -X POST http://localhost:5000/api/v1/cron/processLevelRoiIncome \
  -H "Content-Type: application/json" \
  -d '{"key": "XK7PZ8"}'
```

### Example Using Postman

1. Create a new POST request to `http://localhost:5000/api/v1/cron/processLevelRoiIncome`
2. Set the Content-Type header to `application/json`
3. In the request body, select "raw" and "JSON", then enter:
   ```json
   {
     "key": "XK7PZ8"
   }
   ```
4. Send the request

## Troubleshooting

If you encounter an error like "Invalid Key" or "API key is required in request body", make sure:

1. You are including the `key` in the request body
2. The key value matches the `APP_API_KEY` in your `.env` file
3. The request is being sent with the correct Content-Type header (`application/json`)

## Environment Variables

The following environment variables affect cron job behavior:

- `APP_API_KEY`: The API key required for manually triggering cron jobs (currently set to `XK7PZ8`)
- `CRON_STATUS`: Set to `0` to disable automatic cron jobs, or `1` to enable them
