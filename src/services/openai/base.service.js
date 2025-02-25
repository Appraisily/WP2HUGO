const { OpenAI } = require('openai');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class BaseOpenAIService {
  constructor() {
    this.isInitialized = false;
    this.client = null;
  }

  async initialize() {
    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      this.client = new OpenAI({ apiKey });
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
      const response = await this.client.chat.completions.create({
        model: options.model || 'o3-mini',
        messages,
        ...options
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
      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
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