#!/usr/bin/env node

/**
 * Batch Content Processing Script
 * 
 * This script processes a batch of keywords from a text file and generates 
 * content for each using the WP2HUGO content generation system.
 * 
 * Usage: node batch-process.js [filename] [options]
 * Options:
 *   --force-api    Force use of real APIs instead of cached results
 *   --skip-image   Skip image generation
 *   --min-score    Minimum SEO score required (default: 0)
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Parse command-line arguments
const args = process.argv.slice(2);
const options = {
  filename: 'keywords.txt',
  forceApi: false,
  skipImage: false,
  minScore: 0,
  singleKeyword: null
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--force-api') {
    options.forceApi = true;
  } else if (arg === '--skip-image') {
    options.skipImage = true;
  } else if (arg === '--min-score') {
    options.minScore = parseInt(args[++i]) || 0;
  } else if (!arg.startsWith('--')) {
    // Check if this looks like a filename or a keyword
    if (arg.endsWith('.txt') || arg.includes('/') || arg.includes('\\')) {
      options.filename = arg;
    } else {
      options.singleKeyword = arg;
    }
  }
}

/**
 * Process a single keyword through the entire workflow
 */
async function processKeyword(keyword, options) {
  console.log('\n=========================================================');
  console.log(`PROCESSING KEYWORD: "${keyword}"`);
  console.log('=========================================================\n');
  
  try {
    const startTime = Date.now();
    
    // Step 1: Research the keyword
    console.log(`[STEP 1] Researching keyword: "${keyword}"`);
    await runScript('generate-content-structure.js', [keyword, options.forceApi ? '--force-api' : '']);
    
    // Step 2: Generate content
    console.log(`\n[STEP 2] Generating content for: "${keyword}"`);
    await runScript('generate-content.js', [keyword, options.forceApi ? '--force-api' : '']);
    
    // Step 3: Optimize content for SEO
    console.log(`\n[STEP 3] Optimizing content for SEO: "${keyword}"`);
    await runScript('optimize-content.js', [keyword, options.forceApi ? '--force-api' : '']);
    
    // Step 4: Generate image (unless skipped)
    if (!options.skipImage) {
      console.log(`\n[STEP 4] Generating image for: "${keyword}"`);
      await runScript('generate-image.js', [keyword, options.forceApi ? '--force-api' : '']);
    } else {
      console.log(`\n[STEP 4] Skipping image generation as requested`);
    }
    
    // Step 5: Generate markdown
    console.log(`\n[STEP 5] Generating markdown for: "${keyword}"`);
    await runScript('generate-markdown.js', [keyword, options.forceApi ? '--force-api' : '']);
    
    // Step 6: Export to Hugo
    console.log(`\n[STEP 6] Exporting to Hugo: "${keyword}"`);
    await runScript('export-to-hugo.js', [keyword, options.forceApi ? '--force-api' : '']);
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n=========================================================');
    console.log(`COMPLETED PROCESSING: "${keyword}"`);
    console.log(`Total processing time: ${duration} seconds`);
    console.log('=========================================================\n');
    
    return true;
  } catch (error) {
    console.error(`\n[ERROR] Failed to process keyword "${keyword}": ${error.message}`);
    return false;
  }
}

/**
 * Run a script with the given arguments
 */
async function runScript(scriptName, args = []) {
  const scriptPath = path.join(process.cwd(), scriptName);
  
  // Properly quote the keyword if it contains spaces
  const processedArgs = args.map(arg => {
    // If the argument contains spaces and is not already quoted, add quotes
    if (arg && arg.includes(' ') && !arg.startsWith('"') && !arg.startsWith("'")) {
      return `"${arg}"`;
    }
    return arg;
  });
  
  const command = `node "${scriptPath}" ${processedArgs.filter(Boolean).join(' ')}`;
  
  try {
    console.log(`[EXEC] ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    throw new Error(`Script execution failed: ${scriptName} (${error.message})`);
  }
}

/**
 * Read keywords from a file, filtering out empty lines and comments
 */
async function readKeywordsFromFile(filename) {
  try {
    const filePath = path.join(process.cwd(), filename);
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    return fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
  } catch (error) {
    throw new Error(`Failed to read keywords file: ${error.message}`);
  }
}

/**
 * Main function to process all keywords from a file
 */
async function processKeywordsFromFile(options) {
  try {
    // If a single keyword is provided, process just that one
    if (options.singleKeyword) {
      console.log(`[INFO] Processing single keyword: "${options.singleKeyword}"`);
      await processKeyword(options.singleKeyword, options);
      return;
    }
    
    console.log(`[INFO] Reading keywords from: ${options.filename}`);
    const keywords = await readKeywordsFromFile(options.filename);
    
    if (keywords.length === 0) {
      console.log('[WARNING] No keywords found in file. Nothing to process.');
      return;
    }
    
    console.log(`[INFO] Found ${keywords.length} keywords to process`);
    
    // Process one keyword at a time
    let successCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n[INFO] Processing keyword ${i + 1}/${keywords.length}: "${keyword}"`);
      
      const success = await processKeyword(keyword, options);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay between keywords
      if (i < keywords.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n=========================================================');
    console.log('BATCH PROCESSING COMPLETED');
    console.log(`Total Keywords: ${keywords.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log('=========================================================\n');
  } catch (error) {
    console.error(`[ERROR] Batch processing failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  processKeywordsFromFile(options)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { processKeyword }; 