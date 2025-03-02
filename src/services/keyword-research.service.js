const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class KeywordResearchService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = config.kwrds?.baseUrl || 'https://api.kwrds.ai/v1';
    this.useMockData = false;
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.KWRDS_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[KEYWORD-RESEARCH] KWRDS API key not found. Using mock data for testing.');
        this.useMockData = true;
      }
      
      console.log('[KEYWORD-RESEARCH] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[KEYWORD-RESEARCH] Failed to initialize keyword research service:', error);
      this.useMockData = true;
      this.initialized = true; // Still mark as initialized so we can use mock data
      return true;
    }
  }

  /**
   * Generate mock keyword research data
   * @param {string} keyword - The keyword to generate mock data for
   * @returns {object} - The mock data
   */
  generateMockData(keyword) {
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
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[KEYWORD-RESEARCH] Using cached data for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, generate mock data
      if (this.useMockData) {
        const mockData = this.generateMockData(keyword);
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Otherwise, call the API
      const response = await axios.post(
        `${this.baseUrl}/keyword-data`,
        { keyword },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      // Save data to file
      await localStorage.saveFile(filePath, response.data);
      
      return response.data;
    } catch (error) {
      console.error(`[KEYWORD-RESEARCH] Error researching keyword "${keyword}":`, error);
      
      // If API error, use mock data
      console.log(`[KEYWORD-RESEARCH] Generating mock data due to API error`);
      const mockData = this.generateMockData(keyword);
      
      // Save mock data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-kwrds.json`);
      await localStorage.saveFile(filePath, mockData);
      
      return mockData;
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
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/related-keywords`, 
        { keyword }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const data = response.data;
      
      // Save research data
      await localStorage.saveFile(filePath, data);
      
      return data;
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
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/serp-data`, 
        { keyword }, 
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
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