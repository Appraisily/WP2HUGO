const BaseStorageService = require('../base');
const { createSlug } = require('../../../utils/slug');

class ResearchStorageService extends BaseStorageService {
  constructor() {
    super('hugo-posts-content');
    this.researchTypes = {
      KEYWORD: 'keyword',
      PAA: 'paa',
      SERP: 'serp',
      PERPLEXITY: 'perplexity'
    };
  }

  async storeKeywordData(keyword, data) {
    const slug = createSlug(keyword);
    const path = `research/${slug}/${this.researchTypes.KEYWORD}.json`;
    
    return this.store(path, data, {
      type: 'keyword_research',
      keyword
    });
  }

  async storePaaData(keyword, data) {
    const slug = createSlug(keyword);
    const path = `research/${slug}/${this.researchTypes.PAA}.json`;
    
    return this.store(path, data, {
      type: 'paa_data',
      keyword
    });
  }

  async storeSerpData(keyword, data) {
    const slug = createSlug(keyword);
    const path = `research/${slug}/${this.researchTypes.SERP}.json`;
    
    return this.store(path, data, {
      type: 'serp_data',
      keyword
    });
  }

  async storePerplexityData(keyword, data) {
    const slug = createSlug(keyword);
    const path = `research/${slug}/${this.researchTypes.PERPLEXITY}.json`;
    
    return this.store(path, data, {
      type: 'perplexity_data',
      keyword
    });
  }

  async getResearchData(keyword, type) {
    if (!Object.values(this.researchTypes).includes(type)) {
      throw new Error(`Invalid research type: ${type}`);
    }

    const slug = createSlug(keyword);
    const path = `research/${slug}/${type}.json`;
    
    return this.get(path);
  }

  async getAllResearchData(keyword) {
    const slug = createSlug(keyword);
    const prefix = `research/${slug}/`;
    
    const files = await this.list(prefix);
    const data = {};
    
    for (const file of files) {
      const content = await this.get(file.name);
      const type = file.name.split('/').pop().replace('.json', '');
      data[type] = content;
    }

    return data;
  }
}

module.exports = new ResearchStorageService();