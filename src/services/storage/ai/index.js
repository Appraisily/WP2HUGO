const BaseStorageService = require('../base');
const { createSlug } = require('../../../utils/slug');

class AIStorageService extends BaseStorageService {
  constructor() {
    super('hugo-posts-content');
    this.aiTypes = {
      PROMPT: 'prompts',
      RESPONSE: 'responses',
      ERROR: 'errors'
    };
  }

  async storePrompt(prompt, options = {}) {
    const { keyword, model, type } = options;
    const slug = keyword ? createSlug(keyword) : 'general';
    const dateFolder = new Date().toISOString().split('T')[0];
    const path = `${this.aiTypes.PROMPT}/${dateFolder}/${type}-${Date.now()}.json`;

    return this.store(path, {
      prompt,
      model,
      type,
      timestamp: new Date().toISOString()
    }, {
      type: 'ai_prompt',
      promptType: type,
      model,
      keyword
    });
  }

  async storeResponse(response, promptData, options = {}) {
    const { keyword, model, type } = options;
    const slug = keyword ? createSlug(keyword) : 'general';
    const dateFolder = new Date().toISOString().split('T')[0];
    const path = `${this.aiTypes.RESPONSE}/${dateFolder}/${type}-${Date.now()}.json`;

    return this.store(path, {
      response,
      prompt: promptData,
      model,
      type,
      timestamp: new Date().toISOString()
    }, {
      type: 'ai_response',
      responseType: type,
      model,
      keyword
    });
  }

  async storeError(error, context = {}) {
    const dateFolder = new Date().toISOString().split('T')[0];
    const path = `${this.aiTypes.ERROR}/${dateFolder}/${Date.now()}.json`;

    return this.store(path, {
      error: {
        message: error.message,
        code: error.response?.data?.error?.code,
        type: error.constructor.name
      },
      context,
      timestamp: new Date().toISOString()
    }, {
      type: 'ai_error',
      errorType: context.type,
      keyword: context.keyword
    });
  }

  async getPromptHistory(keyword, type, limit = 10) {
    const slug = keyword ? createSlug(keyword) : 'general';
    const prefix = `${this.aiTypes.PROMPT}/`;
    
    const files = await this.list(prefix);
    const prompts = await Promise.all(
      files
        .filter(file => file.metadata.keyword === keyword && file.metadata.promptType === type)
        .sort((a, b) => b.metadata.timestamp.localeCompare(a.metadata.timestamp))
        .slice(0, limit)
        .map(file => this.get(file.name))
    );

    return prompts;
  }
}

module.exports = new AIStorageService();