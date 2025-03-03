/**
 * Perplexity Service
 * 
 * This service provides comprehensive information about keywords using
 * Perplexity AI. It includes a mock implementation for testing without API access.
 */

const fs = require('fs').promises;
const path = require('path');
const slugify = require('../utils/slugify');

class PerplexityService {
  constructor() {
    this.forceApi = false;
    this.mockDelay = 1800; // Simulate API delay in ms
    this.isInitialized = false;
  }

  /**
   * Initialize the Perplexity service
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      if (process.env.PERPLEXITY_API_KEY) {
        console.log('[PERPLEXITY] API key found, service initialized with API access');
      } else {
        console.warn('[PERPLEXITY] API key not found. Using mock data for testing.');
      }
      
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'output', 'research');
      await fs.mkdir(outputDir, { recursive: true });
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error(`[PERPLEXITY] Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set whether to force using the API even when cache exists
   * @param {boolean} value - Whether to force API usage
   */
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[PERPLEXITY] Force API set to: ${value}`);
  }

  /**
   * Query Perplexity AI for comprehensive information about a keyword
   * @param {string} keyword - The keyword to query
   * @returns {Promise<object>} - The query response
   */
  async query(keyword) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    console.log(`[PERPLEXITY] Querying for information about: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const cachePath = path.join(process.cwd(), 'output', 'research', `${slug}-perplexity.json`);
      
      // Check if cache exists and we're not forcing API usage
      try {
        if (!this.forceApi) {
          const cacheExists = await fs.access(cachePath).then(() => true).catch(() => false);
          if (cacheExists) {
            console.log(`[PERPLEXITY] Using cached information for "${keyword}"`);
            const cachedData = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(cachedData);
          }
        }
      } catch (error) {
        // Cache doesn't exist or is invalid, proceed with query
      }
      
      // Check if we have API access
      if (!process.env.PERPLEXITY_API_KEY) {
        console.warn('[PERPLEXITY] API key not found, using mock implementation');
        return this.generateMockResponse(keyword);
      }
      
      // TODO: Implement real API call to Perplexity
      console.warn('[PERPLEXITY] Real API implementation not available, using mock');
      return this.generateMockResponse(keyword);
    } catch (error) {
      console.error(`[PERPLEXITY] Error querying information: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate mock Perplexity response for testing
   * @param {string} keyword - The keyword to generate response for
   * @returns {Promise<object>} - The mock response
   */
  async generateMockResponse(keyword) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    
    // Create mock response
    const response = {
      keyword,
      response: {
        id: `mock-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'perplexity-mock-model',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: this.generateMockContent(keyword)
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 800,
          total_tokens: 950
        }
      },
      timestamp: new Date().toISOString()
    };
    
    // Save response to cache
    const slug = slugify(keyword);
    const cachePath = path.join(process.cwd(), 'output', 'research', `${slug}-perplexity.json`);
    
    // Create output directory if it doesn't exist
    const outputDir = path.dirname(cachePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    try {
      await fs.writeFile(cachePath, JSON.stringify(response, null, 2));
    } catch (error) {
      console.error(`[PERPLEXITY] Error saving response to cache: ${error.message}`);
    }
    
    return response;
  }

  /**
   * Generate mock content for a keyword
   * @param {string} keyword - The keyword to generate content for
   * @returns {string} - The mock content
   */
  generateMockContent(keyword) {
    return `# Comprehensive Information About ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}

## Overview
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} refers to a significant concept or practice in its respective field. It encompasses various aspects including methodologies, tools, strategies, and applications that have evolved over time to address specific needs and challenges.

## Key Aspects
1. **Definition and Scope**: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} can be defined as a systematic approach to organizing, analyzing, and implementing solutions within its domain. Its scope extends across multiple disciplines and contexts.

2. **Historical Development**: The concept of ${keyword} has evolved significantly over the past decades. Initially developed as a response to specific challenges, it has grown to encompass broader applications and methodologies.

3. **Core Principles**: Several fundamental principles underpin ${keyword}, including:
   - Systematic analysis and planning
   - Iterative improvement and adaptation
   - Integration of best practices and standards
   - Focus on measurable outcomes and results

4. **Common Applications**: ${keyword.charAt(0).toUpperCase() + keyword.slice(1)} is applied across various contexts, including:
   - Professional settings to enhance productivity and efficiency
   - Educational environments to improve learning outcomes
   - Personal development to achieve specific goals
   - Organizational frameworks to optimize processes

5. **Benefits and Advantages**: Implementing ${keyword} effectively can lead to:
   - Improved efficiency and productivity
   - Enhanced quality and consistency
   - Better decision-making through structured approaches
   - Increased adaptability to changing conditions

6. **Challenges and Limitations**: Despite its benefits, ${keyword} faces certain challenges:
   - Implementation complexity in diverse environments
   - Resistance to adoption in traditional settings
   - Resource requirements for effective implementation
   - Balancing structure with flexibility

7. **Best Practices**: Experts recommend the following best practices for ${keyword}:
   - Start with clear objectives and expectations
   - Implement incrementally with regular evaluation
   - Adapt approaches based on specific contexts
   - Continuously learn and incorporate new insights

8. **Future Trends**: The field of ${keyword} continues to evolve, with emerging trends including:
   - Integration with digital technologies and automation
   - Emphasis on customization and personalization
   - Focus on sustainability and long-term impact
   - Cross-disciplinary applications and methodologies

## Expert Insights
Experts in the field of ${keyword} emphasize the importance of a balanced approach that combines structured methodologies with adaptability to specific contexts. They note that successful implementation requires both technical knowledge and an understanding of the human factors involved.

## Conclusion
${keyword.charAt(0).toUpperCase() + keyword.slice(1)} represents a valuable approach to addressing complex challenges across various domains. By understanding its principles, applications, and best practices, individuals and organizations can leverage its benefits while mitigating potential limitations.`;
  }
}

module.exports = new PerplexityService();