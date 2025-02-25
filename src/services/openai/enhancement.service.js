const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class MockEnhancementService {
  async enhanceContent(content, keyword) {
    try {
      console.log('[OPENAI] Mock content enhancement for keyword:', keyword);

      // Just return the original content with some minimal enhancements
      const enhancedContent = `${content}\n\n## Enhanced Content\n\nThis content has been reviewed and enhanced for readability and SEO optimization for "${keyword}".\n\n## Call to Action\n\nLearn more about ${keyword} by contacting our experts today!`;

      // Store the enhancement data
      const slug = createSlug(keyword);
      await contentStorage.storeContent(
        `${slug}/enhancements/${Date.now()}.json`,
        {
          original: content,
          enhanced: enhancedContent,
          timestamp: new Date().toISOString()
        },
        { type: 'content_enhancement', keyword }
      );

      return enhancedContent;
    } catch (error) {
      console.error('[OPENAI] Mock content enhancement failed:', error);
      throw error;
    }
  }
}

module.exports = new MockEnhancementService();