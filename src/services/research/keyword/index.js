const axios = require('axios');
const BaseResearchService = require('../base');
const { getSecret } = require('../../../utils/secrets');

class KeywordResearchService extends BaseResearchService {
  constructor() {
    super();
    this.apiUrl = 'https://keywordresearch.api.kwrds.ai/keywords-with-volumes';
    this.apiKey = null;
  }

  async initialize() {
    try {
      await super.initialize();
      this.apiKey = await getSecret('KWRDS_API_KEY');
      console.log('[KEYWORD] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[KEYWORD] Service initialization failed:', error);
      throw error;
    }
  }

  async getKeywordData(keyword) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!keyword) {
      throw new Error('Keyword is required for keyword research');
    }

    try {
      // Check cache first
      const cached = await this.checkCache(keyword, 'keyword');
      if (cached?.data) {
        console.log('[KEYWORD] Using cached data for:', keyword);
        return cached.data;
      }

      this.logApiCall('keyword', keyword);
      const response = await axios.post(this.apiUrl, {
        search_question: keyword,
        search_country: 'en-US'
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data) {
        throw new Error('Empty response from keyword research API');
      }

      const result = {
        data: response.data,
        timestamp: new Date().toISOString(),
        metadata: {
          keyword,
          hasVolume: Boolean(response.data?.volume),
          hasIntent: Boolean(response.data?.['search-intent']),
          resultCount: Object.keys(response.data?.keyword || {}).length
        }
      };

      // Store result
      await this.storeResult(keyword, result, 'keyword');

      console.log('[KEYWORD] Stored fresh data for:', keyword);
      return result.data;
    } catch (error) {
      console.error('[KEYWORD] Error fetching keyword data:', error);
      if (error.response?.data) {
        console.error('[KEYWORD] API error details:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = new KeywordResearchService();