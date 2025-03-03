#!/usr/bin/env node

/**
 * Batch Keyword Processor
 * 
 * This script processes multiple keywords from a text file using the systematic
 * content generator. Each keyword is processed sequentially to avoid memory issues.
 * 
 * Usage: node process-batch.js keywords.txt [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 *   --skip-image     Skip image generation step
 *   --skip-intent    Skip search intent analysis step
 *   --intent-only    Run only the search intent analysis step
 *   --min-score=N    Set minimum SEO score threshold (default: 85)
 *   --delay=N        Delay in seconds between processing keywords (default: 5)
 */

require('dotenv').config();

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Batch Keyword Processor

Usage: node ${path.basename(__filename)} keywords.txt [options]
Options:
  --force-api      Force use of real APIs instead of mock clients
  --skip-image     Skip image generation step
  --skip-intent    Skip search intent analysis step
  --intent-only    Run only the search intent analysis step
  --min-score=N    Set minimum SEO score threshold (default: 85)
  --delay=N        Delay in seconds between processing keywords (default: 5)
  --help, -h       Show this help message
  `);
  process.exit(0);
}

// Extract the keywords file and options
const keywordsFile = args[0];
const forceApi = args.includes('--force-api');
const skipImage = args.includes('--skip-image');
const skipIntent = args.includes('--skip-intent');
const intentOnly = args.includes('--intent-only');
let minScore = 85;
let delaySeconds = 5;

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

// Parse delay option if provided
const delayArg = args.find(arg => arg.startsWith('--delay='));
if (delayArg) {
  const delayValue = parseInt(delayArg.split('=')[1], 10);
  if (!isNaN(delayValue) && delayValue >= 0) {
    delaySeconds = delayValue;
  } else {
    console.warn('[WARNING] Invalid delay value. Using default: 5 seconds');
  }
}

/**
 * Main function to process a batch of keywords
 */
async function processBatch(keywordsFile, options) {
  try {
    console.log(`[INFO] Starting batch processing from file: ${keywordsFile}`);
    const startTime = performance.now();
    
    // Read the keywords file
    const fileContent = await fs.readFile(keywordsFile, 'utf8');
    
    // Split by lines and filter out empty lines and comments
    const keywords = fileContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    if (keywords.length === 0) {
      console.error('[ERROR] No valid keywords found in the file');
      return false;
    }
    
    console.log(`[INFO] Found ${keywords.length} keywords to process`);
    console.log(`Options: force-api=${options.forceApi}, skip-image=${options.skipImage}, skip-intent=${options.skipIntent}, intent-only=${options.intentOnly}, min-score=${options.minScore}, delay=${options.delaySeconds}s`);
    
    // Prepare results object
    const results = {
      timestamp: new Date().toISOString(),
      options: {
        forceApi: options.forceApi,
        skipImage: options.skipImage,
        skipIntent: options.skipIntent,
        intentOnly: options.intentOnly,
        minScore: options.minScore,
        delaySeconds: options.delaySeconds
      },
      totalKeywords: keywords.length,
      successful: [],
      failed: [],
      startTime: new Date().toISOString(),
      endTime: null,
      durationMinutes: 0
    };
    
    // Process each keyword
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n[INFO] Processing keyword ${i+1}/${keywords.length}: "${keyword}"`);
      
      try {
        // Build the command
        let cmd = `node --max-old-space-size=8192 systematic-content-generator.js "${keyword}"`;
        
        if (options.forceApi) cmd += ' --force-api';
        if (options.skipImage) cmd += ' --skip-image';
        if (options.skipIntent) cmd += ' --skip-intent';
        if (options.intentOnly) cmd += ' --intent-only';
        cmd += ` --min-score=${options.minScore}`;
        
        // Execute the command
        console.log(`Executing: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
        
        // Record success
        results.successful.push({
          keyword,
          timestamp: new Date().toISOString()
        });
        
        console.log(`[SUCCESS] Completed processing for "${keyword}"`);
      } catch (error) {
        // Record failure
        results.failed.push({
          keyword,
          timestamp: new Date().toISOString(),
          error: error.message
        });
        
        console.error(`[ERROR] Failed to process "${keyword}": ${error.message}`);
      }
      
      // Add delay between keywords (except for the last one)
      if (i < keywords.length - 1 && options.delaySeconds > 0) {
        console.log(`[INFO] Waiting ${options.delaySeconds} seconds before processing next keyword...`);
        await new Promise(resolve => setTimeout(resolve, options.delaySeconds * 1000));
      }
      
      // Save interim results after each keyword
      await saveResults(results);
    }
    
    // Calculate final statistics
    const endTime = performance.now();
    const durationMinutes = ((endTime - startTime) / 1000 / 60).toFixed(2);
    
    results.endTime = new Date().toISOString();
    results.durationMinutes = parseFloat(durationMinutes);
    
    // Save final results
    await saveResults(results);
    
    // Print summary
    console.log(`\n[SUMMARY] Batch processing completed in ${durationMinutes} minutes`);
    console.log(`Total keywords: ${keywords.length}`);
    console.log(`Successful: ${results.successful.length}`);
    console.log(`Failed: ${results.failed.length}`);
    console.log(`Results saved to: batch-results.json`);
    
    return results.failed.length === 0;
  } catch (error) {
    console.error(`[ERROR] Batch processing failed: ${error.message}`);
    return false;
  }
}

/**
 * Save results to a JSON file
 */
async function saveResults(results) {
  try {
    await fs.writeFile('batch-results.json', JSON.stringify(results, null, 2), 'utf8');
  } catch (error) {
    console.error(`[ERROR] Failed to save results: ${error.message}`);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  (async () => {
    // Call the main function with parsed options
    const success = await processBatch(keywordsFile, {
      forceApi,
      skipImage,
      skipIntent,
      intentOnly,
      minScore,
      delaySeconds
    });
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1);
  })();
}

module.exports = { processBatch }; 