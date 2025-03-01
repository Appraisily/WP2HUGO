/**
 * Content Planning and Scheduling Script
 * 
 * This script helps create a content plan, schedule content for generation,
 * and export in bulk with advanced options.
 * 
 * Usage: node create-content-plan.js [options]
 * Options:
 *   --from-file=filename.txt   Import keywords from a file (one per line)
 *   --template=type            Specify a content template type
 *   --schedule                 Enable scheduling mode
 *   --export-path=path         Export path for Hugo content
 *   --bulk                     Process all keywords in batch mode
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const workflowService = require('./src/services/workflow.service');
const contentTemplateService = require('./src/services/content-template.service');
const contentOptimizationService = require('./src/services/content-optimization.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

// Parse command line arguments
const args = process.argv.slice(2);
const options = parseCommandLineArgs(args);

/**
 * Main function
 */
async function main() {
  try {
    // Initialize services
    await workflowService.initialize();
    await contentTemplateService.initialize();
    await contentOptimizationService.initialize();
    
    console.log(`
==================================================================
                     WP2HUGO Content Planner
==================================================================
    `);
    
    // Load keywords if specified in options
    let keywords = [];
    if (options.fromFile) {
      keywords = await loadKeywordsFromFile(options.fromFile);
      console.log(`Loaded ${keywords.length} keywords from ${options.fromFile}`);
    }
    
    // Interactive mode if no keywords were loaded or bulk mode not specified
    if (keywords.length === 0 && !options.bulk) {
      await interactiveMode(options);
    } else {
      // Bulk processing mode
      await bulkProcessingMode(keywords, options);
    }
    
    console.log(`
==================================================================
              Content Planning Completed Successfully
==================================================================
    `);
  } catch (error) {
    console.error('Error in content planning:', error);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 * @param {Array} args - Command line arguments
 * @returns {object} - Parsed options
 */
function parseCommandLineArgs(args) {
  const options = {
    fromFile: null,
    template: 'default',
    schedule: false,
    exportPath: null,
    bulk: false
  };
  
  for (const arg of args) {
    if (arg.startsWith('--from-file=')) {
      options.fromFile = arg.substring('--from-file='.length);
    } else if (arg.startsWith('--template=')) {
      options.template = arg.substring('--template='.length);
    } else if (arg === '--schedule') {
      options.schedule = true;
    } else if (arg.startsWith('--export-path=')) {
      options.exportPath = arg.substring('--export-path='.length);
    } else if (arg === '--bulk') {
      options.bulk = true;
    }
  }
  
  return options;
}

/**
 * Load keywords from a file
 * @param {string} filePath - Path to the file
 * @returns {Array} - Array of keywords
 */
async function loadKeywordsFromFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const lines = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    
    return lines;
  } catch (error) {
    console.error(`Error loading keywords from ${filePath}:`, error);
    return [];
  }
}

/**
 * Interactive content planning mode
 * @param {object} options - Command line options
 */
