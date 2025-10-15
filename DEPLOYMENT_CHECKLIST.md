# 🚀 US Indices Deployment Checklist

## Step-by-Step Deployment Guide

### ✅ Step 1: Database Setup (REQUIRED)

1. **Get the SQL content:**

   ```bash
   cd e:\Mydev\financial\backend
   node setup-us-indices-db.js
   ```

2. **Execute in Supabase:**

   - Open: https://supabase.com/dashboard
   - Navigate to your project: `pwziamhjywxeagmgslxf`
   - Go to: **SQL Editor**
   - Click: **New Query**
   - Copy the SQL from the terminal output
   - Paste into the editor
   - Click: **Run** (or press Ctrl+Enter)

3. **Verify Success:**
   - Check for success message
   - Go to **Table Editor** → Should see `us_indices` table
   - Go to **Database** → **Functions** → Should see 5 new functions:
     - `upsert_us_index`
     - `get_latest_us_indices`
     - `get_us_index_history`
     - `get_us_indices_by_date_range`
     - `cleanup_old_us_indices_data`

---

### ✅ Step 2: Test Scraper (RECOMMENDED)

Test that scraping works before starting the server:

```bash
cd e:\Mydev\financial\backend
node scrapers/testUSIndices.js
```

**Expected Output:**

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

✅ **If you see this output, scraping works!**

❌ **If you see errors:**

- Check internet connection
- Verify investing.com is accessible
- Check console for error details

---

### ✅ Step 3: Test Integration (RECOMMENDED)

Test the complete flow: scrape → save → retrieve

```bash
node test-us-integration.js
```

**Expected Output:**

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

✅ **If all tests pass, you're ready to deploy!**

❌ **If tests fail:**

- Verify SQL schema was executed (Step 1)
- Check `.env` has correct Supabase credentials
- Check Supabase dashboard for errors

---

### ✅ Step 4: Start the Server

Start the server with automatic cron job:

```bash
npm start
```

**Expected Output:**

```
================================================================================
🚀 Financial Backend API Server
================================================================================
📡 Server is running on port 3000
🌐 API URL: http://localhost:3000
📊 Environment: development
================================================================================

🕐 Starting Brazil Indices Cron Job
⏰ Schedule: Every 2 minutes
📍 Timezone: America/Sao_Paulo

🕐 Starting US Indices Cron Job
⏰ Schedule: Every 2 minutes
📍 Timezone: America/New_York

🏃 Running initial scrape...

================================================================================
🚀 US Indices Scraper Job #1 - Started at ...
================================================================================
📡 Scraping data from investing.com...
✅ Scraped 4 indices successfully
💾 Saving to Supabase...
✅ Successfully saved 4 indices to database
✅ Job completed successfully in 2.34s
📊 Summary: 4 indices saved to database
================================================================================
```

✅ **If you see this, the cron job is running!**

---

### ✅ Step 5: Verify API Endpoints

Open a new terminal and test the API:

#### 5.1 Check Server Health

```bash
curl http://localhost:3000/api/health
```

Expected: `{"status":"OK","timestamp":"..."}`

#### 5.2 Get Latest US Indices

```bash
curl http://localhost:3000/api/us-indices/latest
```

Expected: JSON with 4 indices

#### 5.3 Check Cron Status

```bash
curl http://localhost:3000/api/us-indices/cron/status
```

Expected:

```json
{
  "success": true,
  "isRunning": false,
  "lastRunTime": "2025-10-15T20:21:53.399Z",
  "lastRunStatus": "success",
  "runCount": 1,
  "nextRunIn": "Within 2 minutes"
}
```

#### 5.4 Trigger Manual Scrape (Optional)

```bash
curl -X POST http://localhost:3000/api/us-indices/cron/trigger
```

Expected: `{"success":true,"message":"Manual scrape triggered successfully"}`

---

### ✅ Step 6: Verify Data in Supabase

1. Open Supabase Dashboard
2. Go to **Table Editor**
3. Select `us_indices` table
4. You should see records with:
   - Names: S&P 500, Dow Jones, Nasdaq 100, Nasdaq
   - Numeric values for last, high, low, change, change_percent
   - Time values
   - Timestamps

