const axios = require('axios');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class BaseOpenAIService {
  constructor() {
    this.isInitialized = false;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async initialize() {
    try {
      this.apiKey = await getSecret(secretNames.openAiKey);
      
      // Test the connection with a minimal request
      await this.chat([{ role: 'assistant', content: 'Test connection' }]);

      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async chat(messages) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}/chat/completions`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'o3-mini',
          messages
        }
      });

      return response.data;
    } catch (error) {
      console.error('[OPENAI] Chat completion failed:', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  async generateImage(prompt, size = "1024x1024") {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}/images/generations`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data: {
          model: 'dall-e-3',
          prompt,
          n: 1,
          size,
          quality: 'standard',
          response_format: 'url'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[OPENAI] Image generation failed:', {
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

module.exports = BaseOpenAIService;