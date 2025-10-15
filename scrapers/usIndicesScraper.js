const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes US indices data from investing.com
 * @returns {Promise<Array>} Array of index objects with their data
 */
async function scrapeUSIndices() {
  try {
    const url = 'https://www.investing.com/indices/usa-indices?include-major-indices=true';
    
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
    const indices = [];

    // Find the table with class "dynamic-table"
    let table = $('.dynamic-table');
    
    if (table.length === 0) {
      // Try alternative selectors
      table = $('table').first();
      if (table.length === 0) {
        throw new Error('No table found on the page');
      }
    }

    return parseTableData($, table);

  } catch (error) {
    console.error('Error scraping US indices:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
}

/**
 * Parses table data and extracts index information
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} table - Table element
 * @returns {Array} Array of parsed index data
 */
function parseTableData($, table) {
  const indices = [];
  
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

      // Extract name (usually in the first or second column)
      let name = '';
      const nameCell = $row.find('td[data-test="name"], td.name, td:first-child a, td:nth-child(2) a');
      if (nameCell.length > 0) {
        name = nameCell.text().trim();
      } else {
        // Fallback: try to find any link in the first few columns
        const link = $row.find('td:nth-child(1) a, td:nth-child(2) a').first();
        name = link.text().trim();
      }

      // Based on the screenshot: Name, Last, High, Low, Chg., Chg. %, Time
      // Columns appear to be: 1=checkbox, 2=name, 3=last, 4=high, 5=low, 6=change, 7=change%, 8=time
      const last = extractNumericValue($, $row, 'last', 3);
      const high = extractNumericValue($, $row, 'high', 4);
      const low = extractNumericValue($, $row, 'low', 5);
      const change = extractNumericValue($, $row, 'change', 6);
      const changePercent = extractPercentValue($, $row, 'change-percent', 7);
      const time = extractTimeValue($, $row, 'time', 8);

      // Only add if we have at least a name and some data
      if (name && (last || high || low)) {
        const indexData = {
          name,
          last,
          high,
          low,
          change,
          changePercent,
          time,
          scrapedAt: new Date().toISOString()
        };

        indices.push(indexData);
      }
    } catch (error) {
      console.error(`Error parsing row ${index}:`, error.message);
    }
  });

  return indices;
}

/**
 * Extracts numeric value from a cell
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} row - Row element
 * @param {string} dataTest - data-test attribute value
 * @param {number} fallbackIndex - Fallback column index
 * @returns {number|null} Parsed numeric value
 */
function extractNumericValue($, row, dataTest, fallbackIndex) {
  let cell = row.find(`td[data-test="${dataTest}"]`);
  
  if (cell.length === 0) {
    cell = row.find(`td:nth-child(${fallbackIndex})`);
  }
  
  if (cell.length === 0) {
    return null;
  }

  const text = cell.text().trim();
  // Remove commas and parse as float
  const value = text.replace(/,/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : parsed;
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
  // Remove % sign and parse as float
  const value = text.replace(/%/g, '').replace(/\+/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts time value from a cell
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} row - Row element
 * @param {string} dataTest - data-test attribute value
 * @param {number} fallbackIndex - Fallback column index
 * @returns {string|null} Time string
 */
function extractTimeValue($, row, dataTest, fallbackIndex) {
  let cell = row.find(`td[data-test="${dataTest}"]`);
  
  if (cell.length === 0) {
    cell = row.find(`td:nth-child(${fallbackIndex})`);
  }
  
  if (cell.length === 0) {
    return null;
  }

  return cell.text().trim() || null;
}

/**
 * Formats the scraped data for console output
 * @param {Array} indices - Array of index data
 */
function displayIndices(indices) {
  console.log('\n' + '='.repeat(120));
  console.log('US INDICES DATA');
  console.log('='.repeat(120));
  console.log(
    'Name'.padEnd(25) +
    'Last'.padStart(15) +
    'High'.padStart(15) +
    'Low'.padStart(15) +
    'Chg.'.padStart(12) +
    'Chg. %'.padStart(12) +
    'Time'.padStart(15)
  );
  console.log('-'.repeat(120));

  indices.forEach(index => {
    const changePercentStr = index.changePercent !== null 
      ? ((index.changePercent > 0 ? '+' : '') + index.changePercent.toFixed(2) + '%')
      : 'N/A';
    
    console.log(
      index.name.padEnd(25) +
      (index.last ? index.last.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(15) : 'N/A'.padStart(15)) +
      (index.high ? index.high.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(15) : 'N/A'.padStart(15)) +
      (index.low ? index.low.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(15) : 'N/A'.padStart(15)) +
      (index.change ? (index.change > 0 ? '+' : '') + index.change.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padStart(11) : 'N/A'.padStart(12)) +
      changePercentStr.padStart(12) +
      (index.time || 'N/A').padStart(15)
    );
  });

  console.log('='.repeat(120));
  console.log(`Total indices: ${indices.length}`);
  console.log(`Scraped at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(120) + '\n');
}

module.exports = {
  scrapeUSIndices,
  displayIndices
};