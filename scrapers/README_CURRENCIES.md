# Currencies Scraper

## Overview

This scraper fetches real-time currency exchange rate data from the Investing.com Technical Summary page (https://br.investing.com/technical/technical-summary).

## Features

- Scrapes currency pairs including:

  - USD/BRL (Dollar/BRL)
  - EUR/BRL
  - EUR/USD (EUR/Dollar)
  - USD/JPY (Dollar/JPY)
  - GBP/USD (GBP/Dollar)
  - GBP/BRL
  - CAD/BRL
  - And more...

- Extracts the following data for each currency pair:
  - **Name**: Currency pair name (e.g., "Dólar/BRL", "EUR/Dólar")
  - **Last Price**: Current exchange rate
  - **Change**: Absolute change in value
  - **Change Percent**: Percentage change
  - **Scraped At**: Timestamp of when the data was scraped

## Data Structure

```javascript
{
  name: "Dólar/BRL",
  lastPrice: 5.4540,
  change: 0.0000,
  changePercent: 0.00,
  scrapedAt: "2025-10-15T21:38:18.473Z"
}
```

## Usage

### Basic Usage

```javascript
const {
  scrapeCurrencies,
  displayCurrencies,
} = require("./scrapers/currenciesScraper");

async function getCurrencyData() {
  try {
    const currencies = await scrapeCurrencies();
    displayCurrencies(currencies);
    return currencies;
  } catch (error) {
    console.error("Error:", error);
  }
}

getCurrencyData();
```

### Testing

Run the test script to verify the scraper is working:

```bash
node test-currencies-scraper.js
```

## Output Format

The scraper provides two output formats:

1. **Console Table**: Formatted table display for easy reading
2. **JSON Array**: Structured data ready for database insertion

### Console Output Example

```
====================================================================================================
CURRENCIES DATA - TECHNICAL SUMMARY
====================================================================================================
Currency Pair                      Last Price              Change            Change %
----------------------------------------------------------------------------------------------------
Dólar/BRL                              5.4540              0.0000               0.00%
EUR/BRL                                6.3452             -0.0081              -0.13%
EUR/Dólar                              1.1645             -0.0002              -0.02%
Dólar/JPY                            151.1000             +0.0300              +0.02%
GBP/Dólar                              1.3401             -0.0002              -0.01%
GBP/BRL                                7.3033             -0.0059              -0.08%
CAD/BRL                                3.8832             -0.0008              -0.02%
====================================================================================================
Total currencies: 7
Scraped at: 10/15/2025, 5:38:18 PM
====================================================================================================
```

## Technical Details

### HTML Structure

The scraper targets a table element with id `QBS_1_inner` on the Investing.com page. The table structure is:

- Column 1: Side column (empty)
- Column 2: Currency pair name with link
- Column 3: Last price
- Column 4: Change (absolute)
- Column 5: Change (percentage)
- Column 6: Icon (status indicator)
- Column 7: Side column (empty)

### Number Format Handling

The scraper handles Brazilian number format where commas are used as decimal separators:

- `5,4540` is converted to `5.4540`
- `-0,0081` is converted to `-0.0081`
- `-0,13%` is converted to `-0.13`

### Browser Simulation

The scraper uses appropriate headers to mimic a real browser request:

- User-Agent: Chrome browser
- Accept-Language: Portuguese (Brazil)
- Other standard browser headers

## Dependencies

- `axios`: For HTTP requests
- `cheerio`: For HTML parsing

## Error Handling

The scraper includes comprehensive error handling:

- Checks if the target table exists
- Falls back to alternative selectors if needed
- Validates data before parsing
- Provides detailed error messages

## Next Steps

To integrate with Supabase:

1. Create a database table for currencies
2. Create a service to insert/update currency data
3. Set up a cron job for periodic scraping
4. Add data validation and deduplication logic

## Notes

- The page can be accessed without authentication
- Data is updated in real-time on the source website
- The scraper respects the website's structure and uses standard web scraping practices
