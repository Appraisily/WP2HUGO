const axios = require('axios');
const BaseResearchService = require('../base');
const { getSecret } = require('../../../utils/secrets');

class SerpService extends BaseResearchService {
  constructor() {
    super();
    this.apiUrl = 'https://keywordresearch.api.kwrds.ai/serp';
    this.apiKey = null;
  }

  async initialize() {
    try {
      await super.initialize();
      this.apiKey = await getSecret('KWRDS_API_KEY');
      console.log('[SERP] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[SERP] Service initialization failed:', error);
      throw error;
    }
  }

  async getSearchResults(keyword, volume = 0) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Check cache first
      const cached = await this.checkCache(keyword, 'serp');
      if (cached?.data) {
        console.log('[SERP] Using cached data for:', keyword);
        return cached.data;
      }

      this.logApiCall('serp', keyword);
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
        throw new Error('Empty response from SERP API');
      }

      const result = {
        data: response.data,
        timestamp: new Date().toISOString(),
        metadata: {
          keyword,
          resultCount: response.data.serp?.length || 0,
          hasPasf: Boolean(response.data.pasf?.length),
          hasPasfTrending: Boolean(response.data.pasf_trending?.length)
        }
      };

      // Store result
      await this.storeResult(keyword, result, 'serp');

      console.log('[SERP] Stored fresh data for:', keyword);
      return result.data;
    } catch (error) {
      console.error('[SERP] Error fetching SERP data:', error);
      if (error.response?.data) {
        console.error('[SERP] API error details:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = new SerpService();