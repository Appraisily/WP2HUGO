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
const competitorAnalysisService = require('./src/services/competitor-analysis.service');
const slugify = require('./src/utils/slugify');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Content Structure Generator

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
 * Main function to generate content structure
 */
async function generateContentStructure(keyword, forceApi = false) {
  console.log(`[INFO] Generating content structure for: "${keyword}"`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      googleAiService.setForceApi(true);
      keywordResearchService.setForceApi(true);
      perplexityService.setForceApi(true);
    }
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(process.cwd(), 'output', 'research');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Load research data
    const slug = slugify(keyword);
    const researchPath = path.join(outputDir, `${slug}-kwrds.json`);
    const perplexityPath = path.join(outputDir, `${slug}-perplexity.json`);
    
    console.log(`[INFO] Loading research data from: ${researchPath}`);
    const researchData = JSON.parse(await fs.readFile(researchPath, 'utf8'));
    
    console.log(`[INFO] Loading perplexity data from: ${perplexityPath}`);
    const perplexityData = JSON.parse(await fs.readFile(perplexityPath, 'utf8'));
    
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
    
    // Generate structure using Google AI
    console.log(`[INFO] Generating structure with Google AI for "${keyword}"`);
    const structureData = await googleAiService.generateStructure(
      keyword, 
      researchData, 
      perplexityData,
      additionalStructureInfo
    );
    
    // Save structure data
    const structurePath = path.join(outputDir, `${slug}-googleai-structure.json`);
    console.log(`[INFO] Saving structure data to: ${structurePath}`);
    await fs.writeFile(structurePath, JSON.stringify(structureData, null, 2));
    
    console.log(`[SUCCESS] Content structure generated successfully for "${keyword}"`);
    return structureData;
  } catch (error) {
    console.error(`[ERROR] Failed to generate content structure: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  generateContentStructure(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateContentStructure }; 