# Currency Exchange Rates Scraper

This scraper extracts real-time currency exchange rate data from Investing.com's Technical Summary page and stores it in Supabase.

## Overview

The scraper fetches currency pair data including:

- Currency pair name (e.g., Dólar/BRL, EUR/BRL)
- Last price (exchange rate)
- Absolute change
- Percentage change
- Timestamp of when data was scraped

## Features

✅ **Automated Scraping**: Runs every 2 minutes via cron job  
✅ **Database Integration**: Stores data in Supabase  
✅ **REST API**: Full API endpoints for accessing data  
✅ **Historical Data**: Tracks exchange rate changes over time  
✅ **Error Handling**: Robust error handling and logging

## Quick Start

### 1. Database Setup

Run the SQL setup file in your Supabase SQL editor:

```bash
# File: backend/sqls/03_currencies_setup.sql
```

This creates:

- `currencies` table
- Helper functions for data management
- Row Level Security policies
- Indexes for performance

### 2. Start the Server

The cron job starts automatically when you run the server:

```bash
cd backend
node server.js
```

The currencies scraper will:

- Run immediately on startup
- Run every 2 minutes thereafter
- Log all activities to console

### 3. Test the Integration

```bash
# Test scraping and database integration
node backend/test-currencies-integration.js

# Test scraper only
node backend/test-currencies-scraper.js
```

## API Endpoints

### Get Latest Currencies

```
GET /api/currencies/latest
```

Returns the most recent data for all currency pairs.

**Response:**

```json
{
  "success": true,
  "message": "Retrieved 7 currencies",
  "data": [
    {
      "id": "uuid",
      "name": "Dólar/BRL",
      "last_price": 5.454,
      "change": 0.0,
      "change_percent": 0.0,
      "scraped_at": "2025-01-15T..."
    }
  ]
}
```

### Get Currency History

```
GET /api/currencies/history/:name?limit=100
```

Returns historical data for a specific currency pair.

**Example:**

```
GET /api/currencies/history/Dólar%2FBRL?limit=50
```

### Get Currencies by Date Range

```
GET /api/currencies/range?start=YYYY-MM-DD&end=YYYY-MM-DD
```

Returns currency data within a specific date range.

**Example:**

```
GET /api/currencies/range?start=2025-01-01&end=2025-01-15
```

### Get Cron Job Status

```
GET /api/currencies/cron/status
```

Returns the current status of the cron job.

**Response:**

```json
{
  "success": true,
  "isRunning": false,
  "lastRunTime": "2025-01-15T...",
  "lastRunStatus": "success",
  "runCount": 42,
  "nextRunIn": "Within 2 minutes"
}
```

### Trigger Manual Scrape

```
POST /api/currencies/cron/trigger
```

Manually triggers a scrape (useful for testing).

## Data Structure

### Scraped Data Format

```javascript
{
  name: "Dólar/BRL",           // Currency pair name
  lastPrice: 5.4540,            // Current exchange rate
  change: 0.0000,               // Absolute change
  changePercent: 0.00,          // Percentage change
  scrapedAt: "2025-01-15T..."   // ISO timestamp
}
```

### Database Schema

```sql
CREATE TABLE currencies (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    last_price numeric(15, 4),
    change numeric(15, 4),
    change_percent numeric(10, 4),
    scraped_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
```

## Technical Details

- **Source URL**: https://br.investing.com/technical/technical-summary
- **Target Table**: `#QBS_1_inner` (7 currency pairs)
- **Method**: Cheerio HTML parsing
- **Number Format**: Brazilian (comma as decimal separator)
- **Cron Schedule**: Every 2 minutes (`*/2 * * * *`)
- **Timezone**: America/Sao_Paulo

### Currency Pairs Scraped

1. **Dólar/BRL** (USD/BRL) - US Dollar to Brazilian Real
2. **EUR/BRL** - Euro to Brazilian Real
3. **EUR/Dólar** (EUR/USD) - Euro to US Dollar
4. **Dólar/JPY** (USD/JPY) - US Dollar to Japanese Yen
5. **GBP/Dólar** (GBP/USD) - British Pound to US Dollar
6. **GBP/BRL** - British Pound to Brazilian Real
7. **CAD/BRL** - Canadian Dollar to Brazilian Real

## File Structure

```
backend/
├── scrapers/
│   ├── currenciesScraper.js          # Main scraper logic
│   └── README_CURRENCIES.md          # This file
├── services/
│   └── currenciesService.js          # Database operations
├── jobs/
│   └── currenciesCron.js             # Cron job configuration
├── sqls/
│   └── 03_currencies_setup.sql       # Database schema
├── test-currencies-scraper.js        # Scraper test
└── test-currencies-integration.js    # Full integration test
```

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Retries and logging
- **HTML Parsing**: Fallback selectors
- **Number Format**: Brazilian format validation
- **Database Errors**: Transaction rollback
- **Concurrent Runs**: Prevention of overlapping jobs

## Monitoring

### Console Logs

The cron job provides detailed logging:

```
================================================================================
🚀 Currencies Scraper Job #1 - Started at 1/15/2025, 3:45:00 PM
================================================================================
📡 Scraping data from investing.com...
✅ Scraped 7 currency pairs successfully
💾 Saving to Supabase...
✅ Successfully saved 7 currencies to database
✅ Job completed successfully in 2.34s
📊 Summary: 7 currency pairs saved to database
================================================================================
```

### Status Endpoint

Monitor the cron job via API:

```bash
curl http://localhost:3000/api/currencies/cron/status
```

## Data Retention

By default, data is kept for 30 days. To clean up old data:

```javascript
const { cleanupOldData } = require("./services/currenciesService");

// Delete data older than 30 days
await cleanupOldData(30);
```

## Troubleshooting

### Scraper Returns No Data

1. Check if the website structure has changed
2. Verify network connectivity
3. Check console logs for errors

### Database Connection Issues

1. Verify `.env` file has correct Supabase credentials
2. Check `SUPABASE_SERVICE_ROLE_KEY` is set
3. Ensure SQL setup script was run

### Cron Job Not Running

1. Check server logs for errors
2. Verify `node-cron` is installed
3. Check timezone settings

## Dependencies

- `axios`: HTTP requests
- `cheerio`: HTML parsing
- `node-cron`: Job scheduling
- `@supabase/supabase-js`: Database client
- Node.js 14+

## Environment Variables

Required in `.env`:

```env
VITE_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Contributing

When modifying the scraper:

1. Test with `test-currencies-scraper.js`
2. Test integration with `test-currencies-integration.js`
3. Verify cron job works correctly
4. Update this README if needed

## License

Part of the Financial Backend API project.
