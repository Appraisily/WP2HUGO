#!/usr/bin/env node

/**
 * Systematic Content Generator
 * 
 * This script transforms a keyword into high-quality markdown content through a
 * systematic process including research, content structure, optimization, 
 * image generation, markdown generation, and export to Hugo.
 * 
 * Usage: node systematic-content-generator.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 *   --skip-image     Skip image generation step
 *   --min-score=N    Set minimum SEO score threshold (default: 85)
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Systematic Content Generator

Usage: node ${path.basename(__filename)} "your keyword" [options]
Options:
  --force-api      Force use of real APIs instead of mock clients
  --skip-image     Skip image generation step
  --min-score=N    Set minimum SEO score threshold (default: 85)
  --help, -h       Show this help message
  `);
  process.exit(0);
}

// Extract the keyword and options
const keyword = args[0];
const forceApi = args.includes('--force-api');
const skipImage = args.includes('--skip-image');
let minScore = 85;

// Parse min-score option if provided
const minScoreArg = args.find(arg => arg.startsWith('--min-score='));
if (minScoreArg) {
  const scoreValue = parseInt(minScoreArg.split('=')[1], 10);
  if (!isNaN(scoreValue) && scoreValue > 0 && scoreValue <= 100) {
    minScore = scoreValue;
  } else {
    console.warn('[WARNING] Invalid min-score value. Using default: 85');
  }
}

/**
 * Main function to execute the systematic content generation process
 */
async function generateSystematicContent(keyword, options) {
  console.log(`[INFO] Starting systematic content generation for: "${keyword}"`);
  const startTime = performance.now();
  
  try {
    // STEP 1: Research - Use the --keyword flag to process a single keyword
    console.log(`\n[STEP 1] Conducting research for "${keyword}"...`);
    const researchSuccess = executeStep(
      `node --max-old-space-size=4096 process-keywords.js --keyword "${keyword}" ${options.forceApi ? '--force-api' : ''}`,
      `Research process for "${keyword}"`
    );
    
    if (!researchSuccess) {
      throw new Error('Research process failed');
    }
    
    // Check if research files were created
    const researchFiles = [
      `output/research/${getSlug(keyword)}-kwrds.json`,
      `output/research/${getSlug(keyword)}-perplexity.json`
    ];
    
    for (const file of researchFiles) {
      if (!fileExists(file)) {
        throw new Error(`Required research file not found: ${file}`);
      }
    }
    
    global.gc && global.gc(); // Trigger garbage collection if available
    
    // STEP 2: Generate Content Structure
    console.log(`\n[STEP 2] Generating content structure for "${keyword}"...`);
    const structureSuccess = executeStep(
      `node --max-old-space-size=4096 generate-content-structure.js "${keyword}"`,
      `Content structure generation for "${keyword}"`
    );
    
    if (!structureSuccess) {
      throw new Error('Content structure generation failed');
    }
    
    // Check if structure file was created
    const structureFile = `output/research/${getSlug(keyword)}-googleai-structure.json`;
    if (!fileExists(structureFile)) {
      throw new Error(`Required structure file not found: ${structureFile}`);
    }
    
    global.gc && global.gc(); // Trigger garbage collection if available
    
    // STEP 3: Enhance Content
    console.log(`\n[STEP 3] Enhancing content for "${keyword}"...`);
    const enhanceSuccess = executeStep(
      `node --max-old-space-size=4096 enhance-content.js "${keyword}"`,
      `Content enhancement for "${keyword}"`
    );
    
    if (!enhanceSuccess) {
      throw new Error('Content enhancement failed');
    }
    
    // Check if enhanced file was created
    const enhancedFile = `output/research/${getSlug(keyword)}-anthropic-enhanced.json`;
    if (!fileExists(enhancedFile)) {
      throw new Error(`Required enhanced content file not found: ${enhancedFile}`);
    }
    
    global.gc && global.gc(); // Trigger garbage collection if available
    
    // STEP 4: Optimize Content
    console.log(`\n[STEP 4] Optimizing content for "${keyword}"...`);
    const optimizeSuccess = executeStep(
      `node --max-old-space-size=4096 improve-content.js --keyword "${keyword}" --min-score=${minScore}`,
      `Content optimization for "${keyword}"`
    );
    
    if (!optimizeSuccess) {
      throw new Error('Content optimization failed');
    }
    
    // Check if optimized file was created
    const optimizedFile = `output/research/${getSlug(keyword)}-anthropic-seo-optimized.json`;
    if (!fileExists(optimizedFile)) {
      throw new Error(`Required optimized content file not found: ${optimizedFile}`);
    }
    
    global.gc && global.gc(); // Trigger garbage collection if available
    
    // STEP 5: Generate Image (if not skipped)
    let imageGenSuccess = true;
    if (!options.skipImage) {
      console.log(`\n[STEP 5] Generating image for "${keyword}"...`);
      imageGenSuccess = executeStep(
        `node --max-old-space-size=4096 generate-image.js "${keyword}" ${options.forceApi ? '--force-api' : ''}`,
        `Image generation for "${keyword}"`
      );
      
      if (!imageGenSuccess) {
        console.warn('[WARNING] Image generation failed, but continuing with process');
      }
      
      global.gc && global.gc(); // Trigger garbage collection if available
    } else {
      console.log(`\n[STEP 5] Image generation skipped as requested`);
    }
    
    // STEP 6: Generate Markdown
    console.log(`\n[STEP 6] Generating markdown for "${keyword}"...`);
    const markdownSuccess = executeStep(
      `node --max-old-space-size=4096 generate-markdown.js "${keyword}"`,
      `Markdown generation for "${keyword}"`
    );
    
    if (!markdownSuccess) {
      throw new Error('Markdown generation failed');
    }
    
    // Check if markdown file was created
    const markdownFile = `output/markdown/${getSlug(keyword)}.md`;
    if (!fileExists(markdownFile)) {
      throw new Error(`Required markdown file not found: ${markdownFile}`);
    }
    
    global.gc && global.gc(); // Trigger garbage collection if available
    
    // STEP 7: Export to Hugo
    console.log(`\n[STEP 7] Exporting to Hugo for "${keyword}"...`);
    const hugoSuccess = executeStep(
      `node --max-old-space-size=4096 export-hugo.js "${keyword}"`,
      `Hugo export for "${keyword}"`
    );
    
    if (!hugoSuccess) {
      throw new Error('Hugo export failed');
    }
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.log(`\n[SUCCESS] Systematic content generation completed for "${keyword}" in ${duration} minutes`);
    console.log(`Markdown file available at: ${markdownFile}`);
    
    return true;
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    console.error(`\n[ERROR] Systematic content generation failed for "${keyword}": ${error.message}`);
    console.error(`Process terminated after ${duration} minutes`);
    
    return false;
  }
}

/**
 * Execute a step in the content generation process
 * 
 * @param {string} command - Command to execute
 * @param {string} description - Description of the step
 * @returns {boolean} - True if successful, false otherwise
 */
function executeStep(command, description) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    console.log(`[SUCCESS] ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`[ERROR] ${description} failed: ${error.message}`);
    return false;
  }
}

/**
 * Check if a file exists
 * 
 * @param {string} filePath - Path to the file
 * @returns {boolean} - True if file exists, false otherwise
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Convert a keyword to a slug for filenames
 * 
 * @param {string} keyword - The keyword to convert
 * @returns {string} - The slugified keyword
 */
function getSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Run the content generation process if this script is executed directly
if (require.main === module) {
  generateSystematicContent(keyword, { forceApi, skipImage, minScore })
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateSystematicContent }; 