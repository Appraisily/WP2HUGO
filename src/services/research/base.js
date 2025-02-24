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
      console.log(`[RESEARCH] Cache check for ${type}:`, {
        keyword,
        hasResult: Boolean(result),
        age: result ? new Date() - new Date(result.timestamp) : null
      });

      if (!result || !result.timestamp) {
        return null;
      }

      const age = new Date() - new Date(result.timestamp);
      if (age > maxAge) {
        console.log(`[RESEARCH] Cache expired for ${type}:`, {
          keyword,
          age,
          maxAge
        });
        return null;
      }

      console.log(`[RESEARCH] Cache hit for ${type}:`, {
        keyword,
        age,
        dataSize: JSON.stringify(result.data).length
      });
      return result;
    } catch (error) {
      if (error.message.includes('File not found')) {
        console.log(`[RESEARCH] No cache found for ${type}:`, { keyword });
      } else {
        console.error(`[RESEARCH] Cache check error for ${type}:`, error);
      }
      return null;
    }
  }

  logApiCall(type, keyword) {
    console.log(`[RESEARCH] Making ${type} API call:`, {
      keyword,
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = BaseResearchService;