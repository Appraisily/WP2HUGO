/**
 * Enhanced Content Generation Process
 * 
 * This script processes keywords with advanced SEO enhancements:
 * - Schema markup generation
 * - Competitor analysis
 * - Internal linking optimization
 * - Content quality monitoring
 * 
 * Usage:
 *   node enhanced-process.js                   # Process all keywords from keywords.txt
 *   node enhanced-process.js "your keyword"    # Process a specific keyword
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const keywordReader = require('./src/utils/keyword-reader');
const workflowService = require('./src/services/workflow.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const contentOptimizationService = require('./src/services/content-optimization.service');

// Initialize all required services
async function initializeServices() {
  console.log('Initializing services...');
  await workflowService.initialize();
  await markdownGeneratorService.initialize();
  await contentOptimizationService.initialize();
  console.log('Services initialized');
}

/**
 * Process a single keyword with all enhancements
 * @param {string} keyword - Keyword to process
 */
async function processKeyword(keyword) {
  console.log(`\n==== Processing keyword: "${keyword}" ====\n`);
  
  try {
    // Generate enhanced content with competitor analysis and internal linking
    const contentData = await workflowService.generateEnhancedContent(keyword);
    console.log(`Content generated for "${keyword}"`);
    
    // Generate markdown with schema and internal links
    const markdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
    console.log(`Markdown generated: ${markdownResult.markdownPath}`);
    
    // Analyze content for optimization
    console.log(`Analyzing content quality for "${keyword}"...`);
    const markdownContent = await fs.readFile(markdownResult.markdownPath, 'utf8');
    const analysisResult = await contentOptimizationService.analyzeContent(keyword, markdownContent, contentData);
    
    // Print analysis summary
    console.log('\n==== Content Analysis ====');
    console.log(`Readability Score: ${analysisResult.readabilityScore.toFixed(1)} (${analysisResult.readabilityLevel})`);
    console.log(`Word Count: ${analysisResult.textMetrics.wordCount}`);
    console.log(`Keyword Density: ${analysisResult.seoAnalysis.keywordDensity.toFixed(2)}%`);
    
    // Show top suggestions
    const allSuggestions = [
      ...(analysisResult.suggestions.readability || []),
      ...(analysisResult.suggestions.seo || []),
      ...(analysisResult.suggestions.structure || [])
    ];
    
    if (allSuggestions.length > 0) {
      console.log('\nTop Suggestions:');
      allSuggestions.slice(0, 3).forEach(suggestion => {
        console.log(`- ${suggestion}`);
      });
    }
    
    console.log(`\n==== Successfully processed "${keyword}" ====\n`);
    
    return {
      success: true,
      keyword,
      markdownPath: markdownResult.markdownPath,
      readabilityScore: analysisResult.readabilityScore,
      wordCount: analysisResult.textMetrics.wordCount,
      keywordDensity: analysisResult.seoAnalysis.keywordDensity
    };
  } catch (error) {
    console.error(`Error processing "${keyword}":`, error);
    return {
      success: false,
      keyword,
      error: error.message
    };
  }
}

/**
 * Process all keywords from keywords.txt
 */
async function processAllKeywords() {
  try {
    // Read keywords from keywords.txt
    const keywords = await keywordReader.readKeywords('./keywords.txt');
    console.log(`Found ${keywords.length} keywords to process`);
    
    // Track results
    const results = {
      success: [],
      failed: []
    };
    
    // Process each keyword
    for (let i = 0; i < keywords.length; i++) {
      const keyword = keywords[i];
      console.log(`\n[${i+1}/${keywords.length}] Processing "${keyword}"...`);
      
      const result = await processKeyword(keyword);
      
      if (result.success) {
        results.success.push(result);
      } else {
        results.failed.push(result);
      }
    }
    
    // Print summary
    console.log('\n==== Processing Summary ====');
    console.log(`Total keywords: ${keywords.length}`);
    console.log(`Successfully processed: ${results.success.length}`);
    console.log(`Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\nFailed keywords:');
      results.failed.forEach(result => {
        console.log(`- "${result.keyword}": ${result.error}`);
      });
    }
    
    // Save report
    const reportPath = './output/enhanced-process-report.json';
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results
    }, null, 2), 'utf8');
    
    console.log(`\nReport saved to ${reportPath}`);
    
  } catch (error) {
    console.error('Error processing keywords:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('\n==== Enhanced Content Generation Process ====\n');
    
    // Initialize services
    await initializeServices();
    
    // Check if a specific keyword was provided
    const keyword = process.argv[2];
    
    if (keyword) {
      // Process specific keyword
      await processKeyword(keyword);
    } else {
      // Process all keywords
      await processAllKeywords();
    }
    
    console.log('\n==== Enhanced Content Generation Complete ====\n');
  } catch (error) {
    console.error('Error in enhanced process:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 