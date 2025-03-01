/**
 * Full Process Test
 * 
 * This script tests the entire workflow from keyword research to markdown generation.
 * It uses a test keyword and runs through all the steps of the process.
 * 
 * Usage: node full-process-test.js "your keyword"
 */

require('dotenv').config();
const workflowService = require('./src/services/workflow.service');
const markdownGeneratorService = require('./src/services/markdown-generator.service');
const fs = require('fs').promises;
const path = require('path');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

// Main function
async function main() {
  try {
    // Get keyword from command line or use default
    const keyword = process.argv[2] || 'what is value art';
    
    console.log(`
===================================================================
                   WP2HUGO Full Process Test                   
===================================================================
Testing the entire workflow with keyword: "${keyword}"
===================================================================
`);
    
    // Initialize services
    await workflowService.initialize();
    
    // Process the keyword
    console.log('\nSTEP 1: Processing keyword...');
    const result = await workflowService.processKeyword(keyword);
    
    // Check result components
    console.log('\nProcessing complete. Checking results:');
    
    // Check for keyword data
    if (result.keywordData) {
      console.log('✓ Keyword data: Success');
    } else {
      console.log('✗ Keyword data: Missing');
    }
    
    // Check for SERP data
    if (result.serpData) {
      console.log('✓ SERP data: Success');
    } else {
      console.log('✗ SERP data: Missing');
    }
    
    // Check for related keywords
    if (result.relatedKeywords) {
      console.log('✓ Related keywords: Success');
    } else {
      console.log('✗ Related keywords: Missing');
    }
    
    // Check for Perplexity data
    if (result.perplexityData) {
      console.log('✓ Perplexity data: Success');
    } else {
      console.log('✗ Perplexity data: Missing');
    }
    
    // Check for structure data
    if (result.structureData) {
      console.log('✓ Structure data: Success');
    } else {
      console.log('✗ Structure data: Missing');
    }
    
    // Check for image data
    if (result.imageData) {
      console.log('✓ Image data: Success');
      console.log(`  Image URL: ${result.imageData.imageUrl}`);
    } else {
      console.log('✗ Image data: Missing');
    }
    
    // Check for markdown data
    if (result.markdownData) {
      console.log('✓ Markdown data: Success');
      console.log(`  Markdown file: ${result.markdownData.markdownPath}`);
    } else {
      console.log('✗ Markdown data: Missing');
    }
    
    // Display the markdown preview
    if (result.markdownData && result.markdownData.markdownPath) {
      console.log('\nSTEP 2: Markdown Preview...');
      
      try {
        const markdownContent = await fs.readFile(result.markdownData.markdownPath, 'utf-8');
        
        // Display the first 15 lines
        const lines = markdownContent.split('\n');
        const previewLines = lines.slice(0, 15);
        
        console.log('\n----- MARKDOWN PREVIEW (first 15 lines) -----\n');
        console.log(previewLines.join('\n'));
        console.log('\n----- END PREVIEW -----\n');
        
        // Count headings, images, links for SEO assessment
        const headingCount = (markdownContent.match(/(?:^|\n)#{1,6}\s+/g) || []).length;
        const imageCount = (markdownContent.match(/!\[.*?\]\(.*?\)/g) || []).length;
        const linkCount = (markdownContent.match(/(?<!!)\[.*?\]\(.*?\)/g) || []).length;
        const keywordOccurrences = (markdownContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
        
        console.log('STEP 3: SEO Assessment...\n');
        console.log('SEO Metrics:');
        console.log(`- Total headings: ${headingCount}`);
        console.log(`- Featured images: ${imageCount}`);
        console.log(`- External links: ${linkCount}`);
        console.log(`- Keyword occurrences: ${keywordOccurrences}`);
        
        // Simple SEO score (very basic)
        let seoScore = 0;
        
        if (headingCount >= 5) seoScore += 20;
        else if (headingCount >= 3) seoScore += 10;
        
        if (imageCount >= 1) seoScore += 20;
        
        if (linkCount >= 3) seoScore += 20;
        else if (linkCount >= 1) seoScore += 10;
        
        if (keywordOccurrences >= 5) seoScore += 20;
        else if (keywordOccurrences >= 3) seoScore += 10;
        
        // Add 20 points if the keyword is in the title
        if (markdownContent.toLowerCase().includes(`title: "${keyword.toLowerCase()}"`)) {
          seoScore += 20;
        }
        
        console.log(`\nEstimated SEO Score: ${seoScore}/100`);
        
        if (seoScore >= 80) {
          console.log('SEO Rating: Excellent ⭐⭐⭐⭐⭐');
        } else if (seoScore >= 60) {
          console.log('SEO Rating: Good ⭐⭐⭐⭐');
        } else if (seoScore >= 40) {
          console.log('SEO Rating: Average ⭐⭐⭐');
        } else {
          console.log('SEO Rating: Needs Improvement ⭐⭐');
        }
      } catch (error) {
        console.error('Error reading markdown file:', error);
      }
    }
    
    console.log(`
===================================================================
                   Test Completed Successfully                   
===================================================================
    `);
    
  } catch (error) {
    console.error('Error in full process test:', error);
    process.exit(1);
  }
}

// Run the test
main(); 