// Load environment variables from .env file
require('dotenv').config();

const app = require('./app');
const workflowService = require('./services/workflow.service');
const contentStorage = require('./utils/storage');

/**
 * Initialize the server
 */
async function initialize() {
  console.log('[SERVER] Starting server initialization...');

  try {
    // Initialize storage service first as other services depend on it
    await contentStorage.initialize();
    console.log('[SERVER] Storage service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Storage service failed to initialize:', error);
    throw error;
  }

  try {
    // Initialize workflow service
    await workflowService.initialize();
    console.log('[SERVER] Workflow service initialized successfully');
  } catch (error) {
    console.error('[SERVER] Workflow service failed to initialize:', error);
    // Continue despite service failure
  }

  // Start the server - using port 3001 directly to avoid conflicts
  const serverPort = 3001;
  console.log(`[SERVER] Using port: ${serverPort}`);
  app.listen(serverPort, () => {
    console.log(`[SERVER] Server listening on port ${serverPort}`);
  });

  return app;
}

// Start the server
initialize().catch(error => {
  console.error('[SERVER] Failed to initialize server:', error);
  process.exit(1);
});