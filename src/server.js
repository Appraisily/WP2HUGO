const { port } = require('./config');
const express = require('express');
const sheetsService = require('./services/sheets.service');
const hugoService = require('./services/hugo.service');
const contentStorage = require('./utils/storage');
const hugoProcessor = require('./services/hugo-processor.service');
const errorHandler = require('./middleware/error-handler');
const requestLogger = require('./middleware/request-logger');
const logger = require('./utils/logging');
const monitoring = require('./utils/monitoring');

const serverLogger = logger.createChild('server');
const keywordResearchService = require('./services/keyword-research.service');
const paaService = require('./services/paa.service');
const serpService = require('./services/serp.service');
const perplexityService = require('./services/perplexity.service');
const contentAnalyzerService = require('./services/hugo/content-analyzer.service');

async function initializeService(service, name) {
  try {
    await service.initialize();
    serverLogger.info(`${name} service initialized successfully`);
    return true;
  } catch (error) {
    serverLogger.error(`${name} service failed to initialize`, error);
    return false;
  }
}

async function initialize() {
  serverLogger.info('Starting server initialization');

  const app = express();
  app.use(express.json());
  app.use(requestLogger);
  
  // Initialize storage first as other services depend on it
  try {
    await contentStorage.initialize();
    serverLogger.info('Storage service initialized successfully');
  } catch (error) {
    serverLogger.error('Storage service failed to initialize', error);
    throw error;
  }

  const serviceStatus = {
    storage: false,
    sheets: false,
    hugo: false,
    analyzer: false,
    keyword: false,
    paa: false,
    serp: false,
    perplexity: false
  };

  try {
    [serviceStatus.storage, serviceStatus.sheets, serviceStatus.hugo, serviceStatus.analyzer, serviceStatus.keyword, serviceStatus.paa, serviceStatus.serp, serviceStatus.perplexity] = await Promise.all([
      initializeService(contentStorage, 'Storage'),
      initializeService(sheetsService, 'Sheets'),
      initializeService(hugoService, 'Hugo'),
      initializeService(contentAnalyzerService, 'Content Analyzer'),
      initializeService(keywordResearchService, 'Keyword Research'),
      initializeService(paaService, 'People Also Ask'),
      initializeService(serpService, 'SERP'),
      initializeService(perplexityService, 'Perplexity')
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
    monitoring.recordMetric('health_check', 1);
    res.json({
      status: 'ok',
      services: {
        storage: serviceStatus.storage ? 'connected' : 'disconnected',
        sheets: serviceStatus.sheets ? 'connected' : 'disconnected',
        hugo: serviceStatus.hugo ? 'connected' : 'disconnected',
        analyzer: serviceStatus.analyzer ? 'connected' : 'disconnected',
        keyword: serviceStatus.keyword ? 'connected' : 'disconnected',
        paa: serviceStatus.paa ? 'connected' : 'disconnected',
        serp: serviceStatus.serp ? 'connected' : 'disconnected',
        perplexity: serviceStatus.perplexity ? 'connected' : 'disconnected'
      }
    });
  });

  // Error handling middleware must be last
  app.use(errorHandler);

  // Start server
  app.listen(port, () => {
    serverLogger.info(`Server listening on port ${port}`);
  });

  return app;
}

// Start the server
initialize().catch(error => {
  serverLogger.error('Failed to initialize server', error);
  process.exit(1);
});