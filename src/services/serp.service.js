const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const config = require('../config');

class SerpService {
  constructor() {
    this.initialized = false;
    this.apiUrl = 'https://keywordresearch.api.kwrds.ai';
    this.apiKey = null;
  }

  async initialize() {
    try {
      // Get API key from Secret Manager or environment variable
      try {
        this.apiKey = await getSecret(config.secretNames.kwrdsApiKey);
        console.log('[SERP-SERVICE] Successfully retrieved KWRDS API key from Secret Manager');
      } catch (secretError) {
        console.warn(`[SERP-SERVICE] Could not retrieve API key from Secret Manager: ${secretError.message}`);
        // Fallback to direct environment variable
        this.apiKey = process.env.KWRDS_API_KEY;
      }
      
      if (!this.apiKey) {
        const error = new Error('KWRDS API key not found. SERP service cannot operate without an API key.');
        error.code = 'MISSING_API_KEY';
        error.service = 'SERP-SERVICE';
        throw error;
      }
      
      console.log('[SERP-SERVICE] API key found. Using real API data.');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[SERP-SERVICE] Failed to initialize SERP service:', error);
      throw error;
    }
  }

  async getSearchResults(keyword) {
    if (!this.initialized) {
      throw new Error('SERP service not initialized');
    }

    try {
      console.log(`[SERP-SERVICE] Fetching SERP results for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/serp-results.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[SERP-SERVICE] Using cached SERP data for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[SERP-SERVICE] No cached SERP data found for: ${keyword}`);
      }
      
      // If no cached data, fetch from API
      const response = await axios.get(`${this.apiUrl}/serp`, {
        params: {
          keyword,
          country: 'us',
          language: 'en'
        },
        headers: {
          'X-API-KEY': this.apiKey
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      const data = response.data;
      
      // Cache the result
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'serp_results', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      console.error(`[SERP-SERVICE] Error fetching SERP data for "${keyword}":`, error);
      throw this.enhanceError(error, keyword);
    }
  }

  enhanceError(error, keyword) {
    const enhancedError = new Error(`Error fetching SERP results for keyword "${keyword}": ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.keyword = keyword;
    return enhancedError;
  }
}

module.exports = new SerpService();
  