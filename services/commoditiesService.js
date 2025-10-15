const { supabase, supabaseAdmin } = require('./supabaseClient');

/**
 * Inserts commodities data into Supabase
 * @param {Array} commodities - Array of commodity objects from scraper
 * @returns {Promise<Object>} Result with success status and details
 */
async function saveCommodities(commodities) {
  try {
    if (!commodities || commodities.length === 0) {
      return {
        success: false,
        message: 'No commodities data to save',
        saved: 0
      };
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    // Transform data to match database schema
    const records = commodities.map(commodity => ({
      name: commodity.name,
      fifteen_minutes: commodity.fifteenMinutes,
      hourly: commodity.hourly,
      daily: commodity.daily,
      one_week: commodity.oneWeek,
      one_month: commodity.oneMonth,
      ytd: commodity.ytd,
      three_years: commodity.threeYears,
      scraped_at: commodity.scrapedAt
    }));

    // Insert all records using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('commodities')
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

    console.log(`✅ Successfully saved ${data.length} commodities to database`);
    
    return {
      success: true,
      message: `Saved ${data.length} commodities`,
      saved: data.length,
      data
    };

  } catch (error) {
    console.error('Exception in saveCommodities:', error);
    return {
      success: false,
      message: error.message,
      saved: 0,
      error
    };
  }
}

/**
 * Gets the latest data for all commodities
 * @returns {Promise<Object>} Result with latest commodities data
 */
async function getLatestCommodities() {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_commodities');

    if (error) {
      console.error('Error fetching latest commodities:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} commodities`,
      data
    };

  } catch (error) {
    console.error('Exception in getLatestCommodities:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets historical data for a specific commodity
 * @param {string} commodityName - Name of the commodity
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<Object>} Result with historical data
 */
async function getCommodityHistory(commodityName, limit = 100) {
  try {
    const { data, error } = await supabase
      .rpc('get_commodity_history', {
        p_name: commodityName,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching commodity history:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} records for ${commodityName}`,
      data
    };

  } catch (error) {
    console.error('Exception in getCommodityHistory:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets commodities data within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Result with filtered data
 */
async function getCommoditiesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .rpc('get_commodities_by_date_range', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Error fetching commodities by date range:', error);
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
    console.error('Exception in getCommoditiesByDateRange:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Cleans up old commodities data
 * @param {number} daysToKeep - Number of days to keep (default 30)
 * @returns {Promise<Object>} Result with number of deleted records
 */
async function cleanupOldData(daysToKeep = 30) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    const { data, error } = await supabaseAdmin
      .rpc('cleanup_old_commodities_data', {
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
  saveCommodities,
  getLatestCommodities,
  getCommodityHistory,
  getCommoditiesByDateRange,
  cleanupOldData
};