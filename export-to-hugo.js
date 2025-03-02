#!/usr/bin/env node

/**
 * Hugo Export Script
 * 
 * This script exports optimized content to Hugo-compatible format.
 * 
 * Usage: node export-to-hugo.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const contentExportService = require('./src/services/content-export.service');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Hugo Export Script

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
 * Main function to export content to Hugo
 */
async function exportToHugo(keyword, forceApi = false) {
  console.log(`[INFO] Exporting content to Hugo for: "${keyword}"`);
  
  try {
    // Load markdown content
    const slug = slugify(keyword);
    const markdownPath = path.join(process.cwd(), 'output', 'markdown', `${slug}.md`);
    
    console.log(`[INFO] Loading markdown content from: ${markdownPath}`);
    const markdownContent = await fs.readFile(markdownPath, 'utf8');
    
    // Extract content and frontmatter from markdown
    const { frontmatter, content } = extractContent(markdownContent);
    
    // Load image data if available
    const imagePath = path.join(process.cwd(), 'output', 'images', `${slug}-image.json`);
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
    
    // Prepare content data for Hugo export
    const contentData = {
      body: content,
      title: frontmatter.title,
      description: frontmatter.description,
      imageUrl: imageData?.imageUrl || frontmatter.image,
      tags: frontmatter.tags || [keyword],
      seoTitle: frontmatter.title
    };
    
    // Export options
    const options = {
      categories: ['Generated Content'],
      tags: frontmatter.tags || [keyword],
      featured: false
    };
    
    // Export to Hugo using the service
    const result = await contentExportService.exportToHugo(keyword, contentData, options);
    
    if (result.success) {
      console.log(`[SUCCESS] Content exported to Hugo successfully for "${keyword}"`);
      console.log(`[INFO] Output file: ${result.outputPath}`);
      return result;
    } else {
      throw new Error(result.error || 'Unknown error during export');
    }
  } catch (error) {
    console.error(`[ERROR] Failed to export content to Hugo: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract frontmatter and content from markdown
 */
function extractContent(markdown) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (match) {
    const frontmatterYaml = match[1];
    const content = match[2].trim();
    
    // Parse frontmatter
    const frontmatter = {};
    const lines = frontmatterYaml.split('\n');
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex !== -1) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        
        // Parse arrays
        if (value.startsWith('[') && value.endsWith(']')) {
          const arrayStr = value.substring(1, value.length - 1);
          frontmatter[key] = arrayStr.split(',').map(item => {
            const trimmed = item.trim();
            return trimmed.startsWith('"') && trimmed.endsWith('"') 
              ? trimmed.substring(1, trimmed.length - 1)
              : trimmed;
          });
        } else {
          frontmatter[key] = value;
        }
      }
    }
    
    return { frontmatter, content };
  }
  
  return { frontmatter: {}, content: markdown };
}

// Run the main function if this script is executed directly
if (require.main === module) {
  exportToHugo(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { exportToHugo }; 