const BaseOpenAIService = require('./base.service');

class ImageGenerationService extends BaseOpenAIService {
  async generateImage(prompt, size = "1024x1024") {
    this.checkInitialization();

    try {
      console.log('[OPENAI] Generating image with prompt:', prompt);
      
      const response = await this.openai.createImage({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'url'
      });

      if (!response.data || !response.data[0] || !response.data[0].url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      const imageUrl = response.data[0].url;
      console.log('[OPENAI] Successfully generated image:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } catch (error) {
      console.error('[OPENAI] Error generating image:', error);
      
      if (error.response) {
        console.error('[OPENAI] API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }
}

module.exports = new ImageGenerationService();