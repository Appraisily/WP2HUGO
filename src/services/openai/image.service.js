class MockImageGenerationService {
  async generateImage(prompt, size = "1024x1024") {
    try {
      console.log('[OPENAI] Mock image generation with prompt:', prompt);
      
      // Create a placeholder URL
      const encodedPrompt = encodeURIComponent(prompt.substring(0, 50));
      const imageUrl = `https://via.placeholder.com/${size}?text=${encodedPrompt}`;
      
      console.log('[OPENAI] Successfully generated mock image:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } catch (error) {
      console.error('[OPENAI] Mock image generation failed:', error);
      throw error;
    }
  }
}

module.exports = new MockImageGenerationService();