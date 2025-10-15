require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startBrazilIndicesCron, getCronStatus: getBrazilCronStatus, triggerManualRun: triggerBrazilManualRun } = require('./jobs/brazilIndicesCron');
const { getLatestIndices: getLatestBrazilIndices, getIndexHistory: getBrazilIndexHistory, getIndicesByDateRange: getBrazilIndicesByDateRange } = require('./services/brazilIndicesService');
const { startUSIndicesCron, getCronStatus: getUSCronStatus, triggerManualRun: triggerUSManualRun } = require('./jobs/usIndicesCron');
const { getLatestIndices: getLatestUSIndices, getIndexHistory: getUSIndexHistory, getIndicesByDateRange: getUSIndicesByDateRange } = require('./services/usIndicesService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to Financial API',
    endpoints: {
      health: '/api/health',
      brazilIndices: {
        latest: '/api/brazil-indices/latest',
        history: '/api/brazil-indices/history/:name',
        dateRange: '/api/brazil-indices/range?start=YYYY-MM-DD&end=YYYY-MM-DD',
        cronStatus: '/api/brazil-indices/cron/status',
        manualTrigger: '/api/brazil-indices/cron/trigger'
      },
      usIndices: {
        latest: '/api/us-indices/latest',
        history: '/api/us-indices/history/:name',
        dateRange: '/api/us-indices/range?start=YYYY-MM-DD&end=YYYY-MM-DD',
        cronStatus: '/api/us-indices/cron/status',
        manualTrigger: '/api/us-indices/cron/trigger'
      }
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Brazil Indices API Routes
app.get('/api/brazil-indices/latest', async (req, res) => {
  try {
    const result = await getLatestBrazilIndices();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/brazil-indices/history/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await getBrazilIndexHistory(name, limit);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/brazil-indices/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both start and end dates are required' 
      });
    }
    
    const result = await getBrazilIndicesByDateRange(start, end);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/brazil-indices/cron/status', (req, res) => {
  try {
    const status = getBrazilCronStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/brazil-indices/cron/trigger', async (req, res) => {
  try {
    // Trigger manual run (don't wait for completion)
    triggerBrazilManualRun();
    res.json({ 
      success: true, 
      message: 'Manual scrape triggered successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// US Indices API Routes
app.get('/api/us-indices/latest', async (req, res) => {
  try {
    const result = await getLatestUSIndices();
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/us-indices/history/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await getUSIndexHistory(name, limit);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/us-indices/range', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        success: false, 
        message: 'Both start and end dates are required' 
      });
    }
    
    const result = await getUSIndicesByDateRange(start, end);
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/us-indices/cron/status', (req, res) => {
  try {
    const status = getUSCronStatus();
    res.json({ success: true, ...status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/us-indices/cron/trigger', async (req, res) => {
  try {
    // Trigger manual run (don't wait for completion)
    triggerUSManualRun();
    res.json({ 
      success: true, 
      message: 'Manual scrape triggered successfully' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Financial Backend API Server`);
  console.log('='.repeat(80));
  console.log(`📡 Server is running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(80));
  
  // Start the cron jobs
  startBrazilIndicesCron();
  startUSIndicesCron();
});