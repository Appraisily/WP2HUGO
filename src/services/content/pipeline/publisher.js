const BasePipelineStage = require('./base');
const contentStorage = require('../../storage/content');
const { createSlug } = require('../../../utils/slug');

class PublisherStage extends BasePipelineStage {
  constructor() {
    super('Publisher');
    this.storage = contentStorage;
  }

  async _initialize() {
    await this.storage.initialize();
    return true;
  }

  async _process(data) {
    const { keyword } = data;
    console.log('[PUBLISHER] Starting content publication for:', keyword);

    const slug = createSlug(keyword);
    const timestamp = new Date().toISOString();

    // Store complete processing result
    await this.storage.storeContent(keyword, {
      ...data,
      metadata: {
        slug,
        timestamp,
        status: 'published'
      }
    });

    // Store research data separately
    await this.storage.storeResearchData(
      keyword,
      data.research,
      'research'
    );

    // Store images
    for (const image of data.content.images) {
      await this.storage.storeImage(
        keyword,
        image.url,
        {
          type: image.type,
          description: image.description
        }
      );
    }

    return {
      success: true,
      keyword,
      slug,
      timestamp,
      contentPath: `${slug}/${timestamp}.json`
    };
  }
}

module.exports = new PublisherStage();