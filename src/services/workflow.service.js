const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const keywordReader = require('../utils/keyword-reader');
const { keywordResearchService } = require('./kwrds');
const perplexityService = require('./perplexity.service');
const googleAiService = require('./google-ai.service');
const anthropicService = require('./anthropic.service');
const seoQualityService = require('./seo-quality.service');
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
    this.forceApi = false;
  }

  // Add a method to set the keywords path
  setKeywordsPath(keywordsPath) {
    // Update the path in the keyword reader
    keywordReader.setKeywordsPath(keywordsPath);
  }

  // Add a method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    // Propagate the setting to other services
    keywordResearchService.setForceApi(value);
    perplexityService.setForceApi(value);
    googleAiService.setForceApi(value);
    anthropicService.setForceApi(value);
    console.log(`[WORKFLOW] Force API set to: ${value}`);
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
        if (!this.forceApi && cacheExists) {
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
      
      // 3. Analyze top competitors to identify winning strategies
      let competitorAnalysis = null;
      if (researchData && researchData.serp && researchData.serp.results) {
        console.log(`[WORKFLOW] Analyzing competitors for "${keyword}"`);
        try {
          competitorAnalysis = await competitorAnalysisService.analyzeCompetitors(keyword, researchData.serp.results);
        } catch (error) {
          console.error(`[WORKFLOW] Error analyzing competitors: ${error.message}`);
        }
      }
      
      // 4. Generate blog post structure using Google AI
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
      
      // 5. NEW: Enhance content using Anthropic (Claude)
      console.log(`[WORKFLOW] Enhancing content quality with Anthropic for "${keyword}"`);
      const enhancedContent = await anthropicService.enhanceContent(
        keyword,
        structureData,
        perplexityData,
        competitorAnalysis?.insights || null
      );
      
      // 6. NEW: Perform final SEO optimization with Anthropic
      console.log(`[WORKFLOW] Performing final SEO optimization for "${keyword}"`);
      const optimizedContent = await anthropicService.optimizeContentForSeo(
        keyword,
        enhancedContent
      );
      
      // 7. Generate image
      console.log(`[WORKFLOW] Generating image for "${keyword}"`);
      const imageData = await imageGenerationService.generateImage(keyword, structureData);
      
      // 8. Generate schema markup based on content type
      let contentType = 'article'; // Default type
      if (structureData.contentType) {
        contentType = structureData.contentType;
      } else if (structureData.title && structureData.title.toLowerCase().includes('how to')) {
        contentType = 'howto';
      } else if (structureData.sections && structureData.sections.some(s => s.type === 'faq' || (s.title && s.title.toLowerCase().includes('faq')))) {
        contentType = 'faq';
      }
      
      console.log(`[WORKFLOW] Generating schema markup for "${keyword}" (${contentType})`);
      let schemaMarkup = null;
      try {
        schemaMarkup = await schemaMarkupService.generateSchemaMarkup(keyword, optimizedContent, contentType);
      } catch (error) {
        console.error(`[WORKFLOW] Error generating schema markup: ${error.message}`);
      }
      
      // 9. NEW: Assess SEO quality
      console.log(`[WORKFLOW] Assessing SEO quality for "${keyword}"`);
      const contentToAssess = {
        keyword,
        title: optimizedContent.optimizedContent?.title || structureData.title,
        description: optimizedContent.optimizedContent?.meta_description || structureData.meta_description,
        structure: optimizedContent.optimizedContent || structureData,
        schema: schemaMarkup
      };
      
      const qualityAssessment = await seoQualityService.evaluateContent(keyword, contentToAssess);
      
      // 10. NEW: Generate improvement recommendations if score is below threshold
      let seoRecommendations = null;
      if (qualityAssessment.overallScore < 85) {
        console.log(`[WORKFLOW] Generating SEO improvement recommendations for "${keyword}"`);
        seoRecommendations = await seoQualityService.generateRecommendations(keyword, qualityAssessment);
      }
      
      // 11. Register content in the internal linking service
      console.log(`[WORKFLOW] Registering "${keyword}" in content registry for internal linking`);
      try {
        await internalLinkingService.registerContent(keyword, contentToAssess);
      } catch (error) {
        console.error(`[WORKFLOW] Error registering content for linking: ${error.message}`);
      }
      
      // 12. Register content for monitoring
      console.log(`[WORKFLOW] Setting up content monitoring for "${keyword}"`);
      try {
        await contentMonitorService.registerContent(keyword, contentToAssess);
      } catch (error) {
        console.error(`[WORKFLOW] Error setting up content monitoring: ${error.message}`);
      }
      
      // 13. Compile final content
      const contentData = {
        keyword,
        slug,
        title: optimizedContent.optimizedContent?.title || structureData.title || `${keyword} - Comprehensive Guide`,
        description: optimizedContent.optimizedContent?.meta_description || structureData.meta_description || `Learn everything about ${keyword} in this comprehensive guide.`,
        date: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        researchData,
        perplexityData,
        structure: structureData,
        enhancedContent: enhancedContent.enhancedContent || enhancedContent,
        optimizedContent: optimizedContent.optimizedContent || optimizedContent,
        seoAssessment: qualityAssessment,
        seoRecommendations,
        image: imageData,
        schema: schemaMarkup,
        competitorAnalysis: competitorAnalysis?.success ? competitorAnalysis.insights : null,
        seoScore: qualityAssessment.overallScore,
        keywordDensity: optimizedContent.optimizedContent?.keywordDensity || "Unknown",
        internalLinkingSuggestions: optimizedContent.optimizedContent?.internalLinkingSuggestions || [],
        readabilityEnhancements: optimizedContent.optimizedContent?.readabilityEnhancements || [],
        previousSeoAssessment: null
      };
      
      // 14. Save content to disk
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
   * Improve existing content based on SEO recommendations
   * @param {string} keyword - The keyword to improve content for
   * @returns {Promise<object>} - The improved content
   */
  async improveExistingContent(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[WORKFLOW] Improving existing content for "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.content, `${slug}-content.json`);
      
      // Check if content exists
      const contentExists = await fs.access(cachePath).then(() => true).catch(() => false);
      
      if (!contentExists) {
        console.log(`[WORKFLOW] No existing content found for "${keyword}". Processing as new content.`);
        return await this.processKeyword(keyword);
      }
      
      // Load existing content
      const existingContent = JSON.parse(await fs.readFile(cachePath, 'utf8'));
      
      // Assess SEO quality if not already assessed
      let qualityAssessment = existingContent.seoAssessment;
      if (!qualityAssessment) {
        console.log(`[WORKFLOW] Assessing SEO quality for "${keyword}"`);
        qualityAssessment = await seoQualityService.evaluateContent(keyword, existingContent);
      }
      
      // Only improve if score is below threshold
      if (qualityAssessment.overallScore >= 90) {
        console.log(`[WORKFLOW] Content for "${keyword}" already has excellent SEO score (${qualityAssessment.overallScore}). No improvements needed.`);
        return existingContent;
      }
      
      // Generate recommendations if not already available
      let seoRecommendations = existingContent.seoRecommendations;
      if (!seoRecommendations) {
        console.log(`[WORKFLOW] Generating SEO improvement recommendations for "${keyword}"`);
        seoRecommendations = await seoQualityService.generateRecommendations(keyword, qualityAssessment);
      }
      
      // Use Anthropic to improve content based on recommendations
      console.log(`[WORKFLOW] Using Anthropic to improve content for "${keyword}" based on SEO recommendations`);
      
      // Extract high priority recommendations
      const highPriorityIssues = seoRecommendations.prioritizedActions
        .filter(action => action.priority === 'High' || action.priority === 'Critical')
        .map(action => `${action.issue}: ${action.recommendation}`)
        .join('\n');
      
      // Perform content improvement
      const improvedContent = await anthropicService.enhanceContent(
        keyword,
        existingContent.structure || existingContent,
        existingContent.perplexityData,
        {
          contentImprovements: highPriorityIssues,
          seoScore: qualityAssessment.overallScore
        }
      );
      
      // Final SEO optimization
      const optimizedContent = await anthropicService.optimizeContentForSeo(
        keyword,
        improvedContent
      );
      
      // Reassess SEO quality
      const contentToReassess = {
        keyword,
        title: optimizedContent.optimizedContent?.title || existingContent.title,
        description: optimizedContent.optimizedContent?.meta_description || existingContent.description,
        structure: optimizedContent.optimizedContent || improvedContent.enhancedContent,
        schema: existingContent.schema
      };
      
      const newQualityAssessment = await seoQualityService.evaluateContent(keyword, contentToReassess);
      
      // Update content data
      const updatedContent = {
        ...existingContent,
        title: optimizedContent.optimizedContent?.title || existingContent.title,
        description: optimizedContent.optimizedContent?.meta_description || existingContent.description,
        lastUpdated: new Date().toISOString(),
        enhancedContent: improvedContent.enhancedContent || improvedContent,
        optimizedContent: optimizedContent.optimizedContent || optimizedContent,
        previousSeoAssessment: existingContent.seoAssessment || qualityAssessment,
        seoAssessment: newQualityAssessment,
        seoRecommendations,
        seoScore: newQualityAssessment.overallScore,
        keywordDensity: optimizedContent.optimizedContent?.keywordDensity || existingContent.keywordDensity || "Unknown",
        improvementsMade: true,
        improvementDate: new Date().toISOString()
      };
      
      // Save updated content
      await fs.writeFile(cachePath, JSON.stringify(updatedContent, null, 2), 'utf8');
      
      console.log(`[WORKFLOW] Successfully improved content for "${keyword}". SEO score improved from ${qualityAssessment.overallScore} to ${newQualityAssessment.overallScore}`);
      
      return updatedContent;
    } catch (error) {
      console.error(`[WORKFLOW] Error improving content for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Batch improve all existing content
   * @returns {array} - Results of improving all content
   */
  async batchImproveAllContent() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      console.log('[WORKFLOW] Starting batch improvement of all content');
      
      // Get all content files
      const contentDir = path.join(config.paths.content);
      await fs.mkdir(contentDir, { recursive: true });
      
      const files = await fs.readdir(contentDir);
      const contentFiles = files.filter(file => file.endsWith('-content.json'));
      
      console.log(`[WORKFLOW] Found ${contentFiles.length} content files to check for improvements`);
      
      const results = [];
      
      // Process each file
      for (const file of contentFiles) {
        try {
          // Extract keyword from filename
          const slug = file.replace('-content.json', '');
          const contentData = JSON.parse(await fs.readFile(path.join(contentDir, file), 'utf8'));
          const keyword = contentData.keyword;
          
          if (!keyword) {
            console.warn(`[WORKFLOW] Could not determine keyword for file: ${file}. Skipping.`);
            continue;
          }
          
          console.log(`[WORKFLOW] Checking if content for "${keyword}" needs improvement`);
          
          // Check SEO score
          const currentScore = contentData.seoScore || 
                              (contentData.seoAssessment ? contentData.seoAssessment.overallScore : 0);
          
          if (currentScore >= 90) {
            console.log(`[WORKFLOW] Content for "${keyword}" already has excellent SEO score (${currentScore}). Skipping.`);
            continue;
          }
          
          // Improve content
          console.log(`[WORKFLOW] Improving content for "${keyword}" (current score: ${currentScore})`);
          const improvedContent = await this.improveExistingContent(keyword);
          
          results.push({
            keyword,
            oldScore: currentScore,
            newScore: improvedContent.seoScore || (improvedContent.seoAssessment ? improvedContent.seoAssessment.overallScore : 0),
            improved: true
          });
        } catch (error) {
          console.error(`[WORKFLOW] Error processing file ${file}:`, error);
        }
      }
      
      console.log(`[WORKFLOW] Completed batch improvement. Total improved: ${results.length}`);
      
      return results;
    } catch (error) {
      console.error('[WORKFLOW] Error in batch improvement:', error);
      throw error;
    }
  }
}

module.exports = new WorkflowService(); 