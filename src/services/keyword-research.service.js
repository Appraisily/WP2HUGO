const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');
const contentStorage = require('../utils/storage');
const { getSecret } = require('../utils/secrets');

class KeywordResearchService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://keywordresearch.api.kwrds.ai'; // Updated to the correct API endpoint
    this.endpoints = {
      keywordsWithVolumes: '/keywords-with-volumes',
      keywordExpansion: '/keyword-expansion',
      keywordSuggestions: '/keyword-suggestions'
    };
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
      throw new Error('Keyword research service not initialized');
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keyword data for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/keyword-data.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached data for keyword: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached data found for keyword: ${keyword}`);
      }
      
      // If no cached data, fetch from all endpoints
      const allData = await this.fetchAllKwrdsData(keyword);
      
      // Cache the combined data
      await contentStorage.storeContent(
        cacheKey,
        allData,
        { 
          type: 'keyword_research_data', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return allData;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error fetching keyword data for "${keyword}":`, error);
      throw error;
    }
  }

  async getRelatedKeywordsWithRetry(keyword, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getRelatedKeywords(keyword);
      } catch (error) {
        console.error(`[KEYWORD-RESEARCH] Error fetching related keywords (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async getSerpDataWithRetry(keyword, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.getSerpData(keyword);
      } catch (error) {
        console.error(`[KEYWORD-RESEARCH] Error fetching SERP data (attempt ${attempt}/${maxRetries}):`, error);
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async researchKeyword(keyword) {
    if (!this.initialized) {
      throw new Error('Keyword research service not initialized');
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Starting comprehensive research for: ${keyword}`);
      
      // Create a directory for this keyword
      const keywordSlug = slugify(keyword);
      const outputDir = path.join(config.paths.research, keywordSlug);
      await localStorage.ensureDirectoryExists(outputDir);
      
      // Get data from each KWRDS endpoint
      console.log(`[KEYWORD-RESEARCH] Fetching related keywords for: ${keyword}`);
      const keywordData = await this.getRelatedKeywordsWithRetry(keyword);
      
      await localStorage.saveFile(
        path.join(outputDir, 'related-keywords.json'),
        keywordData
      );
      
      console.log(`[KEYWORD-RESEARCH] Fetching SERP data for: ${keyword}`);
      const serpData = await this.getSerpDataWithRetry(keyword);
      
      await localStorage.saveFile(
        path.join(outputDir, 'serp-data.json'),
        serpData
      );
      
      // Analyze all gathered data
      const compiledData = {
        keyword,
        keywordData,
        serpData,
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

  async getRelatedKeywords(keyword) {
    if (!this.initialized) {
      throw new Error('Keyword research service not initialized');
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Fetching related keywords for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/related-keywords.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached related keywords for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached related keywords for: ${keyword}`);
      }
      
      const response = await axios.get(`${this.baseUrl}/related-keywords`, {
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
          type: 'related_keywords', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword, 'related-keywords');
      throw this.throwEnhancedError(error, keyword, 'related-keywords');
    }
  }

  async getSerpData(keyword) {
    if (!this.initialized) {
      throw new Error('Keyword research service not initialized');
    }

    try {
      console.log(`[KEYWORD-RESEARCH] Fetching SERP data for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/serp-detailed.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached SERP data for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached SERP data for: ${keyword}`);
      }
      
      const response = await axios.get(`${this.baseUrl}/serp`, {
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
          type: 'serp_data', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword, 'serp');
      throw this.throwEnhancedError(error, keyword, 'serp');
    }
  }

  async fetchAllKwrdsData(keyword) {
    if (!this.initialized) {
      throw new Error('Keyword research service not initialized');
    }

    console.log(`[KEYWORD-RESEARCH] Fetching all KWRDS data for keyword: ${keyword}`);
    
    // Create folder for this keyword's research data
    const keywordSlug = keyword.replace(/\s+/g, '-').toLowerCase();
    const contentFolder = `research/${keywordSlug}`;

    try {
      // Fetch data from all endpoints in parallel
      const [
        keywordsWithVolumes,
        keywordExpansion,
        keywordSuggestions
      ] = await Promise.all([
        this.fetchKeywordsWithVolumes(keyword, contentFolder),
        this.fetchKeywordExpansion(keyword, contentFolder),
        this.fetchKeywordSuggestions(keyword, contentFolder)
      ]);

      // Combine all data
      const combinedData = {
        keyword,
        keywordsWithVolumes,
        keywordExpansion,
        keywordSuggestions,
        timestamp: new Date().toISOString()
      };

      return combinedData;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error fetching all KWRDS data for "${keyword}":`, error);
      throw error;
    }
  }

  async fetchKeywordsWithVolumes(keyword, contentFolder) {
    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keywords with volumes for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `${contentFolder}/keywords-with-volumes.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached keywords with volumes for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached keywords with volumes for: ${keyword}`);
      }
      
      // Make API request
      const endpoint = `${this.baseUrl}${this.endpoints.keywordsWithVolumes}`;
      console.log(`[KEYWORD-RESEARCH] API request to: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
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
      console.log(`[KEYWORD-RESEARCH] Received keywords with volumes response for: ${keyword}`);
      
      // Cache the result
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'keywords_with_volumes', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword, 'keywords-with-volumes');
      throw this.throwEnhancedError(error, keyword, 'keywords-with-volumes');
    }
  }

  async fetchKeywordExpansion(keyword, contentFolder) {
    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keyword expansion for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `${contentFolder}/keyword-expansion.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached keyword expansion for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached keyword expansion for: ${keyword}`);
      }
      
      // Make API request
      const endpoint = `${this.baseUrl}${this.endpoints.keywordExpansion}`;
      console.log(`[KEYWORD-RESEARCH] API request to: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
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
      console.log(`[KEYWORD-RESEARCH] Received keyword expansion response for: ${keyword}`);
      
      // Cache the result
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'keyword_expansion', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword, 'keyword-expansion');
      throw this.throwEnhancedError(error, keyword, 'keyword-expansion');
    }
  }

  async fetchKeywordSuggestions(keyword, contentFolder) {
    try {
      console.log(`[KEYWORD-RESEARCH] Fetching keyword suggestions for: ${keyword}`);
      
      // Check if we have cached data first
      const cacheKey = `${contentFolder}/keyword-suggestions.json`;
      try {
        const cachedData = await contentStorage.getContent(cacheKey);
        if (cachedData && cachedData.data) {
          console.log(`[KEYWORD-RESEARCH] Using cached keyword suggestions for: ${keyword}`);
          return cachedData.data;
        }
      } catch (err) {
        console.log(`[KEYWORD-RESEARCH] No cached keyword suggestions for: ${keyword}`);
      }
      
      // Make API request
      const endpoint = `${this.baseUrl}${this.endpoints.keywordSuggestions}`;
      console.log(`[KEYWORD-RESEARCH] API request to: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
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
      console.log(`[KEYWORD-RESEARCH] Received keyword suggestions response for: ${keyword}`);
      
      // Cache the result
      await contentStorage.storeContent(
        cacheKey,
        data,
        { 
          type: 'keyword_suggestions', 
          keyword,
          timestamp: new Date().toISOString() 
        }
      );
      
      return data;
    } catch (error) {
      this.logApiError(error, keyword, 'keyword-suggestions');
      throw this.throwEnhancedError(error, keyword, 'keyword-suggestions');
    }
  }

  logApiError(error, keyword, endpoint) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    console.error(`[KEYWORD-RESEARCH] API error for ${endpoint} (${keyword}):`, {
      status,
      message: error.message,
      data: errorData,
      endpoint
    });
  }

  throwEnhancedError(error, keyword, endpoint) {
    const enhancedError = new Error(`Error fetching ${endpoint} for keyword "${keyword}": ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.status = error.response?.status;
    enhancedError.endpoint = endpoint;
    enhancedError.keyword = keyword;
    return enhancedError;
  }
}

module.exports = new KeywordResearchService();