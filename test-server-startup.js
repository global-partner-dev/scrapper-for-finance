require('dotenv').config();
const { startCommoditiesCron, getCronStatus } = require('./jobs/commoditiesCron');

console.log('🧪 Testing commodities cron job startup...\n');

// Start the cron job
startCommoditiesCron();

// Wait a moment for it to initialize
setTimeout(() => {
  const status = getCronStatus();
  
  console.log('📊 Cron Job Status:');
  console.log('==================');
  console.log(`Running: ${status.isRunning ? '✅ Yes' : '❌ No'}`);
  console.log(`Schedule: ${status.schedule}`);
  console.log(`Timezone: ${status.timezone}`);
  console.log(`Last Run: ${status.lastRun || 'Never'}`);
  console.log(`Next Run: ${status.nextRun || 'Not scheduled'}`);
  console.log(`Total Runs: ${status.totalRuns}`);
  console.log(`Successful: ${status.successfulRuns}`);
  console.log(`Failed: ${status.failedRuns}`);
  
  if (status.isRunning) {
    console.log('\n✅ SUCCESS! The commodities cron job is running properly!');
    console.log('🎉 Your server integration is working correctly!');
  } else {
    console.log('\n❌ WARNING: Cron job is not running');
  }
  
  process.exit(0);
}, 2000);