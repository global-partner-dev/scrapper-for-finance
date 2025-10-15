# US Indices Feature - Quick Start Guide

## 🎯 What Was Implemented

A complete scraping system for US stock market indices (S&P 500, Dow Jones, Nasdaq 100, Nasdaq) from investing.com with:

- Automated scraping every 2 minutes
- Supabase database storage
- REST API endpoints
- Historical data tracking

## 📁 Files Created

### Scraper

- `backend/scrapers/usIndicesScraper.js` - Main scraper logic
- `backend/scrapers/testUSIndices.js` - Standalone test script

### Service Layer

- `backend/services/usIndicesService.js` - Database operations

### Cron Job

- `backend/jobs/usIndicesCron.js` - Automated scheduler (every 2 minutes)

### Database

- `backend/sqls/02_us_indices_setup.sql` - Complete database schema

### Testing & Documentation

- `backend/test-us-integration.js` - Full integration test
- `backend/setup-us-indices-db.js` - Database setup helper
- `backend/scrapers/README_US_INDICES.md` - Complete documentation

### Modified Files

- `backend/server.js` - Added US indices API routes and cron job startup

## 🚀 Setup Steps

### Step 1: Execute Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Run this command to see the SQL:
   ```bash
   node setup-us-indices-db.js
   ```
3. Copy the SQL output and execute it in Supabase SQL Editor

**OR** manually copy and execute: `backend/sqls/02_us_indices_setup.sql`

### Step 2: Verify Environment Variables

Check `backend/.env` has these variables (already configured):

```env
VITE_SUPABASE_URL="https://pwziamhjywxeagmgslxf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."
```

### Step 3: Test the Scraper

Test scraping only (no database):

```bash
cd backend
node scrapers/testUSIndices.js
```

Expected output:

```
========================================================
US INDICES DATA
========================================================
Name                    Last           High            Low        Chg.      Chg. %           Time
--------------------------------------------------------
S&P 500              6,671.50       6,724.76       6,612.11      +27.19      +0.41%       15:59:59
Dow Jones           46,253.31      46,693.34      46,027.23     -17.15      -0.04%       15:59:59
Nasdaq 100          24,745.36      24,933.23      24,496.08     +166.04      +0.68%       15:59:59
Nasdaq              22,670.08      22,841.69      22,427.79     +148.38      +0.66%       15:59:59
========================================================
Total indices: 4
```

### Step 4: Test Full Integration

Test scraping + database save + retrieval:

```bash
node test-us-integration.js
```

Expected output:

```
================================================================================
US INDICES INTEGRATION TEST
================================================================================

📡 Step 1: Testing scraper...
✅ Scraped 4 indices successfully

💾 Step 2: Testing database save...
✅ Saved 4 indices to database

📊 Step 3: Testing data retrieval...
✅ Retrieved 4 indices from database

================================================================================
✅ ALL TESTS PASSED!
================================================================================
```

### Step 5: Start the Server

Start the server with automatic cron job:

```bash
npm start
# or for development with auto-reload
npm run dev
```

The cron job will:

- Run immediately on startup
- Run every 2 minutes automatically
- Log each execution with status

## 📡 API Endpoints

Base URL: `http://localhost:3000`

### 1. Get Latest Indices

```bash
curl http://localhost:3000/api/us-indices/latest
```

### 2. Get Index History

```bash
curl "http://localhost:3000/api/us-indices/history/S%26P%20500?limit=50"
```

### 3. Get Data by Date Range

```bash
curl "http://localhost:3000/api/us-indices/range?start=2024-01-01&end=2024-01-31"
```

### 4. Get Cron Status

```bash
curl http://localhost:3000/api/us-indices/cron/status
```

### 5. Trigger Manual Scrape

```bash
curl -X POST http://localhost:3000/api/us-indices/cron/trigger
```

## 🗄️ Database Structure

### Table: `us_indices`

Stores all scraped data with columns:

- `id`, `name`, `last`, `high`, `low`, `change`, `change_percent`, `time`
- `scraped_at`, `created_at`, `updated_at`

### Functions Created:

1. `upsert_us_index()` - Insert new data
2. `get_latest_us_indices()` - Get latest for all indices
3. `get_us_index_history()` - Get history for specific index
4. `get_us_indices_by_date_range()` - Get data in date range
5. `cleanup_old_us_indices_data()` - Clean old data (30 days default)

