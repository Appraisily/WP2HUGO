const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const config = require('../config');

// MOCK PAA SERVICE FOR LOCAL DEVELOPMENT
class PeopleAlsoAskService {
  constructor() {
    this.apiUrl = 'https://paa.api.kwrds.ai/people-also-ask';
    this.apiKey = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Get API key from Secret Manager or environment variable
      try {
        this.apiKey = await getSecret(config.secretNames.kwrdsApiKey);
        console.log('[PAA] Successfully retrieved KWRDS API key from Secret Manager');
      } catch (secretError) {
        console.warn(`[PAA] Could not retrieve API key from Secret Manager: ${secretError.message}`);
        // Fallback to direct environment variable
        this.apiKey = process.env.KWRDS_API_KEY;
      }

      if (!this.apiKey) {
        console.warn('[PAA] KWRDS API key not found. Using mock data instead.');
        return this.initializeMock();
      }
      
      console.log('[PAA] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PAA] Service initialization failed:', error);
      
      // Fall back to mock implementation if in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[PAA] Development mode: Using mock data due to initialization error.');
        return this.initializeMock();
      }
      
      throw error;
    }
  }
  
  async initializeMock() {
    console.log('[PAA] Initializing mock PAA service');
    this.useMockData = true;
    this.initialized = true;
    return true;
  }

  async getQuestions(keyword) {
    if (this.useMockData) {
      return this.getMockQuestions(keyword);
    }
    
    try {
      console.log('[PAA] Checking cache for keyword:', keyword);
      const cacheResult = await this.checkCache(keyword);
      
      if (cacheResult) {
        console.log('[PAA] Cache hit for keyword:', keyword);
        return cacheResult.data;
      }

      console.log('[PAA] Fetching PAA data for keyword:', keyword);
      
      const response = await axios.get(this.apiUrl, {
        params: {
          keyword,
          search_country: 'US',
          search_language: 'en',
          'X-API-KEY': this.apiKey
        }
      });

      const data = response.data;
      
      // Cache the result
      await this.cacheResult(keyword, data);

      return data;
    } catch (error) {
      console.error('[PAA] Error fetching PAA data:', error);
      // If the API call fails, fall back to mock data
      return this.getMockQuestions(keyword);
    }
  }
  
  async checkCache(keyword) {
    try {
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/paa-data.json`;
      return await contentStorage.getContent(cacheKey);
    } catch (error) {
      console.log('[PAA] No cache found for keyword:', keyword);
      return null;
    }
  }

  async cacheResult(keyword, data) {
    try {
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/paa-data.json`;
      await contentStorage.storeContent(cacheKey, data, {
        type: 'paa_data',
        keyword,
        timestamp: new Date().toISOString()
      });
      console.log('[PAA] Cached result for keyword:', keyword);
    } catch (error) {
      console.error('[PAA] Error caching result:', error);
    }
  }

  async getMockQuestions(keyword) {
    console.log('[PAA] Getting mock questions for:', keyword);
    
    return {
      keyword,
      results: [
        {
          question: `What is the value of ${keyword}?`,
          answer: `The value of ${keyword} depends on factors like condition, rarity, and provenance. Prices typically range from $100 to $5,000 for common items, with rare pieces commanding much higher prices.`
        },
        {
          question: `How can I identify authentic ${keyword}?`,
          answer: `To identify authentic ${keyword}, look for maker's marks, examine materials and craftsmanship, research the design period, and consider getting an appraisal from a reputable antiques dealer.`
        },
        {
          question: `Where can I buy ${keyword}?`,
          answer: `You can purchase ${keyword} from antique shops, specialty dealers, auction houses, online marketplaces like eBay or Etsy, estate sales, and antique fairs or shows.`
        },
        {
          question: `How do I care for ${keyword}?`,
          answer: `To care for ${keyword}, keep it away from direct sunlight and extreme temperature changes, clean gently with appropriate methods for the material, handle with clean hands, and store properly to prevent damage.`
        },
        {
          question: `Are ${keyword} a good investment?`,
          answer: `${keyword} can be a good investment if you focus on quality pieces with historical significance or from renowned makers. The market can fluctuate, so it's best to buy pieces you also enjoy for their aesthetic and historical value.`
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PeopleAlsoAskService();
  