async function interactiveMode(options) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Helper function for prompting
  const prompt = (question) => new Promise(resolve => rl.question(question, resolve));
  
  try {
    console.log('\n=== Interactive Content Planning Mode ===\n');
    
    // Get the template type
    let templateType = options.template;
    if (!templateType) {
      // List available templates
      const templates = await contentTemplateService.getTemplateList();
      console.log('\nAvailable Templates:');
      templates.forEach(template => {
        console.log(`- ${template.type}: ${template.name} - ${template.description}`);
      });
      
      // Prompt for template selection
      templateType = await prompt('\nSelect a template type (default): ') || 'default';
    }
    
    // Load the selected template
    const template = await contentTemplateService.getTemplate(templateType);
    console.log(`\nSelected template: ${template.name} - ${template.description}`);
    
    // Get keyword
    const keyword = await prompt('\nEnter the keyword to plan content for: ');
    if (!keyword) {
      console.log('No keyword provided. Exiting interactive mode.');
      rl.close();
      return;
    }
    
    // Get publishing date (for scheduling)
    let publishDate = new Date();
    if (options.schedule) {
      const dateInput = await prompt('\nEnter publishing date (YYYY-MM-DD), or leave blank for today: ');
      if (dateInput) {
        publishDate = new Date(dateInput);
        if (isNaN(publishDate.getTime())) {
          console.log('Invalid date format. Using current date.');
          publishDate = new Date();
        }
      }
    }
    
    // Create content plan
    console.log('\nCreating content plan...');
    
    // Get any existing content data
    const slug = slugify(keyword);
    const contentFilePath = path.join(config.paths.content, `${slug}-content.json`);
    let contentExists = false;
    let contentData = null;
    
    try {
      await fs.access(contentFilePath);
      contentExists = true;
      const content = await fs.readFile(contentFilePath, 'utf-8');
      contentData = JSON.parse(content);
      console.log(`Content data for "${keyword}" already exists.`);
    } catch (error) {
      // Content doesn't exist yet
      console.log(`No existing content for "${keyword}". Will process from scratch.`);
    }
    
    // Process the keyword if needed
    if (!contentExists || await prompt('\nRegenerate content? (y/n): ') === 'y') {
      console.log(`\nProcessing keyword: "${keyword}"`);
      contentData = await workflowService.processKeyword(keyword);
      console.log('Content processed successfully.');
    }
    
    // Create or update markdown with template
    console.log('\nGenerating markdown with template...');
    
    // Add template info to contentData
    contentData.template = {
      type: templateType,
      name: template.name,
      description: template.description
    };
    
    // Add scheduling info if enabled
    if (options.schedule) {
      contentData.scheduling = {
        plannedPublishDate: publishDate.toISOString(),
        status: 'scheduled'
      };
    }
    
    // Generate markdown
    const markdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
    console.log(`Markdown generated: ${markdownResult.markdownPath}`);
    
    // Analyze content for optimization
    console.log('\nAnalyzing content for optimization...');
    const markdownContent = await fs.readFile(markdownResult.markdownPath, 'utf-8');
    const analysisResult = await contentOptimizationService.analyzeContent(keyword, markdownContent, contentData);
    
    // Display analysis results
    console.log('\n=== Content Analysis Results ===');
    console.log(`Readability Score: ${analysisResult.readabilityScore.toFixed(1)} (${analysisResult.readabilityLevel})`);
    console.log(`Word Count: ${analysisResult.textMetrics.wordCount}`);
    console.log(`Keyword Density: ${analysisResult.seoAnalysis.keywordDensity.toFixed(2)}%`);
    
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
    
    // Save analysis results
    const analysisPath = path.join(config.paths.output, 'analysis', `${slug}-analysis.json`);
    await fs.mkdir(path.dirname(analysisPath), { recursive: true });
    await fs.writeFile(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
    console.log(`\nAnalysis saved to: ${analysisPath}`);
    
    // Export to Hugo if path is specified
    if (options.exportPath) {
      console.log('\nExporting to Hugo...');
      
      try {
        // Create the export directory if it doesn't exist
        await fs.mkdir(options.exportPath, { recursive: true });
        
        // Export the markdown file
        const hugoPath = path.join(options.exportPath, `${slug}.md`);
        await fs.copyFile(markdownResult.markdownPath, hugoPath);
        
        console.log(`Exported to: ${hugoPath}`);
      } catch (error) {
        console.error('Error exporting to Hugo:', error);
      }
    }
    
    console.log('\nContent planning completed successfully!');
    
    rl.close();
  } catch (error) {
    console.error('Error in interactive mode:', error);
    rl.close();
  }
}

/**
 * Bulk processing mode
 * @param {Array} keywords - Array of keywords to process
 * @param {object} options - Command line options
 */
