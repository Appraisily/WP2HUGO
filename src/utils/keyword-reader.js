const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class KeywordReader {
  constructor() {
    this.initialized = false;
    this.keywordsPath = config.paths.keywords;
    this.keywords = [];
  }

  // Add a method to set the keywords path
  setKeywordsPath(keywordsPath) {
    this.keywordsPath = keywordsPath;
    this.initialized = false; // Reset initialization to reload keywords
    console.log(`[KEYWORD-READER] Keywords path set to: ${keywordsPath}`);
  }

  async initialize() {
    try {
      if (!this.keywordsPath) {
        throw new Error('Keywords file path not specified in config');
      }

      // Check if keywords file exists
      try {
        await fs.access(this.keywordsPath);
      } catch (error) {
        console.error('[KEYWORD-READER] Keywords file not found:', this.keywordsPath);
        throw error;
      }

      // Load keywords
      await this.loadKeywords();
      
      console.log(`[KEYWORD-READER] Initialized with ${this.keywords.length} keywords`);
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[KEYWORD-READER] Failed to initialize keyword reader:', error);
      throw error;
    }
  }

  async loadKeywords() {
    try {
      const data = await fs.readFile(this.keywordsPath, 'utf8');
      this.keywords = data
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
      
      return this.keywords;
    } catch (error) {
      console.error('[KEYWORD-READER] Error loading keywords:', error);
      throw error;
    }
  }

  async getKeywords() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.keywords;
  }

  async getUnprocessedKeywords(processedKeywords = []) {
    const allKeywords = await this.getKeywords();
    return allKeywords.filter(kw => !processedKeywords.includes(kw));
  }

  async getNextKeyword(processedKeywords = []) {
    const unprocessed = await this.getUnprocessedKeywords(processedKeywords);
    return unprocessed.length > 0 ? unprocessed[0] : null;
  }
}

module.exports = new KeywordReader(); 