/**
 * Test script for US Indices Scraper
 * This script fetches US indices data and displays it in the console
 */

const { scrapeUSIndices, displayIndices } = require('./usIndicesScraper');

async function testScraper() {
  try {
    console.log('Starting US Indices scraper test...\n');
    
    // Scrape the data
    const indices = await scrapeUSIndices();
    
    // Display the results
    if (indices && indices.length > 0) {
      displayIndices(indices);
      
      // Also output raw JSON for verification
      console.log('\nRAW JSON DATA:');
      console.log(JSON.stringify(indices, null, 2));
    } else {
      console.log('No indices data found!');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testScraper();