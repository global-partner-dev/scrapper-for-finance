const cron = require('node-cron');
const { supabaseAdmin } = require('../services/supabaseClient');

let isRunning = false;
let lastRunTime = null;
let lastRunStatus = null;
let runCount = 0;

/**
 * Calls a cleanup function to delete data older than 15 days
 * @param {string} functionName - Name of the cleanup function
 * @param {string} tableName - Display name of the table
 * @returns {Promise<Object>} Result with deleted count and status
 */
async function callCleanupFunction(functionName, tableName) {
  try {
    console.log(`  🧹 Cleaning ${tableName}...`);
    
    const { data, error } = await supabaseAdmin.rpc(functionName, {
      p_days_to_keep: 15
    });

    if (error) {
      throw new Error(`${tableName} cleanup failed: ${error.message}`);
    }

    console.log(`     ✅ Deleted ${data || 0} old records from ${tableName}`);
    
    return {
      success: true,
      table: tableName,
      deletedCount: data || 0
    };
  } catch (error) {
    console.error(`     ❌ Error cleaning ${tableName}: ${error.message}`);
    return {
      success: false,
      table: tableName,
      error: error.message
    };
  }
}

/**
 * Main job function that cleans up old data from all tables
 */
async function runCleanupJob() {
  // Prevent concurrent runs
  if (isRunning) {
    console.log('⏭️  Skipping cleanup run - previous job still running');
    return;
  }

  isRunning = true;
  runCount++;
  const startTime = new Date();
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧹 Data Cleanup Job #${runCount} - Started at ${startTime.toLocaleString()}`);
  console.log('='.repeat(80));

  try {
    // Call cleanup functions for all 4 tables
    console.log('📊 Cleaning up data older than 15 days...\n');
    
    const results = await Promise.all([
      callCleanupFunction('cleanup_old_us_indices_data', 'US Indices'),
      callCleanupFunction('cleanup_old_brazil_indices_data', 'Brazil Indices'),
      callCleanupFunction('cleanup_old_currencies_data', 'Currencies'),
      callCleanupFunction('cleanup_old_commodities_data', 'Commodities')
    ]);

    // Check if all operations succeeded
    const allSuccess = results.every(r => r.success);
    const totalDeleted = results.reduce((sum, r) => sum + (r.deletedCount || 0), 0);

    // Success
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    lastRunTime = endTime;
    lastRunStatus = allSuccess ? 'success' : 'partial_success';

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Cleanup completed in ${duration}s`);
    console.log(`📊 Total records deleted: ${totalDeleted}`);
    console.log(`📋 Summary:`);
    results.forEach(r => {
      if (r.success) {
        console.log(`   ✓ ${r.table}: ${r.deletedCount} records deleted`);
      } else {
        console.log(`   ✗ ${r.table}: ${r.error}`);
      }
    });
    console.log('='.repeat(80) + '\n');

  } catch (error) {
    const endTime = new Date();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    lastRunTime = endTime;
    lastRunStatus = 'failed';

    console.error(`❌ Cleanup job failed after ${duration}s`);
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(80) + '\n');
  } finally {
    isRunning = false;
  }
}

/**
 * Starts the cron job to run once daily at 1 AM UTC
 * @returns {Object} Cron task object
 */
function startCleanupCron() {
  console.log('\n🕐 Starting Data Cleanup Cron Job');
  console.log('⏰ Schedule: Daily at 1:00 AM UTC (every day)');
  console.log('🗑️  Function: Removes data older than 15 days');
  console.log('');

  // Run daily at 1 AM UTC: 0 1 * * *
  // Format: minute hour day month weekday
  const task = cron.schedule('0 1 * * *', async () => {
    await runCleanupJob();
  }, {
    scheduled: true,
    timezone: 'UTC'
  });

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
    nextSchedule: '1:00 AM UTC daily',
    nextRunIn: isRunning ? 'Running now' : 'Check scheduled time'
  };
}

/**
 * Manually triggers the cleanup job (for testing)
 */
async function triggerManualRun() {
  console.log('🔧 Manual cleanup trigger requested');
  await runCleanupJob();
}

module.exports = {
  startCleanupCron,
  getCronStatus,
  triggerManualRun
};