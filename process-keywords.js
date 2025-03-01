#!/usr/bin/env node

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');

async function main() {
  try {
    console.log('Starting keyword processing workflow...');
    await workflowService.initialize();
    
    // Process all keywords
    await workflowService.processAllKeywords();
    
    console.log('Workflow completed successfully!');
  } catch (error) {
    console.error('Error running workflow:', error);
    process.exit(1);
  }
}

main(); 