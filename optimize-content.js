/**
 * Content Optimization Script
 * 
 * This script analyzes and optimizes existing markdown content
 * for SEO, readability, and other quality metrics.
 * 
 * Usage: 
 *   node optimize-content.js                   # Interactive mode
 *   node optimize-content.js "keyword"         # Optimize specific keyword
 *   node optimize-content.js --all             # Optimize all content
 *   node optimize-content.js --min-score=70    # Set minimum score threshold
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const contentOptimizationService = require('./src/services/content-optimization.service');
const workflowService = require('./src/services/workflow.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

// Parse arguments
const args = process.argv.slice(2);
let options = {
  keyword: null,
  all: false,
  minScore: 60,
  interactive: true
};

// Process arguments
if (args.length > 0) {
  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
      options.interactive = false;
    } else if (arg.startsWith('--min-score=')) {
      options.minScore = parseInt(arg.substring('--min-score='.length), 10);
    } else if (!arg.startsWith('--')) {
      options.keyword = arg;
      options.interactive = false;
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Initialize services
    await contentOptimizationService.initialize();
    
    console.log(`
=====================================================================
                      Content Optimization Tool
=====================================================================
    `);
    
    if (options.interactive) {
      await interactiveMode();
    } else if (options.keyword) {
      await optimizeKeyword(options.keyword);
    } else if (options.all) {
      await optimizeAllContent();
    }
    
    console.log(`
=====================================================================
                   Optimization Process Complete
=====================================================================
    `);
  } catch (error) {
    console.error('Error in content optimization:', error);
    process.exit(1);
  }
}

/**
 * Interactive mode for content optimization
 */
