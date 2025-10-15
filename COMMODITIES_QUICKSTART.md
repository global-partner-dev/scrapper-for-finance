# Commodities Scraper - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Database Setup (2 minutes)

1. Open your Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `sqls/04_commodities_setup.sql`
4. Click "Run" to execute the SQL

This creates:

- ✅ `commodities` table
- ✅ Helper functions
- ✅ Security policies
- ✅ Performance indexes

### Step 2: Test the Scraper (1 minute)

```bash
cd backend
node test-commodities-scraper.js
```

You should see:

```
✅ Test completed successfully!
Total commodities scraped: 14
```

### Step 3: Test Database Integration (1 minute)

```bash
node test-commodities-integration.js
```

You should see:

```
✅ INTEGRATION TEST COMPLETED SUCCESSFULLY!
Scraped: 14 commodities
Saved: 14 records
Retrieved: 14 latest records
```

### Step 4: Start Automated Scraping (1 minute)

Add to your `server.js` or main application file:

```javascript
const { startCommoditiesCron } = require("./jobs/commoditiesCron");

// Start the commodities cron job
startCommoditiesCron();
```

Then start your server:

```bash
npm start
```

## ✅ That's it! Your commodities scraper is now running!

---

## 📊 What You Get

The scraper automatically collects data for **14 commodities** every **5 minutes**:

### Precious Metals

- Gold
- Silver
- Platinum

### Industrial Metals

- Copper

### Energy

- Brent Oil
- Crude Oil WTI
- Natural Gas
- Heating Oil

### Agricultural

- US Coffee C
- US Corn
- US Wheat
- London Sugar
- US Cotton #2
- US Cocoa

### Data Points (7 time periods)

- 15 Minutes
- Hourly
- Daily
- 1 Week
- 1 Month
- YTD
- 3 Years

---

## 🔍 Quick Commands

### View Latest Data

```javascript
const { getLatestCommodities } = require("./services/commoditiesService");

const result = await getLatestCommodities();
console.log(result.data);
```

### Get Gold History

```javascript
const { getCommodityHistory } = require("./services/commoditiesService");

const result = await getCommodityHistory("Gold", 50);
console.log(result.data); // Last 50 records
```

### Manual Scrape

```javascript
const { triggerManualRun } = require("./jobs/commoditiesCron");

await triggerManualRun();
```

### Check Status

```javascript
const { getCronStatus } = require("./jobs/commoditiesCron");

console.log(getCronStatus());
```

---

## 🎯 Sample Output

```
============================================================================================================================================
COMMODITIES DATA
============================================================================================================================================
Name                     15 Minutes         Hourly          Daily         1 Week        1 Month            YTD        3 Years
--------------------------------------------------------------------------------------------------------------------------------------------
Gold                         -0.01%         -0.01%          0.00%         +3.78%        +13.40%        +59.95%       +157.01%
Silver                       -0.05%         -0.05%         -0.01%         +7.28%        +22.48%        +79.75%       +190.87%
Copper                       +0.06%         +0.06%         -0.01%         -2.35%         +5.99%        +23.56%        +45.32%
Platinum                     +0.16%         +0.16%         +0.08%         -0.11%        +21.13%        +86.59%        +88.87%
Brent Oil                    +0.06%          0.00%         +0.10%         -5.75%         -8.81%        -16.35%        -31.86%
...
============================================================================================================================================
Total commodities: 14
Scraped at: 10/15/2025, 6:01:37 PM
============================================================================================================================================
```

---

## 🔧 Troubleshooting

### "No data scraped"

- Check internet connection
- Verify investing.com is accessible
- Run: `node test-commodities-scraper.js`

### "Database error"

- Verify `.env` has correct Supabase credentials
- Ensure SQL setup was run successfully
- Check Supabase dashboard for errors

### "Module not found"

- Run: `npm install`
- Verify you're in the `backend` directory

---

## 📚 More Information

- **Full Documentation**: `scrapers/README_COMMODITIES.md`
- **Implementation Details**: `COMMODITIES_IMPLEMENTATION_SUMMARY.md`
- **Database Schema**: `sqls/04_commodities_setup.sql`

---

## 🎉 Success Checklist

- [ ] SQL setup completed in Supabase
- [ ] Test scraper runs successfully
- [ ] Integration test passes
- [ ] Cron job started
- [ ] Data visible in Supabase dashboard

---

## 💡 Pro Tips

1. **Monitor the logs**: The cron job logs every run with detailed information
2. **Check Supabase**: View data in real-time in your Supabase dashboard
3. **Historical data**: All scrapes are stored with timestamps for trend analysis
4. **Cleanup**: Old data is automatically cleaned up (configurable)

---

## 🆘 Need Help?

Check these files:

- `scrapers/README_COMMODITIES.md` - Detailed documentation
- `COMMODITIES_IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- Test files for working examples

---

**Happy Scraping! 🚀**
