/**
 * Image Generation Service
 * Integrates with the image-generation-service submodule to generate images for SEO content
 */

const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class ImageGenerationService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'http://localhost:3001'; // Default to local development
    this.maxRetries = 3;
  }

  /**
   * Initialize the Image Generation Service
   */
  async initialize() {
    try {
      this.apiKey = process.env.IMAGEKIT_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[IMAGE-GEN] ImageKit API key not found in environment variables');
        console.warn('[IMAGE-GEN] Some image generation features may not work correctly');
      } else {
        console.log('[IMAGE-GEN] API key found, service is ready');
      }

      // Ensure the required output directories exist
      const imageOutputDir = path.join(config.paths.output, 'images');
      await fs.mkdir(imageOutputDir, { recursive: true });

      this.initialized = true;
      console.log('[IMAGE-GEN] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[IMAGE-GEN] Failed to initialize image generation service:', error);
      throw error;
    }
  }

  /**
   * Generate an image for a keyword and its SEO content
   * @param {string} keyword - The keyword for the SEO content
   * @param {object} structureData - The structure data generated for the keyword
   * @returns {object} Image generation result with URL
   */
  async generateImage(keyword, structureData) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[IMAGE-GEN] Generating image for keyword: "${keyword}"`);

    try {
      const slug = slugify(keyword);
      const cacheFileName = `${slug}-image.json`;
      const cachePath = path.join(config.paths.output, 'images', cacheFileName);

      // Check if we already have this image cached
      if (await localStorage.fileExists(cachePath)) {
        console.log(`[IMAGE-GEN] Image for "${keyword}" already exists, using cached result`);
        return await localStorage.readFile(cachePath);
      }

      // Prepare the prompt based on the SEO content structure
      let prompt = this.createPromptFromStructure(keyword, structureData);

      // Prepare data for image generation
      const imageData = {
        id: slug,
        name: keyword,
        // The image generator service expects an "appraiser" object
        // We'll structure our data to fit this format
        appraiser: {
          id: slug,
          name: keyword,
          specialty: structureData.metaDescription || keyword,
          experience: 'SEO content'
        },
        customPrompt: prompt
      };

      // For local development, return a mock result
      if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
        const mockResult = this.getMockImageResult(keyword, slug);
        await localStorage.saveFile(cachePath, mockResult);
        return mockResult;
      }

      // For production, attempt to call the image generation service
      try {
        // Try to call local service first (if available)
        console.log('[IMAGE-GEN] Attempting to call local image generation service');
        
        const response = await axios.post(`${this.baseUrl}/api/generate`, 
          { appraiser: imageData.appraiser, customPrompt: imageData.customPrompt },
          { 
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000 // 30 second timeout
          }
        );

        if (response.data && response.data.success) {
          const result = {
            keyword,
            slug,
            imageUrl: response.data.data.imageUrl,
            prompt: response.data.data.prompt || prompt,
            timestamp: new Date().toISOString(),
            source: 'image-generation-service'
          };

          await localStorage.saveFile(cachePath, result);
          console.log(`[IMAGE-GEN] Successfully generated image for "${keyword}"`);
          return result;
        }
      } catch (error) {
        console.warn(`[IMAGE-GEN] Local service call failed: ${error.message}`);
        // Fall back to mock data if service call fails
        const mockResult = this.getMockImageResult(keyword, slug);
        await localStorage.saveFile(cachePath, mockResult);
        console.log(`[IMAGE-GEN] Using mock image data for "${keyword}"`);
        return mockResult;
      }
    } catch (error) {
      console.error(`[IMAGE-GEN] Error generating image for "${keyword}":`, error);
      // Return a placeholder result in case of error
      return {
        keyword,
        slug: slugify(keyword),
        imageUrl: 'https://via.placeholder.com/800x450?text=Image+Generation+Failed',
        timestamp: new Date().toISOString(),
        source: 'placeholder',
        error: error.message
      };
    }
  }

  /**
   * Create a prompt for the image generator based on the content structure
   * @param {string} keyword - The keyword
   * @param {object} structure - The content structure
   * @returns {string} The generated prompt
   */
  createPromptFromStructure(keyword, structure) {
    // Extract meaningful information from the structure to create a rich prompt
    const title = structure.seoTitle || keyword;
    const description = structure.metaDescription || '';
    const headings = [];
    
    // Extract headings from sections if available
    if (structure.sections && Array.isArray(structure.sections)) {
      structure.sections.forEach(section => {
        if (section.heading) {
          headings.push(section.heading);
        }
      });
    }

    // Create a comprehensive prompt
    const prompt = `Create a professional, high-quality image representing the concept of "${keyword}".
This image will be used as the featured image for an SEO blog post with the title "${title}".
${description ? `The article is about: ${description}` : ''}
${headings.length > 0 ? `Key topics covered include: ${headings.join(', ')}` : ''}

The image should be:
- Visually appealing and professional
- Relevant to the topic
- Suitable for a blog post header
- In landscape orientation (16:9 ratio)
- High resolution
- Clean, modern aesthetic with good lighting

Avoid text overlays or watermarks in the image.`;

    return prompt;
  }

  /**
   * Get mock image data for testing/development
   * @param {string} keyword - The keyword
   * @param {string} slug - The slug
   * @returns {object} Mock image result
   */
  getMockImageResult(keyword, slug) {
    // Create a deterministic but seemingly random image for the keyword
    const hash = this.simpleHash(keyword);
    const imageId = Math.abs(hash) % 1000;
    
    return {
      keyword,
      slug,
      imageUrl: `https://picsum.photos/seed/${slug}${imageId}/800/450`,
      prompt: `Mock image prompt for "${keyword}"`,
      timestamp: new Date().toISOString(),
      source: 'mock-data'
    };
  }

  /**
   * Generate a simple hash from a string for deterministic mock images
   * @param {string} str - The string to hash
   * @returns {number} A simple numeric hash
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }
}

module.exports = new ImageGenerationService(); 