#!/usr/bin/env node

/**
 * Markdown Generation Script
 * 
 * This script generates markdown content from optimized content data.
 * It combines all the data into a formatted markdown file ready for publishing.
 * 
 * Usage: node generate-markdown.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const imageGenerationService = require('./src/services/image-generation.service');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Markdown Generation Script

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
 * Main function to generate markdown
 */
async function generateMarkdown(keyword, forceApi = false) {
  console.log(`[INFO] Generating markdown for: "${keyword}"`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      imageGenerationService.setForceApi(true);
    }
    
    // Create output directories if they don't exist
    const outputDir = path.join(process.cwd(), 'output');
    const researchDir = path.join(outputDir, 'research');
    const markdownDir = path.join(outputDir, 'markdown');
    
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(researchDir, { recursive: true });
    await fs.mkdir(markdownDir, { recursive: true });
    
    // Load optimized content
    const slug = slugify(keyword);
    const optimizedPath = path.join(researchDir, `${slug}-anthropic-seo-optimized.json`);
    
    console.log(`[INFO] Loading optimized content from: ${optimizedPath}`);
    const optimizedContent = JSON.parse(await fs.readFile(optimizedPath, 'utf8'));
    
    // Load image data if available
    const imagePath = path.join(outputDir, 'images', `${slug}-image.json`);
    let imageData = null;
    
    try {
      const imageFileExists = await fs.access(imagePath).then(() => true).catch(() => false);
      if (imageFileExists) {
        console.log(`[INFO] Loading image data from: ${imagePath}`);
        imageData = JSON.parse(await fs.readFile(imagePath, 'utf8'));
      }
    } catch (error) {
      console.warn(`[WARNING] Error loading image data: ${error.message}`);
    }
    
    // Generate markdown content
    const markdown = await generateMarkdownContent(keyword, optimizedContent, imageData);
    
    // Save to file
    const markdownPath = path.join(markdownDir, `${slug}.md`);
    console.log(`[INFO] Saving markdown to: ${markdownPath}`);
    await fs.writeFile(markdownPath, markdown, 'utf8');
    
    console.log(`[SUCCESS] Markdown generated successfully for "${keyword}"`);
    return markdownPath;
  } catch (error) {
    console.error(`[ERROR] Failed to generate markdown: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate markdown content from data
 */
async function generateMarkdownContent(keyword, content, imageData) {
  console.log(`[INFO] Formatting markdown content for "${keyword}"`);
  
  // Generate frontmatter
  const frontmatter = generateFrontmatter(keyword, content, imageData);
  
  // Handle either direct body property or content array
  let body = '';
  
  if (content.body) {
    // Direct body property
    body = content.body;
  } else if (content.content && Array.isArray(content.content)) {
    // Content array structure
    body = processContentArray(content.content);
  } else {
    // Fallback content
    body = `# ${content.title || content.seoTitle || `Complete Guide to ${keyword}`}\n\n`;
    body += `This is a comprehensive guide about ${keyword}. More content will be added soon.`;
  }
  
  // If body doesn't start with a title, add one
  if (!body.startsWith('# ')) {
    body = `# ${content.title || content.seoTitle || keyword}\n\n${body}`;
  }
  
  // Combine frontmatter and body
  return `${frontmatter}\n${body}`;
}

/**
 * Process content array into markdown
 */
function processContentArray(contentArray) {
  let markdown = '';
  
  for (const item of contentArray) {
    switch (item.type) {
      case 'introduction':
        markdown += `${item.text}\n\n`;
        break;
        
      case 'section':
        // Add section heading
        const headingLevel = '#'.repeat(item.level || 2);
        markdown += `${headingLevel} ${item.heading}\n\n`;
        
        // Add paragraphs
        if (item.paragraphs && Array.isArray(item.paragraphs)) {
          for (const paragraph of item.paragraphs) {
            markdown += `${paragraph}\n\n`;
          }
        }
        
        // Add FAQs if present
        if (item.faq && Array.isArray(item.faq)) {
          for (const faqItem of item.faq) {
            markdown += `**${faqItem.question}**\n\n${faqItem.answer}\n\n`;
          }
        }
        break;
        
      case 'conclusion':
        markdown += `## Conclusion\n\n${item.text}\n\n`;
        break;
        
      default:
        // For any other type, just add the text if available
        if (item.text) {
          markdown += `${item.text}\n\n`;
        }
    }
  }
  
  return markdown;
}

/**
 * Generate frontmatter
 */
function generateFrontmatter(keyword, content, imageData) {
  const date = new Date().toISOString();
  const title = content.title || content.seoTitle || keyword;
  const description = content.description || content.metaDescription || '';
  const imageUrl = imageData?.imageUrl || '';
  
  // Extract tags from content
  let tags = [keyword];
  if (content.tags && Array.isArray(content.tags)) {
    tags = [...new Set([...tags, ...content.tags])];
  }
  
  // Format frontmatter
  return `---
title: "${title}"
date: ${date}
description: "${description}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
image: "${imageUrl}"
---`;
}

// Run the main function if this script is executed directly
if (require.main === module) {
  generateMarkdown(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateMarkdown }; 