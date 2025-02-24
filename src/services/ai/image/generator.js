const BaseAIService = require('../base');
const { createSlug } = require('../../../utils/slug');

class ImageGeneratorService extends BaseAIService {
  async generate(prompt, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      size = "1024x1024",
      quality = "standard",
      keyword = null
    } = options;

    try {
      // Store prompt
      const promptData = await this.storePrompt(prompt, {
        keyword,
        model: 'dall-e-3',
        type: 'image_generation'
      });

      // Generate image
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
        response_format: 'url'
      });

      if (!response.data?.[0]?.url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      // Store response
      await this.storeResponse(response, promptData, {
        keyword,
        model: 'dall-e-3',
        type: 'image_generation'
      });

      return {
        success: true,
        url: response.data[0].url
      };
    } catch (error) {
      await this.handleError(error, {
        type: 'image_generation',
        keyword,
        prompt
      });
    }
  }
}

module.exports = new ImageGeneratorService();