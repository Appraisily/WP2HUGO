const BaseOpenAIService = require('./base.service');

class ImageGenerationService extends BaseOpenAIService {
  async generateImage(prompt, size = "1024x1024") {
    try {
      console.log('[OPENAI] Generating image with prompt:', prompt);
      
      const response = await super.generateImage(prompt, size);

      if (!response.data?.[0]?.url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      const imageUrl = response.data[0].url;
      console.log('[OPENAI] Successfully generated image:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } catch (error) {
      console.error('[OPENAI] Image generation failed:', error);
      throw error;
    }
  }
}

module.exports = new ImageGenerationService();