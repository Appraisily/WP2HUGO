const express = require('express');
const router = require('./routes');

// Create Express application
const app = express();

// JSON body parser middleware
app.use(express.json({ limit: '10mb' }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

// Set up routes
app.use('/api', router);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wp2hugo' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[APP] Error: ${err.message}`);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    details: err.response?.data || null
  });
});

// Export the app to be used in server.js
module.exports = app;