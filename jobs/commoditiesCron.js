const cron = require('node-cron');
const { scrapeCommodities } = require('../scrapers/commoditiesScraper');
const { saveCommodities } = require('../services/commoditiesService');

let isRunning = false;
let lastRunTime = null;
let lastRunStatus = null;
let runCount = 0;

/**
 * Main job function that scrapes and saves commodities data
 */
async function runCommoditiesJob() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('⏭️  Skipping run - previous job still running');
    return;
  }

  isRunning = true;
  runCount++;
  const startTime = new Date();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Commodities Scraper Job #${runCount} - Started at ${startTime.toLocaleString()}`);
  console.log('='.repeat(80));

  try {
    // Step 1: Scrape the data
    console.log('📡 Scraping data from investing.com...');
    const commodities = await scrapeCommodities();
    
    if (!commodities || commodities.length === 0) {
      throw new Error('No data scraped');
    }

    console.log(`✅ Scraped ${commodities.length} commodities successfully`);

    // Step 2: Save to database
    console.log('💾 Saving to Supabase...');
    const result = await saveCommodities(commodities);

    if (!result.success) {
      throw new Error(`Failed to save data: ${result.message}`);
    }

    // Success
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    lastRunTime = endTime;
    lastRunStatus = 'success';

    console.log(`✅ Job completed successfully in ${duration}s`);
    console.log(`📊 Summary: ${result.saved} commodities saved to database`);
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    lastRunTime = endTime;
    lastRunStatus = 'failed';

    console.error(`❌ Job failed after ${duration}s`);
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(80) + '\n');
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the cron job to run every 5 minutes
 * @returns {Object} Cron task object
 */
function startCommoditiesCron() {
  console.log('\n🕐 Starting Commodities Cron Job');
  console.log('⏰ Schedule: Every 5 minutes');
  console.log('📍 Timezone: America/Sao_Paulo');
  console.log('');

  // Run every 5 minutes: */5 * * * *
  // Format: minute hour day month weekday
  const task = cron.schedule('*/2 * * * *', async () => {
    await runCommoditiesJob();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo' // Brazilian timezone
  });

  // Run immediately on startup
  console.log('🏃 Running initial scrape...');
  runCommoditiesJob();

  return task;
}

/**
 * Gets the status of the cron job
 * @returns {Object} Status information
 */
function getCronStatus() {
  return {
    isRunning,
    lastRunTime,
    lastRunStatus,
    runCount,
    nextRunIn: isRunning ? 'Running now' : 'Within 5 minutes'
  };
}

/**
 * Manually triggers the job (for testing)
 */
async function triggerManualRun() {
  console.log('🔧 Manual trigger requested');
  await runCommoditiesJob();
}

module.exports = {
  startCommoditiesCron,
  getCronStatus,
  triggerManualRun
};