const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class KeywordResearchService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://keywordresearch.api.kwrds.ai'; // Updated to the correct API endpoint
    this.useMockData = false;
    this.forceApi = false;
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[KEYWORD-RESEARCH] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.KWRDS_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[KEYWORD-RESEARCH] KWRDS API key not found.');
        
        // Only use mock data in development environment
        if (this.isDevelopment) {
          console.log('[KEYWORD-RESEARCH] Running in development mode. Using mock data for testing.');
          this.useMockData = true;
        } else {
          console.error('[KEYWORD-RESEARCH] Running in production without API key. Service will not function properly.');
          this.useMockData = false;
        }
      } else {
        console.log('[KEYWORD-RESEARCH] API key found. Using real API data.');
        this.useMockData = false;
      }
      
      console.log('[KEYWORD-RESEARCH] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[KEYWORD-RESEARCH] Failed to initialize keyword research service:', error);
      
      // Only use mock data in development
      if (this.isDevelopment) {
        this.useMockData = true;
        this.initialized = true;
        return true;
      } else {
        // In production, don't initialize if there's an error
        throw new Error(`Failed to initialize keyword research service: ${error.message}`);
      }
    }
  }

  /**
   * Generate mock keyword research data - ONLY USED IN DEVELOPMENT
   * @param {string} keyword - The keyword to generate mock data for
   * @returns {object} - The mock data
   */
  generateMockData(keyword) {
    if (!this.isDevelopment) {
      throw new Error('Mock data generation is only available in development environment');
    }
    
    console.log(`[KEYWORD-RESEARCH] Generating mock data for: "${keyword}"`);
    
    // Generate random values for metrics
    const searchVolume = Math.floor(Math.random() * 10000) + 1000;
    const cpc = (Math.random() * 5).toFixed(2);
    const competition = Math.random().toFixed(2);
    const keywordDifficulty = Math.floor(Math.random() * 100);
    
    // Generate related keywords
    const relatedKeywords = [
      `${keyword} guide`,
      `how to ${keyword}`,
      `best ${keyword}`,
      `${keyword} tips`,
      `${keyword} examples`
    ];
    
    // Generate SERP features
    const serpFeatures = [
      'featured_snippet',
      'related_questions',
      'image_pack',
      'knowledge_panel',
      'local_pack'
    ];
    
    // Shuffle and take a random subset of SERP features
    const selectedFeatures = serpFeatures
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * serpFeatures.length) + 1);
    
    return {
      keyword,
      metrics: {
        monthly_search_volume: searchVolume,
        cpc: cpc,
        competition: competition,
        keyword_difficulty: keywordDifficulty
      },
      related_keywords: relatedKeywords.map(keyword => ({
        keyword,
        monthly_search_volume: Math.floor(Math.random() * 5000) + 100,
        cpc: (Math.random() * 3).toFixed(2),
        competition: Math.random().toFixed(2),
        keyword_difficulty: Math.floor(Math.random() * 100)
      })),
      serp_features: selectedFeatures,
      intents: [
        {
          intent: 'informational',
          confidence: Math.random().toFixed(2)
        },
        {
          intent: 'commercial',
          confidence: (Math.random() * 0.5).toFixed(2)
        },
        {
          intent: 'transactional',
          confidence: (Math.random() * 0.3).toFixed(2)
        }
      ],
      trend: {
        trend_data: Array.from({ length: 12 }, () => ({
          month: 'Month',
          volume: Math.floor(Math.random() * 10000) + 500
        })),
        trend_direction: Math.random() > 0.5 ? 'increasing' : 'decreasing'
      }
    };
  }

  /**
   * Get keyword data - main method called by data collector
   * @param {string} keyword - The keyword to research
   * @returns {object} - The keyword data
   */
  async getKeywordData(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[KEYWORD-RESEARCH] Getting keyword data for: "${keyword}"`);
    
    try {
      // Research the keyword
      const researchData = await this.researchKeyword(keyword);
      
      // Get related keywords with retries
      let relatedKeywords = null;
      let serpData = null;
      
      // Attempt to get related keywords with retries
      relatedKeywords = await this.getRelatedKeywordsWithRetry(keyword);
      
      // Get SERP data with retries
      serpData = await this.getSerpDataWithRetry(keyword);
      
      // Combine all data
      return {
        keyword,
        researchData,
        relatedKeywords,
        serp: serpData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error getting keyword data: ${error.message}`);
      
      // In development mode only, we can use mock data
      if (this.isDevelopment && this.useMockData) {
        console.warn('[KEYWORD-RESEARCH] Using mock data because running in development mode');
        const mockResearch = this.generateMockData(keyword);
        return {
          keyword,
          researchData: mockResearch,
          relatedKeywords: mockResearch.related_keywords,
          serp: { results: [] },
          timestamp: new Date().toISOString(),
          isMock: true
        };
      }
      
      // In production, always propagate the error
      throw error;
    }
  }

  /**
   * Get related keywords with retry logic
   * @param {string} keyword - The keyword to get related keywords for
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Array>} - The related keywords
   */
  async getRelatedKeywordsWithRetry(keyword, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[KEYWORD-RESEARCH] Getting related keywords for: "${keyword}" (Attempt ${attempt}/${maxRetries})`);
        return await this.getRelatedKeywords(keyword);
      } catch (error) {
        lastError = error;
        console.warn(`[KEYWORD-RESEARCH] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before next retry (exponential backoff)
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[KEYWORD-RESEARCH] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError;
  }

  /**
   * Get SERP data with retry logic
   * @param {string} keyword - The keyword to get SERP data for
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} - The SERP data
   */
  async getSerpDataWithRetry(keyword, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[KEYWORD-RESEARCH] Getting SERP data for: "${keyword}" (Attempt ${attempt}/${maxRetries})`);
        return await this.getSerpData(keyword);
      } catch (error) {
        lastError = error;
        console.warn(`[KEYWORD-RESEARCH] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before next retry (exponential backoff)
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[KEYWORD-RESEARCH] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError;
  }

  /**
   * Research keyword data
   * @param {string} keyword - The keyword to research
   * @returns {object} - The keyword data
   */
  async researchKeyword(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[KEYWORD-RESEARCH] Researching keyword: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-kwrds.json`);
      
      if (!this.forceApi && await localStorage.fileExists(filePath)) {
        console.log(`[KEYWORD-RESEARCH] Using cached data for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If in development and using mock data, generate mock data
      if (this.isDevelopment && this.useMockData) {
        const mockData = this.generateMockData(keyword);
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Otherwise, call the API with the proper endpoint
      console.log(`[KEYWORD-RESEARCH] Calling API for: "${keyword}"`);
      const response = await axios.post(
        `${this.baseUrl}/keywords-with-volumes`,
        {
          search_question: keyword,
          search_country: "en-US"
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey
          }
        }
      );
      
      // Save data to file
      await localStorage.saveFile(filePath, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error researching keyword "${keyword}":`, error);
      
      // Only use mock data in development
      if (this.isDevelopment && this.useMockData) {
        console.log(`[KEYWORD-RESEARCH] Generating mock data in development mode`);
        const mockData = this.generateMockData(keyword);
        
        // Save mock data
        const slug = slugify(keyword);
        const filePath = path.join(config.paths.research, `${slug}-kwrds.json`);
        await localStorage.saveFile(filePath, mockData);
        
        return mockData;
      }
      
      // Otherwise, propagate the error
      throw new Error(`API error while researching keyword "${keyword}": ${error.message}`);
    }
  }

  /**
   * Get related keywords for a keyword
   * @param {string} keyword - The seed keyword
   * @returns {array} - Array of related keywords
   */
  async getRelatedKeywords(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[KEYWORD-RESEARCH] Getting related keywords for: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-related-keywords.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[KEYWORD-RESEARCH] Using cached related keywords for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If in development and using mock data, use mock data
      if (this.isDevelopment && this.useMockData) {
        const mockData = {
          keyword,
          related_keywords: this.generateMockData(keyword).related_keywords,
          timestamp: new Date().toISOString()
        };
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Make API request to the correct endpoint
      const response = await axios.post(
        `${this.baseUrl}/keywords-with-volumes`, 
        { 
          search_question: keyword,
          search_country: "en-US"
        }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey
          }
        }
      );
      
      const data = response.data;
      
      // Transform the data to our expected format
      const transformedData = {
        keyword,
        related_keywords: Object.keys(data.keyword || {}).map(index => ({
          keyword: data.keyword[index],
          volume: data.volume ? data.volume[index] : 0,
          cpc: data.cpc ? data.cpc[index] : 0,
          competition: data.competition_value ? data.competition_value[index] : 'LOW',
          intent: data['search-intent'] ? data['search-intent'][index] : 'informational'
        })),
        timestamp: new Date().toISOString()
      };
      
      // Save research data
      await localStorage.saveFile(filePath, transformedData);
      
      return transformedData;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error getting related keywords for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get SERP data for a keyword
   * @param {string} keyword - The keyword to get SERP data for
   * @returns {object} - The SERP data
   */
  async getSerpData(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[KEYWORD-RESEARCH] Getting SERP data for keyword: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-serp-data.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[KEYWORD-RESEARCH] Using cached SERP data for keyword: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If in development and using mock data, use mock data
      if (this.isDevelopment && this.useMockData) {
        const mockData = {
          keyword,
          serp_results: [
            {
              title: `Top ${keyword} Guide`,
              url: `https://example.com/${keyword.replace(/\s+/g, '-')}`,
              snippet: `Comprehensive guide about ${keyword}. Learn everything you need to know.`
            }
          ],
          timestamp: new Date().toISOString()
        };
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Make API request - Note: This endpoint might need to be updated based on the KWRDS API documentation
      const response = await axios.post(
        `${this.baseUrl}/serp-data`, 
        { keyword }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': this.apiKey
          }
        }
      );
      
      const data = response.data;
      
      // Save research data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error getting SERP data for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new KeywordResearchService();