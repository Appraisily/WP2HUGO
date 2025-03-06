const express = require('express');
const router = express.Router();
const workflowService = require('../services/workflow.service');

/**
 * Process a keyword through the complete workflow
 * POST /api/process
 */
router.post('/process', async (req, res, next) => {
  try {
    const { keyword } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword is required'
      });
    }
    
    console.log(`[ROUTES] Processing keyword: ${keyword}`);
    const result = await workflowService.processKeyword(keyword);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get the status of a workflow for a keyword
 * GET /api/status/:keyword
 */
router.get('/status/:keyword', async (req, res, next) => {
  try {
    const { keyword } = req.params;
    
    console.log(`[ROUTES] Getting status for keyword: ${keyword}`);
    const workflow = await workflowService.getWorkflow(keyword);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found for this keyword'
      });
    }
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Health check endpoint
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    service: 'wp2hugo',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;