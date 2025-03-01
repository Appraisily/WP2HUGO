#!/usr/bin/env node

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');

async function main() {
  try {
    console.log('Starting test workflow with a single keyword...');
    await workflowService.initialize();
    
    // Process single test keyword
    await workflowService.testWithSingleKeyword();
    
    console.log('Test workflow completed successfully!');
  } catch (error) {
    console.error('Error running test workflow:', error);
    process.exit(1);
  }
}

main(); 