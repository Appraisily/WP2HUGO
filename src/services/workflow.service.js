const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const keywordReader = require('../utils/keyword-reader');
const keywordResearchService = require('./keyword-research.service');
const perplexityService = require('./perplexity.service');
const googleAiService = require('./google-ai.service');
const imageGenerationService = require('./image-generation.service');
const markdownGeneratorService = require('./markdown-generator.service');
const slugify = require('../utils/slugify');
const fs = require('fs').promises;
const schemaMarkupService = require('./schema-markup.service');
const competitorAnalysisService = require('./competitor-analysis.service');
const internalLinkingService = require('./internal-linking.service');
const contentMonitorService = require('./content-monitor.service');

class WorkflowService {
  constructor() {
    this.initialized = false;
  }

  // Add a method to set the keywords path
  setKeywordsPath(keywordsPath) {
    // Update the path in the keyword reader
    keywordReader.setKeywordsPath(keywordsPath);
  }

  async initialize() {
    try {
      // Initialize required services
      await localStorage.initialize();
      await keywordReader.initialize();
      
      console.log('[WORKFLOW] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[WORKFLOW] Failed to initialize workflow service:', error);
      throw error;
    }
  }

  /**
   * Get the list of keywords that have already been processed
   * @returns {array} - List of processed keywords
   */
  async getProcessedKeywords() {
    try {
      const statusFilePath = path.join(config.paths.output, 'processing-status.json');
      
      if (await localStorage.fileExists(statusFilePath)) {
        const status = await localStorage.readFile(statusFilePath);
        return status.processedKeywords || [];
      }
      
      return [];
    } catch (error) {
      console.error('[WORKFLOW] Error getting processed keywords:', error);
      return [];
    }
  }

  /**
   * Update the list of processed keywords
   * @param {string} keyword - The keyword that was processed
   * @returns {boolean} - Success status
   */
  async markKeywordAsProcessed(keyword) {
    try {
      const statusFilePath = path.join(config.paths.output, 'processing-status.json');
      let status = { processedKeywords: [] };
      
      if (await localStorage.fileExists(statusFilePath)) {
        status = await localStorage.readFile(statusFilePath);
      }
      
      if (!status.processedKeywords) {
        status.processedKeywords = [];
      }
      
      if (!status.processedKeywords.includes(keyword)) {
        status.processedKeywords.push(keyword);
      }
      
      await localStorage.saveFile(statusFilePath, status);
      return true;
    } catch (error) {
      console.error(`[WORKFLOW] Error marking keyword "${keyword}" as processed:`, error);
      return false;
    }
  }

  /**
   * Process a single keyword with enhanced SEO
   * @param {string} keyword - The keyword to process
   * @returns {Promise<object>} - The processed content
   */
  async processKeyword(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[WORKFLOW] Processing keyword: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.content, `${slug}-content.json`);
      
      // Check if content exists in cache
      try {
        const cacheExists = await fs.access(cachePath).then(() => true).catch(() => false);
        if (cacheExists) {
          console.log(`[WORKFLOW] Found cached content for "${keyword}"`);
          const cachedContent = await fs.readFile(cachePath, 'utf8');
          return JSON.parse(cachedContent);
        }
      } catch (error) {
        // Cache doesn't exist or is invalid, proceed with processing
      }

      // 1. Get keyword research
      console.log(`[WORKFLOW] Researching keyword: "${keyword}"`);
      const researchData = await keywordResearchService.researchKeyword(keyword);
      
      // 2. Get comprehensive information from Perplexity
      console.log(`[WORKFLOW] Getting comprehensive information for "${keyword}"`);
      const perplexityData = await perplexityService.query(keyword);
      
      // 3. NEW: Analyze top competitors to identify winning strategies
      let competitorAnalysis = null;
      if (researchData && researchData.serp && researchData.serp.results) {
        console.log(`[WORKFLOW] Analyzing competitors for "${keyword}"`);
        try {
          competitorAnalysis = await competitorAnalysisService.analyzeCompetitors(keyword, researchData.serp.results);
        } catch (error) {
          console.error(`[WORKFLOW] Error analyzing competitors: ${error.message}`);
        }
      }
      
      // 4. Generate blog post structure
      console.log(`[WORKFLOW] Generating content structure for "${keyword}"`);
      
      // Include competitor insights in structure prompt if available
      let additionalStructureInfo = '';
      if (competitorAnalysis && competitorAnalysis.success) {
        additionalStructureInfo = `
Based on competitor analysis, consider these insights:
- Average word count for top content: ${competitorAnalysis.insights.contentStatistics.averageWordCount} words
- Important topics to cover: ${competitorAnalysis.insights.criticalTopics.join(', ')}
- Content gaps to fill: ${competitorAnalysis.insights.contentGaps.join(', ')}
- Recommended headings structure: ${competitorAnalysis.insights.recommendedOutline.join(', ')}
`;
      }
      
      const structureData = await googleAiService.generateStructure(
        keyword, 
        researchData, 
        perplexityData,
        additionalStructureInfo
      );
      
      // 5. Generate image
      console.log(`[WORKFLOW] Generating image for "${keyword}"`);
      const imageData = await imageGenerationService.generateImage(keyword, structureData);
      
