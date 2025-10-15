const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes commodities data from investing.com
 * @returns {Promise<Array>} Array of commodity objects with their data
 */
async function scrapeCommodities() {
  try {
    const url = 'https://www.investing.com/commodities';
    
    console.log('Fetching data from:', url);
    
    // Fetch the page with headers to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(response.data);
    const commodities = [];

    // Find the div with data-test="dynamic-table"
    let tableContainer = $('div[data-test="dynamic-table"]');
    
    if (tableContainer.length === 0) {
      console.log('Target div with data-test="dynamic-table" not found. Searching for alternative selectors...');
      
      // Try alternative selectors
      tableContainer = $('.dynamic-table');
      if (tableContainer.length === 0) {
        // Try to find any table
        const table = $('table').first();
        if (table.length === 0) {
          throw new Error('No table found on the page');
        }
        return parseTableData($, table);
      }
    }

    console.log('Found target table container');

    // The table might be inside the div
    const table = tableContainer.find('table').first();
    if (table.length > 0) {
      return parseTableData($, table);
    } else {
      // If no table inside, treat the container as the table
      return parseTableData($, tableContainer);
    }

  } catch (error) {
    console.error('Error scraping commodities:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
}

/**
 * Parses table data and extracts commodity information
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} table - Table element
 * @returns {Array} Array of parsed commodity data
 */
function parseTableData($, table) {
  const commodities = [];
  
  // Find all rows in the table body
  const rows = table.find('tbody tr');
  
  console.log(`Found ${rows.length} rows in the table`);

  rows.each((index, row) => {
    try {
      const $row = $(row);
      
      // Extract data from each column
      const cells = $row.find('td');
      
      if (cells.length === 0) {
        return; // Skip empty rows
      }

      // Extract name (usually in the first or second column with a link)
      let name = '';
      const nameCell = $row.find('td[data-test="name"], td.name, td:first-child a, td:nth-child(2) a');
      if (nameCell.length > 0) {
        name = nameCell.text().trim();
      } else {
        // Fallback: try to find any link in the first few columns
        const link = $row.find('td:nth-child(1) a, td:nth-child(2) a').first();
        name = link.text().trim();
      }

      // Based on the screenshot: Name, 15 Minutes, Hourly, Daily, 1 Week, 1 Month, YTD, 3 Years
      // Columns appear to be: 1=checkbox, 2=name, 3=15min, 4=hourly, 5=daily, 6=1week, 7=1month, 8=ytd, 9=3years
      const fifteenMinutes = extractPercentValue($, $row, '15-minutes', 3);
      const hourly = extractPercentValue($, $row, 'hourly', 4);
      const daily = extractPercentValue($, $row, 'daily', 5);
      const oneWeek = extractPercentValue($, $row, '1-week', 6);
      const oneMonth = extractPercentValue($, $row, '1-month', 7);
      const ytd = extractPercentValue($, $row, 'ytd', 8);
      const threeYears = extractPercentValue($, $row, '3-years', 9);

      // Only add if we have at least a name and some data
      if (name && (fifteenMinutes !== null || hourly !== null || daily !== null)) {
        const commodityData = {
          name,
          fifteenMinutes,
          hourly,
          daily,
          oneWeek,
          oneMonth,
          ytd,
          threeYears,
          scrapedAt: new Date().toISOString()
        };

        commodities.push(commodityData);
      }
    } catch (error) {
      console.error(`Error parsing row ${index}:`, error.message);
    }
  });

  return commodities;
}

/**
 * Extracts percentage value from a cell
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} row - Row element
 * @param {string} dataTest - data-test attribute value
 * @param {number} fallbackIndex - Fallback column index
 * @returns {number|null} Parsed percentage value
 */
function extractPercentValue($, row, dataTest, fallbackIndex) {
  let cell = row.find(`td[data-test="${dataTest}"]`);
  
  if (cell.length === 0) {
    cell = row.find(`td:nth-child(${fallbackIndex})`);
  }
  
  if (cell.length === 0) {
    return null;
  }

  const text = cell.text().trim();
  // Remove % sign, plus signs, and parse as float
  const value = text.replace(/%/g, '').replace(/\+/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats the scraped data for console output
 * @param {Array} commodities - Array of commodity data
 */
function displayCommodities(commodities) {
  console.log('\n' + '='.repeat(140));
  console.log('COMMODITIES DATA');
  console.log('='.repeat(140));
  console.log(
    'Name'.padEnd(20) +
    '15 Minutes'.padStart(15) +
    'Hourly'.padStart(15) +
    'Daily'.padStart(15) +
    '1 Week'.padStart(15) +
    '1 Month'.padStart(15) +
    'YTD'.padStart(15) +
    '3 Years'.padStart(15)
  );
  console.log('-'.repeat(140));

  commodities.forEach(commodity => {
    const formatPercent = (value) => {
      if (value === null) return 'N/A';
      const sign = value > 0 ? '+' : '';
      return sign + value.toFixed(2) + '%';
    };
    
    console.log(
      commodity.name.padEnd(20) +
      formatPercent(commodity.fifteenMinutes).padStart(15) +
      formatPercent(commodity.hourly).padStart(15) +
      formatPercent(commodity.daily).padStart(15) +
      formatPercent(commodity.oneWeek).padStart(15) +
      formatPercent(commodity.oneMonth).padStart(15) +
      formatPercent(commodity.ytd).padStart(15) +
      formatPercent(commodity.threeYears).padStart(15)
    );
  });

  console.log('='.repeat(140));
  console.log(`Total commodities: ${commodities.length}`);
  console.log(`Scraped at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(140) + '\n');
}

module.exports = {
  scrapeCommodities,
  displayCommodities
};