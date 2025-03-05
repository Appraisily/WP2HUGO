const axios = require('axios');
const contentStorage = require('../../utils/storage');
const { getSecret } = require('../../utils/secrets');
const config = require('../../config');

class SerpService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://keywordresearch.api.kwrds.ai';
    this.endpoint = '/keywords-with-volumes';
  }

  async initialize() {
    try {
      // Get API key from Secret Manager or environment variable
      try {
        this.apiKey = await getSecret(config.secretNames.kwrdsApiKey);
        console.log('[SERP] Successfully retrieved KWRDS API key from Secret Manager');
      } catch (secretError) {
        console.warn(`[SERP] Could not retrieve API key from Secret Manager: ${secretError.message}`);
        // Fallback to direct environment variable
        this.apiKey = process.env.KWRDS_API_KEY;
      }
      
      if (!this.apiKey) {
        const error = new Error('KWRDS API key not found. Service cannot operate without an API key.');
        error.code = 'MISSING_API_KEY';
        error.service = 'SERP';
        throw error;
      }
      
      console.log('[SERP] API key found. Service initialized successfully.');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[SERP] Failed to initialize SERP service:', error);
      throw error;
    }
  }

  async getSerpData(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[SERP] Fetching SERP data for: ${keyword}`);
      
      // Check if we have cached data first
      const keywordSlug = keyword.replace(/\s+/g, '-').toLowerCase();
      const cacheKey = `${keywordSlug}/serp-data.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[SERP] Using cached SERP data for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[SERP] No cached SERP data for: ${keyword}`);
      }
      
      // Use the keywords-with-volumes endpoint
      const endpoint = `${this.baseUrl}${this.endpoint}`;
      console.log(`[SERP] API request to: ${endpoint}`);
      
      const response = await axios.post(endpoint, {
        search_question: keyword,
        search_country: 'en-US'
      }, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      });
      
      const data = response.data;
      
      // Cache the result
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'serp_data', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword);
      throw this.throwEnhancedError(error, keyword);
    }
  }

  logApiError(error, keyword) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[SERP] API error for keyword "${keyword}":`, {
      status,
      message: error.message,
      data: errorData
    });
  }

  throwEnhancedError(error, keyword) {
    const enhancedError = new Error(`Error fetching SERP data for keyword "${keyword}": ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.keyword = keyword;
    return enhancedError;
  }
}

module.exports = new SerpService(); 