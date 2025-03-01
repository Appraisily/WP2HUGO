const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class GoogleAIService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = config.googleAi?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = config.googleAi?.model || 'gemini-1.5-pro';
    this.maxOutputTokens = config.googleAi?.maxOutputTokens || 4000;
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.GOOGLE_AI_API_KEY;
      
      if (!this.apiKey) {
        throw new Error('Google AI API key not found. Please set the GOOGLE_AI_API_KEY environment variable.');
      }
      
      console.log('[GOOGLE-AI] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[GOOGLE-AI] Failed to initialize Google AI service:', error);
      throw error;
    }
  }

  /**
   * Generate a blog post structure using Google AI
   * @param {string} keyword - The keyword to generate structure for
   * @param {object} keywordData - Research data for the keyword
   * @param {object} perplexityData - Perplexity data for the keyword
   * @param {object} serpData - SERP data for the keyword
   * @returns {object} - The generated structure
   */
  async generateStructure(keyword, keywordData, perplexityData, serpData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[GOOGLE-AI] Generating blog post structure for: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-googleai-structure.json`);
      
      if (await localStorage.fileExists(filePath)) {
        console.log(`[GOOGLE-AI] Using cached structure for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // Extract relevant information from the research data
      const perplexityInfo = perplexityData?.response?.choices?.[0]?.message?.content || '';
      
      // Prepare SERP data summary
      const serpTitles = serpData?.organic_results?.map(result => result.title).join('\n- ') || '';
      
      // Construct the prompt for Google AI
      const prompt = `I need to create an SEO-optimized blog post about "${keyword}". Based on the research data provided, please create a detailed content structure that would be attractive to users and well-optimized for search engines.

RESEARCH DATA:
${perplexityInfo}

TOP SEARCH RESULTS:
- ${serpTitles}

Please provide a detailed blog post structure including:

1. A compelling SEO title (60-65 characters max)
2. A meta description (150-160 characters max)
3. An introduction that hooks the reader and clearly states the value of the article
4. A logical H2/H3 heading structure with brief notes about what to include in each section
5. Suggestions for tables, lists, or other formatting elements that would enhance the content
6. A conclusion that summarizes key points and includes a call to action

Make sure the structure is comprehensive, addresses user intent, and covers all important aspects of the topic. The goal is to create content that is more valuable and informative than the current top-ranking pages.`;
      
      // Make API request
      const response = await axios.post(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: this.maxOutputTokens,
            topP: 0.95,
            topK: 64
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
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
      console.error(`[GOOGLE-AI] Error generating structure for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new GoogleAIService(); 