const OpenAI = require('openai');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class BaseOpenAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      this.openai = new OpenAI({ apiKey });
      // Test the connection
      await this.openai.createChatCompletion({
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

  checkInitialization() {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }
  }
}

module.exports = BaseOpenAIService;