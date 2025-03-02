/**
 * Markdown Generator Service
 * Converts structured data into SEO-optimized markdown content
 */

const path = require('path');
const fs = require('fs').promises;
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');
const internalLinkingService = require('./internal-linking.service');
const schemaMarkupService = require('./schema-markup.service');

class MarkdownGeneratorService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the markdown generator service
   */
  async initialize() {
    try {
      // Create output directories if they don't exist
      await fs.mkdir(path.join(config.paths.output, 'markdown'), { recursive: true });
      
      console.log('[MARKDOWN] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[MARKDOWN] Failed to initialize markdown generator service:', error);
      throw error;
    }
  }

  /**
   * Generate markdown content from processed data
   * @param {string} keyword - The keyword for the content
   * @param {object} contentData - The processed content data
   * @returns {string} - The generated markdown content
   */
  async generateMarkdown(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[MARKDOWN] Generating markdown for: "${keyword}"`);
    
    try {
      // Use optimized content if available, fallback to enhanced, then to original structure
      const optimizedContent = contentData.optimizedContent?.optimizedContent || 
                              contentData.optimizedContent || 
                              contentData.enhancedContent?.enhancedContent || 
                              contentData.enhancedContent || 
                              contentData.structure || 
                              {};
      
      // Get title and description
      const title = optimizedContent.title || contentData.title || `${keyword} - Comprehensive Guide`;
      const description = optimizedContent.meta_description || contentData.description || `Learn everything about ${keyword} in this comprehensive guide.`;
      
      // Start building markdown
      let markdown = `---
title: "${title}"
description: "${description}"
date: "${new Date(contentData.date).toISOString().split('T')[0]}"
lastmod: "${new Date(contentData.lastUpdated).toISOString().split('T')[0]}"
draft: false
seo_score: ${contentData.seoScore || contentData.seoAssessment?.overallScore || 0}
`;
      
      // Add tags if available
      if (optimizedContent.tags || contentData.tags) {
        const tags = optimizedContent.tags || contentData.tags || [];
        markdown += `tags: [${tags.map(t => `"${t}"`).join(', ')}]\n`;
      }
      
      // Add categories if available
      if (optimizedContent.categories || contentData.categories) {
        const categories = optimizedContent.categories || contentData.categories || [];
        markdown += `categories: [${categories.map(c => `"${c}"`).join(', ')}]\n`;
      }
      
      // Add featured image if available
      if (contentData.image && contentData.image.url) {
        markdown += `featured_image: "${contentData.image.url}"\n`;
        markdown += `image: "${contentData.image.url}"\n`;
      }
      
      // Add schema markup if available
      if (contentData.schema) {
        markdown += `schema: ${JSON.stringify(contentData.schema)}\n`;
      }
      
      // End frontmatter
      markdown += `---\n\n`;
      
      // Add table of contents if requested
      if (optimizedContent.table_of_contents !== false) {
        markdown += `{{< tableofcontents >}}\n\n`;
      }
      
      // Add introduction
      if (optimizedContent.introduction) {
        markdown += `${optimizedContent.introduction}\n\n`;
      }
      
      // Add sections
      const sections = optimizedContent.sections || [];
      
      for (const section of sections) {
        // Add section heading
        markdown += `## ${section.heading || section.title}\n\n`;
        
        // Add section content
        if (section.content) {
          markdown += `${section.content}\n\n`;
        }
        
        // Add subsections if available
        if (section.subsections && section.subsections.length > 0) {
          for (const subsection of section.subsections) {
            // Add subsection heading
            markdown += `### ${subsection.heading || subsection.title}\n\n`;
            
            // Add subsection content
            if (subsection.content) {
              markdown += `${subsection.content}\n\n`;
            }
          }
        }
      }
      
      // Add FAQ section if available
      const faqs = optimizedContent.faqs || [];
      
      if (faqs.length > 0) {
        markdown += `## Frequently Asked Questions About ${keyword}\n\n`;
        
        for (const faq of faqs) {
          markdown += `### ${faq.question}\n\n`;
          markdown += `${faq.answer}\n\n`;
        }
      }
      
      // Add conclusion if available
      if (optimizedContent.conclusion) {
        markdown += `## Conclusion\n\n`;
        markdown += `${optimizedContent.conclusion}\n\n`;
      }
      
      // Add SEO-boosting elements
      
      // Add call-to-action if available
      if (optimizedContent.ctaSuggestion) {
        markdown += `## Next Steps\n\n`;
        markdown += `${optimizedContent.ctaSuggestion}\n\n`;
      }
      
      // Add internal linking suggestions if available
      if (contentData.internalLinkingSuggestions && contentData.internalLinkingSuggestions.length > 0) {
        markdown += `## Related Resources\n\n`;
        markdown += `You might also be interested in:\n\n`;
        
        for (const link of contentData.internalLinkingSuggestions) {
          markdown += `- [${link.text || link.title || link.url}](${link.url})\n`;
        }
        
        markdown += `\n`;
      }
      
      // Add author bio if available
      if (optimizedContent.authorBio) {
        markdown += `---\n\n`;
        markdown += `${optimizedContent.authorBio}\n\n`;
      }
      
      // Add schema markup for FAQ if available
      if (faqs.length > 0 && !contentData.schema) {
        const faqSchema = {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          }))
        };
        
        markdown += `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>\n\n`;
      }
      
      return markdown;
    } catch (error) {
      console.error(`[MARKDOWN] Error generating markdown for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Save markdown content to file
   * @param {string} keyword - The keyword for the content
   * @param {string} markdown - The markdown content
   * @returns {string} - The path to the saved file
   */
  async saveMarkdown(keyword, markdown) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[MARKDOWN] Saving markdown for: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.output, 'markdown', `${slug}.md`);
      
      await fs.writeFile(filePath, markdown, 'utf8');
      
      console.log(`[MARKDOWN] Saved markdown to: ${filePath}`);
      
      return filePath;
    } catch (error) {
      console.error(`[MARKDOWN] Error saving markdown for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Generate and save markdown for processed content
   * @param {string} keyword - The keyword for the content
   * @param {object} contentData - The processed content data
   * @returns {string} - The path to the saved file
   */
  async generateAndSave(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[MARKDOWN] Generating and saving markdown for: "${keyword}"`);
    
    try {
      const markdown = await this.generateMarkdown(keyword, contentData);
      return await this.saveMarkdown(keyword, markdown);
    } catch (error) {
      console.error(`[MARKDOWN] Error generating and saving markdown for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Generate enhanced markdown with additional SEO elements
   * @param {string} keyword - The keyword for the content
   * @param {object} contentData - The processed content data
   * @returns {string} - The path to the saved file
   */
  async generateEnhancedMarkdown(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[MARKDOWN] Generating enhanced markdown for: "${keyword}"`);
    
    try {
      // Get standard markdown
      let markdown = await this.generateMarkdown(keyword, contentData);
      
      // Add reading time estimate
      const wordCount = this.countWords(markdown);
      const readingTime = Math.ceil(wordCount / 200); // Average reading speed of 200 words per minute
      
      // Add reading time to frontmatter
      markdown = markdown.replace('---\n', `---\nreading_time: ${readingTime} min\nword_count: ${wordCount}\n`);
      
      // Add table of contents if not already added
      if (!markdown.includes('{{< tableofcontents >}}')) {
        markdown = markdown.replace('---\n\n', '---\n\n{{< tableofcontents >}}\n\n');
      }
      
      // Add structured data for Google if not already present
      if (!markdown.includes('<script type="application/ld+json">') && !markdown.includes('schema:')) {
        const articleSchema = {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": contentData.title,
          "description": contentData.description,
          "image": contentData.image?.url || "",
          "datePublished": contentData.date,
          "dateModified": contentData.lastUpdated,
          "author": {
            "@type": "Person",
            "name": contentData.author || "Content Team"
          }
        };
        
        markdown += `\n\n<script type="application/ld+json">\n${JSON.stringify(articleSchema, null, 2)}\n</script>\n`;
      }
      
      // Add breadcrumbs navigation at the top
      const breadcrumbSection = `<nav class="breadcrumbs">
  <a href="/">Home</a> &raquo; 
  <a href="/blog/">Blog</a> &raquo; 
  <span>${contentData.title}</span>
</nav>\n\n`;
      
      markdown = markdown.replace('{{< tableofcontents >}}\n\n', `{{< tableofcontents >}}\n\n${breadcrumbSection}`);
      
      // Add social sharing buttons
      const socialShareSection = `\n\n<div class="social-share">
  <h4>Share this article:</h4>
  <a href="https://twitter.com/intent/tweet?url={{ .Permalink }}&text=${encodeURIComponent(contentData.title)}" target="_blank">Twitter</a>
  <a href="https://www.facebook.com/sharer/sharer.php?u={{ .Permalink }}" target="_blank">Facebook</a>
  <a href="https://www.linkedin.com/shareArticle?mini=true&url={{ .Permalink }}&title=${encodeURIComponent(contentData.title)}" target="_blank">LinkedIn</a>
</div>\n`;
      
      markdown += socialShareSection;
      
      // Save enhanced markdown
      return await this.saveMarkdown(keyword, markdown);
    } catch (error) {
      console.error(`[MARKDOWN] Error generating enhanced markdown for "${keyword}":`, error);
      throw error;
    }
  }
  
  /**
   * Count words in a string
   * @param {string} text - The text to count words in
   * @returns {number} - The word count
   */
  countWords(text) {
    // Remove markdown formatting
    const cleanText = text
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`[^`]*`/g, '') // Remove inline code
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // Replace links with just their text
      .replace(/[#*_~]/g, '') // Remove formatting characters
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .trim();
    
    // Count words
    return cleanText.split(/\s+/).filter(Boolean).length;
  }
}

module.exports = new MarkdownGeneratorService(); 