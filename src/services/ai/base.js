const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');
const contentStorage = require('../storage/ai');
const { createSlug } = require('../../utils/slug');
const { OpenAI } = require('openai');

class BaseAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return true;
    }

    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      this.client = new OpenAI({ apiKey });
      this.isInitialized = true;
      console.log('[AI] Base service initialized successfully');
      return true;
    } catch (error) {
      console.error('[AI] Base service initialization failed:', error);
      throw error;
    }
  }

  async storePrompt(prompt, options = {}) {
    const { keyword, model, type } = options;
    const slug = keyword ? createSlug(keyword) : 'general';
    const dateFolder = new Date().toISOString().split('T')[0];
    const promptData = {
      prompt,
      model,
      type,
      timestamp: new Date().toISOString()
    };

    await contentStorage.storePrompt(
      `${slug}/prompts/${dateFolder}/${type}-${Date.now()}.json`,
      promptData,
      { type: 'ai_prompt', model, keyword }
    );

    return promptData;
  }

  async storeResponse(response, promptData, options = {}) {
    const { keyword, model, type } = options;
    const slug = keyword ? createSlug(keyword) : 'general';
    const dateFolder = new Date().toISOString().split('T')[0];
    const responseData = {
      response,
      prompt: promptData,
      model,
      type,
      timestamp: new Date().toISOString()
    };

    await contentStorage.storeResponse(
      `${slug}/responses/${dateFolder}/${type}-${Date.now()}.json`,
      responseData,
      { type: 'ai_response', model, keyword }
    );

    return responseData;
  }

  async handleError(error, context = {}) {
    console.error(`[AI] Error in ${context.type || 'unknown'} operation:`, error);

    if (error.response?.data) {
      console.error('[AI] API error details:', {
        status: error.response.status,
        data: error.response.data
      });
    }

    // Store error for analysis
    const errorData = {
      error: {
        message: error.message,
        code: error.response?.data?.error?.code,
        type: error.constructor.name
      },
      context,
      timestamp: new Date().toISOString()
    };

    await contentStorage.storeError(
      `errors/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`,
      errorData,
      { type: 'ai_error', ...context }
    );

    throw error;
  }
}

module.exports = BaseAIService;