async function bulkProcessingMode(keywords, options) {
  console.log('\n=== Bulk Content Processing Mode ===\n');
  
  // If no keywords were provided but bulk mode is enabled, get all unprocessed keywords
  if (keywords.length === 0) {
    console.log('No keywords provided. Loading from keywords.txt...');
    keywords = await loadKeywordsFromFile('keywords.txt');
    
    if (keywords.length === 0) {
      console.log('No keywords found in keywords.txt. Exiting bulk mode.');
      return;
    }
  }
  
  console.log(`Processing ${keywords.length} keywords in bulk mode...`);
  
  // Load the template
  const template = await contentTemplateService.getTemplate(options.template);
  console.log(`Using template: ${template.name} - ${template.description}`);
  
  // Process each keyword
  const results = {
    successful: [],
    failed: []
  };
  
  // Create analysis directory
  const analysisDir = path.join(config.paths.output, 'analysis');
  await fs.mkdir(analysisDir, { recursive: true });
  
  // Create scheduling info file
  const schedulePath = path.join(config.paths.output, 'content-schedule.json');
  let schedule = {};
  
  try {
    // Check if schedule file exists
    try {
      const existingSchedule = await fs.readFile(schedulePath, 'utf-8');
      schedule = JSON.parse(existingSchedule);
    } catch (error) {
      // File doesn't exist or is invalid, initialize empty schedule
      schedule = {
        lastUpdated: new Date().toISOString(),
        scheduledContent: []
      };
    }
  } catch (error) {
    console.error('Error loading schedule file:', error);
    schedule = {
      lastUpdated: new Date().toISOString(),
      scheduledContent: []
    };
  }
  
  // Process keywords with scheduling if enabled
  let publishDate = new Date();
  const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds
  
  for (let i = 0; i < keywords.length; i++) {
    const keyword = keywords[i];
    console.log(`\n[${i + 1}/${keywords.length}] Processing "${keyword}"...`);
    
    try {
      // Process the keyword
      const contentData = await workflowService.processKeyword(keyword);
      
      // Add template info
      contentData.template = {
        type: options.template,
        name: template.name,
        description: template.description
      };
      
      // Add scheduling info if enabled
      if (options.schedule) {
        // Schedule this content item
        const scheduleItem = {
          keyword,
          slug: slugify(keyword),
          publishDate: publishDate.toISOString(),
          status: 'scheduled'
        };
        
        contentData.scheduling = {
          plannedPublishDate: publishDate.toISOString(),
          status: 'scheduled'
        };
        
        // Add to schedule
        schedule.scheduledContent.push(scheduleItem);
        schedule.lastUpdated = new Date().toISOString();
        
        // Move to next date (e.g., publish one per day)
        publishDate = new Date(publishDate.getTime() + oneDay);
      }
      
      // Generate markdown
      const markdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
      
      // Analyze content
      const markdownContent = await fs.readFile(markdownResult.markdownPath, 'utf-8');
      const analysisResult = await contentOptimizationService.analyzeContent(keyword, markdownContent, contentData);
      
      // Save analysis
      const slug = slugify(keyword);
      const analysisPath = path.join(analysisDir, `${slug}-analysis.json`);
      await fs.writeFile(analysisPath, JSON.stringify(analysisResult, null, 2), 'utf-8');
      
      // Export to Hugo if path is specified
      if (options.exportPath) {
        try {
          await fs.mkdir(options.exportPath, { recursive: true });
          const hugoPath = path.join(options.exportPath, `${slug}.md`);
          await fs.copyFile(markdownResult.markdownPath, hugoPath);
        } catch (exportError) {
          console.error(`Error exporting "${keyword}" to Hugo:`, exportError);
        }
      }
      
      // Record success
      results.successful.push({
        keyword,
        slug,
        readabilityScore: analysisResult.readabilityScore,
        readabilityLevel: analysisResult.readabilityLevel,
        wordCount: analysisResult.textMetrics.wordCount
      });
      
      console.log(`Processed "${keyword}" successfully.`);
    } catch (error) {
      console.error(`Error processing "${keyword}":`, error);
      results.failed.push({
        keyword,
        error: error.message
      });
    }
  }
  
  // Save the updated schedule
  if (options.schedule) {
    await fs.writeFile(schedulePath, JSON.stringify(schedule, null, 2), 'utf-8');
    console.log(`Updated content schedule saved to ${schedulePath}`);
  }
  
  // Display summary
  console.log('\n=== Bulk Processing Summary ===');
  console.log(`Total keywords: ${keywords.length}`);
  console.log(`Successfully processed: ${results.successful.length}`);
  console.log(`Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log('\nFailed keywords:');
    results.failed.forEach(item => {
      console.log(`- "${item.keyword}": ${item.error}`);
    });
  }
  
  // Save results report
  const reportPath = path.join(config.paths.output, 'bulk-processing-report.json');
  await fs.writeFile(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    options,
    results
  }, null, 2), 'utf-8');
  
  console.log(`\nDetailed report saved to: ${reportPath}`);
}

// Run the script
main(); 