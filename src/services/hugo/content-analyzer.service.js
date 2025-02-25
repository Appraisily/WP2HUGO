const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentAnalyzerService {
  constructor() {
    this.isInitialized = true; // Always initialized
  }

  async initialize() {
    try {
      console.log('[ANALYZER] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[ANALYZER] Service initialization failed:', error);
      throw error;
    }
  }

  async analyzeKeyword(keyword, collectedData) {
    try {
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
      // Return a static analysis object instead of calling OpenAI
      return {
        topic: keyword,
        title: `Complete Guide to ${keyword}`,
        sections: [
          {
            title: "Introduction",
            content: `An introduction to ${keyword} and its importance in the market.`
          },
          {
            title: "History and Background",
            content: `The historical context of ${keyword} and how it has evolved over time.`
          },
          {
            title: "Value Factors",
            content: "Factors that contribute to the valuation of this item."
          },
          {
            title: "Market Trends",
            content: "Current market trends affecting value and desirability."
          },
          {
            title: "Conclusion",
            content: "Final thoughts and recommendations."
          }
        ],
        meta: {
          description: `Learn everything you need to know about ${keyword} including valuation, history, and market trends.`,
          keywords: keyword.split(" "),
          targetAudience: "Collectors and investors"
        }
      };
    } catch (error) {
      console.error('[ANALYZER] Error getting content analysis:', error);
      throw error;
    }
  }

  async getValuationDescription(keyword, collectedData) {
    try {
      console.log('[ANALYZER] Generating valuation description for:', keyword);
      // Return a static valuation description
      return `Valuable collectible with strong market appeal and historical significance.`;
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