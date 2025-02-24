const { contentService } = require('../openai');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class ContentAnalyzerService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await contentService.initialize();
      this.isInitialized = true;
      console.log('[ANALYZER] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[ANALYZER] Service initialization failed:', error);
      throw error;
    }
  }

  async analyzeKeyword(keyword, collectedData) {
    try {
      if (!this.isInitialized) {
        console.log('[ANALYZER] Service not initialized, initializing now...');
        await this.initialize();
      }

      console.log('[ANALYZER] Starting content analysis for:', keyword);
      
      // Get both the content analysis and valuation description
      const [analysis, valuationDesc] = await Promise.all([
        this.getContentAnalysis(keyword, collectedData),
        this.getValuationDescription(keyword, collectedData)
      ]);

      // Store both results
      await this.storeResults(keyword, analysis, valuationDesc, collectedData);

      return {
        ...analysis,
        valuation_description: valuationDesc
      };

    } catch (error) {
      console.error('[ANALYZER] Error analyzing content:', error);
      throw error;
    }
  }

  async getContentAnalysis(keyword, collectedData) {
    try {
      return await contentService.analyzeContent(keyword, collectedData);
    } catch (error) {
      console.error('[ANALYZER] Error getting content analysis:', error);
      throw error;
    }
  }

  async getValuationDescription(keyword, collectedData) {
    try {
      console.log('[ANALYZER] Generating valuation description for:', keyword);
      return await contentService.generateValuationDescription(keyword, collectedData);
    } catch (error) {
      console.error('[ANALYZER] Error generating valuation description:', error);
      throw error;
    }
  }

  async storeResults(keyword, analysis, valuationDesc, collectedData) {
    const slug = createSlug(keyword);
    const timestamp = new Date().toISOString();

    await contentStorage.storeContent(
      `${slug}/research/content-analysis.json`,
      {
        keyword,
        analysis,
        valuation_description: valuationDesc,
        metadata: {
          timestamp,
          dataPoints: {
            keywordData: Boolean(collectedData.keywordData),
            paaData: Boolean(collectedData.paaData),
            serpData: Boolean(collectedData.serpData),
            perplexityData: Boolean(collectedData.perplexityData)
          }
        }
      },
      { type: 'content_analysis', keyword }
    );
  }
}

module.exports = new ContentAnalyzerService();