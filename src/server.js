const { port } = require('./config');
const express = require('express');
const sheetsService = require('./services/sheets.service');
const hugoService = require('./services/hugo.service');
const contentStorage = require('./utils/storage');
const hugoProcessor = require('./services/hugo-processor.service');
const keywordResearchService = require('./services/keyword-research.service');
const paaService = require('./services/paa.service');
const serpService = require('./services/serp.service');
const perplexityService = require('./services/perplexity.service');
const contentAnalyzerService = require('./services/hugo/content-analyzer.service');
const workflowService = require('./services/hugo/workflow.service');

async function initializeService(service, name) {
  try {
    const result = await service.initialize();
    if (result === false) {
      console.warn(`[SERVER] ${name} service initialization returned false, but continuing...`);
      return false;
    }
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
  
  // Initialize storage first as other services depend on it
  try {
    await contentStorage.initialize();
    console.log('[SERVER] Storage service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Storage service failed to initialize:', error);
    throw error;
  }

  const serviceStatus = {
    storage: true, // Storage is already initialized above
    sheets: false,
    hugo: false,
    analyzer: false,
    keyword: false,
    paa: false,
    serp: false,
    perplexity: false
  };

  // Initialize services individually to ensure one failure doesn't prevent others
  serviceStatus.sheets = await initializeService(sheetsService, 'Sheets');
  serviceStatus.hugo = await initializeService(hugoService, 'Hugo');
  serviceStatus.analyzer = await initializeService(contentAnalyzerService, 'Content Analyzer');
  serviceStatus.keyword = await initializeService(keywordResearchService, 'Keyword Research');
  serviceStatus.paa = await initializeService(paaService, 'People Also Ask');
  serviceStatus.serp = await initializeService(serpService, 'SERP');
  serviceStatus.perplexity = await initializeService(perplexityService, 'Perplexity');

  // Set up routes
  app.post('/api/hugo/process', async (req, res) => {
    try {
      // Extract keyword from request body
      const { keyword } = req.body;
      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: 'Keyword is required'
        });
      }
      
      console.log(`[SERVER] Processing Hugo workflow for keyword: ${keyword}`);
      const result = await hugoProcessor.processWorkflow(keyword);
      res.json(result);
    } catch (error) {
      console.error('[SERVER] Error processing Hugo workflow:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  // New endpoint for batch keyword processing
  app.post('/api/keywords/process-batch', async (req, res) => {
    try {
      console.log('[SERVER] Starting batch keyword processing');
      const result = await workflowService.processWorkflow();
      res.json(result);
    } catch (error) {
      console.error('[SERVER] Error processing batch keywords:', error);
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