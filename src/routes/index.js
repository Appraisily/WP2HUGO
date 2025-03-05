const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const workerController = require('../controllers/worker.controller');
const hugoController = require('../controllers/hugo.controller');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Content storage endpoints
router.get('/content/:path(*)', contentController.getContent);
router.post('/content/:path(*)', contentController.storeContent);

// Hugo content endpoints
router.post('/hugo/process', workerController.processWorkflow);
router.post('/hugo/process-keyword', workerController.processKeyword);

// Hugo management endpoints
router.get('/hugo/workflows', hugoController.getWorkflows);
router.post('/hugo/workflows', hugoController.createWorkflow);
router.get('/hugo/workflows/:id', hugoController.getWorkflow);
router.put('/hugo/workflows/:id', hugoController.updateWorkflow);
router.delete('/hugo/workflows/:id', hugoController.deleteWorkflow);
router.post('/hugo/workflows/:id/steps/:step', hugoController.updateWorkflowStep);

module.exports = router;