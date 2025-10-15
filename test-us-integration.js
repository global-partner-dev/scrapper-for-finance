/**
 * Integration test for US Indices feature
 * Tests scraping, saving to database, and retrieving data
 */

require('dotenv').config();
const { scrapeUSIndices } = require('./scrapers/usIndicesScraper');
const { saveUSIndices, getLatestIndices } = require('./services/usIndicesService');

async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('US INDICES INTEGRATION TEST');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Test scraping
    console.log('📡 Step 1: Testing scraper...');
    const scrapedData = await scrapeUSIndices();
    
    if (!scrapedData || scrapedData.length === 0) {
      throw new Error('Scraping failed - no data returned');
    }
    
    console.log(`✅ Scraped ${scrapedData.length} indices successfully`);
    console.log('Sample data:', JSON.stringify(scrapedData[0], null, 2));
    console.log('');

    // Step 2: Test saving to database
    console.log('💾 Step 2: Testing database save...');
    const saveResult = await saveUSIndices(scrapedData);
    
    if (!saveResult.success) {
      throw new Error(`Save failed: ${saveResult.message}`);
    }
    
    console.log(`✅ Saved ${saveResult.saved} indices to database`);
    console.log('');

    // Step 3: Test retrieving latest data
    console.log('📊 Step 3: Testing data retrieval...');
    
    // Wait a moment for database to process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const latestResult = await getLatestIndices();
    
    if (!latestResult.success) {
      throw new Error(`Retrieval failed: ${latestResult.message}`);
    }
    
    console.log(`✅ Retrieved ${latestResult.data.length} indices from database`);
    console.log('');

    // Display retrieved data
    console.log('📋 Retrieved Data:');
    console.log('-'.repeat(80));
    latestResult.data.forEach(index => {
      console.log(`${index.name.padEnd(20)} | Last: ${index.last} | Change: ${index.change_percent}%`);
    });
    console.log('-'.repeat(80));
    console.log('');

    // Final summary
    console.log('='.repeat(80));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(80));
    console.log('Summary:');
    console.log(`  - Scraped: ${scrapedData.length} indices`);
    console.log(`  - Saved: ${saveResult.saved} indices`);
    console.log(`  - Retrieved: ${latestResult.data.length} indices`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('='.repeat(80) + '\n');
    
    process.exit(1);
  }
}

// Run the test
console.log('\n🚀 Starting US Indices Integration Test...\n');
testIntegration();