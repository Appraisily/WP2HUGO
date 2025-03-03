#!/usr/bin/env node

/**
 * Content Optimization Script
 * 
 * This script optimizes enhanced content for SEO using the SEO Quality API.
 * 
 * Usage: node optimize-content.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const anthropicService = require('./src/services/anthropic.service');
const seoQualityService = require('./src/services/seo-quality.service');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Content Optimization Script

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

// Set up the services
anthropicService.setForceApi(forceApi);
seoQualityService.setForceApi(forceApi);

/**
 * Determine the optimal number of images based on content analysis
 * Uses AI to analyze content and decide how many images would be beneficial
 */
async function determineOptimalImageCount(keyword, content) {
  console.log(`[INFO] Analyzing content to determine optimal image count...`);
  
  try {
    // Default image count if analysis fails
    let recommendedCount = 3;
    
    // Use Anthropic to analyze the content and recommend image count
    const analysis = await anthropicService.analyzeContentForImages(
      keyword,
      content
    );
    
    if (analysis && analysis.recommendedImageCount) {
      recommendedCount = analysis.recommendedImageCount;
      console.log(`[INFO] AI analysis recommends ${recommendedCount} images for this content`);
      
      // Log the reasons for this recommendation
      if (analysis.reasoning) {
        console.log(`[INFO] Reasoning: ${analysis.reasoning}`);
      }
    } else {
      console.log(`[INFO] Using default image count: ${recommendedCount}`);
    }
    
    // Ensure the count is within reasonable bounds (1-10)
    recommendedCount = Math.max(1, Math.min(recommendedCount, 10));
    
    return {
      recommendedImageCount: recommendedCount,
      analysis: analysis || { reasoning: 'Used default recommendation' }
    };
  } catch (error) {
    console.warn(`[WARNING] Failed to determine optimal image count: ${error.message}`);
    console.log(`[INFO] Using default image count: 3`);
    return {
      recommendedImageCount: 3,
      analysis: { reasoning: 'Error during analysis, using default' }
    };
  }
}

/**
 * Main function to optimize content for a keyword
 */
async function optimizeContent(keyword, forceApi = false) {
  console.log(`[INFO] Optimizing content for: "${keyword}"`);
  
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output', 'optimized');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load enhanced content
    const slug = slugify(keyword);
    const enhancedPath = path.join(process.cwd(), 'output', 'enhanced', `${slug}.json`);
    
    console.log(`[INFO] Loading enhanced content from: ${enhancedPath}`);
    const enhancedContent = JSON.parse(await fs.readFile(enhancedPath, 'utf8'));
    
    // Evaluate content quality with SEO service
    console.log(`[INFO] Evaluating content SEO quality...`);
    const seoEvaluation = await seoQualityService.evaluateContent(keyword, enhancedContent);
    
    console.log(`[INFO] SEO Evaluation completed:`);
    console.log(`- Overall Score: ${seoEvaluation.scores.overall}/100`);
    console.log(`- Title Score: ${seoEvaluation.scores.title}/100`);
    console.log(`- Description Score: ${seoEvaluation.scores.description}/100`);
    console.log(`- Content Score: ${seoEvaluation.scores.content}/100`);
    console.log(`- Readability Score: ${seoEvaluation.scores.readability}/100`);
    
    // Determine optimal image count for this content
    const imageAnalysis = await determineOptimalImageCount(keyword, enhancedContent);
    
    // Optimize content with Anthropic based on SEO feedback
    console.log(`[INFO] Optimizing content based on SEO feedback...`);
    const startTime = Date.now();
    
    const optimizedContent = await anthropicService.optimizeContentForSeo(
      keyword,
      enhancedContent,
      seoEvaluation
    );
    
    // Add image count recommendation to optimized content
    optimizedContent.imageRecommendation = imageAnalysis;
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`[INFO] Content optimization completed in ${duration} seconds`);
    
    // Save the optimized content
    const outputPath = path.join(outputDir, `${slug}.json`);
    await fs.writeFile(outputPath, JSON.stringify(optimizedContent, null, 2), 'utf8');
    
    console.log(`[SUCCESS] Optimized content saved to: ${outputPath}`);
    return optimizedContent;
  } catch (error) {
    console.error(`[ERROR] Failed to optimize content: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  optimizeContent(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { optimizeContent, determineOptimalImageCount }; 