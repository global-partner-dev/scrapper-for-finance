const { scrapeCommodities, displayCommodities } = require('./scrapers/commoditiesScraper');

/**
 * Test script for commodities scraper
 * This script will scrape commodities data and display it in the console
 */
async function testCommoditiesScraper() {
  console.log('Starting commodities scraper test...\n');
  
  try {
    // Scrape the data
    const commodities = await scrapeCommodities();
    
    // Display the results
    displayCommodities(commodities);
    
    // Also output raw JSON for verification
    console.log('\nRaw JSON Data (first 3 items):');
    console.log(JSON.stringify(commodities.slice(0, 3), null, 2));
    
    console.log('\n✅ Test completed successfully!');
    console.log(`Total commodities scraped: ${commodities.length}`);
    
  } catch (error) {
    console.error('\n❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testCommoditiesScraper();