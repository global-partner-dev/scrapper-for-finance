require('dotenv').config();
const { scrapeCommodities, displayCommodities } = require('./scrapers/commoditiesScraper');
const { saveCommodities, getLatestCommodities } = require('./services/commoditiesService');

/**
 * Integration test for commodities scraper and database service
 * This script will:
 * 1. Scrape commodities data from investing.com
 * 2. Display the scraped data
 * 3. Save the data to Supabase
 * 4. Retrieve and display the saved data
 */
async function testCommoditiesIntegration() {
  console.log('🚀 Starting commodities integration test...\n');
  
  try {
    // Step 1: Scrape the data
    console.log('📊 Step 1: Scraping commodities data...');
    const commodities = await scrapeCommodities();
    
    if (!commodities || commodities.length === 0) {
      throw new Error('No commodities data scraped');
    }
    
    // Display the scraped data
    displayCommodities(commodities);
    
    // Step 2: Save to database
    console.log('\n💾 Step 2: Saving commodities to database...');
    const saveResult = await saveCommodities(commodities);
    
    if (!saveResult.success) {
      throw new Error(`Failed to save commodities: ${saveResult.message}`);
    }
    
    console.log(`✅ ${saveResult.message}`);
    
    // Step 3: Retrieve latest data from database
    console.log('\n📥 Step 3: Retrieving latest commodities from database...');
    const latestResult = await getLatestCommodities();
    
    if (!latestResult.success) {
      throw new Error(`Failed to retrieve commodities: ${latestResult.message}`);
    }
    
    console.log(`✅ ${latestResult.message}`);
    
    // Display retrieved data
    console.log('\n📋 Retrieved Data (first 5 items):');
    console.log(JSON.stringify(latestResult.data.slice(0, 5), null, 2));
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ INTEGRATION TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log(`Scraped: ${commodities.length} commodities`);
    console.log(`Saved: ${saveResult.saved} records`);
    console.log(`Retrieved: ${latestResult.data.length} latest records`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the integration test
testCommoditiesIntegration();