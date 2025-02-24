const BaseStorageService = require('../base');
const { createSlug } = require('../../../utils/slug');

class ContentStorageService extends BaseStorageService {
  constructor() {
    super('hugo-posts-content');
    this.contentTypes = {
      RESEARCH: 'research',
      CONTENT: 'content',
      IMAGES: 'images',
      METADATA: 'metadata'
    };
  }

  async storeResearchData(keyword, data, type) {
    const slug = createSlug(keyword);
    const path = `${this.contentTypes.RESEARCH}/${slug}/${type}.json`;
    
    return this.store(path, data, {
      type: 'research_data',
      dataType: type,
      keyword
    });
  }

  async storeContent(keyword, content, metadata = {}) {
    const slug = createSlug(keyword);
    const timestamp = new Date().toISOString();
    const path = `${this.contentTypes.CONTENT}/${slug}/${timestamp}.json`;

    return this.store(path, {
      content,
      metadata: {
        ...metadata,
        keyword,
        timestamp
      }
    }, {
      type: 'content',
      keyword
    });
  }

  async storeImage(keyword, imageUrl, metadata = {}) {
    const slug = createSlug(keyword);
    const timestamp = new Date().toISOString();
    const path = `${this.contentTypes.IMAGES}/${slug}/${timestamp}.json`;

    return this.store(path, {
      url: imageUrl,
      metadata: {
        ...metadata,
        keyword,
        timestamp
      }
    }, {
      type: 'image',
      keyword
    });
  }

  async getLatestContent(keyword) {
    const slug = createSlug(keyword);
    const prefix = `${this.contentTypes.CONTENT}/${slug}/`;
    
    const files = await this.list(prefix);
    if (!files.length) {
      return null;
    }

    // Get most recent file
    const latestFile = files
      .sort((a, b) => b.metadata.timeCreated.localeCompare(a.metadata.timeCreated))
      [0];

    return this.get(latestFile.name);
  }

  async getResearchData(keyword, type) {
    const slug = createSlug(keyword);
    const path = `${this.contentTypes.RESEARCH}/${slug}/${type}.json`;
    
    return this.get(path);
  }

  async getAllResearchData(keyword) {
    const slug = createSlug(keyword);
    const prefix = `${this.contentTypes.RESEARCH}/${slug}/`;
    
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

module.exports = new ContentStorageService();