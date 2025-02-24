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
      await this.makeRequest('/chat/completions', {
        model: 'o3-mini',
        messages: [{ role: 'assistant', content: 'Test connection' }]
      });

      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async makeRequest(endpoint, data) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data
      });

      return response.data;
    } catch (error) {
      console.error('[OPENAI] API request failed:', {
        endpoint,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }
}

module.exports = BaseOpenAIService;