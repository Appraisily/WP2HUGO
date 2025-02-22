const { port } = require('./config');
const express = require('express');
const sheetsService = require('./services/sheets.service');
const wordpressService = require('./services/wordpress');
const hugoService = require('./services/hugo.service');
const HugoProcessorService = require('./services/hugo-processor.service');

const hugoProcessor = new HugoProcessorService();

async function initializeService(service, name) {
  try {
    await service.initialize();
    console.log(`[SERVER] ${name} service initialized successfully`);
    return true;
  } catch (error) {
    console.error(`[SERVER] ${name} service failed to initialize:`, error);
    return false;
  }
}

async function initialize() {
  console.log('[SERVER] Starting server initialization...');

  const app = express();
  app.use(express.json());
  
  // Initialize services in parallel for better performance
  const serviceStatus = {
    sheets: false,
    wordpress: false,
    hugo: false
  };

  try {
    [serviceStatus.sheets, serviceStatus.wordpress, serviceStatus.hugo] = await Promise.all([
      initializeService(sheetsService, 'Sheets'),
      initializeService(wordpressService, 'WordPress'),
      initializeService(hugoService, 'Hugo')
    ]);
  } catch (error) {
    console.error('[SERVER] Error initializing services:', error);
  }

  // Set up routes
  app.post('/api/hugo/process', async (req, res) => {
    try {
      const result = await hugoProcessor.processWorkflow();
      res.json(result);
    } catch (error) {
      console.error('[SERVER] Error processing Hugo workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      services: {
        sheets: serviceStatus.sheets ? 'connected' : 'disconnected',
        wordpress: serviceStatus.wordpress ? 'connected' : 'disconnected',
        hugo: serviceStatus.hugo ? 'connected' : 'disconnected'
      }
    });
  });

  // Start server
  app.listen(port, () => {
    console.log(`[SERVER] Server listening on port ${port}`);
  });

  return app;
}

// Start the server
initialize().catch(error => {
  console.error('[SERVER] Failed to initialize server:', error);
  process.exit(1);
});