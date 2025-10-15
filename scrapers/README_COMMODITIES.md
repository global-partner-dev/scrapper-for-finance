# Commodities Scraper

This module scrapes commodities data from investing.com and stores it in Supabase.

## Overview

The commodities scraper collects percentage change data for various commodities (Gold, Silver, Copper, Oil, etc.) across different time periods:

- 15 Minutes
- Hourly
- Daily
- 1 Week
- 1 Month
- YTD (Year-to-Date)
- 3 Years

## Files

### Scraper

- **`commoditiesScraper.js`**: Main scraper that fetches data from investing.com
  - `scrapeCommodities()`: Scrapes commodities data
  - `displayCommodities()`: Formats and displays data in console

### Service

- **`../services/commoditiesService.js`**: Handles database operations
  - `saveCommodities()`: Saves scraped data to Supabase
  - `getLatestCommodities()`: Retrieves latest data for all commodities
  - `getCommodityHistory()`: Gets historical data for a specific commodity
  - `getCommoditiesByDateRange()`: Retrieves data within a date range
  - `cleanupOldData()`: Removes old records

### Database

- **`../sqls/04_commodities_setup.sql`**: Database schema and functions
  - Creates `commodities` table
  - Creates helper functions for data retrieval
  - Sets up Row Level Security (RLS) policies

### Cron Job

- **`../jobs/commoditiesCron.js`**: Scheduled scraping job
  - Runs every 5 minutes
  - Automatically scrapes and saves data
  - Provides status monitoring

### Tests

- **`../test-commodities-scraper.js`**: Tests the scraper only
- **`../test-commodities-integration.js`**: Tests scraper + database integration

## Setup

### 1. Database Setup

Run the SQL setup file in your Supabase SQL editor:

```bash
# Copy the contents of sqls/04_commodities_setup.sql
# and run it in Supabase SQL Editor
```

This will create:

- `commodities` table
- Helper functions for data operations
- RLS policies for security
- Indexes for performance

### 2. Environment Variables

Make sure your `.env` file has the required Supabase credentials:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Test the Scraper Only

```bash
node test-commodities-scraper.js
```

This will:

1. Scrape commodities data from investing.com
2. Display the data in a formatted table
3. Show raw JSON for the first 3 items

### Test Full Integration

```bash
node test-commodities-integration.js
```

This will:

1. Scrape commodities data
2. Save it to Supabase
3. Retrieve and display the saved data

### Start the Cron Job

The cron job is integrated into the main server. To start it:

```bash
npm start
```

Or manually in your code:

```javascript
const { startCommoditiesCron } = require("./jobs/commoditiesCron");
startCommoditiesCron();
```

### Manual Trigger

```javascript
const { triggerManualRun } = require("./jobs/commoditiesCron");
await triggerManualRun();
```

## Data Structure

### Scraped Data Format

```javascript
{
  name: "Gold",
  fifteenMinutes: -0.01,
  hourly: -0.01,
  daily: 0.00,
  oneWeek: 3.78,
  oneMonth: 13.40,
  ytd: 59.95,
  threeYears: 157.01,
  scrapedAt: "2025-10-15T22:01:37.664Z"
}
```

### Database Schema

```sql
commodities (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  fifteen_minutes numeric(10, 4),
  hourly numeric(10, 4),
  daily numeric(10, 4),
  one_week numeric(10, 4),
  one_month numeric(10, 4),
  ytd numeric(10, 4),
  three_years numeric(10, 4),
  scraped_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
)
```

## Commodities Tracked

The scraper currently tracks these commodities:

1. Gold
2. Silver
3. Copper
4. Platinum
5. Brent Oil
6. Crude Oil WTI
7. Natural Gas
8. Heating Oil
9. US Coffee C
10. US Corn
11. US Wheat
12. London Sugar
13. US Cotton #2
14. US Cocoa

## API Functions

### Get Latest Commodities

```javascript
const { getLatestCommodities } = require("./services/commoditiesService");

const result = await getLatestCommodities();
console.log(result.data); // Array of latest commodity data
```

### Get Commodity History

```javascript
const { getCommodityHistory } = require("./services/commoditiesService");

const result = await getCommodityHistory("Gold", 50);
console.log(result.data); // Last 50 records for Gold
```

### Get Data by Date Range

```javascript
const { getCommoditiesByDateRange } = require("./services/commoditiesService");

const startDate = new Date("2025-01-01");
const endDate = new Date("2025-12-31");
const result = await getCommoditiesByDateRange(startDate, endDate);
console.log(result.data);
```

### Cleanup Old Data

```javascript
const { cleanupOldData } = require("./services/commoditiesService");

// Keep only last 30 days
const result = await cleanupOldData(30);
console.log(`Deleted ${result.deleted} old records`);
```

## Cron Schedule

The cron job runs every 5 minutes:

- Schedule: `*/5 * * * *`
- Timezone: America/Sao_Paulo
- Auto-starts on server startup

## Error Handling

The scraper includes comprehensive error handling:

- Network errors (timeout, connection issues)
- Parsing errors (HTML structure changes)
- Database errors (connection, constraint violations)
- Concurrent run prevention

## Monitoring

Check cron job status:

```javascript
const { getCronStatus } = require("./jobs/commoditiesCron");

const status = getCronStatus();
console.log(status);
// {
//   isRunning: false,
//   lastRunTime: Date,
//   lastRunStatus: 'success',
//   runCount: 42,
//   nextRunIn: 'Within 5 minutes'
// }
```

## Troubleshooting

### No data scraped

- Check if investing.com is accessible
- Verify the HTML structure hasn't changed
- Check console logs for specific errors

### Database errors

- Verify Supabase credentials in `.env`
- Ensure SQL setup was run successfully
- Check RLS policies are configured correctly

### Scraper timing out

- Increase timeout in axios config
- Check network connectivity
- Verify investing.com is not blocking requests

## Notes

- The scraper uses Cheerio for HTML parsing
- Data is stored with timestamps for historical tracking
- RLS policies ensure data security
- Indexes optimize query performance
- Old data can be cleaned up automatically
