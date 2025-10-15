const { scrapeCurrencies, displayCurrencies } = require('./scrapers/currenciesScraper');

/**
 * Test script for the currencies scraper
 */
async function testCurrenciesScraper() {
  console.log('Starting currencies scraper test...\n');
  
  try {
    // Scrape the data
    const currencies = await scrapeCurrencies();
    
    // Display the results
    displayCurrencies(currencies);
    
    // Also output as JSON for inspection
    console.log('\nJSON Output:');
    console.log(JSON.stringify(currencies, null, 2));
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testCurrenciesScraper();