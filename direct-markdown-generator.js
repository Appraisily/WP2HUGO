/**
 * Direct Markdown Generator
 * 
 * This script streamlines the process of converting keywords to markdown content
 * without relying on workflow services. It directly:
 * 1. Reads keywords from keywords.txt
 * 2. Fetches SERP data for each keyword
 * 3. Generates content structure and markdown
 * 4. Saves the markdown content to the content directory
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { serpService } = require('./src/services/kwrds');
const contentGenerator = require('./src/services/hugo/content-generator.service');
const keywordReader = require('./src/utils/keyword-reader');
const contentStorage = require('./src/utils/storage');
const { createSlug } = require('./src/utils/slug');

// Ensure required directories exist
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
    
    // Create simplified keyword data and PAA data
    const keywordData = {
      keyword,
      relatedKeywords: serpData.pasf ? serpData.pasf.map(k => ({ keyword: k })) : []
    };
    
    const paaData = {
      results: serpData.pasf ? serpData.pasf.map(q => ({ question: q })) : []
    };
    
    // Step 2: Generate content structure
    console.log(`[CONTENT] Generating content structure for: "${keyword}"`);
    const contentStructure = await contentGenerator.generateStructure(keyword, keywordData, paaData, serpData);
    console.log(`[CONTENT] Successfully generated structure for: "${keyword}"`);
    
    // Step 3: Generate markdown content
    console.log(`[MARKDOWN] Generating markdown content for: "${keyword}"`);
    const markdownContent = await contentGenerator.generateContent(contentStructure);
    console.log(`[MARKDOWN] Successfully generated content for: "${keyword}"`);
    
    // Step 4: Save to file system
    const slug = createSlug(keyword);
    const outputPath = path.join(process.cwd(), 'content', `${slug}.md`);
    await fs.writeFile(outputPath, markdownContent.content, 'utf8');
    console.log(`[OUTPUT] Content saved to: ${outputPath}`);
    
    return { 
      success: true, 
      keyword, 
      outputPath,
      metadata: {
        title: markdownContent.title,
        contentLength: markdownContent.content.length
      }
    };
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