### Security:

- Row Level Security (RLS) enabled
- Authenticated users: Read access
- Service role: Full access (for scraper)
- Admins: Full access

## 🔍 Monitoring

### Check Cron Job Status

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

### Server Logs

Watch for these messages:

```
🚀 US Indices Scraper Job #1 - Started at ...
📡 Scraping data from investing.com...
✅ Scraped 4 indices successfully
💾 Saving to Supabase...
✅ Job completed successfully in 2.34s
📊 Summary: 4 indices saved to database
```

## 🎨 Data Format

### Scraped Data Structure:

```json
{
  "name": "S&P 500",
  "last": 6671.5,
  "high": 6724.76,
  "low": 6612.11,
  "change": 27.19,
  "changePercent": 0.41,
  "time": "15:59:59",
  "scrapedAt": "2025-10-15T20:21:53.399Z"
}
```

### Database Schema Mapping:

- `changePercent` → `change_percent`
- `scrapedAt` → `scraped_at`

## ⚙️ Configuration

### Change Scraping Frequency

Edit `backend/jobs/usIndicesCron.js`:

```javascript
// Current: Every 2 minutes
const task = cron.schedule("*/2 * * * *", async () => {
  await runUSIndicesJob();
});

// Change to every 5 minutes:
const task = cron.schedule("*/5 * * * *", async () => {
  await runUSIndicesJob();
});
```

### Change Timezone

Edit `backend/jobs/usIndicesCron.js`:

```javascript
const task = cron.schedule(
  "*/2 * * * *",
  async () => {
    await runUSIndicesJob();
  },
  {
    scheduled: true,
    timezone: "America/New_York", // Change this
  }
);
```

## 🐛 Troubleshooting

### Issue: No data scraped

**Solution:**

- Check internet connection
- Verify investing.com is accessible
- Check if HTML structure changed (view page source)

### Issue: Database errors

**Solution:**

- Verify `.env` has correct Supabase credentials
- Ensure SQL schema was executed successfully
- Check Supabase dashboard for errors

### Issue: Cron not running

**Solution:**

- Check server startup logs
- Verify `node-cron` is installed: `npm list node-cron`
- Check for JavaScript errors in console

### Issue: RLS (Row Level Security) errors

**Solution:**

- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in `.env`
- Verify RLS policies were created (check SQL execution)
- Use admin client for scraper operations

## 📊 Comparison with Brazil Indices

Both features follow the same architecture:

| Feature  | Brazil Indices                | US Indices                |
| -------- | ----------------------------- | ------------------------- |
| Table    | `brazil_indices`              | `us_indices`              |
| Scraper  | `brazilIndicesScraper.js`     | `usIndicesScraper.js`     |
| Service  | `brazilIndicesService.js`     | `usIndicesService.js`     |
| Cron     | `brazilIndicesCron.js`        | `usIndicesCron.js`        |
| SQL      | `01_brazil_indices_setup.sql` | `02_us_indices_setup.sql` |
| API Base | `/api/brazil-indices/`        | `/api/us-indices/`        |
| Timezone | America/Sao_Paulo             | America/New_York          |

## 🎯 Next Steps

1. **Execute the SQL schema** in Supabase
2. **Run the integration test** to verify everything works
3. **Start the server** to begin automatic scraping
4. **Monitor the logs** to ensure cron job runs successfully
5. **Test the API endpoints** to retrieve data

## 📚 Additional Resources

- Full documentation: `backend/scrapers/README_US_INDICES.md`
- Database setup helper: `node setup-us-indices-db.js`
- Integration test: `node test-us-integration.js`
- Scraper test: `node scrapers/testUSIndices.js`

## ✅ Success Checklist

- [ ] SQL schema executed in Supabase
- [ ] Environment variables configured
- [ ] Scraper test passes (`node scrapers/testUSIndices.js`)
- [ ] Integration test passes (`node test-us-integration.js`)
- [ ] Server starts without errors (`npm start`)
- [ ] Cron job runs automatically (check logs)
- [ ] API endpoints return data
- [ ] Data visible in Supabase dashboard

---

**Need Help?** Check the detailed documentation in `README_US_INDICES.md`
