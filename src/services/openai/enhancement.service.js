const BaseOpenAIService = require('./base.service');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class EnhancementService extends BaseOpenAIService {
  async enhanceContent(content, keyword) {
    try {
      console.log('[OPENAI] Enhancing content for keyword:', keyword);

      const messages = [
        {
          role: 'assistant',
          content: 'You are an expert content enhancer specializing in antiques and art valuation. Enhance the content while maintaining structure and adding compelling CTAs.'
        },
        {
          role: 'user',
          content: `Enhance this content for keyword "${keyword}":\n\n${content}`
        }
      ];

      const response = await this.chat(messages);
      const enhancedContent = response.choices[0].message.content;

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
      console.error('[OPENAI] Content enhancement failed:', error);
      throw error;
    }
  }
}

module.exports = new EnhancementService();