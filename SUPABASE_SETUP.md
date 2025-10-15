# 🔑 Supabase Setup Guide

## Quick Fix for RLS Error

If you're seeing this error:

```
new row violates row-level security policy for table "brazil_indices"
```

You need to add the **Service Role Key** to your `.env` file.

---

## Step-by-Step Setup

### 1. Get Your Supabase Keys

1. Go to your Supabase project: https://app.supabase.com
2. Click on your project
3. Go to **Settings** → **API**
4. You'll see two important keys:

   - **anon/public key** (already in your .env as `VITE_SUPABASE_PUBLISHABLE_KEY`)
   - **service_role key** (⚠️ secret - click "Reveal" to see it)

### 2. Update Your .env File

Add the service role key to your `.env` file:

```env
# Your existing keys
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-anon-key

# Add this new line:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
```

### 3. Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

---

## Why Two Keys?

### Anon/Public Key (`VITE_SUPABASE_PUBLISHABLE_KEY`)

- ✅ Safe to expose in frontend
- ✅ Respects Row Level Security (RLS) policies
- ✅ Used for read operations via API
- ❌ Cannot insert data (blocked by RLS)

### Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)

- ⚠️ **MUST BE KEPT SECRET**
- ✅ Bypasses Row Level Security
- ✅ Used by scraper/cron jobs to insert data
- ✅ Used for admin operations
- ❌ Never expose to frontend or commit to git

---

## Security Best Practices

### ✅ DO:

- Keep service role key in `.env` file only
- Add `.env` to `.gitignore`
- Use environment variables in production
- Rotate keys if accidentally exposed

### ❌ DON'T:

- Commit service role key to git
- Expose service role key to frontend
- Share service role key publicly
- Use service role key in client-side code

---

## Verification

After adding the service role key, test the setup:

```bash
npm run test:integration
```

You should see:

```
✅ Successfully saved 7 indices to database
✅ Integration test passed!
```

---

## Troubleshooting

### Error: "Supabase admin client not initialized"

**Solution**: Add `SUPABASE_SERVICE_ROLE_KEY` to your `.env` file

### Error: "Missing Supabase environment variables"

**Solution**: Make sure all three variables are in `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Invalid API key"

**Solution**:

1. Double-check you copied the full key (they're very long)
2. Make sure there are no extra spaces
3. Verify you're using the correct project's keys

---

## Where to Find Keys

```
Supabase Dashboard
└── Your Project
    └── Settings (⚙️)
        └── API
            ├── Project URL → VITE_SUPABASE_URL
            ├── anon public → VITE_SUPABASE_PUBLISHABLE_KEY
            └── service_role → SUPABASE_SERVICE_ROLE_KEY (click "Reveal")
```

---

## Complete .env Example

```env
# Server
PORT=3000
NODE_ENV=development

# Supabase
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjE2MTYxNiwiZXhwIjoxOTMxNzM3NjE2fQ.example-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MTYxNjE2LCJleHAiOjE5MzE3Mzc2MTZ9.example-service-role-key
```

---

**Need Help?** Check the main README.md or DEPLOYMENT.md for more details.
