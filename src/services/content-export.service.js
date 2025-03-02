/**
 * Content Export Service
 * 
 * This service exports generated content to various formats,
 * including Hugo-compatible markdown files.
 * It includes a mock implementation for testing.
 */

const fs = require('fs').promises;
const path = require('path');
const slugify = require('../utils/slugify');

class ContentExportService {
  constructor() {
    this.mockDelay = 500; // Simulate processing delay in ms
  }

  /**
   * Export content to Hugo format
   * @param {string} keyword - The keyword for the content
   * @param {object} content - The optimized content to export
   * @param {object} options - Export options
   * @returns {Promise<object>} - The export result
   */
  async exportToHugo(keyword, content, options = {}) {
    console.log(`[EXPORT] Exporting content for "${keyword}" to Hugo format`);
    
    try {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, this.mockDelay));
      
      const slug = slugify(keyword);
      const hugoDir = path.join(process.cwd(), 'output', 'hugo');
      const contentDir = path.join(hugoDir, 'content');
      const postDir = path.join(contentDir, 'posts');
      
      // Create directories if they don't exist
      await fs.mkdir(hugoDir, { recursive: true });
      await fs.mkdir(contentDir, { recursive: true });
      await fs.mkdir(postDir, { recursive: true });
      
      // Generate Hugo frontmatter
      const frontmatter = this.generateFrontmatter(keyword, content, options);
      
      // Combine frontmatter with content body
      const markdownContent = this.generateMarkdownContent(frontmatter, content);
      
      // Save to file
      const outputPath = path.join(postDir, `${slug}.md`);
      await fs.writeFile(outputPath, markdownContent, 'utf8');
      
      // Copy image if available
      let imageResult = null;
      if (content.imageUrl) {
        imageResult = await this.copyImageForHugo(content.imageUrl, slug, hugoDir);
      }
      
      return {
        success: true,
        keyword,
        slug,
        outputPath,
        imageResult,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[EXPORT] Error exporting content for "${keyword}": ${error.message}`);
      return {
        success: false,
        keyword,
        error: error.message
      };
    }
  }

  /**
   * Generate Hugo frontmatter from content
   * @param {string} keyword - The keyword for the content
   * @param {object} content - The optimized content
   * @param {object} options - Export options
   * @returns {string} - The generated frontmatter
   */
  generateFrontmatter(keyword, content, options) {
    const date = new Date().toISOString();
    const title = content.title || content.seoTitle || keyword;
    const description = content.description || content.metaDescription || '';
    const categories = options.categories || ['Generated Content'];
    const tags = options.tags || [keyword];
    const featured = options.featured || false;
    
    // Add image to frontmatter if available
    const featuredImage = content.imageUrl ? `images/${slugify(keyword)}.jpg` : '';
    
    return `---
title: "${title}"
date: ${date}
description: "${description}"
categories: [${categories.map(c => `"${c}"`).join(', ')}]
tags: [${tags.map(t => `"${t}"`).join(', ')}]
featured: ${featured}
${featuredImage ? `featuredImage: "${featuredImage}"` : ''}
---

`;
  }

  /**
   * Generate markdown content with frontmatter
   * @param {string} frontmatter - The Hugo frontmatter
   * @param {object} content - The optimized content
   * @returns {string} - The complete markdown content
   */
  generateMarkdownContent(frontmatter, content) {
    // Start with frontmatter
    let markdown = frontmatter;
    
    // Add title if not already in the content
    if (!content.body.startsWith('# ')) {
      markdown += `# ${content.title || content.seoTitle}\n\n`;
    }
    
    // Add the main content body
    markdown += content.body;
    
    return markdown;
  }

  /**
   * Copy image for Hugo (mock implementation)
   * @param {string} imageUrl - The URL of the image
   * @param {string} slug - The slug for the content
   * @param {string} hugoDir - The Hugo directory
   * @returns {Promise<object>} - The result of the image copy operation
   */
  async copyImageForHugo(imageUrl, slug, hugoDir) {
    console.log(`[EXPORT] Copying image for "${slug}" to Hugo static directory`);
    
    try {
      // In a real implementation, we would download the image and save it
      // For the mock implementation, we'll just create a record of it
      
      const staticDir = path.join(hugoDir, 'static');
      const imagesDir = path.join(staticDir, 'images');
      
      // Create directories if they don't exist
      await fs.mkdir(staticDir, { recursive: true });
      await fs.mkdir(imagesDir, { recursive: true });
      
      // Create a mock image record file
      const imageRecordPath = path.join(imagesDir, `${slug}-image-record.json`);
      const imageRecord = {
        originalUrl: imageUrl,
        localPath: `images/${slug}.jpg`,
        timestamp: new Date().toISOString()
      };
      
      await fs.writeFile(imageRecordPath, JSON.stringify(imageRecord, null, 2));
      
      return {
        success: true,
        originalUrl: imageUrl,
        localPath: `images/${slug}.jpg`
      };
    } catch (error) {
      console.error(`[EXPORT] Error copying image: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new ContentExportService(); 