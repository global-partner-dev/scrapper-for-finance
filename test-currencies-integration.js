/**
 * Test script for currencies scraper integration with Supabase
 * This script tests the complete flow: scraping -> saving to database
 */

const { scrapeCurrencies } = require('./scrapers/currenciesScraper');
const { saveCurrencies, getLatestCurrencies } = require('./services/currenciesService');

async function testCurrenciesIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 Testing Currencies Scraper Integration');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Test scraping
    console.log('📡 Step 1: Scraping currencies data...');
    const currencies = await scrapeCurrencies();
    
    if (!currencies || currencies.length === 0) {
      throw new Error('No currencies data scraped');
    }
    
    console.log(`✅ Successfully scraped ${currencies.length} currency pairs\n`);
    console.table(currencies);

    // Step 2: Test saving to database
    console.log('\n💾 Step 2: Saving to Supabase...');
    const saveResult = await saveCurrencies(currencies);
    
    if (!saveResult.success) {
      throw new Error(`Failed to save: ${saveResult.message}`);
    }
    
    console.log(`✅ Successfully saved ${saveResult.saved} currency pairs to database\n`);

    // Step 3: Test retrieving latest data
    console.log('📊 Step 3: Retrieving latest currencies from database...');
    const latestResult = await getLatestCurrencies();
    
    if (!latestResult.success) {
      throw new Error(`Failed to retrieve: ${latestResult.message}`);
    }
    
    console.log(`✅ Successfully retrieved ${latestResult.data.length} currency pairs\n`);
    console.table(latestResult.data);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ All tests passed successfully!');
    console.log('='.repeat(80));
    console.log('📊 Summary:');
    console.log(`   - Scraped: ${currencies.length} currency pairs`);
    console.log(`   - Saved: ${saveResult.saved} records`);
    console.log(`   - Retrieved: ${latestResult.data.length} records`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ Test failed!');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(80) + '\n');
    process.exit(1);
  }
}

// Run the test
testCurrenciesIntegration();