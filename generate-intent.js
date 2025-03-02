#!/usr/bin/env node

/**
 * Generate Search Intent Analysis
 * 
 * This script analyzes the search intent for a given keyword and displays the results.
 * It helps content creators understand the user intent behind specific keywords.
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const searchIntentService = require('./src/services/search-intent.service');
const keywordResearchService = require('./src/services/keyword-research.service');
const slugify = require('./src/utils/slugify');

// Parse command line arguments
const args = process.argv.slice(2);
let keyword = '';
let forceApi = false;

// Display help if requested
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
  Search Intent Analyzer

  Usage: node generate-intent.js "your keyword" [options]

  Options:
    --force-api       Force use of real APIs instead of mock clients
    --help, -h        Display this help message
  `);
  process.exit(0);
}

// Extract options
for (const arg of args) {
  if (arg === '--force-api') {
    forceApi = true;
  } else if (!arg.startsWith('--')) {
    keyword = arg;
  }
}

// Ensure keyword is provided
if (!keyword) {
  console.error('[ERROR] No keyword provided. Please specify a keyword.');
  console.error('Usage: node generate-intent.js "your keyword" [options]');
  process.exit(1);
}

/**
 * Generate and display search intent analysis for a keyword
 */
async function generateIntentAnalysis(keyword, forceApi) {
  console.log(`\n[INTENT-ANALYZER] Analyzing search intent for: "${keyword}"\n`);
  
  try {
    // Create output directory
    const outputDir = path.join(process.cwd(), 'output', 'research');
    await fs.mkdir(outputDir, { recursive: true });
    
    if (forceApi) {
      console.log('[INTENT-ANALYZER] Force API flag enabled. Using API data even when cache exists.');
      searchIntentService.setForceApi(true);
      keywordResearchService.setForceApi(true);
    }
    
    // Check if we have keyword research data
    const slug = slugify(keyword);
    const researchPath = path.join(outputDir, `${slug}-kwrds.json`);
    let researchData = null;
    
    const researchExists = await fs.access(researchPath).then(() => true).catch(() => false);
    if (researchExists) {
      console.log(`[INTENT-ANALYZER] Loading existing keyword research data`);
      researchData = JSON.parse(await fs.readFile(researchPath, 'utf8'));
    } else {
      console.log(`[INTENT-ANALYZER] No keyword research data found. Generating new data...`);
      // Generate keyword research data
      researchData = await keywordResearchService.researchKeyword(keyword);
      console.log(`[INTENT-ANALYZER] Keyword research data generated and saved to: ${researchPath}`);
    }
    
    // Generate intent data
    console.log(`[INTENT-ANALYZER] Analyzing search intent...`);
    const intentData = await searchIntentService.analyzeIntent(keyword, researchData);
    const intentPath = path.join(outputDir, `${slug}-intent.json`);
    
    // Display intent analysis results
    console.log('\n====== SEARCH INTENT ANALYSIS ======\n');
    console.log(`• Primary Intent: ${intentData.intent.primaryIntent.toUpperCase()}`);
    if (intentData.intent.secondaryIntent) {
      console.log(`• Secondary Intent: ${intentData.intent.secondaryIntent.toUpperCase()}`);
    }
    console.log(`• User Journey Stage: ${intentData.intent.userJourney}`);
    console.log(`• Buyer's Journey: ${intentData.intent.buyerStage}`);
    console.log(`• Recommended Content Formats: ${intentData.contentRecommendations.recommendedFormat}`);
    console.log(`• Ideal Word Count: ${intentData.contentRecommendations.idealWordCount} words`);
    
    if (intentData.searchFeatures.featuredSnippetOpportunity) {
      console.log(`• Featured Snippet Opportunity: YES (${intentData.searchFeatures.snippetType} format)`);
    } else {
      console.log(`• Featured Snippet Opportunity: NO`);
    }
    
    console.log('\n=== People Also Ask Questions ===');
    intentData.searchFeatures.peopleAlsoAsk.forEach((question, index) => {
      console.log(`${index + 1}. ${question}`);
    });
    
    console.log('\n=== Related Subtopics ===');
    intentData.topicClusters.relatedSubtopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`);
    });
    
    console.log('\n=== Recommended Heading Structure ===');
    intentData.contentRecommendations.headingStructure.forEach((heading) => {
      const indent = '  '.repeat(heading.level - 1);
      console.log(`${indent}${heading.level === 1 ? '# ' : '## '}${heading.text}`);
    });
    
    console.log(`\n[SUCCESS] Search intent analysis completed and saved to: ${intentPath}`);
    console.log(`[INFO] Full results available in: ${intentPath}`);
    
    return intentData;
  } catch (error) {
    console.error(`[ERROR] Failed to analyze search intent: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the intent analysis
generateIntentAnalysis(keyword, forceApi).catch(err => {
  console.error(`[FATAL] ${err.message}`);
  process.exit(1);
}); 