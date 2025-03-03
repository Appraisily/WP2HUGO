const contentStorage = require('../utils/storage');
const workflowService = require('./hugo/workflow.service');

class HugoProcessorService {
  async processWorkflow(keyword) {
    try {
      // Pass the keyword to the workflow service if provided
      if (keyword) {
        console.log(`[HUGO] Processing workflow for specific keyword: ${keyword}`);
        return await workflowService.processRow({ 'KWs': keyword });
      } else {
        // Original batch processing logic
        console.log('[HUGO] Processing batch workflow (no specific keyword provided)');
        return await workflowService.processWorkflow();
      }
    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    }
  }
}

module.exports = new HugoProcessorService();