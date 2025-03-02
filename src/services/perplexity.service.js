const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class PerplexityService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = config.perplexity?.baseUrl || 'https://api.perplexity.ai';
    this.useMockData = false;
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.PERPLEXITY_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[PERPLEXITY] Perplexity API key not found. Using mock data for testing.');
        this.useMockData = true;
      }
      
      console.log('[PERPLEXITY] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PERPLEXITY] Failed to initialize Perplexity service:', error);
      this.useMockData = true;
      this.initialized = true; // Still mark as initialized so we can use mock data
      return true;
    }
  }

  /**
   * Generate mock data for testing purposes
   * @param {string} keyword - The keyword to generate mock data for
   * @returns {object} - The mock data
   */
  generateMockData(keyword) {
    console.log(`[PERPLEXITY] Generating mock data for: "${keyword}"`);
    
    return {
      keyword,
      meaning: `An antique value guide is a comprehensive resource that provides information about the worth, history, and significance of antique items. These guides are essential tools for collectors, dealers, appraisers, and enthusiasts who need to determine the value of vintage items, understand market trends, and make informed decisions about purchases, sales, or insurance valuations.`,
      
      key_aspects: [
        "Types of antique value guides (print, online, specialized)",
        "Elements that determine antique values (age, rarity, condition, provenance)",
        "How to use value guides effectively",
        "Limitations of value guides",
        "Historical significance of antique valuation",
        "Relationship between appraisals and value guides",
        "Digital vs. traditional print guides"
      ],
      
      common_questions: [
        {
          question: "How accurate are antique value guides?",
          answer: "Antique value guides provide reasonable estimates but cannot account for all market variables. Their accuracy depends on how recent the guide was published, regional market differences, and item-specific factors. They're best used as starting points rather than definitive valuations."
        },
        {
          question: "What's the difference between price guides and appraisals?",
          answer: "Price guides offer general values based on categories and averages, while appraisals provide item-specific valuations by certified professionals who consider the exact condition, provenance, and market demand for your specific piece."
        },
        {
          question: "Are online or printed antique value guides better?",
          answer: "Online guides typically offer more current values and real-time market data, while printed guides often provide more comprehensive historical context and detailed identification information. Many serious collectors use both formats."
        },
        {
          question: "How often should I update my antique value guides?",
          answer: "For active collectors or dealers, annual updates are recommended as antique values can fluctuate significantly based on market trends. Online subscription services provide the most current information."
        },
        {
          question: "Can antique value guides help identify reproductions?",
          answer: "Quality guides often include information about common reproductions and how to distinguish them from authentic pieces, but for valuable items, expert authentication is still recommended."
        }
      ],
      
      expert_insights: [
        "Professional appraisers recommend cross-referencing multiple value guides rather than relying on a single source",
        "Regional variations in antique values can be significant; items may be worth more in areas where they have historical significance",
        "Condition is typically the most critical factor affecting value, often more important than age",
        "The provenance (documented history) of an antique can significantly increase its value beyond what generic guides suggest",
        "Market trends affect antique values dramatically; popularity of certain styles (like mid-century modern) can cause rapid price increases"
      ],
      
      current_trends: [
        "Shift toward digital and app-based value guides with real-time price tracking",
        "Integration of image recognition technology in newer guides to help with identification",
        "Growing emphasis on sustainability is increasing interest in antiques as eco-friendly alternatives to new production",
        "Changing collector demographics are influencing which antiques command premium prices",
        "Rising importance of online marketplaces in establishing current values"
      ],
      
      statistics: [
        "The global antiques market was valued at approximately $10.2 billion in 2023",
        "Online antique sales have grown by 15-20% annually over the past five years",
        "Approximately 65% of serious collectors now use digital valuation tools alongside traditional guides",
        "The most valuable antiques typically appreciate at 3-5% annually, outperforming inflation",
        "Nearly 80% of professional appraisers use multiple value guides when determining item worth"
      ],
      
      best_practices: [
        "Always check publication dates of value guides to ensure you're using current information",
        "Consider condition carefully when comparing your item to guide examples",
        "Use multiple sources to establish a value range rather than a single price point",
        "For valuable items, supplement guide values with professional appraisals",
        "Understand regional market differences when applying guide values",
        "Learn to identify maker's marks and signatures to ensure accurate identification",
        "Document provenance carefully as it significantly impacts value"
      ],
      
      summary: `Antique value guides are essential tools for anyone interested in collecting, selling, or appraising vintage items. They provide structured frameworks for understanding market values, but should be used with an awareness of their limitations and alongside other research methods. The most effective approach combines traditional guides with digital resources, expert opinions, and an understanding of current market trends.`
    };
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
      const filePath = path.join(config.paths.research, `${slug}-perplexity.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[PERPLEXITY] Using cached data for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, generate it instead of calling the API
      if (this.useMockData) {
        console.log(`[PERPLEXITY] Using mock data for: "${keyword}"`);
        const mockData = this.generateMockData(keyword);
        await localStorage.saveFile(filePath, mockData);
        return mockData;
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
      const filePath = path.join(config.paths.research, `${slug}-perplexity-aspect.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[PERPLEXITY] Using cached data for aspect "${aspect}" of keyword: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, generate it instead of calling the API
      if (this.useMockData) {
        console.log(`[PERPLEXITY] Using mock data for aspect "${aspect}" of keyword: "${keyword}"`);
        // Create a simplified mock response focused on the specific aspect
        const mockData = {
          keyword,
          aspect,
          content: `Detailed information about the "${aspect}" aspect of "${keyword}". This is mock data generated for testing purposes when the API key is not available.`,
          timestamp: new Date().toISOString()
        };
        await localStorage.saveFile(filePath, mockData);
        return mockData;
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