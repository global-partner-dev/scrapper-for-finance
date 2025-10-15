# Quick Start Guide - Brazil Indices Scraper

Get up and running in 5 minutes! ⚡

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Supabase account
- ✅ Git (optional)

---

## Step 1: Install Dependencies (1 min)

```bash
cd backend
npm install
```

---

## Step 2: Configure Environment (1 min)

Edit `.env` file:

```env
PORT=3000
NODE_ENV=development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Get your Supabase credentials:**

1. Go to your Supabase project
2. Settings → API
3. Copy **Project URL** and **anon/public key**

---

## Step 3: Setup Database (1 min)

1. Open Supabase SQL Editor
2. Copy contents of `sqls/01_brazil_indices_setup.sql`
3. Paste and run
4. ✅ Done!

---

## Step 4: Test Everything (1 min)

```bash
# Test scraper
npm run test:scraper

# Test full integration
npm run test:integration
```

**Expected**: Both tests should pass ✅

---

## Step 5: Start Server (1 min)

```bash
# Development mode (with auto-restart)
npm run dev

# OR Production mode
npm start
```

**Expected output:**

```
🚀 Financial Backend API Server
📡 Server is running on port 3000
🕐 Starting Brazil Indices Cron Job
⏰ Schedule: Every 2 minutes
🏃 Running initial scrape...
```

---

## ✅ Verify It's Working

### Check 1: Server is Running

```bash
curl http://localhost:3000/api/health
```

**Expected**: `{"status":"OK","timestamp":"..."}`

### Check 2: Data is Being Scraped

```bash
curl http://localhost:3000/api/brazil-indices/latest
```

**Expected**: JSON with 7 Brazilian indices

### Check 3: Cron Job is Active

```bash
curl http://localhost:3000/api/brazil-indices/cron/status
```

**Expected**: `{"success":true,"isRunning":false,"runCount":1,...}`

---

## 🎉 Success!

Your scraper is now:

- ✅ Running every 2 minutes
- ✅ Saving data to Supabase
- ✅ Serving data via API

---

## What's Next?

### View Your Data

Open Supabase → Table Editor → `brazil_indices`

### Monitor the Cron Job

Watch the console logs for scraping activity every 2 minutes

### Use the API

```bash
# Get latest data
curl http://localhost:3000/api/brazil-indices/latest

# Get Bovespa history
curl http://localhost:3000/api/brazil-indices/history/Bovespa?limit=10

# Trigger manual scrape
curl -X POST http://localhost:3000/api/brazil-indices/cron/trigger
```

---

## 🆘 Troubleshooting

### Problem: Test fails

**Solution**: Check `.env` credentials are correct

### Problem: No data in Supabase

**Solution**: Check SQL script was executed successfully

### Problem: Cron job not running

**Solution**: Check server logs for errors

---

## 📚 Need More Help?

- **Full Documentation**: See `README.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Implementation Details**: See `IMPLEMENTATION_SUMMARY.md`

---

**That's it! You're all set! 🚀**
