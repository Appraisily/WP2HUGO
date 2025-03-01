/**
 * Markdown Generator Service
 * Converts structured data into SEO-optimized markdown content
 */

const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class MarkdownGeneratorService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the markdown generator service
   */
  async initialize() {
    try {
      // Ensure the required output directories exist
      const markdownOutputDir = path.join(config.paths.output, 'markdown');
      await fs.mkdir(markdownOutputDir, { recursive: true });

      this.initialized = true;
      console.log('[MARKDOWN] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[MARKDOWN] Failed to initialize markdown generator service:', error);
      throw error;
    }
  }

  /**
   * Generate markdown content from structured data
   * @param {string} keyword - The keyword 
   * @param {object} data - The structured data from the workflow
   * @returns {object} - The result with markdown content and metadata
   */
  async generateMarkdown(keyword, data) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[MARKDOWN] Generating markdown content for keyword: "${keyword}"`);

    try {
      const slug = slugify(keyword);
      const markdownPath = path.join(config.paths.output, 'markdown', `${slug}.md`);

      // Check if already processed
      if (await localStorage.fileExists(markdownPath)) {
        console.log(`[MARKDOWN] Markdown for "${keyword}" already exists, using cached result`);
        const content = await fs.readFile(markdownPath, 'utf-8');
        return {
          keyword,
          slug,
          markdownPath,
          content,
          timestamp: data.timestamp,
          cached: true
        };
      }

      // Extract data components
      const { structureData, imageData, keywordData, serpData, perplexityData } = data;

      // Validate required data
      if (!structureData) {
        throw new Error('Missing required structure data for markdown generation');
      }

      // Generate the frontmatter
      const frontmatter = this.generateFrontmatter(keyword, data);
      
      // Generate the markdown content
      const content = this.generateContent(keyword, data);

      // Combine frontmatter and content
      const markdownContent = `${frontmatter}\n\n${content}`;

      // Save the markdown file
      await fs.writeFile(markdownPath, markdownContent, 'utf-8');

      console.log(`[MARKDOWN] Successfully generated markdown for "${keyword}"`);
      
      return {
        keyword,
        slug,
        markdownPath,
        content: markdownContent,
        timestamp: new Date().toISOString(),
        cached: false
      };
    } catch (error) {
      console.error(`[MARKDOWN] Error generating markdown for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Generate Hugo frontmatter from structured data
   * @param {string} keyword - The keyword
   * @param {object} data - The structured data
   * @returns {string} - The frontmatter as YAML
   */
  generateFrontmatter(keyword, data) {
    const { structureData, imageData, keywordData } = data;
    const slug = slugify(keyword);
    const date = new Date().toISOString();
    
    // Default values
    const title = structureData.seoTitle || `All About ${keyword}`;
    const description = structureData.metaDescription || `Comprehensive guide about ${keyword}`;
    
    // Extract categories and tags
    let categories = [];
    let tags = [];
    
    // Add the main keyword as a tag
    tags.push(keyword);
    
    // Add related keywords as tags (if available)
    if (data.relatedKeywords && Array.isArray(data.relatedKeywords.keywords)) {
      data.relatedKeywords.keywords.forEach(related => {
        // Only add if it's short enough to be a tag and not the same as the main keyword
        if (related.keyword && related.keyword.length < 50 && related.keyword !== keyword) {
          tags.push(related.keyword);
        }
      });
    }
    
    // Limit to 10 tags to prevent tag spam
    tags = tags.slice(0, 10);
    
    // Format the image URL if available
    const featuredImage = imageData && imageData.imageUrl ? imageData.imageUrl : '';
    
    // Build the frontmatter
    let frontmatter = '---\n';
    frontmatter += `title: "${this.escapeYaml(title)}"\n`;
    frontmatter += `description: "${this.escapeYaml(description)}"\n`;
    frontmatter += `date: ${date}\n`;
    frontmatter += `lastmod: ${date}\n`;
    frontmatter += `slug: "${slug}"\n`;
    
    if (categories.length > 0) {
      frontmatter += 'categories:\n';
      categories.forEach(category => {
        frontmatter += `  - "${this.escapeYaml(category)}"\n`;
      });
    }
    
    if (tags.length > 0) {
      frontmatter += 'tags:\n';
      tags.forEach(tag => {
        frontmatter += `  - "${this.escapeYaml(tag)}"\n`;
      });
    }
    
    if (featuredImage) {
      frontmatter += `image: "${featuredImage}"\n`;
      frontmatter += 'images:\n';
      frontmatter += `  - "${featuredImage}"\n`;
    }
    
    // Add keyword data for SEO
    if (keywordData) {
      frontmatter += 'keywords:\n';
      frontmatter += `  - "${this.escapeYaml(keyword)}"\n`;
      
      // Add top 5 related keywords if available
      if (data.relatedKeywords && Array.isArray(data.relatedKeywords.keywords)) {
        data.relatedKeywords.keywords.slice(0, 5).forEach(related => {
          if (related.keyword && related.keyword !== keyword) {
            frontmatter += `  - "${this.escapeYaml(related.keyword)}"\n`;
          }
        });
      }
    }
    
    // Add draft status (false for production-ready content)
    frontmatter += 'draft: false\n';
    
    // Close the frontmatter
    frontmatter += '---';
    
    return frontmatter;
  }

  /**
   * Generate the markdown content from structured data
   * @param {string} keyword - The keyword
   * @param {object} data - The structured data
   * @returns {string} - The markdown content
   */
  generateContent(keyword, data) {
    const { structureData, perplexityData, imageData } = data;
    let content = '';
    
    // Add the featured image if available
    if (imageData && imageData.imageUrl) {
      content += `![${this.escapeMarkdown(structureData.seoTitle || keyword)}](${imageData.imageUrl})\n\n`;
    }
    
    // Add introduction
    if (structureData.introduction) {
      content += `## Introduction\n\n${structureData.introduction}\n\n`;
    } else {
      // Generate a basic introduction from the meta description
      content += `## Introduction\n\n${structureData.metaDescription || `Welcome to our comprehensive guide about ${keyword}.`}\n\n`;
    }
    
    // Add table of contents if there are sections
    if (structureData.sections && structureData.sections.length > 3) {
      content += '## Table of Contents\n\n';
      structureData.sections.forEach((section, index) => {
        if (section.heading) {
          const sectionSlug = this.createAnchor(section.heading);
          content += `${index + 1}. [${section.heading}](#${sectionSlug})\n`;
        }
      });
      content += '\n';
    }
    
    // Add sections
    if (structureData.sections && Array.isArray(structureData.sections)) {
      structureData.sections.forEach(section => {
        if (section.heading) {
          const sectionSlug = this.createAnchor(section.heading);
          content += `## ${section.heading} {#${sectionSlug}}\n\n`;
          
          if (section.content) {
            content += `${section.content}\n\n`;
          }
          
          // Add subsections if available
          if (section.subsections && Array.isArray(section.subsections)) {
            section.subsections.forEach(subsection => {
              if (subsection.heading) {
                content += `### ${subsection.heading}\n\n`;
                
                if (subsection.content) {
                  content += `${subsection.content}\n\n`;
                }
              }
            });
          }
        }
      });
    }
    
    // Add FAQ section if available in the structure
    if (structureData.faqs && Array.isArray(structureData.faqs) && structureData.faqs.length > 0) {
      content += `## Frequently Asked Questions About ${keyword}\n\n`;
      
      structureData.faqs.forEach(faq => {
        content += `### ${faq.question}\n\n`;
        content += `${faq.answer}\n\n`;
      });
    } else if (perplexityData && perplexityData.text) {
      // Try to extract FAQ-like content from Perplexity data
      const faqs = this.extractFaqsFromPerplexity(perplexityData.text);
      
      if (faqs.length > 0) {
        content += `## Frequently Asked Questions About ${keyword}\n\n`;
        
        faqs.forEach(faq => {
          content += `### ${faq.question}\n\n`;
          content += `${faq.answer}\n\n`;
        });
      }
    }
    
    // Add conclusion
    if (structureData.conclusion) {
      content += `## Conclusion\n\n${structureData.conclusion}\n\n`;
    } else {
      // Generate a basic conclusion
      content += `## Conclusion\n\n`;
      content += `We hope this guide about ${keyword} has been helpful. Whether you're just getting started or looking to deepen your understanding, the information provided here should give you a solid foundation.\n\n`;
    }
    
    // Add references if available
    if (data.serpData && Array.isArray(data.serpData.organic)) {
      content += '## References\n\n';
      
      data.serpData.organic.slice(0, 5).forEach((result, index) => {
        if (result.title && result.link) {
          content += `${index + 1}. [${this.escapeMarkdown(result.title)}](${result.link})\n`;
        }
      });
      
      content += '\n';
    }
    
    return content;
  }

  /**
   * Extract FAQ-like content from Perplexity data
   * @param {string} text - The Perplexity response text
   * @returns {Array} - Array of FAQ objects with question and answer
   */
  extractFaqsFromPerplexity(text) {
    const faqs = [];
    
    // Look for patterns that might indicate FAQs in the text
    const questionMatches = text.match(/(?:^|\n)(?:Q:|Question:|FAQs?:)?\s*(.+\?)/gm);
    
    if (questionMatches && questionMatches.length > 0) {
      questionMatches.slice(0, 5).forEach(match => {
        // Clean up the question
        const question = match.replace(/(?:^|\n)(?:Q:|Question:|FAQs?:)?\s*/, '').trim();
        
        // Get the text after the question until the next question or section
        const startIndex = text.indexOf(match) + match.length;
        const nextQuestion = text.indexOf('?', startIndex + 1);
        const nextSection = text.indexOf('\n##', startIndex);
        
        let endIndex;
        if (nextQuestion > 0 && (nextSection < 0 || nextQuestion < nextSection)) {
          endIndex = text.indexOf('?', nextQuestion + 1);
          if (endIndex > 0) endIndex += 1;
        } else if (nextSection > 0) {
          endIndex = nextSection;
        } else {
          endIndex = text.length;
        }
        
        if (endIndex > startIndex) {
          let answer = text.substring(startIndex, endIndex).trim();
          
          // Clean up the answer
          answer = answer.replace(/^[:\s-]+/, '').trim();
          
          if (answer && answer.length > 10) {
            faqs.push({ question, answer });
          }
        }
      });
    }
    
    return faqs;
  }

  /**
   * Create an HTML anchor from a heading
   * @param {string} heading - The heading text
   * @returns {string} - The anchor slug
   */
  createAnchor(heading) {
    return heading
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  /**
   * Escape special characters for YAML strings
   * @param {string} str - The string to escape
   * @returns {string} - The escaped string
   */
  escapeYaml(str) {
    if (!str) return '';
    
    // Escape quotes and backslashes
    return str.replace(/["\\]/g, '\\$&');
  }

  /**
   * Escape special characters for Markdown
   * @param {string} str - The string to escape
   * @returns {string} - The escaped string
   */
  escapeMarkdown(str) {
    if (!str) return '';
    
    // Escape Markdown special characters
    return str.replace(/([[\](){}*_~`>#+=|.!-])/g, '\\$1');
  }
}

module.exports = new MarkdownGeneratorService(); 