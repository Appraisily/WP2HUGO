const axios = require('axios');
const BaseResearchService = require('../base');
const { getSecret } = require('../../../utils/secrets');

class PeopleAlsoAskService extends BaseResearchService {
  constructor() {
    super();
    this.apiUrl = 'https://paa.api.kwrds.ai/people-also-ask';
    this.apiKey = null;
  }

  async initialize() {
    try {
      await super.initialize();
      this.apiKey = await getSecret('KWRDS_API_KEY');
      console.log('[PAA] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[PAA] Service initialization failed:', error);
      throw error;
    }
  }

  async getQuestions(keyword) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!keyword) {
      throw new Error('Keyword is required for PAA data retrieval');
    }

    try {
      // Check cache first
      const cached = await this.checkCache(keyword, 'paa');
      if (cached?.data) {
        console.log('[PAA] Using cached data for:', keyword);
        return cached.data;
      }

      this.logApiCall('paa', keyword);
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
        throw new Error('Empty response from PAA API');
      }

      const result = {
        data: response.data,
        timestamp: new Date().toISOString(),
        metadata: {
          keyword,
          questionCount: response.data.results?.length || 0
        }
      };

      // Store result
      await this.storeResult(keyword, result, 'paa');

      console.log('[PAA] Stored fresh data for:', keyword);
      return result.data;
    } catch (error) {
      console.error('[PAA] Error fetching PAA data:', error);
      if (error.response?.data) {
        console.error('[PAA] API error details:', error.response.data);
      }
      throw error;
    }
  }
}

module.exports = new PeopleAlsoAskService();