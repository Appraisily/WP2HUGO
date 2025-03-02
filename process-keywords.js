#!/usr/bin/env node

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');
const path = require('path');
const fs = require('fs').promises;

// Parse command line arguments
const args = process.argv.slice(2);
let keywordsFile = null;
let singleKeyword = null;
let forceApi = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && i + 1 < args.length) {
    keywordsFile = args[i + 1];
    i++; // Skip the next argument as it's the filename
  } else if (args[i] === '--keyword' && i + 1 < args.length) {
    singleKeyword = args[i + 1];
    i++; // Skip the next argument as it's the keyword
  } else if (args[i] === '--force-api') {
    forceApi = true;
  }
}

async function main() {
  try {
    console.log('Starting keyword processing workflow...');
    
    // If a custom keywords file is specified, set it in the service
    if (keywordsFile) {
      const fullPath = path.resolve(process.cwd(), keywordsFile);
      console.log(`Using custom keywords file: ${fullPath}`);
      workflowService.setKeywordsPath(fullPath);
    }
    
    await workflowService.initialize();
    
    // Set force API flag if specified
    if (forceApi) {
      console.log('Forcing to use API data even when cache exists');
      workflowService.setForceApi(true);
    }
    
    // Process a single keyword if specified, otherwise process all keywords
    if (singleKeyword) {
      console.log(`Processing single keyword: "${singleKeyword}"`);
      await workflowService.processKeyword(singleKeyword);
    } else {
      // Process all keywords
      await workflowService.processAllKeywords();
    }
    
    console.log('Workflow completed successfully!');
  } catch (error) {
    console.error('Error running workflow:', error);
    process.exit(1);
  }
}

main(); 