#!/usr/bin/env node

/**
 * Content Generation Script
 * 
 * This script enhances a content structure with detailed content using the Anthropic API.
 * 
 * Usage: node generate-content.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const anthropicService = require('./src/services/anthropic.service');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Content Generation Script

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

// Set up the Anthropic service
anthropicService.setForceApi(forceApi);

/**
 * Main function to generate content for a keyword
 */
async function generateContent(keyword, forceApi = false) {
  console.log(`[INFO] Generating content for: "${keyword}"`);
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output', 'enhanced');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load structure data
    const slug = slugify(keyword);
    const structurePath = path.join(process.cwd(), 'output', 'research', `${slug}-googleai-structure.json`);
    
    console.log(`[INFO] Loading content structure from: ${structurePath}`);
    const structureData = JSON.parse(await fs.readFile(structurePath, 'utf8'));
    
    // Load research data (if available)
    let researchData = null;
    const researchPath = path.join(process.cwd(), 'output', 'research', `${slug}.json`);
    
    try {
      const researchFileExists = await fs.access(researchPath).then(() => true).catch(() => false);
      if (researchFileExists) {
        console.log(`[INFO] Loading research data from: ${researchPath}`);
        researchData = JSON.parse(await fs.readFile(researchPath, 'utf8'));
      }
    } catch (error) {
      console.warn(`[WARNING] Error loading research data: ${error.message}`);
    }
    
    // Generate enhanced content with Anthropic
    console.log(`[INFO] Enhancing content structure with detailed content...`);
    const startTime = Date.now();
    
    const enhancedContent = await anthropicService.enhanceContent(
      keyword, 
      structureData,
      researchData
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[INFO] Content enhancement completed in ${duration} seconds`);
    
    // Save the enhanced content
    const outputPath = path.join(outputDir, `${slug}.json`);
    await fs.writeFile(outputPath, JSON.stringify(enhancedContent, null, 2), 'utf8');
    
    console.log(`[SUCCESS] Enhanced content saved to: ${outputPath}`);
    return enhancedContent;
  } catch (error) {
    console.error(`[ERROR] Failed to generate content: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  generateContent(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateContent }; 