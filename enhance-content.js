#!/usr/bin/env node

/**
 * Content Enhancement Script
 * 
 * This script enhances content structure with high-quality, detailed content
 * using Anthropic's Claude AI. It takes the structured outline and expands it
 * into comprehensive, engaging content.
 * 
 * Usage: node enhance-content.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const anthropicService = require('./src/services/anthropic.service');
const slugify = require('./src/utils/slugify');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Content Enhancement Script

Usage: node ${path.basename(__filename)} "your keyword" [options]
Options:
  --force-api      Force use of real APIs instead of mock clients
  --help, -h       Show this help message
  `);
  process.exit(0);
}

// Extract the keyword and options
const keyword = args[0];
const forceApi = args.includes('--force-api');

/**
 * Main function to enhance content
 */
async function enhanceContent(keyword, forceApi = false) {
  console.log(`[INFO] Enhancing content for: "${keyword}"`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      anthropicService.setForceApi(true);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output', 'research');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load structure data
    const slug = slugify(keyword);
    const structurePath = path.join(outputDir, `${slug}-googleai-structure.json`);
    const perplexityPath = path.join(outputDir, `${slug}-perplexity.json`);
    
    console.log(`[INFO] Loading structure data from: ${structurePath}`);
    const structureData = JSON.parse(await fs.readFile(structurePath, 'utf8'));
    
    console.log(`[INFO] Loading perplexity data from: ${perplexityPath}`);
    const perplexityData = JSON.parse(await fs.readFile(perplexityPath, 'utf8'));
    
    // Enhance content using Anthropic
    console.log(`[INFO] Enhancing content with Anthropic for "${keyword}"`);
    const enhancedContent = await anthropicService.enhanceContent(
      keyword,
      structureData,
      perplexityData
    );
    
    // Save enhanced content
    const enhancedPath = path.join(outputDir, `${slug}-anthropic-enhanced.json`);
    console.log(`[INFO] Saving enhanced content to: ${enhancedPath}`);
    await fs.writeFile(enhancedPath, JSON.stringify(enhancedContent, null, 2));
    
    console.log(`[SUCCESS] Content enhanced successfully for "${keyword}"`);
    return enhancedContent;
  } catch (error) {
    console.error(`[ERROR] Failed to enhance content: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  enhanceContent(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { enhanceContent }; 