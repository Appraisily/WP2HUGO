const { createSlug } = require('../../utils/slug');
const researchStorage = require('../storage/research');

class BaseResearchService {
  constructor() {
    this.isInitialized = false;
    this.storage = researchStorage;
  }

  async initialize() {
    try {
      await this.storage.initialize();
      this.isInitialized = true;
      console.log('[RESEARCH] Base service initialized successfully');
      return true;
    } catch (error) {
      console.error('[RESEARCH] Base service initialization failed:', error);
      throw error;
    }
  }

  async storeResult(keyword, data, type) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const metadata = {
      type: 'research_data',
      dataType: type,
      keyword,
      timestamp: new Date().toISOString()
    };

    return this.storage.store(
      `research/${createSlug(keyword)}/${type}.json`,
      data,
      metadata
    );
  }

  async getResult(keyword, type) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    return this.storage.get(
      `research/${createSlug(keyword)}/${type}.json`
    );
  }

  async checkCache(keyword, type, maxAge = 7 * 24 * 60 * 60 * 1000) {
    try {
      const result = await this.getResult(keyword, type);
      
      if (!result || !result.timestamp) {
        return null;
      }

      const age = new Date() - new Date(result.timestamp);
      if (age > maxAge) {
        return null;
      }

      return result;
    } catch (error) {
      return null;
    }
  }
}

module.exports = BaseResearchService;