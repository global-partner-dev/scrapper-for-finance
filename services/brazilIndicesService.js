const { supabase, supabaseAdmin } = require('./supabaseClient');

/**
 * Inserts Brazil indices data into Supabase
 * @param {Array} indices - Array of index objects from scraper
 * @returns {Promise<Object>} Result with success status and details
 */
async function saveBrazilIndices(indices) {
  try {
    if (!indices || indices.length === 0) {
      return {
        success: false,
        message: 'No indices data to save',
        saved: 0
      };
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    // Transform data to match database schema
    const records = indices.map(index => ({
      name: index.name,
      last: index.last,
      high: index.high,
      low: index.low,
      change: index.change,
      change_percent: index.changePercent,
      time: index.time,
      scraped_at: index.scrapedAt
    }));

    // Insert all records using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('brazil_indices')
      .insert(records)
      .select();

    if (error) {
      console.error('Error saving to Supabase:', error);
      return {
        success: false,
        message: error.message,
        saved: 0,
        error
      };
    }

    console.log(`✅ Successfully saved ${data.length} indices to database`);
    
    return {
      success: true,
      message: `Saved ${data.length} indices`,
      saved: data.length,
      data
    };

  } catch (error) {
    console.error('Exception in saveBrazilIndices:', error);
    return {
      success: false,
      message: error.message,
      saved: 0,
      error
    };
  }
}

/**
 * Gets the latest data for all Brazil indices
 * @returns {Promise<Object>} Result with latest indices data
 */
async function getLatestIndices() {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_brazil_indices');

    if (error) {
      console.error('Error fetching latest indices:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} indices`,
      data
    };

  } catch (error) {
    console.error('Exception in getLatestIndices:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets historical data for a specific index
 * @param {string} indexName - Name of the index
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<Object>} Result with historical data
 */
async function getIndexHistory(indexName, limit = 100) {
  try {
    const { data, error } = await supabase
      .rpc('get_brazil_index_history', {
        p_name: indexName,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching index history:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} records for ${indexName}`,
      data
    };

  } catch (error) {
    console.error('Exception in getIndexHistory:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets indices data within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Result with filtered data
 */
async function getIndicesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .rpc('get_brazil_indices_by_date_range', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Error fetching indices by date range:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} records`,
      data
    };

  } catch (error) {
    console.error('Exception in getIndicesByDateRange:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Cleans up old indices data
 * @param {number} daysToKeep - Number of days to keep (default 30)
 * @returns {Promise<Object>} Result with number of deleted records
 */
async function cleanupOldData(daysToKeep = 30) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    const { data, error } = await supabaseAdmin
      .rpc('cleanup_old_brazil_indices_data', {
        p_days_to_keep: daysToKeep
      });

    if (error) {
      console.error('Error cleaning up old data:', error);
      return {
        success: false,
        message: error.message,
        deleted: 0,
        error
      };
    }

    console.log(`🗑️  Cleaned up ${data} old records`);

    return {
      success: true,
      message: `Deleted ${data} old records`,
      deleted: data
    };

  } catch (error) {
    console.error('Exception in cleanupOldData:', error);
    return {
      success: false,
      message: error.message,
      deleted: 0,
      error
    };
  }
}

module.exports = {
  saveBrazilIndices,
  getLatestIndices,
  getIndexHistory,
  getIndicesByDateRange,
  cleanupOldData
};