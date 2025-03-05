const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const config = require('../config');

class PeopleAlsoAskService {
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
        console.log('[PAA-SERVICE] Successfully retrieved KWRDS API key from Secret Manager');
      } catch (secretError) {
        console.warn(`[PAA-SERVICE] Could not retrieve API key from Secret Manager: ${secretError.message}`);
        // Fallback to direct environment variable
        this.apiKey = process.env.KWRDS_API_KEY;
      }
      
      if (!this.apiKey) {
        const error = new Error('KWRDS API key not found. PAA service cannot operate without an API key.');
        error.code = 'MISSING_API_KEY';
        error.service = 'PAA-SERVICE';
        throw error;
      }
      
      console.log('[PAA-SERVICE] API key found. Using real API data.');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PAA-SERVICE] Failed to initialize PAA service:', error);
      throw error;
    }
  }

  async getQuestions(keyword) {
    if (!this.initialized) {
      throw new Error('PAA service not initialized');
    }

    try {
      console.log(`[PAA-SERVICE] Fetching PAA questions for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/paa-questions.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[PAA-SERVICE] Using cached PAA data for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[PAA-SERVICE] No cached PAA data found for: ${keyword}`);
      }
      
      // If no cached data, fetch from API
      const response = await axios.get(`${this.apiUrl}/people-also-ask`, {
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
          type: 'paa_questions', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      console.error(`[PAA-SERVICE] Error fetching PAA data for "${keyword}":`, error);
      throw this.enhanceError(error, keyword);
    }
  }

  enhanceError(error, keyword) {
    const enhancedError = new Error(`Error fetching PAA questions for keyword "${keyword}": ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.keyword = keyword;
    return enhancedError;
  }
}

module.exports = new PeopleAlsoAskService();
  