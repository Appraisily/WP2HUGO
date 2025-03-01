const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class PerplexityService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://api.perplexity.ai';
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.PERPLEXITY_API_KEY;
      
      if (!this.apiKey) {
        throw new Error('Perplexity API key not found. Please set the PERPLEXITY_API_KEY environment variable.');
      }
      
      console.log('[PERPLEXITY] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Failed to initialize Perplexity service:', error);
      throw error;
    }
  }

  /**
   * Query the Perplexity API for information about a keyword
   * @param {string} keyword - The keyword to query about
   * @returns {object} - The response data
   */
  async query(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[PERPLEXITY] Querying about: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-perplexity-data.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[PERPLEXITY] Using cached data for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // Construct the prompt for Perplexity
      const prompt = `I need comprehensive information about "${keyword}" for creating an SEO-optimized blog post. Please provide:
1. A thorough explanation of what "${keyword}" means and its significance
2. Key aspects or components to cover when discussing "${keyword}"
3. Common questions people have about "${keyword}"
4. Expert insights or advice related to "${keyword}"
5. Current trends or developments related to "${keyword}"
6. Relevant statistics, if applicable
7. Best practices or recommendations related to "${keyword}"

Please provide detailed, accurate, and up-to-date information that would be valuable for readers interested in this topic.`;
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "sonar-medium-online",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant that provides comprehensive, accurate information for creating SEO-optimized blog content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const data = {
        keyword,
        timestamp: new Date().toISOString(),
        response: response.data
      };
      
      // Save response data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[PERPLEXITY] Error querying about "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get specific information about a keyword aspect
   * @param {string} keyword - The main keyword
   * @param {string} aspect - The specific aspect to query about
   * @returns {object} - The response data
   */
  async queryAspect(keyword, aspect) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[PERPLEXITY] Querying about aspect "${aspect}" for keyword: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(`${keyword}-${aspect}`);
      const filePath = path.join(config.paths.research, `${slug}-perplexity-data.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[PERPLEXITY] Using cached data for aspect "${aspect}" of keyword: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // Construct the prompt for the specific aspect
      const prompt = `I need detailed information about the "${aspect}" aspect of "${keyword}" for creating an SEO-optimized blog post. Please provide comprehensive, accurate, and helpful information specifically focused on this aspect.`;
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: "sonar-medium-online",
          messages: [
            {
              role: "system",
              content: "You are a helpful AI assistant that provides comprehensive, accurate information for creating SEO-optimized blog content."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1500
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const data = {
        keyword,
        aspect,
        timestamp: new Date().toISOString(),
        response: response.data
      };
      
      // Save response data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[PERPLEXITY] Error querying about aspect "${aspect}" for keyword "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new PerplexityService();