---

### ✅ Step 7: Monitor Cron Job

Watch the server logs for automatic runs every 2 minutes:

```
================================================================================
🚀 US Indices Scraper Job #2 - Started at ...
================================================================================
📡 Scraping data from investing.com...
✅ Scraped 4 indices successfully
💾 Saving to Supabase...
✅ Successfully saved 4 indices to database
✅ Job completed successfully in 2.45s
📊 Summary: 4 indices saved to database
================================================================================
```

This should appear every 2 minutes automatically.

---

## 🎯 Quick Verification Checklist

Use this checklist to verify everything is working:

- [ ] SQL schema executed in Supabase
- [ ] `us_indices` table exists in Supabase
- [ ] 5 database functions created
- [ ] Scraper test passes (`node scrapers/testUSIndices.js`)
- [ ] Integration test passes (`node test-us-integration.js`)
- [ ] Server starts without errors (`npm start`)
- [ ] Initial scrape runs on startup
- [ ] Cron job logs appear every 2 minutes
- [ ] API endpoint `/api/us-indices/latest` returns data
- [ ] API endpoint `/api/us-indices/cron/status` shows status
- [ ] Data visible in Supabase `us_indices` table
- [ ] No errors in server logs
- [ ] No errors in Supabase logs

---

## 🐛 Troubleshooting

### Problem: SQL execution fails

**Error:** "function public.handle_updated_at() does not exist"

**Solution:** This function should exist from Brazil indices setup. If not, you need to create it first. Check if `01_brazil_indices_setup.sql` was executed.

---

### Problem: Integration test fails with "table does not exist"

**Solution:** SQL schema not executed. Go back to Step 1.

---

### Problem: Integration test fails with "permission denied"

**Solution:** Check `.env` file has `SUPABASE_SERVICE_ROLE_KEY` set correctly.

---

### Problem: Scraper returns no data

**Possible causes:**

1. Internet connection issue
2. investing.com is down or blocking requests
3. HTML structure changed

**Solution:**

- Check internet connection
- Try accessing the URL in browser: https://www.investing.com/indices/usa-indices?include-major-indices=true
- Check console logs for specific error

---

### Problem: Cron job not running

**Check:**

1. Server started successfully?
2. Any errors in startup logs?
3. `node-cron` installed? Run: `npm list node-cron`

**Solution:**

- Restart server
- Check for JavaScript errors
- Verify `usIndicesCron.js` is imported in `server.js`

---

### Problem: API returns empty data

**Possible causes:**

1. Cron job hasn't run yet
2. Database is empty
3. RLS blocking access

**Solution:**

- Wait for first cron run (happens immediately on startup)
- Manually trigger: `curl -X POST http://localhost:3000/api/us-indices/cron/trigger`
- Check Supabase table has data
- Verify RLS policies are correct

---

## 📞 Need Help?

### Documentation Files

- **Quick Start:** `US_INDICES_QUICKSTART.md`
- **Full Documentation:** `scrapers/README_US_INDICES.md`
- **Implementation Summary:** `US_INDICES_IMPLEMENTATION_SUMMARY.md`

### Test Scripts

- **Scraper Only:** `node scrapers/testUSIndices.js`
- **Full Integration:** `node test-us-integration.js`
- **Database Setup:** `node setup-us-indices-db.js`

### Useful Commands

```bash
# View SQL schema
node setup-us-indices-db.js

# Test scraper
node scrapers/testUSIndices.js

# Test integration
node test-us-integration.js

# Start server
npm start

# Check API
curl http://localhost:3000/api/us-indices/latest

# Check cron status
curl http://localhost:3000/api/us-indices/cron/status

# Trigger manual scrape
curl -X POST http://localhost:3000/api/us-indices/cron/trigger
```

---

## ✨ Success!

If all steps are complete and all checks pass, you now have:

✅ Automatic US indices scraping every 2 minutes
✅ Historical data storage in Supabase
✅ REST API for data access
✅ Monitoring and status endpoints
✅ Comprehensive error handling
✅ Production-ready implementation

**Congratulations! 🎉**

---

**Last Updated:** 2025-10-15
**Version:** 1.0.0
**Status:** Ready for Production
