const axios = require('axios');
const { getSecret } = require('../utils/secrets');
const contentStorage = require('../utils/storage');
const config = require('../config');

// MOCK SERP SERVICE FOR LOCAL DEVELOPMENT
class SerpService {
  constructor() {
    this.apiUrl = 'https://keywordresearch.api.kwrds.ai/serp';
    this.apiKey = null;
    this.initialized = false;
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
        console.warn('[SERP] KWRDS API key not found. Using mock data instead.');
        return this.initializeMock();
      }
      
      console.log('[SERP] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[SERP] Service initialization failed:', error);
      
      // Fall back to mock implementation if in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SERP] Development mode: Using mock data due to initialization error.');
        return this.initializeMock();
      }
      
      throw error;
    }
  }
  
  async initializeMock() {
    console.log('[SERP] Initializing mock SERP service');
    this.useMockData = true;
    this.initialized = true;
    return true;
  }

  async getSearchResults(keyword, volume = 0) {
    if (this.useMockData) {
      return this.getMockSearchResults(keyword, volume);
    }
    
    try {
      // Check cache first
      console.log('[SERP] Checking cache for keyword:', keyword);
      const cacheResult = await this.checkCache(keyword);
      
      if (cacheResult) {
        console.log('[SERP] Cache hit for keyword:', keyword);
        return cacheResult.data;
      }

      console.log('[SERP] Fetching SERP data for keyword:', keyword);

      const response = await axios({
        method: 'post',
        url: this.apiUrl,
        data: {
          search_question: keyword,
          search_country: 'en-US',
          volume
        },
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      // Cache the result
      await this.cacheResult(keyword, data);

      return data;
    } catch (error) {
      console.error('[SERP] Error fetching SERP data:', error);
      // If the API call fails, fall back to mock data
      return this.getMockSearchResults(keyword, volume);
    }
  }
  
  async checkCache(keyword) {
    try {
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/serp-data.json`;
      return await contentStorage.getContent(cacheKey);
    } catch (error) {
      console.log('[SERP] No cache found for keyword:', keyword);
      return null;
    }
  }

  async cacheResult(keyword, data) {
    try {
      const cacheKey = `research/${keyword.replace(/\s+/g, '-').toLowerCase()}/serp-data.json`;
      await contentStorage.storeContent(cacheKey, data, {
        type: 'serp_data',
        keyword,
        timestamp: new Date().toISOString()
      });
      console.log('[SERP] Cached result for keyword:', keyword);
    } catch (error) {
      console.error('[SERP] Error caching result:', error);
    }
  }
  
  async getMockSearchResults(keyword, volume = 0) {
    console.log('[SERP] Getting mock search results for:', keyword);
    
    return {
      keyword,
      volume,
      serp: [
        {
          title: `Complete Guide to ${keyword}: Value, History, and Market Trends`,
          url: `https://www.example.com/antiques/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
          snippet: `Comprehensive information about ${keyword} including value ranges, historical context, and current market trends. Learn what makes these items collectible and valuable.`
        },
        {
          title: `How to Identify Authentic ${keyword} - Collector's Guide`,
          url: `https://www.collectorsweekly.com/guides/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
          snippet: `Expert tips for identifying authentic ${keyword}. Learn about maker's marks, materials, craftsmanship, and how to spot reproductions and fakes.`
        },
        {
          title: `${keyword} for Sale | Top Rated Dealer | Authentic Pieces`,
          url: `https://www.antiquestore.com/shop/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
          snippet: `Browse our selection of authentic ${keyword} with certificate of authenticity. We ship worldwide. Prices ranging from $200-$5000 based on condition and rarity.`
        },
        {
          title: `The History of ${keyword} - Museum Collection`,
          url: `https://www.museum.org/collections/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
          snippet: `Explore the fascinating history of ${keyword} through our museum's digital collection. View rare examples from the 18th to early 20th century with detailed historical context.`
        },
        {
          title: `Recent Auction Results for ${keyword} - Price Guide`,
          url: `https://www.auctionhouse.com/results/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
          snippet: `View recent auction results for ${keyword} from major auction houses. Price trends, notable sales, and market analysis updated monthly.`
        }
      ],
      features: [
        "knowledge_panel",
        "related_questions",
        "images",
        "shopping_results",
        "top_stories"
      ]
    };
  }
}

module.exports = new SerpService();
  