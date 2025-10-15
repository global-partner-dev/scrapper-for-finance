# Brazil Indices Scraper

This module scrapes Brazilian stock market indices data from investing.com.

## Features

- Scrapes real-time data for Brazilian indices (Bovespa, Brazil 50, Brazil Index, etc.)
- Extracts: Name, Last Price, High, Low, Change, Change %, and Time
- Formatted console output for easy viewing
- JSON output for database integration
- Robust error handling
- Browser-like headers to avoid blocking

## Installation

Dependencies are already included in the main package.json:

- `axios` - For HTTP requests
- `cheerio` - For HTML parsing

## Usage

### Running the Test Script

```bash
npm run test:scraper
```

This will:

1. Fetch data from investing.com
2. Parse the table data
3. Display formatted output in the console
4. Show raw JSON data

### Using in Your Code

```javascript
const {
  scrapeBrazilIndices,
  displayIndices,
} = require("./scrapers/brazilIndicesScraper");

async function example() {
  try {
    // Scrape the data
    const indices = await scrapeBrazilIndices();

    // Display formatted output
    displayIndices(indices);

    // Or use the raw data
    console.log(JSON.stringify(indices, null, 2));

    // Each index object contains:
    // {
    //   name: string,
    //   last: number,
    //   high: number,
    //   low: number,
    //   change: number,
    //   changePercent: number,
    //   time: string,
    //   scrapedAt: string (ISO timestamp)
    // }
  } catch (error) {
    console.error("Error:", error.message);
  }
}
```

## Data Structure

Each scraped index contains the following fields:

| Field           | Type   | Description               | Example                    |
| --------------- | ------ | ------------------------- | -------------------------- |
| `name`          | string | Index name                | "Bovespa"                  |
| `last`          | number | Current/last price        | 142249.00                  |
| `high`          | number | Day's high price          | 142898.00                  |
| `low`           | number | Day's low price           | 141154.00                  |
| `change`        | number | Price change              | 566.00                     |
| `changePercent` | number | Percentage change         | 0.40                       |
| `time`          | string | Last update time          | "13:09:30"                 |
| `scrapedAt`     | string | ISO timestamp of scraping | "2025-10-15T17:26:59.087Z" |

## Example Output

```
========================================================================================================================
BRAZILIAN INDICES DATA
========================================================================================================================
Name                                Last           High            Low        Chg.      Chg. %           Time
------------------------------------------------------------------------------------------------------------------------
Bovespa                       142,249.00     142,898.00     141,154.00+     566.00+0.40          %       13:09:30
Brazil 50                      23,833.37      23,945.83      23,654.59+      90.14+0.38          %       13:09:00
Brazil Index                   60,175.22      60,401.58      59,657.36+     289.77+0.48          %       13:07:00
Brazil broad-Based              5,614.06       5,634.50       5,565.06+      27.83+0.50          %       13:07:00
Mid-Large Cap Index             2,892.88       2,905.01       2,870.10+      12.08+0.42          %       13:07:30
Small Cap Index                 2,146.03       2,150.16       2,108.84+      23.43+1.10          %       13:08:00
Tag Along                      31,228.19      31,340.13      30,923.07+     135.84+0.44          %       13:07:00
========================================================================================================================
Total indices: 7
Scraped at: 10/15/2025, 1:26:59 PM
========================================================================================================================
```

## Next Steps

To integrate with Supabase:

1. Create a table in Supabase to store the indices data
2. Add Supabase client configuration
3. Create a function to insert/update the scraped data
4. Set up a scheduled job (cron) to run the scraper periodically

## Error Handling

The scraper includes comprehensive error handling:

- Network errors (connection issues, timeouts)
- Parsing errors (if page structure changes)
- Missing data (gracefully handles null values)

## Notes

- The scraper uses browser-like headers to avoid being blocked
- Data is scraped from a public page (no login required)
- Respect the website's terms of service and rate limits
- Consider adding delays between requests if scraping frequently
