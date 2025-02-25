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
      // Use the chat completions endpoint with correct parameters for o3-mini model
      const modelName = options.model || 'o3-mini';
      
      // Build request parameters based on model requirements
      const requestParams = {
        model: modelName,
        messages: messages
      };
      
      // Only add o3-mini specific parameters
      if (modelName === 'o3-mini' && options.max_tokens) {
        requestParams.max_completion_tokens = options.max_tokens;
      } else if (modelName !== 'o3-mini') {
        // For other models, use standard parameters
        if (options.max_tokens) requestParams.max_tokens = options.max_tokens;
        if (options.temperature) requestParams.temperature = options.temperature;
      }
      
      // Send the request
      const response = await this.client.chat.completions.create(requestParams);

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