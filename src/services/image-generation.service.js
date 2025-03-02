/**
 * Image Generation Service
 * 
 * This service generates images based on keywords using an external API.
 * It includes a mock implementation for testing without API access.
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const slugify = require('../utils/slugify');

class ImageGenerationService {
  constructor() {
    this.forceApi = false;
    this.skipImage = false;
    this.mockDelay = 2000; // Simulate API delay in ms
    this.imageServiceUrl = process.env.IMAGE_SERVICE_URL || 'https://image-generation-service-856401495068.us-central1.run.app';
  }

  /**
   * Set whether to force using the API even when cache exists
   * @param {boolean} value - Whether to force API usage
   */
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[IMAGE] Force API set to: ${value}`);
  }

  /**
   * Set whether to skip image generation
   * @param {boolean} value - Whether to skip image generation
   */
  setSkipImage(value) {
    this.skipImage = value;
    console.log(`[IMAGE] Skip image set to: ${value}`);
  }

  /**
   * Generate an image based on a keyword
   * @param {string} keyword - The keyword to generate an image for
   * @returns {Promise<object>} - The image generation result
   */
  async generateImage(keyword) {
    if (this.skipImage) {
      console.log(`[IMAGE] Skipping image generation for: "${keyword}"`);
      return {
        success: true,
        skipped: true,
        keyword,
        imageUrl: null,
        message: 'Image generation skipped as requested'
      };
    }

    console.log(`[IMAGE] Generating image for: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const cachePath = path.join(process.cwd(), 'output', 'images', `${slug}-image.json`);
      
      // Check if cache exists and we're not forcing API usage
      try {
        if (!this.forceApi) {
          const cacheExists = await fs.access(cachePath).then(() => true).catch(() => false);
          if (cacheExists) {
            console.log(`[IMAGE] Using cached image for "${keyword}"`);
            const cachedData = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(cachedData);
          }
        }
      } catch (error) {
        // Cache doesn't exist or is invalid, proceed with generation
      }
      
      // Generate prompt for the image
      const prompt = this.generatePrompt(keyword);
      console.log(`[IMAGE] Generated prompt: "${prompt}"`);
      
      // Check if we have API access
      if (!process.env.IMAGE_SERVICE_API_KEY) {
        console.warn('[IMAGE] API key not found, using mock implementation');
        return this.generateMockImage(keyword, prompt);
      }
      
      try {
        // Make API request
        console.log(`[IMAGE] Calling API for: "${keyword}"`);
        const response = await axios.post(
          `${this.imageServiceUrl}/api/generate`,
          {
            appraiser: {
              id: 'mock-appraiser',
              name: 'Mock Appraiser',
              specialty: 'Content Generation',
              experience: '10+ years'
            },
            customPrompt: prompt
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.IMAGE_SERVICE_API_KEY}`
            }
          }
        );
        
        if (response.data && response.data.data && response.data.data.imageUrl) {
          const result = {
            success: true,
            keyword,
            prompt,
            imageUrl: response.data.data.imageUrl,
            timestamp: new Date().toISOString()
          };
          
          // Save result to cache
          await this.saveToCache(cachePath, result);
          
          return result;
        } else {
          console.error('[IMAGE] Invalid API response:', response.data);
          return this.generateMockImage(keyword, prompt);
        }
      } catch (apiError) {
        console.error(`[IMAGE] API error: ${apiError.message}`);
        return this.generateMockImage(keyword, prompt);
      }
    } catch (error) {
      console.error(`[IMAGE] Error generating image: ${error.message}`);
      return {
        success: false,
        keyword,
        error: error.message
      };
    }
  }

  /**
   * Generate a mock image result for testing
   * @param {string} keyword - The keyword to generate an image for
   * @param {string} prompt - The prompt used for generation
   * @returns {Promise<object>} - The mock image result
   */
  async generateMockImage(keyword, prompt) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    
    const slug = slugify(keyword);
    const mockImageUrl = `https://via.placeholder.com/800x600.png?text=${encodeURIComponent(slug)}`;
    
    const result = {
      success: true,
      keyword,
      prompt,
      imageUrl: mockImageUrl,
      mock: true,
      timestamp: new Date().toISOString()
    };
    
    // Save result to cache
    const cachePath = path.join(process.cwd(), 'output', 'images', `${slug}-image.json`);
    await this.saveToCache(cachePath, result);
    
    return result;
  }

  /**
   * Generate a prompt for image generation based on a keyword
   * @param {string} keyword - The keyword to generate a prompt for
   * @returns {string} - The generated prompt
   */
  generatePrompt(keyword) {
    return `Create a professional, high-quality image representing "${keyword}". 
    The image should be visually appealing, informative, and suitable for a blog post about this topic. 
    Use a clean, modern style with a balanced composition and appropriate colors. 
    Avoid text in the image. Make it look professional and polished.`;
  }

  /**
   * Save result to cache file
   * @param {string} cachePath - Path to save the cache file
   * @param {object} data - Data to save
   */
  async saveToCache(cachePath, data) {
    try {
      // Create output directory if it doesn't exist
      const outputDir = path.dirname(cachePath);
      await fs.mkdir(outputDir, { recursive: true });
      
      await fs.writeFile(cachePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`[IMAGE] Error saving to cache: ${error.message}`);
    }
  }
}

module.exports = new ImageGenerationService(); 