const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes currency data from investing.com technical summary page
 * @returns {Promise<Array>} Array of currency objects with their data
 */
async function scrapeCurrencies() {
  try {
    const url = 'https://br.investing.com/technical/technical-summary';
    
    console.log('Fetching data from:', url);
    
    // Fetch the page with headers to mimic a browser
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    const $ = cheerio.load(response.data);
    const currencies = [];

    // Find the table with id="QBS_1_inner" (it's a table element, not a div)
    const table = $('#QBS_1_inner');
    
    if (table.length === 0) {
      console.log('Target table #QBS_1_inner not found. Searching for alternative selectors...');
      
      // Try to find the table by other means
      const fallbackTable = $('table').first();
      if (fallbackTable.length === 0) {
        throw new Error('No table found on the page');
      }
      return parseTableData($, fallbackTable);
    }

    console.log('Found target table #QBS_1_inner');

    return parseTableData($, table);

  } catch (error) {
    console.error('Error scraping currencies:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
    throw error;
  }
}

/**
 * Parses table data and extracts currency information
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} table - Table element
 * @returns {Array} Array of parsed currency data
 */
function parseTableData($, table) {
  const currencies = [];
  
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

      // Based on the actual HTML structure:
      // Column 1: Side column (empty)
      // Column 2: Currency Pair Name with link
      // Column 3: Last Price
      // Column 4: Change (absolute)
      // Column 5: Change (percentage)
      // Column 6: Icon (clock)
      // Column 7: Side column (empty)
      
      // Extract currency pair name from column 2
      let name = '';
      const nameCell = $row.find('td:nth-child(2) a');
      if (nameCell.length > 0) {
        name = nameCell.text().trim();
      }

      // Extract last price (column 3)
      const lastPrice = extractNumericValue($, $row, 3);
      
      // Extract change (column 4)
      const change = extractNumericValue($, $row, 4);
      
      // Extract change percentage (column 5)
      const changePercent = extractPercentValue($, $row, 5);

      // Only add if we have at least a name and price
      if (name && lastPrice !== null) {
        const currencyData = {
          name,
          lastPrice,
          change,
          changePercent,
          scrapedAt: new Date().toISOString()
        };

        currencies.push(currencyData);
      }
    } catch (error) {
      console.error(`Error parsing row ${index}:`, error.message);
    }
  });

  return currencies;
}

/**
 * Extracts numeric value from a cell by column index
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} row - Row element
 * @param {number} columnIndex - Column index (1-based)
 * @returns {number|null} Parsed numeric value
 */
function extractNumericValue($, row, columnIndex) {
  const cell = row.find(`td:nth-child(${columnIndex})`);
  
  if (cell.length === 0) {
    return null;
  }

  const text = cell.text().trim();
  // Brazilian format uses comma as decimal separator
  // Replace comma with dot for proper parsing, remove plus signs
  const value = text.replace(/,/g, '.').replace(/\+/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Extracts percentage value from a cell
 * @param {CheerioAPI} $ - Cheerio instance
 * @param {Cheerio} row - Row element
 * @param {number} columnIndex - Column index (1-based)
 * @returns {number|null} Parsed percentage value
 */
function extractPercentValue($, row, columnIndex) {
  const cell = row.find(`td:nth-child(${columnIndex})`);
  
  if (cell.length === 0) {
    return null;
  }

  const text = cell.text().trim();
  // Brazilian format uses comma as decimal separator
  // Remove % sign, replace comma with dot, remove plus signs and parse as float
  const value = text.replace(/%/g, '').replace(/,/g, '.').replace(/\+/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Formats the scraped data for console output
 * @param {Array} currencies - Array of currency data
 */
function displayCurrencies(currencies) {
  console.log('\n' + '='.repeat(100));
  console.log('CURRENCIES DATA - TECHNICAL SUMMARY');
  console.log('='.repeat(100));
  console.log(
    'Currency Pair'.padEnd(25) +
    'Last Price'.padStart(20) +
    'Change'.padStart(20) +
    'Change %'.padStart(20)
  );
  console.log('-'.repeat(100));

  currencies.forEach(currency => {
    const changeStr = currency.change !== null 
      ? (currency.change > 0 ? '+' : '') + currency.change.toFixed(4)
      : 'N/A';
    
    const changePercentStr = currency.changePercent !== null 
      ? (currency.changePercent > 0 ? '+' : '') + currency.changePercent.toFixed(2) + '%'
      : 'N/A';

    console.log(
      currency.name.padEnd(25) +
      (currency.lastPrice !== null ? currency.lastPrice.toFixed(4).padStart(20) : 'N/A'.padStart(20)) +
      changeStr.padStart(20) +
      changePercentStr.padStart(20)
    );
  });

  console.log('='.repeat(100));
  console.log(`Total currencies: ${currencies.length}`);
  console.log(`Scraped at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(100) + '\n');
}

module.exports = {
  scrapeCurrencies,
  displayCurrencies
};