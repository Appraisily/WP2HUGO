const axios = require('axios');

// MOCK PAA SERVICE FOR LOCAL DEVELOPMENT
class PeopleAlsoAskService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://paa.api.kwrds.ai'; // Updated to correct PAA API endpoint
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.PAA_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[PAA] API key not found.');
        
        if (this.isDevelopment) {
          console.log('[PAA] Running in development mode. Using mock implementation.');
        } else {
          console.error('[PAA] Running in production without API key. Service will not function properly.');
          throw new Error('PAA service API key not configured');
        }
      } else {
        console.log('[PAA] API key found. Using real API data.');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PAA] Failed to initialize PAA service:', error);
      
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
   * Get questions with retry logic
   * @param {string} keyword - The keyword to get questions for
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} - The questions data
   */
  async getQuestionsWithRetry(keyword, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[PAA] Getting questions for: "${keyword}" (Attempt ${attempt}/${maxRetries})`);
        return await this.getQuestions(keyword);
      } catch (error) {
        lastError = error;
        console.warn(`[PAA] Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        
        if (attempt < maxRetries) {
          // Wait before next retry (exponential backoff)
          const delay = 1000 * Math.pow(2, attempt - 1);
          console.log(`[PAA] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we got here, all retries failed
    throw lastError;
  }

  async getQuestions(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // In production without an API key, this will fail
    if (!this.isDevelopment && !this.apiKey) {
      throw new Error('PAA service not properly configured with API key');
    }
    
    try {
      // In production or when we have an API key, call the actual API
      if (!this.isDevelopment && this.apiKey) {
        console.log(`[PAA] Calling API for questions about: ${keyword}`);
        
        const response = await axios.get(
          `${this.baseUrl}/people-also-ask`,
          {
            params: {
              keyword: keyword,
              search_country: 'US',
              search_language: 'en'
            },
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': this.apiKey  // Updated to use X-API-KEY as per docs
            }
          }
        );
        
        return response.data;
      }
      
      // Only in development mode, use mock data
      if (this.isDevelopment) {
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
      
      // This should never be reached because we check for isDevelopment || apiKey above
      throw new Error('PAA service not properly configured');
    } catch (error) {
      console.error(`[PAA] Error fetching questions for "${keyword}":`, error.message);
      throw error; // Don't use mock data in production, just propagate the error
    }
  }
}

module.exports = new PeopleAlsoAskService();
  