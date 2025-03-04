const axios = require('axios');

// MOCK SERP SERVICE FOR LOCAL DEVELOPMENT
class SerpService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://serp.api.kwrds.ai'; // Updated to correct SERP API endpoint
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.SERP_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[SERP] API key not found.');
        
        if (this.isDevelopment) {
          console.log('[SERP] Running in development mode. Using mock implementation.');
        } else {
          console.error('[SERP] Running in production without API key. Service will not function properly.');
          throw new Error('SERP service API key not configured');
        }
      } else {
        console.log('[SERP] API key found. Using real API data.');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[SERP] Failed to initialize SERP service:', error);
      
      if (this.isDevelopment) {
        // In development, we can continue with a mock implementation
        this.initialized = true;
        return true;
      } else {
        // In production, fail initialization
        throw error;
      }
    }
  }

  /**
   * Get search results with retry logic
   * @param {string} keyword - The keyword to get search results for
   * @param {number} volume - The search volume
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} - The search results data
   */
  async getSearchResultsWithRetry(keyword, volume = 0, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[SERP] Getting search results for: "${keyword}" (Attempt ${attempt}/${maxRetries})`);
        return await this.getSearchResults(keyword, volume);
      } catch (error) {
        lastError = error;
        console.warn(`[SERP] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before next retry (exponential backoff)
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[SERP] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError;
  }

  async getSearchResults(keyword, volume = 0) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In production without an API key, this will fail
    if (!this.isDevelopment && !this.apiKey) {
      throw new Error('SERP service not properly configured with API key');
    }
    
    try {
      // In production or when we have an API key, call the actual API
      if (!this.isDevelopment && this.apiKey) {
        console.log(`[SERP] Calling API for search results about: ${keyword}`);
        
        const response = await axios.get(
          `${this.baseUrl}/search`,
          {
            params: {
              keyword: keyword,
              search_country: 'US', 
              search_language: 'en'
            },
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.apiKey // Updated to use X-API-KEY as per kwrds.ai docs
            }
          }
        );
        
        return response.data;
      }
      
      // Only in development mode, use mock data
      if (this.isDevelopment) {
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
            "shopping_results"
          ],
          timestamp: new Date().toISOString()
        };
      }
      
      // This should never be reached because we check for isDevelopment || apiKey above
      throw new Error('SERP service not properly configured');
    } catch (error) {
      console.error(`[SERP] Error fetching search results for "${keyword}":`, error.message);
      throw error; // Don't use mock data in production, just propagate the error
    }
  }
}

module.exports = new SerpService();
  