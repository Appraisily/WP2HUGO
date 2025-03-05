const axios = require('axios');
const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');
const contentStorage = require('../../utils/storage');
const { getSecret } = require('../../utils/secrets');

class KeywordResearchService {
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
        console.log('[KEYWORD-RESEARCH] Successfully retrieved KWRDS API key from Secret Manager');
      } catch (secretError) {
        console.warn(`[KEYWORD-RESEARCH] Could not retrieve API key from Secret Manager: ${secretError.message}`);
        // Fallback to direct environment variable
        this.apiKey = process.env.KWRDS_API_KEY;
      }
      
      if (!this.apiKey) {
        const error = new Error('KWRDS API key not found. Service cannot operate without an API key.');
        error.code = 'MISSING_API_KEY';
        error.service = 'KEYWORD-RESEARCH';
        throw error;
      }
      
      console.log('[KEYWORD-RESEARCH] API key found. Using real API data.');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[KEYWORD-RESEARCH] Failed to initialize keyword research service:', error);
      throw error;
    }
  }

  async getKeywordData(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keyword data for: ${keyword}`);
      
      // Check if we have cached data first
      const keywordSlug = keyword.replace(/\s+/g, '-').toLowerCase();
      const cacheKey = `${keywordSlug}/keyword-data.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached data for keyword: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached data found for keyword: ${keyword}`);
      }
      
      // If no cached data, fetch from API
      const data = await this.fetchKeywordData(keyword);
      
      // Cache the data
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'keyword_research_data', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error fetching keyword data for "${keyword}":`, error);
      throw error;
    }
  }

  async fetchKeywordData(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keyword data from API for: ${keyword}`);
      
      // Use the keywords-with-volumes endpoint
      const endpoint = `${this.baseUrl}${this.endpoint}`;
      console.log(`[KEYWORD-RESEARCH] API request to: ${endpoint}`);
      
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
      console.log(`[KEYWORD-RESEARCH] Received keyword data response for: ${keyword}`);
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword);
      throw this.throwEnhancedError(error, keyword);
    }
  }

  async researchKeyword(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Starting comprehensive research for: ${keyword}`);
      
      // Create a directory for this keyword
      const keywordSlug = slugify(keyword);
      const outputDir = path.join(config.paths.research, keywordSlug);
      await localStorage.ensureDirectoryExists(outputDir);
      
      // Get data from the API
      console.log(`[KEYWORD-RESEARCH] Fetching keyword data for: ${keyword}`);
      const keywordData = await this.getKeywordData(keyword);
      
      await localStorage.saveFile(
        path.join(outputDir, 'keyword-data.json'),
        keywordData
      );
      
      // Compile the data
      const compiledData = {
        keyword,
        keywordData,
        timestamp: new Date().toISOString()
      };
      
      await localStorage.saveFile(
        path.join(outputDir, 'compiled-data.json'),
        compiledData
      );
      
      return compiledData;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error researching keyword "${keyword}":`, error);
      throw error;
    }
  }

  logApiError(error, keyword) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[KEYWORD-RESEARCH] API error for keyword "${keyword}":`, {
      status,
      message: error.message,
      data: errorData
    });
  }

  throwEnhancedError(error, keyword) {
    const enhancedError = new Error(`Error fetching keyword data for "${keyword}": ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.keyword = keyword;
    return enhancedError;
  }
}

module.exports = new KeywordResearchService();