async function interactiveMode() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Helper function for prompting
  const prompt = (question) => new Promise(resolve => rl.question(question, resolve));
  
  try {
    console.log('=== Interactive Content Optimization ===\n');
    
    // List available content
    const markdownDir = config.paths.markdown;
    const markdownFiles = await listMarkdownFiles(markdownDir);
    
    if (markdownFiles.length === 0) {
      console.log('No markdown files found. Generate content first using process-keywords.js or generate-markdown.js');
      rl.close();
      return;
    }
    
    console.log('Available content:\n');
    markdownFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file.replace('.md', '')}`);
    });
    
    // Prompt for selection
    const selection = await prompt('\nEnter the number of the content to optimize (or "all" for all content): ');
    
    if (selection.toLowerCase() === 'all') {
      rl.close();
      await optimizeAllContent();
      return;
    }
    
    const index = parseInt(selection, 10) - 1;
    if (isNaN(index) || index < 0 || index >= markdownFiles.length) {
      console.log('Invalid selection. Exiting.');
      rl.close();
      return;
    }
    
    const selectedFile = markdownFiles[index];
    const keyword = selectedFile.replace('.md', '');
    
    rl.close();
    await optimizeKeyword(keyword);
  } catch (error) {
    console.error('Error in interactive mode:', error);
    rl.close();
  }
}

/**
 * Optimize a single keyword's content
 * @param {string} keyword - The keyword to optimize
 */
async function optimizeKeyword(keyword) {
  console.log(`\nOptimizing content for keyword: "${keyword}"`);
  
  try {
    const slug = slugify(keyword);
    const markdownPath = path.join(config.paths.markdown, `${slug}.md`);
    
    // Check if markdown file exists
    try {
      await fs.access(markdownPath);
    } catch (error) {
      console.error(`Markdown file for "${keyword}" not found. Generate content first.`);
      return;
    }
    
    // Load content data if available
    const contentPath = path.join(config.paths.content, `${slug}-content.json`);
    let contentData = null;
    
    try {
      const contentFile = await fs.readFile(contentPath, 'utf-8');
      contentData = JSON.parse(contentFile);
    } catch (error) {
      console.log(`No content data found for "${keyword}". Will analyze markdown only.`);
    }
    
    // Read the markdown content
    const markdownContent = await fs.readFile(markdownPath, 'utf-8');
    
    // Analyze content
    console.log(`Analyzing content for "${keyword}"...`);
    const analysisResult = await contentOptimizationService.analyzeContent(keyword, markdownContent, contentData);
    
    // Create output directory
    const analysisDir = path.join(config.paths.output, 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });
    
    // Save analysis results
    const analysisPath = path.join(analysisDir, `${slug}-analysis.json`);
    await fs.writeFile(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
    
    // Display analysis results
    console.log('\n=== Content Analysis Results ===');
    console.log(`Readability Score: ${analysisResult.readabilityScore.toFixed(1)} (${analysisResult.readabilityLevel})`);
    console.log(`Word Count: ${analysisResult.textMetrics.wordCount}`);
    console.log(`Keyword Density: ${analysisResult.seoAnalysis.keywordDensity.toFixed(2)}%`);
    
    // Display suggestions
    console.log('\n=== Improvement Suggestions ===');
    
    if (analysisResult.suggestions.readability.length > 0) {
      console.log('\nReadability:');
      analysisResult.suggestions.readability.forEach(suggestion => {
        console.log(`- ${suggestion}`);
      });
    }
    
    if (analysisResult.suggestions.seo.length > 0) {
      console.log('\nSEO:');
      analysisResult.suggestions.seo.forEach(suggestion => {
        console.log(`- ${suggestion}`);
      });
    }
    
    if (analysisResult.suggestions.structure.length > 0) {
      console.log('\nStructure:');
      analysisResult.suggestions.structure.forEach(suggestion => {
        console.log(`- ${suggestion}`);
      });
    }
    
    if (analysisResult.suggestions.engagement && analysisResult.suggestions.engagement.length > 0) {
      console.log('\nEngagement:');
      analysisResult.suggestions.engagement.forEach(suggestion => {
        console.log(`- ${suggestion}`);
      });
    }
    
    console.log(`\nAnalysis saved to: ${analysisPath}`);
    
    // Check if content needs optimization
    const needsOptimization = analysisResult.readabilityScore < options.minScore;
    
    if (needsOptimization && contentData) {
      console.log(`\nContent score (${analysisResult.readabilityScore.toFixed(1)}) is below threshold (${options.minScore}). Regenerating with optimization hints...`);
      
      // Add optimization hints to contentData
      contentData.optimizationHints = {
        readabilityScore: analysisResult.readabilityScore,
        readabilityLevel: analysisResult.readabilityLevel,
        suggestions: analysisResult.suggestions
      };
      
      // Regenerate markdown
      await markdownGeneratorService.initialize();
      const newMarkdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
      
      console.log(`\nOptimized content saved to: ${newMarkdownResult.markdownPath}`);
      
      // Analyze again to check improvement
      const newMarkdownContent = await fs.readFile(newMarkdownResult.markdownPath, 'utf-8');
      const newAnalysisResult = await contentOptimizationService.analyzeContent(keyword, newMarkdownContent, contentData);
      
      console.log('\n=== Optimization Results ===');
      console.log(`Previous Readability Score: ${analysisResult.readabilityScore.toFixed(1)} (${analysisResult.readabilityLevel})`);
      console.log(`New Readability Score: ${newAnalysisResult.readabilityScore.toFixed(1)} (${newAnalysisResult.readabilityLevel})`);
      
      // Save new analysis
      const newAnalysisPath = path.join(analysisDir, `${slug}-optimized-analysis.json`);
      await fs.writeFile(newAnalysisPath, JSON.stringify(newAnalysisResult, null, 2), 'utf-8');
    } else if (needsOptimization) {
      console.log(`\nContent score (${analysisResult.readabilityScore.toFixed(1)}) is below threshold (${options.minScore}), but content data is not available for regeneration.`);
      console.log('Consider manually implementing the improvement suggestions.');
    } else {
      console.log(`\nContent score (${analysisResult.readabilityScore.toFixed(1)}) is above threshold (${options.minScore}). No optimization needed.`);
    }
    
    console.log(`\nOptimization process for "${keyword}" completed.`);
    
  } catch (error) {
    console.error(`Error optimizing content for "${keyword}":`, error);
  }
}

/**
 * Optimize all available content
 */
async function optimizeAllContent() {
  console.log('\n=== Bulk Content Optimization ===');
  
  try {
    // List all markdown files
    const markdownDir = config.paths.markdown;
    const markdownFiles = await listMarkdownFiles(markdownDir);
    
    if (markdownFiles.length === 0) {
      console.log('No markdown files found. Generate content first using process-keywords.js or generate-markdown.js');
      return;
    }
    
    console.log(`Found ${markdownFiles.length} markdown files to analyze.\n`);
    
    // Create analysis directory
    const analysisDir = path.join(config.paths.output, 'analysis');
    await fs.mkdir(analysisDir, { recursive: true });
    
    // Track results
    const results = {
      total: markdownFiles.length,
      analyzed: 0,
      optimized: 0,
      failed: 0,
      scores: {
        before: [],
        after: []
      }
    };
    
    // Process each file
    for (let i = 0; i < markdownFiles.length; i++) {
      const file = markdownFiles[i];
      const keyword = file.replace('.md', '');
      
      console.log(`\n[${i + 1}/${markdownFiles.length}] Analyzing "${keyword}"...`);
      
      try {
        // Get path to markdown file
        const markdownPath = path.join(markdownDir, file);
        
        // Load content data if available
        const contentPath = path.join(config.paths.content, `${keyword}-content.json`);
        let contentData = null;
        
        try {
          const contentFile = await fs.readFile(contentPath, 'utf-8');
          contentData = JSON.parse(contentFile);
        } catch (error) {
          // Content data not available, continue with just markdown
        }
        
        // Read markdown content
        const markdownContent = await fs.readFile(markdownPath, 'utf-8');
        
        // Analyze content
        const analysisResult = await contentOptimizationService.analyzeContent(keyword, markdownContent, contentData);
        
        // Save analysis
        const analysisPath = path.join(analysisDir, `${keyword}-analysis.json`);
        await fs.writeFile(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
        
        // Track score
        results.scores.before.push(analysisResult.readabilityScore);
        
        // Increment analyzed count
        results.analyzed++;
        
        // Check if optimization is needed
        const needsOptimization = analysisResult.readabilityScore < options.minScore;
        
        if (needsOptimization && contentData) {
          console.log(`Content score (${analysisResult.readabilityScore.toFixed(1)}) is below threshold (${options.minScore}). Optimizing...`);
          
          // Add optimization hints
          contentData.optimizationHints = {
            readabilityScore: analysisResult.readabilityScore,
            readabilityLevel: analysisResult.readabilityLevel,
            suggestions: analysisResult.suggestions
          };
          
          // Regenerate markdown
          await markdownGeneratorService.initialize();
          const newMarkdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
          
          // Analyze the optimized content
          const newMarkdownContent = await fs.readFile(newMarkdownResult.markdownPath, 'utf-8');
          const newAnalysisResult = await contentOptimizationService.analyzeContent(keyword, newMarkdownContent, contentData);
          
          // Save new analysis
          const newAnalysisPath = path.join(analysisDir, `${keyword}-optimized-analysis.json`);
          await fs.writeFile(newAnalysisPath, JSON.stringify(newAnalysisResult, null, 2), 'utf-8');
          
          // Track improvement
          results.scores.after.push(newAnalysisResult.readabilityScore);
          results.optimized++;
          
          console.log(`Optimized: ${analysisResult.readabilityScore.toFixed(1)} → ${newAnalysisResult.readabilityScore.toFixed(1)}`);
        } else if (needsOptimization) {
          console.log(`Content score (${analysisResult.readabilityScore.toFixed(1)}) is below threshold but content data not available.`);
          results.scores.after.push(analysisResult.readabilityScore);
        } else {
          console.log(`Content score (${analysisResult.readabilityScore.toFixed(1)}) is above threshold. No optimization needed.`);
          results.scores.after.push(analysisResult.readabilityScore);
        }
      } catch (error) {
        console.error(`Error processing "${keyword}":`, error);
        results.failed++;
      }
    }
    
    // Calculate average scores
    const avgBefore = results.scores.before.reduce((sum, score) => sum + score, 0) / (results.scores.before.length || 1);
    const avgAfter = results.scores.after.reduce((sum, score) => sum + score, 0) / (results.scores.after.length || 1);
    
    // Save optimization report
    const reportPath = path.join(config.paths.output, 'optimization-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      options,
      results: {
        ...results,
        averageScoreBefore: avgBefore,
        averageScoreAfter: avgAfter,
        improvement: avgAfter - avgBefore
      }
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
    
    // Display summary
    console.log('\n=== Optimization Summary ===');
    console.log(`Total content processed: ${results.total}`);
    console.log(`Successfully analyzed: ${results.analyzed}`);
    console.log(`Content optimized: ${results.optimized}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Average score before: ${avgBefore.toFixed(1)}`);
    console.log(`Average score after: ${avgAfter.toFixed(1)}`);
    console.log(`Overall improvement: ${(avgAfter - avgBefore).toFixed(1)} points`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('Error in bulk optimization:', error);
  }
}

/**
 * List all markdown files in a directory
 * @param {string} directory - The directory to scan
 * @returns {Array} - Array of markdown filenames
 */
async function listMarkdownFiles(directory) {
  try {
    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });
    
    // List files
    const files = await fs.readdir(directory);
    
    // Filter for markdown files
    return files.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Error listing markdown files:', error);
    return [];
  }
}

// Run the script
main(); 