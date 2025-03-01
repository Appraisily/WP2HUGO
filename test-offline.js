#!/usr/bin/env node

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');
const mockDataUtil = require('./src/utils/mock-data');
const path = require('path');
const fs = require('fs').promises;
const config = require('./src/config');
const localStorage = require('./src/utils/local-storage');
const slugify = require('./src/utils/slugify');

async function main() {
  try {
    console.log('Starting offline test workflow with mock data...');
    
    // Initialize local storage
    await localStorage.initialize();
    
    // Get keyword from test-keywords.txt
    const testKeywordsPath = path.resolve(process.cwd(), 'test-keywords.txt');
    const keywordData = await fs.readFile(testKeywordsPath, 'utf8');
    const keyword = keywordData.trim();
    
    if (!keyword) {
      throw new Error('No keyword found in test-keywords.txt');
    }
    
    console.log(`[TEST] Using keyword: "${keyword}"`);
    const slug = slugify(keyword);
    
    // Create output paths
    const researchDir = config.paths.research;
    const contentDir = config.paths.content;
    
    // Save mock keyword research data
    console.log('[TEST] Saving mock keyword research data...');
    await localStorage.saveFile(
      path.join(researchDir, `${slug}-kwrds-data.json`), 
      mockDataUtil.keywordResearchMock
    );
    
    // Save mock SERP data
    console.log('[TEST] Saving mock SERP data...');
    await localStorage.saveFile(
      path.join(researchDir, `${slug}-serp-data.json`), 
      mockDataUtil.serpDataMock
    );
    
    // Save mock related keywords data
    console.log('[TEST] Saving mock related keywords data...');
    await localStorage.saveFile(
      path.join(researchDir, `${slug}-related-keywords.json`), 
      mockDataUtil.relatedKeywordsMock
    );
    
    // Save mock perplexity data
    console.log('[TEST] Saving mock perplexity data...');
    await localStorage.saveFile(
      path.join(researchDir, `${slug}-perplexity-data.json`), 
      mockDataUtil.perplexityMock
    );
    
    // Save mock Google AI data
    console.log('[TEST] Saving mock Google AI structure data...');
    await localStorage.saveFile(
      path.join(researchDir, `${slug}-googleai-structure.json`), 
      mockDataUtil.googleAiMock
    );
    
    // Now we can run the workflow, which will use our cached mock data
    console.log('[TEST] Running workflow with cached mock data...');
    await workflowService.testWithSingleKeyword();
    
    console.log('[TEST] Testing completed successfully! Check the output folder for results.');
  } catch (error) {
    console.error('Error running test workflow:', error);
    process.exit(1);
  }
}

main(); 