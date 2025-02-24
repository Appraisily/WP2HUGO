const axios = require('axios');
const BaseResearchService = require('../base');
const { getSecret } = require('../../../utils/secrets');

class PerplexityService extends BaseResearchService {
  constructor() {
    super();
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.apiKey = null;
  }

  async initialize() {
    try {
      await super.initialize();
      this.apiKey = await getSecret('PERPLEXITY_API_KEY');
      console.log('[PERPLEXITY] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Service initialization failed:', error);
      throw error;
    }
  }

  async makeRequest(prompt, type, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      model = 'sonar',
      temperature = 0.2,
      top_p = 0.9
    } = options;

    try {
      // Check cache first
      const cached = await this.checkCache(prompt, type);
      if (cached?.data) {
        console.log('[PERPLEXITY] Using cached data for type:', type);
        return cached.data;
      }

      this.logApiCall(type, prompt);
      const response = await axios.post(
        this.apiUrl,
        {
          model,
          messages: [
            { role: 'system', content: 'Be precise and concise.' },
            { role: 'user', content: prompt }
          ],
          temperature,
          top_p,
          return_images: false,
          return_related_questions: false,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = {
        data: response.data?.choices?.[0]?.message?.content,
        timestamp: new Date().toISOString(),
        metadata: {
          prompt,
          type,
          model
        }
      };

      if (!result.data) {
        throw new Error('No content in Perplexity response');
      }

      // Store result
      await this.storeResult(prompt, result, type);

      console.log('[PERPLEXITY] Stored fresh data for type:', type);
      return result.data;
    } catch (error) {
      console.error('[PERPLEXITY] API request failed:', error);
      throw error;
    }
  }

  async generateKeywordVariations(keyword) {
    const prompt = `Generate a list of long-tail keyword variations related to '${keyword}'. Please provide at least 5 variations.`;
    return this.makeRequest(prompt, 'keyword_variations');
  }

  async analyzeSearchIntent(keyword) {
    const prompt = `Explain and group the search intents behind queries related to '${keyword}'. Categorize them into the following groups: Valuation, Historical, and Identification.`;
    return this.makeRequest(prompt, 'search_intent');
  }

  async getContextualExpansion(keyword) {
    const prompt = `List common questions, topics, or phrases that people associate with '${keyword}'. Include any nuances that might help in crafting detailed content.`;
    return this.makeRequest(prompt, 'contextual_expansion');
  }

  async generateContentTopics(keyword) {
    const prompt = `Propose several content topics for an online antique appraisal service, based on emerging trends and popular queries related to '${keyword}'. Ensure the topics are SEO-friendly and conversion-focused.`;
    return this.makeRequest(prompt, 'content_topics');
  }

  async complementStructuredData(keyword, structuredData) {
    const prompt = `Given the following structured data from SERP research: ${JSON.stringify(structuredData)}, and the seed keyword '${keyword}', provide additional insights and keyword suggestions that could enhance a content strategy for antique appraisals.`;
    return this.makeRequest(prompt, 'complementary_data');
  }
}

module.exports = new PerplexityService();