#!/usr/bin/env node

/**
 * Content SEO Optimization Script
 * 
 * This script optimizes enhanced content for SEO using Anthropic's Claude AI.
 * It ensures the content meets SEO best practices and achieves a minimum
 * quality score.
 * 
 * Usage: node improve-content.js --keyword "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 *   --min-score=N    Set minimum SEO score threshold (default: 85)
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const anthropicService = require('./src/services/anthropic.service');
const seoQualityService = require('./src/services/seo-quality.service');
const slugify = require('./src/utils/slugify');

// Parse command-line arguments
const args = process.argv.slice(2);
let keyword = null;
let forceApi = false;
let minScore = 85;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--keyword' || args[i] === '-k') && i + 1 < args.length) {
    keyword = args[i + 1];
    i++; // Skip the next argument as it's the keyword
  } else if (args[i] === '--force-api') {
    forceApi = true;
  } else if (args[i].startsWith('--min-score=')) {
    const scoreValue = parseInt(args[i].split('=')[1], 10);
    if (!isNaN(scoreValue) && scoreValue > 0 && scoreValue <= 100) {
      minScore = scoreValue;
    }
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Content SEO Optimization Script

Usage: node ${path.basename(__filename)} --keyword "your keyword" [options]
Options:
  --keyword, -k     The keyword to optimize content for (required)
  --force-api       Force use of real APIs instead of mock clients
  --min-score=N     Set minimum SEO score threshold (default: 85)
  --help, -h        Show this help message
    `);
    process.exit(0);
  }
}

// Check if keyword is provided
if (!keyword) {
  console.error('[ERROR] Keyword is required. Use --keyword "your keyword"');
  process.exit(1);
}

/**
 * Main function to optimize content for SEO
 */
async function improveContent(keyword, options = {}) {
  const { forceApi = false, minScore = 85 } = options;
  console.log(`[INFO] Optimizing content for SEO: "${keyword}" (min score: ${minScore})`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      anthropicService.setForceApi(true);
      seoQualityService.setForceApi(true);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output', 'research');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load enhanced content
    const slug = slugify(keyword);
    const enhancedPath = path.join(outputDir, `${slug}-anthropic-enhanced.json`);
    
    console.log(`[INFO] Loading enhanced content from: ${enhancedPath}`);
    const enhancedContent = JSON.parse(await fs.readFile(enhancedPath, 'utf8'));
    
    // Optimize content for SEO
    console.log(`[INFO] Optimizing content for SEO with Anthropic for "${keyword}"`);
    const optimizedContent = await anthropicService.optimizeContentForSeo(
      keyword,
      enhancedContent
    );
    
    // Evaluate SEO quality
    console.log(`[INFO] Evaluating SEO quality for "${keyword}"`);
    const seoScore = await seoQualityService.evaluateContent(keyword, optimizedContent);
    
    console.log(`[INFO] SEO score: ${seoScore.score} (minimum: ${minScore})`);
    
    // If score is below minimum, try to improve it
    let finalContent = optimizedContent;
    let attempts = 1;
    const maxAttempts = 3;
    
    while (seoScore.score < minScore && attempts < maxAttempts) {
      console.log(`[INFO] SEO score below minimum. Attempt ${attempts}/${maxAttempts} to improve...`);
      
      // Improve content based on SEO feedback
      finalContent = await anthropicService.improveContentWithSeoFeedback(
        keyword,
        finalContent,
        seoScore.feedback
      );
      
      // Re-evaluate SEO quality
      const newScore = await seoQualityService.evaluateContent(keyword, finalContent);
      console.log(`[INFO] New SEO score: ${newScore.score} (minimum: ${minScore})`);
      
      if (newScore.score >= minScore) {
        console.log(`[INFO] SEO score meets minimum requirement`);
        break;
      }
      
      attempts++;
    }
    
    // Save optimized content
    const optimizedPath = path.join(outputDir, `${slug}-anthropic-seo-optimized.json`);
    console.log(`[INFO] Saving optimized content to: ${optimizedPath}`);
    await fs.writeFile(optimizedPath, JSON.stringify(finalContent, null, 2));
    
    console.log(`[SUCCESS] Content optimized successfully for "${keyword}"`);
    return finalContent;
  } catch (error) {
    console.error(`[ERROR] Failed to optimize content: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  improveContent(keyword, { forceApi, minScore })
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { improveContent }; 