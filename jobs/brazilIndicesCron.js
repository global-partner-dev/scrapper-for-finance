const cron = require('node-cron');
const { scrapeBrazilIndices } = require('../scrapers/brazilIndicesScraper');
const { saveBrazilIndices } = require('../services/brazilIndicesService');

let isRunning = false;
let lastRunTime = null;
let lastRunStatus = null;
let runCount = 0;

/**
 * Main job function that scrapes and saves Brazil indices data
 */
async function runBrazilIndicesJob() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('⏭️  Skipping run - previous job still running');
    return;
  }

  isRunning = true;
  runCount++;
  const startTime = new Date();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Brazil Indices Scraper Job #${runCount} - Started at ${startTime.toLocaleString()}`);
  console.log('='.repeat(80));

  try {
    // Step 1: Scrape the data
    console.log('📡 Scraping data from investing.com...');
    const indices = await scrapeBrazilIndices();
    
    if (!indices || indices.length === 0) {
      throw new Error('No data scraped');
    }

    console.log(`✅ Scraped ${indices.length} indices successfully`);

    // Step 2: Save to database
    console.log('💾 Saving to Supabase...');
    const result = await saveBrazilIndices(indices);

    if (!result.success) {
      throw new Error(`Failed to save data: ${result.message}`);
    }

    // Success
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    lastRunTime = endTime;
    lastRunStatus = 'success';

    console.log(`✅ Job completed successfully in ${duration}s`);
    console.log(`📊 Summary: ${result.saved} indices saved to database`);
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
 * Starts the cron job to run every 2 minutes
 * @returns {Object} Cron task object
 */
function startBrazilIndicesCron() {
  console.log('\n🕐 Starting Brazil Indices Cron Job');
  console.log('⏰ Schedule: Every 2 minutes');
  console.log('📍 Timezone: System default');
  console.log('');

  // Run every 2 minutes: */2 * * * *
  // Format: minute hour day month weekday
  const task = cron.schedule('*/2 * * * *', async () => {
    await runBrazilIndicesJob();
  }, {
    scheduled: true,
    timezone: 'America/Sao_Paulo' // Brazilian timezone
  });

  // Run immediately on startup
  console.log('🏃 Running initial scrape...');
  runBrazilIndicesJob();

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
    nextRunIn: isRunning ? 'Running now' : 'Within 2 minutes'
  };
}

/**
 * Manually triggers the job (for testing)
 */
async function triggerManualRun() {
  console.log('🔧 Manual trigger requested');
  await runBrazilIndicesJob();
}

module.exports = {
  startBrazilIndicesCron,
  getCronStatus,
  triggerManualRun
};