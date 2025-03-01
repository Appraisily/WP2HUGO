/**
 * Generate Markdown Content Script
 * 
 * This script generates SEO-optimized markdown content for keywords.
 * It can process a single keyword or all keywords from content files.
 * 
 * Usage:
 * - To process all keywords:  node generate-markdown.js
 * - For a specific keyword:   node generate-markdown.js "your keyword"
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const workflowService = require('./src/services/workflow.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const localStorage = require('./src/utils/local-storage');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

/**
 * Main entry point - process arguments and start generation
 */
async function main() {
  try {
    // Initialize services
    await workflowService.initialize();
    await markdownGeneratorService.initialize();
    
    // Check if we have a specific keyword
    const keyword = process.argv[2];
    
    if (keyword) {
      // Process a single keyword
      await generateMarkdownForKeyword(keyword);
    } else {
      // Process all keywords with existing content files
      await generateMarkdownForAllKeywords();
    }
    
    console.log('Markdown generation completed successfully!');
  } catch (error) {
    console.error('Error generating markdown:', error);
    process.exit(1);
  }
}

/**
 * Generate markdown for a specific keyword
 * @param {string} keyword - The keyword to process
 */
async function generateMarkdownForKeyword(keyword) {
  console.log(`Generating markdown for keyword: "${keyword}"`);
  
  try {
    const slug = slugify(keyword);
    const contentFilePath = path.join(config.paths.content, `${slug}-content.json`);
    
    // Check if the content file exists
    if (await fileExists(contentFilePath)) {
      // Load the existing content data
      const contentData = await loadJsonFile(contentFilePath);
      
      // Generate the markdown
      await markdownGeneratorService.generateMarkdown(keyword, contentData);
      console.log(`Markdown successfully generated for "${keyword}"`);
    } else {
      // Content doesn't exist, need to process the keyword first
      console.log(`Content data for "${keyword}" not found. Processing keyword...`);
      const result = await workflowService.processKeyword(keyword);
      console.log(`Keyword "${keyword}" processed and markdown generated`);
    }
  } catch (error) {
    console.error(`Error generating markdown for "${keyword}":`, error);
    throw error;
  }
}

/**
 * Generate markdown for all keywords that have content files
 */
async function generateMarkdownForAllKeywords() {
  try {
    console.log('Generating markdown for all processed keywords...');
    
    // Get all content files
    const contentFiles = await fs.readdir(config.paths.content);
    const contentJsonFiles = contentFiles.filter(file => file.endsWith('-content.json'));
    
    if (contentJsonFiles.length === 0) {
      console.log('No content files found. Process keywords first using process-keywords.js');
      return;
    }
    
    console.log(`Found ${contentJsonFiles.length} content files to process`);
    
    // Process each content file
    for (const contentFile of contentJsonFiles) {
      try {
        // Extract the keyword from the filename
        const slug = contentFile.replace('-content.json', '');
        const contentFilePath = path.join(config.paths.content, contentFile);
        
        // Load the content data
        const contentData = await loadJsonFile(contentFilePath);
        const keyword = contentData.keyword;
        
        if (!keyword) {
          console.warn(`Warning: Keyword not found in content file: ${contentFile}`);
          continue;
        }
        
        // Generate the markdown
        console.log(`Generating markdown for "${keyword}"`);
        await markdownGeneratorService.generateMarkdown(keyword, contentData);
        console.log(`Markdown successfully generated for "${keyword}"`);
      } catch (error) {
        console.error(`Error processing content file ${contentFile}:`, error);
        // Continue with other files
      }
    }
    
    console.log(`Processed ${contentJsonFiles.length} keywords`);
  } catch (error) {
    console.error('Error generating markdown for all keywords:', error);
    throw error;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} - True if the file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Load and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Promise<object>} - The parsed JSON data
 */
async function loadJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading JSON file ${filePath}:`, error);
    throw error;
  }
}

// Run the script
main(); 