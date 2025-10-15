require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying commodities database setup...\n');

  try {
    // Check if table exists by trying to query it
    const { data, error } = await supabase
      .from('commodities')
      .select('*')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.commodities" does not exist')) {
        console.log('❌ SETUP REQUIRED: The commodities table does not exist in your database.\n');
        console.log('📋 TO FIX THIS:\n');
        console.log('1. Open your Supabase Dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy and paste the contents of: backend/sqls/04_commodities_setup.sql');
        console.log('4. Click "Run" to execute the SQL\n');
        console.log('5. Run this verification script again\n');
        return false;
      } else {
        console.error('❌ Database error:', error.message);
        return false;
      }
    }

    console.log('✅ Commodities table exists!');
    
    // Check if there's any data
    const { data: allData, error: countError } = await supabase
      .from('commodities')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('⚠️  Could not count records:', countError.message);
    } else {
      console.log(`📊 Current records in database: ${allData?.length || 0}`);
    }

    // Try to get latest data
    const { data: latestData, error: latestError } = await supabase
      .from('commodities')
      .select('name, scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(5);

    if (!latestError && latestData && latestData.length > 0) {
      console.log('\n📈 Latest commodities in database:');
      latestData.forEach(item => {
        console.log(`   - ${item.name} (${new Date(item.scraped_at).toLocaleString()})`);
      });
    } else if (latestData && latestData.length === 0) {
      console.log('\n⚠️  No data in database yet. The cron job will populate it automatically.');
    }

    console.log('\n✅ DATABASE SETUP IS COMPLETE!\n');
    console.log('🚀 Next steps:');
    console.log('   1. Start your server: npm start');
    console.log('   2. The cron job will automatically scrape data every 5 minutes');
    console.log('   3. Or trigger manually: POST http://localhost:3000/api/commodities/cron/trigger\n');
    
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifySetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });