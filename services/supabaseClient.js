const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable. Please check your .env file.');
}

// Create two clients:
// 1. Admin client with service role key (bypasses RLS) - for scraper/cron jobs
// 2. Public client with anon key (respects RLS) - for API endpoints

let supabaseAdmin;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
} else {
  console.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will fail.');
}

let supabase;
if (supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️  VITE_SUPABASE_PUBLISHABLE_KEY not found. Public operations will fail.');
}

module.exports = {
  supabase,        // Public client (respects RLS)
  supabaseAdmin    // Admin client (bypasses RLS)
};