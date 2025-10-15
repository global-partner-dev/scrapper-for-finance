# US Indices Scraper

## Overview

This module scrapes US stock market indices data from investing.com and stores it in Supabase database.

## Features

- Scrapes major US indices (S&P 500, Dow Jones, Nasdaq 100, Nasdaq)
- Runs automatically every 2 minutes via cron job
- Stores historical data in Supabase
- Provides REST API endpoints for data access

## Files Structure

```
backend/
├── scrapers/
│   ├── usIndicesScraper.js       # Main scraper logic
│   └── testUSIndices.js          # Standalone test script
├── services/
│   └── usIndicesService.js       # Database operations
├── jobs/
│   └── usIndicesCron.js          # Cron job scheduler
├── sqls/
│   └── 02_us_indices_setup.sql   # Database schema
└── test-us-integration.js        # Integration test
```

## Database Schema

### Table: `us_indices`

- `id` (uuid) - Primary key
- `name` (text) - Index name (e.g., "S&P 500", "Dow Jones")
- `last` (numeric) - Current/last price
- `high` (numeric) - Day's high price
- `low` (numeric) - Day's low price
- `change` (numeric) - Price change from previous close
- `change_percent` (numeric) - Percentage change
- `time` (text) - Last update time from source
- `scraped_at` (timestamptz) - When data was scraped
- `created_at` (timestamptz) - Record creation time
- `updated_at` (timestamptz) - Record update time

### Functions

- `upsert_us_index()` - Insert new index data
- `get_latest_us_indices()` - Get most recent data for all indices
- `get_us_index_history()` - Get historical data for specific index
- `get_us_indices_by_date_range()` - Get data within date range
- `cleanup_old_us_indices_data()` - Delete old data (default: 30 days)

## Setup

### 1. Database Setup

Run the SQL file in Supabase SQL Editor:

```sql
-- Execute: backend/sqls/02_us_indices_setup.sql
```

### 2. Environment Variables

Ensure these are set in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

## Usage

### Test Scraper Only

```bash
node scrapers/testUSIndices.js
```

### Test Full Integration

```bash
node test-us-integration.js
```

### Start Server with Cron Job

```bash
npm start
# or
npm run dev
```

## API Endpoints

### Get Latest Indices

```
GET /api/us-indices/latest
```

Returns the most recent data for all US indices.

### Get Index History

```
GET /api/us-indices/history/:name?limit=100
```

Returns historical data for a specific index.

Example:

```
GET /api/us-indices/history/S%26P%20500?limit=50
```

### Get Data by Date Range

```
GET /api/us-indices/range?start=2024-01-01&end=2024-01-31
```

Returns indices data within specified date range.

### Get Cron Status

```
GET /api/us-indices/cron/status
```

Returns current status of the cron job.

### Trigger Manual Scrape

```
POST /api/us-indices/cron/trigger
```

Manually triggers a scrape operation.

## Cron Schedule

The scraper runs automatically every 2 minutes:

- Schedule: `*/2 * * * *`
- Timezone: America/New_York (US Eastern Time)
- Auto-start: Yes (runs immediately on server start)

## Data Flow

1. **Scraper** (`usIndicesScraper.js`)

   - Fetches HTML from investing.com
   - Parses table data using Cheerio
   - Extracts: name, last, high, low, change, change%, time

2. **Service** (`usIndicesService.js`)

   - Transforms data to match database schema
   - Inserts records using Supabase admin client
   - Handles errors and returns results

3. **Cron Job** (`usIndicesCron.js`)

   - Runs every 2 minutes
   - Prevents concurrent runs
   - Logs execution status and duration

4. **Database** (Supabase)
   - Stores all scraped data
   - Provides query functions
   - Enforces Row Level Security (RLS)

## Error Handling

- **Scraping Errors**: Logged with details, job continues
- **Database Errors**: Logged with error message, job continues
- **Concurrent Runs**: Prevented automatically
- **Network Issues**: Retries on next scheduled run

## Security

- Uses Supabase service role key for database writes
- Row Level Security (RLS) enabled:
  - Authenticated users: Read access
  - Service role: Full access
  - Admins: Full access

## Monitoring

Check cron job status:

```bash
curl http://localhost:3000/api/us-indices/cron/status
```

Response:

```json
{
  "success": true,
  "isRunning": false,
  "lastRunTime": "2024-01-15T10:30:00.000Z",
  "lastRunStatus": "success",
  "runCount": 42,
  "nextRunIn": "Within 2 minutes"
}
```

## Troubleshooting

### No data scraped

- Check if investing.com is accessible
- Verify HTML structure hasn't changed
- Check console logs for parsing errors

### Database errors

- Verify Supabase credentials in `.env`
- Ensure SQL schema is properly executed
- Check Supabase logs for RLS issues

### Cron not running

- Check server logs for startup errors
- Verify node-cron is installed
- Check timezone settings

## Maintenance

### Clean up old data

Old data is automatically cleaned up (default: 30 days retention).

Manual cleanup:

```javascript
const { cleanupOldData } = require("./services/usIndicesService");
await cleanupOldData(30); // Keep last 30 days
```

## Development

### Add new indices

The scraper automatically detects all indices in the table.
No code changes needed if investing.com adds new indices.

### Modify scraping frequency

Edit `usIndicesCron.js`:

```javascript
// Change from every 2 minutes to every 5 minutes
const task = cron.schedule("*/5 * * * *", async () => {
  await runUSIndicesJob();
});
```

### Add new data fields

1. Update scraper to extract new fields
2. Update database schema (add columns)
3. Update service to map new fields
4. Update TypeScript types (if using frontend)

## Related Files

- Brazil Indices: Similar implementation for Brazilian indices
- Server: `server.js` - Main Express server with API routes
- Supabase Client: `services/supabaseClient.js` - Database connection
