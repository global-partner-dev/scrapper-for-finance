require('dotenv').config();
const { scrapeBrazilIndices } = require('./scrapers/brazilIndicesScraper');
const { saveBrazilIndices, getLatestIndices } = require('./services/brazilIndicesService');

/**
 * Integration test for the complete flow:
 * 1. Scrape data
 * 2. Save to Supabase
 * 3. Retrieve from Supabase
 */
async function testIntegration() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 INTEGRATION TEST - Brazil Indices Scraper + Supabase');
  console.log('='.repeat(80) + '\n');

  try {
    // Step 1: Test scraping
    console.log('📡 Step 1: Testing scraper...');
    const indices = await scrapeBrazilIndices();
    
    if (!indices || indices.length === 0) {
      throw new Error('Scraper returned no data');
    }
    
    console.log(`✅ Scraped ${indices.length} indices successfully\n`);
    
    // Display scraped data
    console.log('Scraped data:');
    indices.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${index.last || 'N/A'}`);
    });
    console.log('');

    // Step 2: Test saving to Supabase
    console.log('💾 Step 2: Testing Supabase save...');
    const saveResult = await saveBrazilIndices(indices);
    
    if (!saveResult.success) {
      throw new Error(`Failed to save: ${saveResult.message}`);
    }
    
    console.log(`✅ Saved ${saveResult.saved} indices to Supabase\n`);

    // Step 3: Test retrieving from Supabase
    console.log('📥 Step 3: Testing Supabase retrieval...');
    const getResult = await getLatestIndices();
    
    if (!getResult.success) {
      throw new Error(`Failed to retrieve: ${getResult.message}`);
    }
    
    console.log(`✅ Retrieved ${getResult.data.length} indices from Supabase\n`);
    
    // Display retrieved data
    console.log('Retrieved data:');
    getResult.data.forEach((index, i) => {
      console.log(`  ${i + 1}. ${index.name}: ${index.last || 'N/A'} (scraped at: ${new Date(index.scraped_at).toLocaleString()})`);
    });
    console.log('');

    // Summary
    console.log('='.repeat(80));
    console.log('✅ INTEGRATION TEST PASSED');
    console.log('='.repeat(80));
    console.log('All components are working correctly:');
    console.log('  ✓ Scraper can fetch data from investing.com');
    console.log('  ✓ Data can be saved to Supabase');
    console.log('  ✓ Data can be retrieved from Supabase');
    console.log('='.repeat(80) + '\n');
    
    process.exit(0);

  } catch (error) {
    console.error('\n' + '='.repeat(80));
    console.error('❌ INTEGRATION TEST FAILED');
    console.error('='.repeat(80));
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    console.error('='.repeat(80) + '\n');
    
    process.exit(1);
  }
}

// Run the test
testIntegration();