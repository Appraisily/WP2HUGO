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
 *   --skip-intent    Skip search intent analysis step
 *   --intent-only    Run only the search intent analysis step
 *   --min-score=N    Set minimum SEO score threshold (default: 85)
 *   --image-count=N  Number of images to generate (default: 5)
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// Parse command-line arguments
const args = process.argv.slice(2);
let keyword = '';
let forceApi = false;
let skipImage = false;
let skipIntent = false;
let intentOnly = false;
let minScore = 85;
let imageCount = 5;

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Systematic Content Generator

Usage: node systematic-content-generator.js "your keyword" [options]

Options:
  --force-api       Force use of real APIs instead of mock clients
  --skip-image      Skip image generation step
  --skip-intent     Skip search intent analysis step
  --intent-only     Run only the search intent analysis step
  --min-score=N     Set minimum SEO score threshold (default: 85)
  --image-count=N   Number of images to generate (default: 5)
  --help, -h        Display this help message
`);
  process.exit(0);
}

// Extract options
for (const arg of args) {
  if (arg === '--force-api') {
    forceApi = true;
  } else if (arg === '--skip-image') {
    skipImage = true;
  } else if (arg === '--skip-intent') {
    skipIntent = true;
  } else if (arg === '--intent-only') {
    intentOnly = true;
  } else if (arg.startsWith('--min-score=')) {
    const scoreStr = arg.split('=')[1];
    const score = parseInt(scoreStr, 10);
    if (!isNaN(score) && score > 0 && score <= 100) {
      minScore = score;
    } else {
      console.warn(`[WARNING] Invalid min-score value: ${scoreStr}. Using default: 85`);
    }
  } else if (arg.startsWith('--image-count=')) {
    const countStr = arg.split('=')[1];
    const count = parseInt(countStr, 10);
    if (!isNaN(count) && count > 0) {
      imageCount = Math.min(count, 10); // Cap at 10 images
    } else {
      console.warn(`[WARNING] Invalid image-count value: ${countStr}. Using default: 5`);
    }
  } else if (!arg.startsWith('--')) {
    keyword = arg;
  }
}

/**
 * Main function to execute the systematic content generation process
 */
async function generateSystematicContent(keyword, options) {
  console.log(`[INFO] Starting systematic content generation for: "${keyword}"`);
  const startTime = performance.now();
  
  try {
    if (intentOnly) {
      // If intent-only flag is set, only run the search intent analysis
      console.log('[INFO] Running in intent-only mode');
      const searchIntentService = require('./src/services/search-intent.service');
      if (forceApi) searchIntentService.setForceApi(true);
      
      const slug = require('./src/utils/slugify')(keyword);
      await searchIntentService.analyzeIntent(keyword);
      
      console.log(`[SUCCESS] Search intent analysis completed for "${keyword}"`);
      return;
    }
    
    // STEP 1: Research - Use the --keyword flag to process a single keyword
    console.log(`\n[STEP 1] Conducting research for "${keyword}"...`);
    const researchSuccess = executeStep(
      `node --max-old-space-size=4096 process-keywords.js --keyword "${keyword}" ${options.forceApi ? '--force-api' : ''}`,
      `Research process for "${keyword}"`
    );
    
    if (!researchSuccess) {
      throw new Error('Research step failed');
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
    
    // STEP 2: Generate content structure
    console.log(`\n[STEP 2] Generating content structure for "${keyword}"...`);
    const structureSuccess = executeStep(
      `node --max-old-space-size=4096 generate-content-structure.js "${keyword}" ${options.forceApi ? '--force-api' : ''} ${options.skipIntent ? '--skip-intent' : ''}`,
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
    
    // STEP 3: Enhance content with Anthropic
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
    
    // STEP 4: Improve content with SEO optimization
    console.log(`\n[STEP 4] Optimizing content for "${keyword}"...`);
    const optimizeSuccess = executeStep(
      `node --max-old-space-size=4096 improve-content.js --keyword "${keyword}" --min-score=${options.minScore}`,
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
    
    // STEP 5: Generate images
    if (!options.skipImage) {
      console.log(`\n[STEP 5] Generating images for "${keyword}"...`);
      const imageSuccess = executeStep(
        `node --max-old-space-size=4096 generate-image.js "${keyword}" ${options.forceApi ? '--force-api' : ''} --image-count=${options.imageCount}`,
        `Image generation for "${keyword}"`
      );
      
      if (!imageSuccess) {
        throw new Error('Image generation failed');
      }
    } else {
      console.log(`\n[STEP 5] Skipping image generation as requested`);
    }
    
    // STEP 6: Generate markdown
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
    const exportSuccess = executeStep(
      `node --max-old-space-size=4096 export-hugo.js "${keyword}"`,
      `Hugo export for "${keyword}"`
    );
    
    if (!exportSuccess) {
      throw new Error('Hugo export failed');
    }
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 60000).toFixed(2); // Convert to minutes
    
    console.log(`\n[SUCCESS] Systematic content generation completed for "${keyword}" in ${duration} minutes`);
    
    // Print the location of the markdown file
    const slug = getSlug(keyword);
    console.log(`\nMarkdown file available at: output/markdown/${slug}.md`);
    
    return true;
  } catch (error) {
    console.error(`\n[ERROR] Systematic content generation failed for "${keyword}": ${error.message}`);
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 60000).toFixed(2); // Convert to minutes
    
    console.log(`Process terminated after ${duration} minutes`);
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
  generateSystematicContent(keyword, { forceApi, skipImage, minScore, imageCount })
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateSystematicContent }; 