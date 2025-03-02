const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

/**
 * Service for identifying and optimizing entities in content
 * to improve knowledge graph integration and semantic search relevance
 */
class EntityOptimizationService {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    this.entityTypes = [
      'Person', 'Organization', 'Place', 'LocalBusiness', 'Product', 
      'Event', 'CreativeWork', 'BrandOrProduct', 'MedicalEntity'
    ];
    this.wikiDataEndpoint = 'https://www.wikidata.org/w/api.php';
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[ENTITY-OPTIMIZATION] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[ENTITY-OPTIMIZATION] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[ENTITY-OPTIMIZATION] Failed to initialize Entity Optimization service:', error);
      throw error;
    }
  }

  /**
   * Identifies potential entities in the content and enriches them with structured data
   * @param {string} keyword - The target keyword
   * @param {object} contentData - The content data with sections, title, etc.
   * @returns {object} - Enhanced content with entity annotations and structured data
   */
  async optimizeEntities(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[ENTITY-OPTIMIZATION] Optimizing entities for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-entity-optimized.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[ENTITY-OPTIMIZATION] Using cached entity optimization for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Extract content text from contentData
      const contentText = this.extractContentText(contentData);
      
      // Identify potential entities
      const entities = await this.identifyEntities(contentText, keyword);
      
      // Enrich entities with structured data from knowledge graphs
      const enrichedEntities = await this.enrichEntities(entities);
      
      // Generate entity markup suggestions
      const entityMarkup = this.generateEntityMarkup(enrichedEntities);
      
      // Enhance content with entity annotations
      const enhancedContent = this.enhanceContentWithEntities(contentData, enrichedEntities);
      
      // Add entity schema markup recommendations
      enhancedContent.entitySchemaMarkup = entityMarkup;
      
      // Cache the results
      await localStorage.saveFile(cachePath, enhancedContent);
      
      return enhancedContent;
    } catch (error) {
      console.error(`[ENTITY-OPTIMIZATION] Error optimizing entities for "${keyword}":`, error);
      // Return original content if there's an error
      return contentData;
    }
  }

  /**
   * Extract all text content from the content data structure
   */
  extractContentText(contentData) {
    let text = contentData.title || '';
    
    // Add description
    if (contentData.description) {
      text += ' ' + contentData.description;
    }
    
    // Add section content
    if (contentData.sections && Array.isArray(contentData.sections)) {
      contentData.sections.forEach(section => {
        if (section.title) text += ' ' + section.title;
        if (section.content) text += ' ' + section.content;
      });
    }
    
    // Add FAQs content
    if (contentData.faqs && Array.isArray(contentData.faqs)) {
      contentData.faqs.forEach(faq => {
        if (faq.question) text += ' ' + faq.question;
        if (faq.answer) text += ' ' + faq.answer;
      });
    }
    
    return text;
  }

  /**
   * Identify potential entities in the text using NLP techniques
   * For production, this would use a proper NER model or API
   */
  async identifyEntities(text, keyword) {
    // In a real implementation, this would use a named entity recognition model
    // For now, we'll use a simplified approach for demonstration
    
    // 1. Identify potential capitalized multi-word phrases (simple NER approximation)
    const capitalizedPhrasePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
    const potentialNamedEntities = [...new Set(text.match(capitalizedPhrasePattern) || [])];
    
    // 2. Identify common entity patterns (like dates, locations, etc.)
    // This is simplified - a real implementation would use proper NER
    const patterns = [
      { type: 'Product', pattern: /\b(\w+(?:\s+\w+){0,3}(?:Product|Tool|Device|Software|App|Application))\b/gi },
      { type: 'Organization', pattern: /\b(\w+(?:\s+\w+){0,2}(?:Inc|LLC|Ltd|Company|Organization|Corporation))\b/gi },
      { type: 'Person', pattern: /\b(Dr\.|Mr\.|Mrs\.|Ms\.|Prof\.)(\s+\w+){1,2}\b/g },
    ];
    
    const patternMatches = [];
    patterns.forEach(pattern => {
      const matches = [...new Set(text.match(pattern.pattern) || [])];
      matches.forEach(match => {
        patternMatches.push({
          text: match,
          type: pattern.type,
          confidence: 0.7 // Placeholder confidence score
        });
      });
    });
    
    // 3. Add the keyword itself as an entity (with appropriate type guessing)
    // Check if keyword looks like a product
    let keywordEntityType = 'Thing';
    if (/product|tool|software|app|guide|book/i.test(keyword)) {
      keywordEntityType = 'Product';
    } else if (/how to|ways to|guide to/i.test(keyword)) {
      keywordEntityType = 'HowTo';
    } else if (/review/i.test(keyword)) {
      keywordEntityType = 'Review';
    }
    
    const allEntities = [
      ...potentialNamedEntities.map(entity => ({
        text: entity,
        type: 'Thing', // Default type until enriched
        confidence: 0.6,
        source: 'pattern_match'
      })),
      ...patternMatches,
      {
        text: keyword,
        type: keywordEntityType,
        confidence: 0.9,
        source: 'keyword'
      }
    ];
    
    // Remove duplicates
    const uniqueEntities = [];
    const seen = new Set();
    
    allEntities.forEach(entity => {
      const key = `${entity.text.toLowerCase()}-${entity.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEntities.push(entity);
      }
    });
    
    return uniqueEntities;
  }

  /**
   * Enrich identified entities with structured data from knowledge bases
   */
  async enrichEntities(entities) {
    // For each entity, try to find more information from knowledge graphs
    const enrichedEntities = [];
    
    for (const entity of entities) {
      try {
        // First try to match with Wikidata (simplified version)
        const wikidataEntity = await this.queryWikidata(entity.text);
        
        if (wikidataEntity) {
          enrichedEntities.push({
            ...entity,
            wikidataId: wikidataEntity.id,
            description: wikidataEntity.description || '',
            properties: wikidataEntity.properties || {},
            type: wikidataEntity.type || entity.type,
            source: 'wikidata',
            enriched: true
          });
          continue;
        }
        
        // If no Wikidata match, try to determine the most likely type
        const guessedType = await this.guessEntityType(entity.text);
        
        enrichedEntities.push({
          ...entity,
          type: guessedType || entity.type,
          enriched: false
        });
      } catch (error) {
        console.error(`[ENTITY-OPTIMIZATION] Error enriching entity "${entity.text}":`, error);
        // Add the original entity if enrichment fails
        enrichedEntities.push({
          ...entity,
          enriched: false
        });
      }
    }
    
    return enrichedEntities;
  }

  /**
   * Query Wikidata for entity information (simplified version)
   * In a real implementation, this would use the Wikidata API
   */
  async queryWikidata(entityText) {
    try {
      // This is a mockup of what would be a real API call
      // For production, you would implement a proper Wikidata query

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Mock result for common entities to demonstrate functionality
      const mockEntities = {
        'Google': {
          id: 'Q95',
          type: 'Organization',
          description: 'American multinational technology company',
          properties: {
            founded: '1998-09-04',
            founder: ['Larry Page', 'Sergey Brin'],
            headquarters: 'Mountain View, California'
          }
        },
        'Artificial Intelligence': {
          id: 'Q11660',
          type: 'FieldOfStudy',
          description: 'Intelligence demonstrated by machines',
          properties: {
            subfields: ['Machine Learning', 'Computer Vision', 'Natural Language Processing']
          }
        }
      };
      
      return mockEntities[entityText] || null;
    } catch (error) {
      console.error(`[ENTITY-OPTIMIZATION] Error querying Wikidata for "${entityText}":`, error);
      return null;
    }
  }

  /**
   * Guess the most likely entity type for an entity
   * In a real implementation, this would use more sophisticated NLP
   */
  async guessEntityType(entityText) {
    // Simplified type guessing logic
    const entityLower = entityText.toLowerCase();
    
    if (/\b(inc|llc|ltd|company|corporation|group)\b/i.test(entityLower)) {
      return 'Organization';
    } else if (/\b(product|tool|app|software|program|platform)\b/i.test(entityLower)) {
      return 'Product';
    } else if (/\b(mr\.|dr\.|mrs\.|ms\.|prof\.)\b/i.test(entityLower)) {
      return 'Person';
    } else if (/\b(city|country|state|mountain|river|ocean|sea|lake)\b/i.test(entityLower)) {
      return 'Place';
    } else if (/\b(restaurant|hotel|store|shop|mall)\b/i.test(entityLower)) {
      return 'LocalBusiness';
    } else if (/\b(event|conference|concert|festival|ceremony)\b/i.test(entityLower)) {
      return 'Event';
    } else if (/\b(book|movie|song|painting|article|report)\b/i.test(entityLower)) {
      return 'CreativeWork';
    }
    
    return 'Thing'; // Default type
  }

  /**
   * Generate schema.org entity markup for identified entities
   */
  generateEntityMarkup(entities) {
    const markupRecommendations = [];
    
    for (const entity of entities) {
      // Only create markup for entities with sufficient confidence
      if (entity.confidence >= 0.7) {
        // Create a basic schema.org structure based on entity type
        const markup = {
          '@context': 'https://schema.org',
          '@type': entity.type,
          'name': entity.text
        };
        
        // Add additional properties if available
        if (entity.description) {
          markup.description = entity.description;
        }
        
        if (entity.wikidataId) {
          markup.sameAs = `https://www.wikidata.org/wiki/${entity.wikidataId}`;
        }
        
        // Add more specific properties based on entity type
        if (entity.properties) {
          Object.keys(entity.properties).forEach(key => {
            // Convert property names to camelCase for schema.org
            const schemaKey = key.charAt(0).toLowerCase() + key.slice(1);
            markup[schemaKey] = entity.properties[key];
          });
        }
        
        markupRecommendations.push({
          entity: entity.text,
          type: entity.type,
          markup: markup,
          implementation: JSON.stringify(markup, null, 2)
        });
      }
    }
    
    return markupRecommendations;
  }

  /**
   * Enhance content with identified entities
   */
  enhanceContentWithEntities(contentData, entities) {
    // Create a deep copy of the content to avoid modifying the original
    const enhancedContent = JSON.parse(JSON.stringify(contentData));
    
    // Add entity information
    enhancedContent.entities = entities;
    
    // Create entity-aware content recommendation
    enhancedContent.entityOptimizationRecommendations = this.generateEntityContentRecommendations(entities);
    
    return enhancedContent;
  }

  /**
   * Generate recommendations for optimizing content with identified entities
   */
  generateEntityContentRecommendations(entities) {
    const recommendations = [];
    
    // Filter to high-confidence entities
    const highConfidenceEntities = entities.filter(e => e.confidence >= 0.7);
    
    // Generate different types of recommendations
    if (highConfidenceEntities.length > 0) {
      recommendations.push({
        type: 'markup',
        title: 'Add Schema.org Entity Markup',
        description: 'Implement schema.org markup for the identified entities to improve knowledge graph integration.'
      });
      
      // Recommend entity definitions for important entities
      const keyEntities = highConfidenceEntities.filter(e => e.type !== 'Thing' && e.confidence >= 0.8);
      if (keyEntities.length > 0) {
        recommendations.push({
          type: 'definitions',
          title: 'Add Entity Definitions',
          description: 'Consider adding clear definitions for key entities like: ' + 
            keyEntities.map(e => e.text).join(', '),
          entities: keyEntities
        });
      }
      
      // Recommend entity relationship clarification
      if (highConfidenceEntities.length >= 2) {
        recommendations.push({
          type: 'relationships',
          title: 'Clarify Entity Relationships',
          description: 'Explicitly describe relationships between key entities in your content to improve semantic understanding.'
        });
      }
    }
    
    return recommendations;
  }
}

module.exports = new EntityOptimizationService(); 