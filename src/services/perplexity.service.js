const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');

class PerplexityService {
  constructor() {
    this.apiUrl = 'https://api.perplexity.ai/chat/completions';
    this.apiKey = null;
  }

  async initialize() {
    try {
      this.apiKey = await getSecret('PERPLEXITY_API_KEY');
      console.log('[PERPLEXITY] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Service initialization failed:', error);
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

  async makeRequest(prompt, type, options = {}) {
    const {
      model = 'sonar',
      temperature = 0.2,
      top_p = 0.9
    } = options;

    try {
      console.log(`[PERPLEXITY] Making ${type} request for prompt:`, prompt.substring(0, 100) + '...');

      const messages = [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: prompt }
      ];

      const response = await axios.post(
        this.apiUrl,
        {
          model,
          messages: [
            ...messages
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

      const result = response.data?.choices?.[0]?.message?.content;

      if (!result) {
        throw new Error('No content in Perplexity response');
      }

      // Cache the result
      await this.cacheResult(prompt, result, type);

      return result;

    } catch (error) {
      console.error('[PERPLEXITY] API request failed:', error);
      throw error;
    }
  }

  async cacheResult(prompt, result, type) {
    const cacheData = {
      prompt,
      result,
      type,
      timestamp: new Date().toISOString()
    };

    const hash = Buffer.from(prompt).toString('base64').substring(0, 8);
    const filePath = `perplexity/${hash}.json`;

    await contentStorage.storeContent(
      filePath,
      cacheData,
      { type: 'perplexity_result', resultType: type }
    );
  }
}

module.exports = new PerplexityService();