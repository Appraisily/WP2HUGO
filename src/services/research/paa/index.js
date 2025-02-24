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

    try {
      // Check cache first
      const cached = await this.checkCache(keyword, 'paa');
      if (cached) {
        return cached.data;
      }

      const response = await axios.get(this.apiUrl, {
        params: {
          keyword,
          search_country: 'US',
          search_language: 'en'
        },
        headers: {
          'X-API-KEY': this.apiKey
        }
      });

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

      return result.data;
    } catch (error) {
      console.error('[PAA] Error fetching PAA data:', error);
      throw error;
    }
  }
}

module.exports = new PeopleAlsoAskService();