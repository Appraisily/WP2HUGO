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

class WorkflowService {
  constructor() {
    this.initialized = false;
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
   * Process a single keyword through the entire workflow
   * @param {string} keyword - The keyword to process
   * @returns {object} - The processing results
   */
  async processKeyword(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[WORKFLOW] Starting processing of keyword: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const resultFilePath = path.join(config.paths.content, `${slug}-content.json`);
      
      // Check if already processed
      if (await localStorage.fileExists(resultFilePath)) {
        console.log(`[WORKFLOW] Keyword "${keyword}" already processed, using cached result`);
        return await localStorage.readFile(resultFilePath);
      }
      
      // Step 1: Research keyword using KWRDS API
      console.log(`[WORKFLOW] Step 1: Researching keyword "${keyword}"`);
      await keywordResearchService.initialize();
      const keywordData = await keywordResearchService.researchKeyword(keyword);
      
      // Step 2: Get SERP data
      console.log(`[WORKFLOW] Step 2: Getting SERP data for "${keyword}"`);
      const serpData = await keywordResearchService.getSerpData(keyword);
      
      // Step 3: Get related keywords
      console.log(`[WORKFLOW] Step 3: Getting related keywords for "${keyword}"`);
      const relatedKeywords = await keywordResearchService.getRelatedKeywords(keyword);
      
      // Step 4: Query Perplexity for comprehensive information
      console.log(`[WORKFLOW] Step 4: Querying Perplexity for information about "${keyword}"`);
      await perplexityService.initialize();
      const perplexityData = await perplexityService.query(keyword);
      
      // Step 5: Generate blog post structure using Google AI
      console.log(`[WORKFLOW] Step 5: Generating blog post structure using Google AI for "${keyword}"`);
      await googleAiService.initialize();
      const structureData = await googleAiService.generateStructure(keyword, keywordData, perplexityData, serpData);
      
      // Step 6: Generate featured image for the blog post
      console.log(`[WORKFLOW] Step 6: Generating featured image for "${keyword}"`);
      await imageGenerationService.initialize();
      const imageData = await imageGenerationService.generateImage(keyword, structureData);
      
      // Step 7: Generate SEO-optimized markdown content
      console.log(`[WORKFLOW] Step 7: Generating SEO-optimized markdown for "${keyword}"`);
      await markdownGeneratorService.initialize();
      
      // Compile intermediate results for markdown generation
      const contentData = {
        keyword,
        slug,
        timestamp: new Date().toISOString(),
        keywordData,
        serpData,
        relatedKeywords,
        perplexityData,
        structureData,
        imageData
      };
      
      const markdownData = await markdownGeneratorService.generateMarkdown(keyword, contentData);
      
      // Compile final results with all data
      const result = {
        ...contentData,
        markdownData
      };
      
      // Save complete result
      await localStorage.saveFile(resultFilePath, result);
      
      // Mark as processed
      await this.markKeywordAsProcessed(keyword);
      
      console.log(`[WORKFLOW] Completed processing of keyword: "${keyword}"`);
      
      return result;
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
}

module.exports = new WorkflowService(); 