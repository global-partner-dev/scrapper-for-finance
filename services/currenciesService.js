const { supabase, supabaseAdmin } = require('./supabaseClient');

/**
 * Inserts currencies data into Supabase
 * @param {Array} currencies - Array of currency objects from scraper
 * @returns {Promise<Object>} Result with success status and details
 */
async function saveCurrencies(currencies) {
  try {
    if (!currencies || currencies.length === 0) {
      return {
        success: false,
        message: 'No currencies data to save',
        saved: 0
      };
    }

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    // Transform data to match database schema
    const records = currencies.map(currency => ({
      name: currency.name,
      last_price: currency.lastPrice,
      change: currency.change,
      change_percent: currency.changePercent,
      scraped_at: currency.scrapedAt
    }));

    // Insert all records using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from('currencies')
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

    console.log(`✅ Successfully saved ${data.length} currencies to database`);
    
    return {
      success: true,
      message: `Saved ${data.length} currencies`,
      saved: data.length,
      data
    };

  } catch (error) {
    console.error('Exception in saveCurrencies:', error);
    return {
      success: false,
      message: error.message,
      saved: 0,
      error
    };
  }
}

/**
 * Gets the latest data for all currencies
 * @returns {Promise<Object>} Result with latest currencies data
 */
async function getLatestCurrencies() {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_currencies');

    if (error) {
      console.error('Error fetching latest currencies:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} currencies`,
      data
    };

  } catch (error) {
    console.error('Exception in getLatestCurrencies:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets historical data for a specific currency
 * @param {string} currencyName - Name of the currency pair
 * @param {number} limit - Number of records to retrieve
 * @returns {Promise<Object>} Result with historical data
 */
async function getCurrencyHistory(currencyName, limit = 100) {
  try {
    const { data, error } = await supabase
      .rpc('get_currency_history', {
        p_name: currencyName,
        p_limit: limit
      });

    if (error) {
      console.error('Error fetching currency history:', error);
      return {
        success: false,
        message: error.message,
        data: [],
        error
      };
    }

    return {
      success: true,
      message: `Retrieved ${data.length} records for ${currencyName}`,
      data
    };

  } catch (error) {
    console.error('Exception in getCurrencyHistory:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Gets currencies data within a date range
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {Promise<Object>} Result with filtered data
 */
async function getCurrenciesByDateRange(startDate, endDate) {
  try {
    const { data, error } = await supabase
      .rpc('get_currencies_by_date_range', {
        p_start_date: startDate,
        p_end_date: endDate
      });

    if (error) {
      console.error('Error fetching currencies by date range:', error);
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
    console.error('Exception in getCurrenciesByDateRange:', error);
    return {
      success: false,
      message: error.message,
      data: [],
      error
    };
  }
}

/**
 * Cleans up old currencies data
 * @param {number} daysToKeep - Number of days to keep (default 30)
 * @returns {Promise<Object>} Result with number of deleted records
 */
async function cleanupOldData(daysToKeep = 30) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized. Please set SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    const { data, error } = await supabaseAdmin
      .rpc('cleanup_old_currencies_data', {
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
  saveCurrencies,
  getLatestCurrencies,
  getCurrencyHistory,
  getCurrenciesByDateRange,
  cleanupOldData
};