/**
 * Schema Markup Service
 * 
 * This service generates JSON-LD schema markup for Hugo markdown files
 * to enhance SEO and improve rich snippet opportunities.
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class SchemaMarkupService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      this.initialized = true;
      console.log('[SCHEMA] Schema markup service initialized');
      return true;
    } catch (error) {
      console.error('[SCHEMA] Failed to initialize schema markup service:', error);
      throw error;
    }
  }

  /**
   * Generate schema markup for a content piece
   * @param {string} keyword - The target keyword
   * @param {object} contentData - The processed content data
   * @param {string} contentType - The type of content (article, howto, faq, etc.)
   * @returns {object} - The generated schema markup
   */
  async generateSchemaMarkup(keyword, contentData, contentType = 'article') {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[SCHEMA] Generating schema markup for "${keyword}" (${contentType})`);
    
    try {
      // Base schema that all content types will have
      const baseSchema = {
        "@context": "https://schema.org",
        "@type": this.mapContentTypeToSchemaType(contentType),
        "headline": contentData.title || `${keyword} Guide`,
        "description": contentData.description || contentData.summary || `Comprehensive guide about ${keyword}`,
        "datePublished": new Date().toISOString(),
        "dateModified": new Date().toISOString()
      };
      
      // Add author information if available
      if (contentData.author) {
        baseSchema.author = {
          "@type": "Person",
          "name": contentData.author
        };
      }
      
      // Add image if available
      if (contentData.image && contentData.image.url) {
        baseSchema.image = contentData.image.url;
      }
      
      // Generate specific schema based on content type
      let specificSchema = {};
      switch (contentType.toLowerCase()) {
        case 'article':
        case 'blogposting':
          specificSchema = this.generateArticleSchema(contentData);
          break;
        case 'howto':
          specificSchema = this.generateHowToSchema(contentData);
          break;
        case 'faq':
          specificSchema = this.generateFAQSchema(contentData);
          break;
        case 'product':
          specificSchema = this.generateProductSchema(contentData);
          break;
        case 'review':
          specificSchema = this.generateReviewSchema(contentData);
          break;
        default:
          specificSchema = this.generateArticleSchema(contentData);
      }
      
      // Merge schemas
      const schema = { ...baseSchema, ...specificSchema };
      
      return schema;
    } catch (error) {
      console.error(`[SCHEMA] Error generating schema for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Generate Article schema
   * @param {object} contentData - The content data
   * @returns {object} - Article specific schema properties
   */
  generateArticleSchema(contentData) {
    const schema = {};
    
    // Add word count if available
    if (contentData.wordCount) {
      schema.wordCount = contentData.wordCount;
    }
    
    // Add keywords if available
    if (contentData.keywords && contentData.keywords.length > 0) {
      schema.keywords = contentData.keywords.join(', ');
    }
    
    return schema;
  }

  /**
   * Generate HowTo schema
   * @param {object} contentData - The content data
   * @returns {object} - HowTo specific schema properties
   */
  generateHowToSchema(contentData) {
    const schema = {};
    
    // Extract steps from content structure
    if (contentData.structure && contentData.structure.sections) {
      const howToSections = contentData.structure.sections.filter(
        section => section.type === 'step' || section.title.toLowerCase().includes('step')
      );
      
      if (howToSections.length > 0) {
        schema.step = howToSections.map((section, index) => ({
          "@type": "HowToStep",
          "position": index + 1,
          "name": section.title,
          "text": section.content || section.description || section.title
        }));
      }
    }
    
    // Total time if available
    if (contentData.totalTime) {
      schema.totalTime = contentData.totalTime;
    }
    
    return schema;
  }

  /**
   * Generate FAQ schema
   * @param {object} contentData - The content data
   * @returns {object} - FAQ specific schema properties
   */
  generateFAQSchema(contentData) {
    const schema = {
      "@type": "FAQPage"
    };
    
    // Extract FAQs from content
    if (contentData.faqs && contentData.faqs.length > 0) {
      schema.mainEntity = contentData.faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }));
    } else if (contentData.structure && contentData.structure.sections) {
      // Try to find FAQ sections in the structure
      const faqSections = contentData.structure.sections.filter(
        section => section.type === 'faq' || section.title.toLowerCase().includes('faq') || section.title.toLowerCase().includes('question')
      );
      
      if (faqSections.length > 0 && faqSections[0].items) {
        schema.mainEntity = faqSections[0].items.map(item => ({
          "@type": "Question",
          "name": item.question || item.title,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.answer || item.content
          }
        }));
      }
    }
    
    return schema;
  }

  /**
   * Generate Product schema
   * @param {object} contentData - The content data
   * @returns {object} - Product specific schema properties
   */
  generateProductSchema(contentData) {
    const schema = {};
    
    // Add product-specific properties
    if (contentData.product) {
      if (contentData.product.price) {
        schema.offers = {
          "@type": "Offer",
          "price": contentData.product.price,
          "priceCurrency": contentData.product.currency || "USD",
          "availability": "https://schema.org/InStock"
        };
      }
      
      if (contentData.product.rating) {
        schema.aggregateRating = {
          "@type": "AggregateRating",
          "ratingValue": contentData.product.rating,
          "ratingCount": contentData.product.ratingCount || 1
        };
      }
      
      if (contentData.product.brand) {
        schema.brand = {
          "@type": "Brand",
          "name": contentData.product.brand
        };
      }
    }
    
    return schema;
  }

  /**
   * Generate Review schema
   * @param {object} contentData - The content data
   * @returns {object} - Review specific schema properties
   */
  generateReviewSchema(contentData) {
    const schema = {
      "@type": "Review"
    };
    
    // Add item reviewed
    if (contentData.review && contentData.review.itemName) {
      schema.itemReviewed = {
        "@type": contentData.review.itemType || "Product",
        "name": contentData.review.itemName
      };
    }
    
    // Add review rating
    if (contentData.review && contentData.review.rating) {
      schema.reviewRating = {
        "@type": "Rating",
        "ratingValue": contentData.review.rating,
        "bestRating": contentData.review.bestRating || 5
      };
    }
    
    return schema;
  }

  /**
   * Map content type to schema type
   * @param {string} contentType - The content type string
   * @returns {string} - The corresponding schema type
   */
  mapContentTypeToSchemaType(contentType) {
    const typeMap = {
      'article': 'Article',
      'blog': 'BlogPosting',
      'blogposting': 'BlogPosting',
      'news': 'NewsArticle',
      'howto': 'HowTo',
      'tutorial': 'HowTo',
      'faq': 'FAQPage',
      'product': 'Product',
      'review': 'Review',
      'listicle': 'Article'
    };
    
    return typeMap[contentType.toLowerCase()] || 'Article';
  }

  /**
   * Format schema markup as JSON-LD for inclusion in HTML
   * @param {object} schema - The schema object
   * @returns {string} - Formatted JSON-LD string
   */
  formatSchemaAsJsonLd(schema) {
    return `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`;
  }

  /**
   * Format schema markup for Hugo frontmatter
   * @param {object} schema - The schema object
   * @returns {string} - Formatted YAML for Hugo frontmatter
   */
  formatSchemaForHugoFrontmatter(schema) {
    // Convert schema to YAML-compatible format for Hugo's frontmatter
    return JSON.stringify(schema);
  }
}

module.exports = new SchemaMarkupService(); 