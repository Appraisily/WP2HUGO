/**
 * Streamlined script to generate markdown content from keywords.
 * 
 * This script:
 * 1. Reads keywords from keywords.txt
 * 2. Fetches SERP data for each keyword using the KWRDS API
 * 3. Generates and saves markdown content
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { serpService } = require('./src/services/kwrds');
const hugoProcessor = require('./src/services/hugo-processor.service');
const keywordReader = require('./src/utils/keyword-reader');
const contentStorage = require('./src/utils/storage');
const { createSlug } = require('./src/utils/slug');

// Ensure directories exist
async function ensureDirectories() {
  const outputDir = path.join(process.cwd(), 'content');
  const dataDir = path.join(process.cwd(), 'data', 'research');
  
  await fs.ensureDir(outputDir);
  await fs.ensureDir(dataDir);
  
  console.log(`[SETUP] Directories initialized`);
}

// Process a single keyword
async function processKeyword(keyword) {
  console.log(`\n\n[PROCESS] ===== Processing keyword: "${keyword}" =====`);
  
  try {
    // Step 1: Fetch SERP data
    console.log(`[SERP] Fetching SERP data for keyword: "${keyword}"`);
    const serpData = await serpService.getSerpData(keyword);
    console.log(`[SERP] Successfully retrieved data for: "${keyword}"`);
    
    // Step 2: Generate markdown
    console.log(`[MARKDOWN] Generating markdown content for: "${keyword}"`);
    const result = await hugoProcessor.generateMarkdown(keyword);
    
    if (result.success) {
      console.log(`[MARKDOWN] ✅ Successfully generated markdown for: "${keyword}"`);
      
      // Get the file path and display some info
      const outputPath = path.join(process.cwd(), 'content', `${createSlug(keyword)}.md`);
      console.log(`[OUTPUT] Content saved to: ${outputPath}`);
      console.log(`[INFO] Content title: ${result.metadata?.title || 'Unknown'}`);
      console.log(`[INFO] Content length: ${result.metadata?.contentLength || 0} characters`);
      
      return { success: true, keyword, outputPath };
    } else {
      console.error(`[MARKDOWN] ❌ Failed to generate markdown for: "${keyword}"`);
      console.error(`[ERROR] ${result.error}`);
      return { success: false, keyword, error: result.error };
    }
  } catch (error) {
    console.error(`[PROCESS] ❌ Error processing keyword "${keyword}":`, error);
    return { success: false, keyword, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('[START] Initializing markdown generation process...');
    
    // Step 1: Initialize storage and directories
    await contentStorage.initialize();
    await ensureDirectories();
    
    // Step 2: Load keywords
    await keywordReader.initialize();
    const keywords = await keywordReader.getKeywords();
    console.log(`[KEYWORDS] Loaded ${keywords.length} keywords from file`);
    
    // Step 3: Process each keyword
    const results = [];
    for (const keyword of keywords) {
      const result = await processKeyword(keyword);
      results.push(result);
    }
    
    // Step 4: Print summary
    console.log('\n\n[SUMMARY] Processing complete:');
    const successful = results.filter(r => r.success).length;
    console.log(`- Total keywords: ${keywords.length}`);
    console.log(`- Successfully processed: ${successful}`);
    console.log(`- Failed: ${keywords.length - successful}`);
    
    if (keywords.length - successful > 0) {
      console.log('\nFailed keywords:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`- "${r.keyword}": ${r.error}`));
    }
    
  } catch (error) {
    console.error('[ERROR] Critical error in main process:', error);
  }
}

// Run the main function
main();