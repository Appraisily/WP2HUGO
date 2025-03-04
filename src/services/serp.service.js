const axios = require('axios');

// MOCK SERP SERVICE FOR LOCAL DEVELOPMENT
class SerpService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://keywordresearch.api.kwrds.ai'; // Correct SERP API endpoint
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.SERP_API_KEY || process.env.KWRDS_API_KEY; // Also try KWRDS_API_KEY as fallback
      
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
        
        // Updated to use POST with the correct request body format
        const response = await axios.post(
          `${this.baseUrl}/serp`,
          {
            search_question: keyword,
            search_country: "en-US",
            volume: volume || 0
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.apiKey
            }
          }
        );
        
        return response.data;
      }
      
      // Only in development mode, use mock data
      if (this.isDevelopment) {
        console.log('[SERP] Getting mock search results for:', keyword);
        
        // Updated mock data structure to match API response
        return {
          pasf: [
            `${keyword} near me`,
            `best ${keyword}`,
            `${keyword} history`,
            `${keyword} types`,
            `how to find ${keyword}`,
            `${keyword} value`,
            `${keyword} prices`,
            `${keyword} collectors`
          ],
          pasf_trending: [
            `best ${keyword}`,
            `${keyword} value`
          ],
          serp: [
            {
              title: `Complete Guide to ${keyword}: Value, History, and Market Trends`,
              url: `https://www.example.com/antiques/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Comprehensive information about ${keyword} including value ranges, historical context, and current market trends. Learn what makes these items collectible and valuable.`,
              est_monthly_traffic: Math.floor(Math.random() * 100000) + 50000,
              favicon: "data:image/webp;base64,UklGRs4BAABXRUJQVlA4IMIBAABwCgCdASo4ADgAPjEOjEYiEREJgCADBLSACKT/T/yO4gjFb5n+Of5GQRr+q+bhqLfPE7APaJ9H+wV0nlGkx79FyYOXb9MiloJ+c/glFuMlok5rYLwgqxGTH6EsAAD"
            },
            {
              title: `How to Identify Authentic ${keyword} - Collector's Guide`,
              url: `https://www.collectorsweekly.com/guides/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Expert tips for identifying authentic ${keyword}. Learn about maker's marks, materials, craftsmanship, and how to spot reproductions and fakes.`,
              est_monthly_traffic: Math.floor(Math.random() * 50000) + 20000,
              favicon: "data:image/webp;base64,UklGRs4BAABXRUJQVlA4IMIBAABwCgCdASo4ADgAPjEOjEYiEREJgCADBLSACKT/T/yO4gjFb5n+Of5GQRr+q+bhqLfPE7APaJ9H+wV0nlGkx79FyYOXb9MiloJ+c/glFuMlok5rYLwgqxGTH6EsAAD"
            },
            {
              title: `${keyword} for Sale | Top Rated Dealer | Authentic Pieces`,
              url: `https://www.antiquestore.com/shop/${keyword.replace(/\s+/g, '-').toLowerCase()}`,
              snippet: `Browse our selection of authentic ${keyword} with certificate of authenticity. We ship worldwide. Prices ranging from $200-$5000 based on condition and rarity.`,
              est_monthly_traffic: Math.floor(Math.random() * 40000) + 10000,
              favicon: "data:image/webp;base64,UklGRs4BAABXRUJQVlA4IMIBAABwCgCdASo4ADgAPjEOjEYiEREJgCADBLSACKT/T/yO4gjFb5n+Of5GQRr+q+bhqLfPE7APaJ9H+wV0nlGkx79FyYOXb9MiloJ+c/glFuMlok5rYLwgqxGTH6EsAAD"
            }
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
  