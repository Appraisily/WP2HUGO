#!/usr/bin/env node

/**
 * Hugo Export Script
 * 
 * This script exports markdown content to Hugo format, including frontmatter
 * with metadata, categories, tags, and other Hugo-specific attributes.
 * 
 * Usage: node export-hugo.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const yaml = require('js-yaml');

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
    // Create output directories if they don't exist
    const contentDir = path.join(process.cwd(), 'hugo', 'content', 'posts');
    await fs.mkdir(contentDir, { recursive: true });
    
    // Load markdown content
    const slug = slugify(keyword);
    const markdownPath = path.join(process.cwd(), 'output', 'markdown', `${slug}.md`);
    
    console.log(`[INFO] Loading markdown content from: ${markdownPath}`);
    const markdownContent = await fs.readFile(markdownPath, 'utf8');
    
    // Extract frontmatter and content
    const { frontmatter, content } = extractFrontmatter(markdownContent);
    
    // Enhance frontmatter for Hugo
    const hugoFrontmatter = enhanceFrontmatterForHugo(frontmatter, keyword);
    
    // Create Hugo content with frontmatter
    const hugoContent = `---
${yaml.dump(hugoFrontmatter)}---

${content}`;
    
    // Save Hugo content
    const hugoPath = path.join(contentDir, `${slug}.md`);
    console.log(`[INFO] Saving Hugo content to: ${hugoPath}`);
    await fs.writeFile(hugoPath, hugoContent);
    
    console.log(`[SUCCESS] Content exported to Hugo successfully for "${keyword}"`);
    return { path: hugoPath };
  } catch (error) {
    console.error(`[ERROR] Failed to export content to Hugo: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Extract frontmatter and content from markdown
 * 
 * @param {string} markdown - The markdown content
 * @returns {object} - The frontmatter and content
 */
function extractFrontmatter(markdown) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (match) {
    const frontmatterYaml = match[1];
    const content = match[2];
    
    try {
      const frontmatter = yaml.load(frontmatterYaml);
      return { frontmatter, content };
    } catch (error) {
      console.error('[WARNING] Failed to parse frontmatter, using empty object');
      return { frontmatter: {}, content: markdown };
    }
  }
  
  return { frontmatter: {}, content: markdown };
}

/**
 * Enhance frontmatter for Hugo
 * 
 * @param {object} frontmatter - The original frontmatter
 * @param {string} keyword - The keyword
 * @returns {object} - The enhanced frontmatter
 */
function enhanceFrontmatterForHugo(frontmatter, keyword) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  // Create Hugo frontmatter
  const hugoFrontmatter = {
    title: frontmatter.title || keyword,
    date: dateStr,
    draft: false,
    description: frontmatter.description || '',
    categories: frontmatter.categories || ['General'],
    tags: frontmatter.tags || [keyword.toLowerCase()],
    author: frontmatter.author || 'Admin',
    ...frontmatter
  };
  
  // Add Hugo-specific fields
  hugoFrontmatter.slug = slugify(keyword);
  hugoFrontmatter.lastmod = dateStr;
  
  // Add featured image if available
  if (frontmatter.image) {
    hugoFrontmatter.images = [frontmatter.image];
  }
  
  return hugoFrontmatter;
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