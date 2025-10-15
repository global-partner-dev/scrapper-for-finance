require('dotenv').config();
const { scrapeBrazilIndices, displayIndices } = require('./scrapers/brazilIndicesScraper');

/**
 * Test script to run the Brazil indices scraper
 */
async function testScraper() {
  console.log('Starting Brazil Indices Scraper Test...\n');

  try {
    // Scrape the data
    const indices = await scrapeBrazilIndices();

    // Display in formatted table
    displayIndices(indices);

    // Also output raw JSON for verification
    console.log('\nRAW JSON DATA:');
    console.log(JSON.stringify(indices, null, 2));

    console.log('\n✅ Scraping completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Scraping failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testScraper();