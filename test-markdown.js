/**
 * Test Markdown Generation
 * 
 * This script tests the markdown generation service with a specified keyword.
 * 
 * Usage: node test-markdown.js "your keyword"
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const workflowService = require('./src/services/workflow.service');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

/**
 * Main function
 */
async function main() {
  try {
    // Get the keyword from command line arguments
    const keyword = process.argv[2] || 'what is value art';
    
    if (!keyword) {
      console.error('Error: Please provide a keyword as a command line argument');
      console.error('Usage: node test-markdown.js "your keyword"');
      process.exit(1);
    }
    
    console.log(`Testing markdown generation for keyword: "${keyword}"`);
    
    const slug = slugify(keyword);
    const contentFilePath = path.join(config.paths.content, `${slug}-content.json`);
    
    // Initialize services
    await markdownGeneratorService.initialize();
    
    // Check if content data exists
    let contentData;
    try {
      const fileContent = await fs.readFile(contentFilePath, 'utf-8');
      contentData = JSON.parse(fileContent);
      console.log(`Found existing content data for "${keyword}"`);
    } catch (error) {
      console.log(`No existing content data found for "${keyword}". Processing keyword...`);
      await workflowService.initialize();
      contentData = await workflowService.processKeyword(keyword);
      console.log(`Keyword "${keyword}" processed successfully`);
    }
    
    // Generate markdown
    console.log('Generating markdown...');
    const markdownResult = await markdownGeneratorService.generateMarkdown(keyword, contentData);
    
    console.log(`\nMarkdown generated successfully!`);
    console.log(`Markdown file saved to: ${markdownResult.markdownPath}`);
    
    // Preview the content
    console.log('\n===== MARKDOWN PREVIEW =====\n');
    
    // Get the markdown content
    let markdownContent;
    try {
      markdownContent = await fs.readFile(markdownResult.markdownPath, 'utf-8');
      
      // Print the first 25 lines
      const lines = markdownContent.split('\n');
      const previewLines = lines.slice(0, 25);
      console.log(previewLines.join('\n'));
      
      if (lines.length > 25) {
        console.log('\n... (truncated) ...\n');
      }
    } catch (error) {
      console.error('Error reading markdown file:', error);
    }
    
    console.log('\n===== END PREVIEW =====\n');
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Error testing markdown generation:', error);
    process.exit(1);
  }
}

// Run the test
main(); 