const OpenAI = require('openai');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class BaseOpenAIService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
  }

  async initialize() {
    try {
      // Get the API key from Secret Manager
      const apiKey = await getSecret(secretNames.openAiKey);
      
      // Initialize the OpenAI client with the API key
      this.client = new OpenAI({
        apiKey: apiKey
      });
      
      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
      return true;
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async chat(messages, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Use the chat completions endpoint
      const response = await this.client.chat.completions.create({
        model: options.model || 'o3-mini',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000
      });

      return response;
    } catch (error) {
      console.error('[OPENAI] Chat completion failed:', error);
      throw error;
    }
  }

  async generateImage(prompt, size = "1024x1024", quality = "standard") {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Use the image generation endpoint
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: 'url'
      });

      return response;
    } catch (error) {
      console.error('[OPENAI] Image generation failed:', error);
      throw error;
    }
  }
}

module.exports = BaseOpenAIService;