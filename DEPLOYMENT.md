# Deployment Guide - Brazil Indices Scraper

This guide walks you through deploying the Brazil indices scraping feature.

## Prerequisites

- Node.js 18+ installed
- Supabase account and project
- Access to Supabase SQL Editor

## Step-by-Step Deployment

### 1. Database Setup

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `sqls/01_brazil_indices_setup.sql`
5. Paste and execute the SQL script
6. Verify the table was created:
   ```sql
   SELECT * FROM brazil_indices LIMIT 1;
   ```

### 2. Environment Configuration

1. Copy `.env.example` to `.env` (if not already done)
2. Update the following variables:

   ```env
   PORT=3000
   NODE_ENV=production
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```

3. Get your Supabase credentials:
   - Go to **Project Settings** → **API**
   - Copy **Project URL** → `VITE_SUPABASE_URL`
   - Copy **anon/public key** → `VITE_SUPABASE_PUBLISHABLE_KEY`

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Test the Setup

#### Test 1: Scraper Only

```bash
npm run test:scraper
```

Expected output: Table with 7 Brazilian indices

#### Test 2: Full Integration

```bash
npm run test:integration
```

Expected output:

- ✅ Scraped data
- ✅ Saved to Supabase
- ✅ Retrieved from Supabase

### 5. Start the Server

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

### 6. Verify the Cron Job

1. Check server logs for:

   ```
   🕐 Starting Brazil Indices Cron Job
   ⏰ Schedule: Every 2 minutes
   🏃 Running initial scrape...
   ```

2. Wait 2 minutes and check for automatic runs

3. Check cron status via API:
   ```bash
   curl http://localhost:3000/api/brazil-indices/cron/status
   ```

### 7. Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get latest indices
curl http://localhost:3000/api/brazil-indices/latest

# Get history for Bovespa
curl http://localhost:3000/api/brazil-indices/history/Bovespa?limit=10

# Get data by date range
curl "http://localhost:3000/api/brazil-indices/range?start=2025-10-01&end=2025-10-15"

# Trigger manual scrape
curl -X POST http://localhost:3000/api/brazil-indices/cron/trigger
```

## Verification Checklist

- [ ] SQL script executed successfully
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Scraper test passed
- [ ] Integration test passed
- [ ] Server starts without errors
- [ ] Cron job starts automatically
- [ ] Initial scrape completes successfully
- [ ] Data appears in Supabase table
- [ ] API endpoints respond correctly
- [ ] Automatic scraping runs every 2 minutes

## Monitoring

### Check Database Records

In Supabase SQL Editor:

```sql
-- Count total records
SELECT COUNT(*) FROM brazil_indices;

-- View latest records
SELECT * FROM brazil_indices
ORDER BY scraped_at DESC
LIMIT 10;

-- Check records per index
SELECT name, COUNT(*) as count
FROM brazil_indices
GROUP BY name
ORDER BY name;
```

### Check Logs

Monitor the console output for:

- Scraping start/completion messages
- Number of indices scraped
- Database save confirmations
- Any errors or warnings

### API Monitoring

Use the status endpoint to monitor the cron job:

```bash
curl http://localhost:3000/api/brazil-indices/cron/status
```

Response should show:

- `isRunning`: false (when idle)
- `lastRunTime`: Recent timestamp
- `lastRunStatus`: "success"
- `runCount`: Increasing number

## Troubleshooting

### Issue: SQL Script Fails

**Solution:**

1. Check if `handle_updated_at()` function exists
2. Check if `is_authenticated_admin()` function exists
3. Run prerequisite SQL scripts first (auth setup, etc.)

### Issue: Scraper Returns No Data

**Possible causes:**

1. investing.com is blocking requests
2. Page structure changed
3. Network connectivity issues

**Solutions:**

1. Check if the website is accessible
2. Update scraper selectors if needed
3. Add delays between requests

### Issue: Database Connection Fails

**Possible causes:**

1. Wrong Supabase credentials
2. RLS policies blocking access
3. Network issues

**Solutions:**

1. Verify `.env` credentials
2. Check Supabase project is active
3. Verify RLS policies allow service_role access

### Issue: Cron Job Not Running

**Possible causes:**

1. Server crashed during startup
2. Cron module not installed
3. Timezone issues

**Solutions:**

1. Check server logs for errors
2. Verify `node-cron` is installed
3. Adjust timezone in `brazilIndicesCron.js`

## Production Deployment

### Using PM2 (Recommended)

1. Install PM2:

   ```bash
   npm install -g pm2
   ```

2. Start the application:

   ```bash
   pm2 start server.js --name financial-backend
   ```

3. Configure auto-restart:

   ```bash
   pm2 startup
   pm2 save
   ```

4. Monitor:
   ```bash
   pm2 logs financial-backend
   pm2 status
   ```

### Using Docker

1. Create `Dockerfile`:

   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. Build and run:
   ```bash
   docker build -t financial-backend .
   docker run -d -p 3000:3000 --env-file .env financial-backend
   ```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_production_key
```

## Maintenance

### Data Cleanup

Run cleanup periodically to remove old data:

```sql
-- Clean up data older than 30 days
SELECT cleanup_old_brazil_indices_data(30);

-- Clean up data older than 7 days
SELECT cleanup_old_brazil_indices_data(7);
```

Or via API (requires admin access):

```bash
curl -X POST http://localhost:3000/api/brazil-indices/cleanup?days=30
```

### Monitoring Best Practices

1. Set up alerts for:

   - Scraper failures
   - Database connection issues
   - Cron job not running

2. Monitor disk space (data grows over time)

3. Check logs regularly for errors

4. Verify data freshness (scraped_at timestamps)

## Scaling Considerations

### High Frequency Scraping

If you need more frequent updates:

1. Adjust cron schedule in `brazilIndicesCron.js`:

   ```javascript
   // Every 1 minute
   cron.schedule('*/1 * * * *', ...)

   // Every 30 seconds (not recommended)
   cron.schedule('*/30 * * * * *', ...)
   ```

2. Consider rate limiting to avoid being blocked

### Multiple Scrapers

To scrape multiple sources:

1. Create new scraper modules in `scrapers/`
2. Create new service modules in `services/`
3. Create new cron jobs in `jobs/`
4. Add new API routes in `server.js`

## Support

For issues or questions:

1. Check the logs
2. Review this deployment guide
3. Check the main README.md
4. Contact the development team

## Rollback Plan

If deployment fails:

1. Stop the server:

   ```bash
   pm2 stop financial-backend
   # or
   Ctrl+C (if running in terminal)
   ```

2. Restore previous version:

   ```bash
   git checkout previous-version
   npm install
   ```

3. Drop the new table (if needed):

   ```sql
   DROP TABLE IF EXISTS brazil_indices CASCADE;
   ```

4. Restart with previous version:
   ```bash
   npm start
   ```