      // 6. Compile final content
      const contentData = {
        keyword,
        slug,
        title: structureData.title || `${keyword} - Comprehensive Guide`,
        description: structureData.metaDescription || `Learn everything about ${keyword} in this comprehensive guide.`,
        date: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        researchData,
        perplexityData,
        structure: structureData,
        image: imageData,
        competitorAnalysis: competitorAnalysis?.success ? competitorAnalysis.insights : null
      };
      
      // 7. NEW: Generate appropriate schema markup based on content type
      let contentType = 'article'; // Default type
      if (structureData.contentType) {
        contentType = structureData.contentType;
      } else if (structureData.title && structureData.title.toLowerCase().includes('how to')) {
        contentType = 'howto';
      } else if (structureData.sections && structureData.sections.some(s => s.type === 'faq' || (s.title && s.title.toLowerCase().includes('faq')))) {
        contentType = 'faq';
      }
      
      console.log(`[WORKFLOW] Generating schema markup for "${keyword}" (${contentType})`);
      try {
        const schemaMarkup = await schemaMarkupService.generateSchemaMarkup(keyword, contentData, contentType);
        contentData.schema = schemaMarkup;
      } catch (error) {
        console.error(`[WORKFLOW] Error generating schema markup: ${error.message}`);
      }
      
      // 8. NEW: Register content in the internal linking service
      console.log(`[WORKFLOW] Registering "${keyword}" in content registry for internal linking`);
      try {
        await internalLinkingService.registerContent(keyword, contentData);
      } catch (error) {
        console.error(`[WORKFLOW] Error registering content for linking: ${error.message}`);
      }
      
      // 9. NEW: Register content for monitoring
      console.log(`[WORKFLOW] Setting up content monitoring for "${keyword}"`);
      try {
        await contentMonitorService.registerContent(keyword, contentData);
      } catch (error) {
        console.error(`[WORKFLOW] Error setting up content monitoring: ${error.message}`);
      }
      
      // 10. Save content to disk
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, JSON.stringify(contentData, null, 2), 'utf8');
      
      console.log(`[WORKFLOW] Successfully processed keyword: "${keyword}"`);
      return contentData;
    } catch (error) {
      console.error(`[WORKFLOW] Error processing keyword "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Process the next unprocessed keyword
   * @returns {object|null} - Processing result or null if no keywords left
   */
  async processNextKeyword() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Get processed keywords
      const processedKeywords = await this.getProcessedKeywords();
      
      // Get next keyword to process
      const nextKeyword = await keywordReader.getNextKeyword(processedKeywords);
      
      if (!nextKeyword) {
        console.log('[WORKFLOW] No more keywords to process');
        return null;
      }
      
      // Process the keyword
      return await this.processKeyword(nextKeyword);
    } catch (error) {
      console.error('[WORKFLOW] Error processing next keyword:', error);
      throw error;
    }
  }

  /**
   * Process all remaining keywords
   * @returns {array} - Results of processing all keywords
   */
  async processAllKeywords() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const results = [];
      let result;
      
      do {
        result = await this.processNextKeyword();
        if (result) {
          results.push(result);
        }
      } while (result);
      
      console.log(`[WORKFLOW] Completed processing all keywords. Total processed: ${results.length}`);
      
      return results;
    } catch (error) {
      console.error('[WORKFLOW] Error processing all keywords:', error);
      throw error;
    }
  }

  /**
   * Test function to process a single keyword from our test file
   * @returns {object} - The processing result
   */
  async testWithSingleKeyword() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      console.log('[WORKFLOW] Running test with a single keyword');
      
      // Read from test-keywords.txt
      const testKeywordsPath = path.resolve(process.cwd(), 'test-keywords.txt');
      const keywordData = await fs.readFile(testKeywordsPath, 'utf8');
      const keyword = keywordData.trim();
      
      if (!keyword) {
        throw new Error('No keyword found in test-keywords.txt');
      }
      
      console.log(`[WORKFLOW] Test keyword: "${keyword}"`);
      
      // Process the keyword
      const result = await this.processKeyword(keyword);
      
      console.log('[WORKFLOW] Test completed successfully');
      return result;
    } catch (error) {
      console.error('[WORKFLOW] Error in test:', error);
      throw error;
    }
  }

  /**
   * Enhanced content generation with internal linking and schema
   * @param {string} keyword - The keyword to generate content for
   * @returns {Promise<object>} - The processed content with enhancements
   */
  async generateEnhancedContent(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[WORKFLOW] Generating enhanced content for "${keyword}"`);
    
    try {
      // 1. First process the keyword normally
      const contentData = await this.processKeyword(keyword);
      
      // 2. Find internal linking opportunities
      console.log(`[WORKFLOW] Finding internal linking opportunities for "${keyword}"`);
      let linkOpportunities = null;
      try {
        linkOpportunities = await internalLinkingService.findLinkingOpportunities(keyword, contentData);
      } catch (error) {
        console.error(`[WORKFLOW] Error finding linking opportunities: ${error.message}`);
      }
      
      // 3. Add link opportunities to content data
      if (linkOpportunities) {
        contentData.internalLinks = linkOpportunities;
      }
      
      // 4. Save the enhanced content
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.content, `${slug}-content.json`);
      await fs.writeFile(cachePath, JSON.stringify(contentData, null, 2), 'utf8');
      
      return contentData;
    } catch (error) {
      console.error(`[WORKFLOW] Error generating enhanced content for "${keyword}":`, error);
      throw error;
    }
  }
}

module.exports = new WorkflowService(); 