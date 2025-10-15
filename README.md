# Financial Backend API

Backend service for the Financial Application with automated Brazilian indices scraping and data management.

## Features

- 🚀 RESTful API built with Express.js
- 📊 Automated Brazilian indices scraping from investing.com
- ⏰ Cron job running every 2 minutes
- 💾 Supabase integration for data storage
- 🔄 Real-time data updates
- 📈 Historical data tracking

## Project Structure

```
backend/
├── jobs/                    # Cron job definitions
│   └── brazilIndicesCron.js # Brazil indices scraper cron job
├── scrapers/                # Web scraping modules
│   ├── brazilIndicesScraper.js
│   └── README.md
├── services/                # Business logic services
│   ├── supabaseClient.js   # Supabase client configuration
│   └── brazilIndicesService.js # Database operations
├── sqls/                    # SQL migration files
│   └── 01_brazil_indices_setup.sql
├── server.js                # Main application entry point
├── test-scraper.js          # Scraper testing utility
├── package.json
└── .env                     # Environment variables
```

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables in `.env`:

```env
PORT=3000
NODE_ENV=development
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
```

3. Run the SQL setup script in Supabase:
   - Execute `sqls/01_brazil_indices_setup.sql` in your Supabase SQL editor

## Usage

### Development Mode

```bash
npm run dev
```

Starts the server with nodemon for auto-restart on file changes.

### Production Mode

```bash
npm start
```

Starts the server in production mode.

### Test Scraper Only

```bash
npm run test:scraper
```

Tests the scraper without starting the server or saving to database.

## API Endpoints

### General

#### `GET /`

Returns API information and available endpoints.

**Response:**

```json
{
  "message": "Welcome to Financial API",
  "endpoints": { ... }
}
```

#### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2025-10-15T17:00:00.000Z"
}
```

### Brazil Indices

#### `GET /api/brazil-indices/latest`

Get the latest data for all Brazilian indices.

**Response:**

```json
{
  "success": true,
  "message": "Retrieved 7 indices",
  "data": [
    {
      "id": "uuid",
      "name": "Bovespa",
      "last": 142249.0,
      "high": 142898.0,
      "low": 141154.0,
      "change": 566.0,
      "change_percent": 0.4,
      "time": "13:09:30",
      "scraped_at": "2025-10-15T17:00:00.000Z"
    }
  ]
}
```

#### `GET /api/brazil-indices/history/:name`

Get historical data for a specific index.

**Parameters:**

- `name` (path): Index name (e.g., "Bovespa")
- `limit` (query, optional): Number of records (default: 100)

**Example:**

```
GET /api/brazil-indices/history/Bovespa?limit=50
```

**Response:**

```json
{
  "success": true,
  "message": "Retrieved 50 records for Bovespa",
  "data": [ ... ]
}
```

#### `GET /api/brazil-indices/range`

Get indices data within a date range.

**Query Parameters:**

- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)

**Example:**

```
GET /api/brazil-indices/range?start=2025-10-01&end=2025-10-15
```

**Response:**

```json
{
  "success": true,
  "message": "Retrieved 1000 records",
  "data": [ ... ]
}
```

#### `GET /api/brazil-indices/cron/status`

Get the status of the cron job.

**Response:**

```json
{
  "success": true,
  "isRunning": false,
  "lastRunTime": "2025-10-15T17:00:00.000Z",
  "lastRunStatus": "success",
  "runCount": 42,
  "nextRunIn": "Within 2 minutes"
}
```

#### `POST /api/brazil-indices/cron/trigger`

Manually trigger a scraping job.

**Response:**

```json
{
  "success": true,
  "message": "Manual scrape triggered successfully"
}
```

## Cron Job

The Brazil indices scraper runs automatically every 2 minutes:

- **Schedule**: `*/2 * * * *` (every 2 minutes)
- **Timezone**: America/Sao_Paulo (Brazilian timezone)
- **Auto-start**: Runs immediately when server starts
- **Prevents overlapping**: Won't start a new job if previous is still running

### Cron Job Workflow

1. Scrapes data from investing.com
2. Parses 7 Brazilian indices
3. Saves to Supabase database
4. Logs results to console
5. Waits 2 minutes before next run

## Database Schema

### Table: `brazil_indices`

| Column         | Type          | Description          |
| -------------- | ------------- | -------------------- |
| id             | uuid          | Primary key          |
| name           | text          | Index name           |
| last           | numeric(15,2) | Current price        |
| high           | numeric(15,2) | Day's high           |
| low            | numeric(15,2) | Day's low            |
| change         | numeric(15,2) | Price change         |
| change_percent | numeric(10,4) | Percentage change    |
| time           | text          | Last update time     |
| scraped_at     | timestamptz   | Scraping timestamp   |
| created_at     | timestamptz   | Record creation time |
| updated_at     | timestamptz   | Last update time     |

### Available Functions

- `upsert_brazil_index()` - Insert new index data
- `get_latest_brazil_indices()` - Get latest data for all indices
- `get_brazil_index_history()` - Get historical data for specific index
- `get_brazil_indices_by_date_range()` - Get data within date range
- `cleanup_old_brazil_indices_data()` - Clean up old data (30+ days)

## Environment Variables

| Variable                      | Description              | Required                  |
| ----------------------------- | ------------------------ | ------------------------- |
| PORT                          | Server port              | No (default: 3000)        |
| NODE_ENV                      | Environment mode         | No (default: development) |
| VITE_SUPABASE_URL             | Supabase project URL     | Yes                       |
| VITE_SUPABASE_PUBLISHABLE_KEY | Supabase anon/public key | Yes                       |

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }
}
```

HTTP Status Codes:

- `200` - Success
- `400` - Bad Request (missing parameters)
- `404` - Not Found
- `500` - Internal Server Error

## Logging

The application logs:

- Server startup information
- Cron job execution details
- Scraping results
- Database operations
- Errors and warnings

## Data Retention

By default, the system keeps 30 days of historical data. Older data can be cleaned up using the `cleanup_old_brazil_indices_data()` function.

## Testing

### Test the Scraper

```bash
npm run test:scraper
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Get latest indices
curl http://localhost:3000/api/brazil-indices/latest

# Get cron status
curl http://localhost:3000/api/brazil-indices/cron/status

# Trigger manual scrape
curl -X POST http://localhost:3000/api/brazil-indices/cron/trigger
```

## Troubleshooting

### Scraper Not Working

1. Check if investing.com is accessible
2. Verify the page structure hasn't changed
3. Check console logs for errors

### Database Connection Issues

1. Verify Supabase credentials in `.env`
2. Check if SQL setup script was executed
3. Verify RLS policies are configured correctly

### Cron Job Not Running

1. Check server logs for errors
2. Verify cron job started (check startup logs)
3. Check cron status endpoint

## Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **axios** - HTTP client for scraping
- **cheerio** - HTML parsing
- **@supabase/supabase-js** - Supabase client
- **node-cron** - Cron job scheduler
- **nodemon** - Development auto-restart (dev only)

## License

ISC

## Support

For issues or questions, please check the logs or contact the development team.
