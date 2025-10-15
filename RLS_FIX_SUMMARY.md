# 🔧 RLS Error Fix - Summary

## Problem

The scraper was failing with this error:

```
Error: new row violates row-level security policy for table "brazil_indices"
```

## Root Cause

The application was using the **anon/public key** for all operations. This key respects Row Level Security (RLS) policies, which prevent direct inserts into the `brazil_indices` table.

## Solution

We now use **two separate Supabase clients**:

### 1. Public Client (anon key)

- Used for: API read operations
- Respects: RLS policies
- Safe for: Frontend exposure

### 2. Admin Client (service role key)

- Used for: Scraper/cron job writes
- Bypasses: RLS policies
- Must be: Kept secret

## Files Changed

### 1. `services/supabaseClient.js`

**Before:**

```javascript
const supabase = createClient(supabaseUrl, supabaseKey);
module.exports = supabase;
```

**After:**

```javascript
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = {
  supabase, // Public client
  supabaseAdmin, // Admin client
};
```

### 2. `services/brazilIndicesService.js`

**Changed:**

- `saveBrazilIndices()` - Now uses `supabaseAdmin` for inserts
- `cleanupOldData()` - Now uses `supabaseAdmin` for deletes
- Read operations still use `supabase` (public client)

### 3. New Files Created

- `.env.example` - Template with all required keys
- `SUPABASE_SETUP.md` - Detailed setup guide
- `RLS_FIX_SUMMARY.md` - This file

## What You Need to Do

### Step 1: Get Service Role Key

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Find **service_role** key
5. Click **"Reveal"** to see it
6. Copy the full key

### Step 2: Update .env File

Add this line to your `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Restart Server

```bash
npm run dev
```

### Step 4: Test

```bash
npm run test:integration
```

## Expected Result

After adding the service role key, you should see:

```
🔄 Starting Brazil Indices scraper...
✅ Successfully scraped 7 indices
✅ Successfully saved 7 indices to database
✅ Job completed successfully in 3.45s
```

## Security Notes

⚠️ **IMPORTANT**: The service role key is extremely powerful and must be kept secret!

### ✅ Safe:

- Storing in `.env` file (not committed to git)
- Using in backend/server code
- Using in cron jobs/scrapers

### ❌ Dangerous:

- Committing to git
- Exposing to frontend
- Sharing publicly
- Hardcoding in source files

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Application                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌─────────────────┐  │
│  │   Scraper    │         │   API Routes    │  │
│  │  (Cron Job)  │         │  (Public Read)  │  │
│  └──────┬───────┘         └────────┬────────┘  │
│         │                          │           │
│         │ Writes                   │ Reads     │
│         │                          │           │
│  ┌──────▼───────┐         ┌────────▼────────┐  │
│  │ Admin Client │         │ Public Client   │  │
│  │ (Service Key)│         │  (Anon Key)     │  │
│  └──────┬───────┘         └────────┬────────┘  │
│         │                          │           │
│         └──────────┬───────────────┘           │
│                    │                           │
└────────────────────┼───────────────────────────┘
                     │
              ┌──────▼──────┐
              │  Supabase   │
              │  (RLS ON)   │
              └─────────────┘
```

## Why This Works

1. **Admin Client** uses service role key → bypasses RLS → can insert data
2. **Public Client** uses anon key → respects RLS → can read data
3. **RLS Policies** remain active for security
4. **Scraper** can write, **API** can read

## Verification Checklist

- [ ] Service role key added to `.env`
- [ ] `.env` file is in `.gitignore`
- [ ] Server restarted
- [ ] Integration test passes
- [ ] Cron job runs successfully
- [ ] Data appears in Supabase table

## Troubleshooting

### Still getting RLS error?

1. Check `.env` has `SUPABASE_SERVICE_ROLE_KEY`
2. Verify the key is correct (copy again from Supabase)
3. Restart the server
4. Check for typos in the key

### "Admin client not initialized" error?

- The service role key is missing or invalid
- Check `.env` file exists and has the key
- Verify no extra spaces in the key

### Keys not loading?

- Make sure `.env` is in the `backend` folder
- Restart the server after changing `.env`
- Check file is named exactly `.env` (not `.env.txt`)

## Additional Resources

- **Setup Guide**: `SUPABASE_SETUP.md`
- **Deployment Guide**: `DEPLOYMENT.md`
- **API Documentation**: `README.md`
- **Quick Start**: `QUICKSTART.md`

---

## Summary

✅ **Fixed**: RLS policy violation  
✅ **Added**: Service role key support  
✅ **Created**: Dual client architecture  
✅ **Maintained**: Security with RLS  
✅ **Documented**: Complete setup guide

**Status**: Ready to use after adding service role key to `.env`

---

_Last Updated: 2024_
