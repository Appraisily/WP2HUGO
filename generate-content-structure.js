#!/usr/bin/env node

/**
 * Content Structure Generator
 * 
 * This script generates a structured outline for content based on keyword research.
 * It uses Google AI to create a comprehensive structure with headings, subheadings,
 * and content recommendations.
 * 
 * Usage: node generate-content-structure.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const googleAiService = require('./src/services/google-ai.service');
const keywordResearchService = require('./src/services/keyword-research.service');
const perplexityService = require('./src/services/perplexity.service');
const searchIntentService = require('./src/services/search-intent.service');
const competitorAnalysisService = require('./src/services/competitor-analysis.service');
const slugify = require('./src/utils/slugify');

// Parse command line arguments
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Content Structure Generator

Usage: node generate-content-structure.js "your keyword" [options]
Options:
  --force-api      Force use of real APIs instead of mock clients
  --skip-intent    Skip search intent analysis step
  --help, -h       Show this help message
`);
    process.exit(0);
  }
  
  const keyword = args[0];
  const forceApi = args.includes('--force-api');
  const skipIntent = args.includes('--skip-intent');
  
  generateContentStructure(keyword, forceApi, skipIntent)
    .then(() => {
      console.log(`[SUCCESS] Content structure generated successfully for "${keyword}"`);
    })
    .catch(error => {
      console.error(`[ERROR] ${error.message}`);
      process.exit(1);
    });
}

/**
 * Main function to generate content structure
 */
async function generateContentStructure(keyword, forceApi = false, skipIntent = false) {
  console.log(`[INFO] Generating content structure for: "${keyword}"`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      googleAiService.setForceApi(true);
      keywordResearchService.setForceApi(true);
      perplexityService.setForceApi(true);
      searchIntentService.setForceApi(true);
    }
    
    // Load research data (if available)
    const slug = slugify(keyword);
    let researchData = null;
    const researchPath = path.join(process.cwd(), 'output', 'research', `${slug}-kwrds.json`);
    
    try {
      // Check if research data exists
      const researchFileExists = await fs.access(researchPath).then(() => true).catch(() => false);
      if (researchFileExists) {
        console.log(`[INFO] Loading research data from: ${researchPath}`);
        researchData = JSON.parse(await fs.readFile(researchPath, 'utf8'));
      }
    } catch (error) {
      console.warn(`[WARNING] Error loading research data: ${error.message}`);
    }
    
    // Load perplexity data (if available)
    let perplexityData = null;
    const perplexityPath = path.join(process.cwd(), 'output', 'research', `${slug}-perplexity.json`);
    
    try {
      // Check if perplexity data exists
      const perplexityFileExists = await fs.access(perplexityPath).then(() => true).catch(() => false);
      if (perplexityFileExists) {
        console.log(`[INFO] Loading perplexity data from: ${perplexityPath}`);
        perplexityData = JSON.parse(await fs.readFile(perplexityPath, 'utf8'));
      }
    } catch (error) {
      console.warn(`[WARNING] Error loading perplexity data: ${error.message}`);
    }
    
    // Analyze search intent if not skipped
    let intentData = null;
    if (!skipIntent) {
      try {
        console.log(`[INFO] Analyzing search intent for "${keyword}"`);
        intentData = await searchIntentService.analyzeIntent(keyword, researchData);
        console.log(`[INFO] Search intent analysis completed: ${intentData.intent.primaryIntent} intent detected`);
      } catch (error) {
        console.warn(`[WARNING] Error analyzing search intent: ${error.message}`);
      }
    }
    
    // Analyze competitors if SERP data is available
    let competitorAnalysis = null;
    if (researchData && researchData.serp && researchData.serp.results) {
      console.log(`[INFO] Analyzing competitors for "${keyword}"`);
      try {
        competitorAnalysis = await competitorAnalysisService.analyzeCompetitors(keyword, researchData.serp.results);
      } catch (error) {
        console.error(`[WARNING] Error analyzing competitors: ${error.message}`);
      }
    }
    
    // Include competitor insights in structure prompt if available
    let additionalStructureInfo = '';
    if (competitorAnalysis && competitorAnalysis.success) {
      additionalStructureInfo = `
Based on competitor analysis, consider these insights:
- Average word count for top content: ${competitorAnalysis.insights.contentStatistics.averageWordCount} words
- Important topics to cover: ${competitorAnalysis.insights.criticalTopics.join(', ')}
- Content gaps to fill: ${competitorAnalysis.insights.contentGaps.join(', ')}
- Recommended headings structure: ${competitorAnalysis.insights.recommendedOutline.join(', ')}
`;
    }
    
    // Generate structure with Google AI
    console.log(`[INFO] Generating structure with Google AI for "${keyword}"`);
    const structureData = await googleAiService.generateStructure(
      keyword, 
      researchData, 
      perplexityData,
      intentData
    );
    
    // Save the structure data
    const outputPath = path.join(process.cwd(), 'output', 'research', `${slug}-googleai-structure.json`);
    await fs.writeFile(outputPath, JSON.stringify(structureData, null, 2), 'utf8');
    
    console.log(`[INFO] Saving structure data to: ${outputPath}`);
    console.log(`[SUCCESS] Content structure generated successfully for "${keyword}"`);
    
    return structureData;
  } catch (error) {
    console.error(`[ERROR] Failed to generate content structure: ${error.message}`);
    process.exit(1);
  }
}

module.exports = generateContentStructure; 