const BaseOpenAIService = require('./base.service');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentService extends BaseOpenAIService {
  async analyzeContent(keyword, collectedData) {
    try {
      const messages = [
        {
          role: 'assistant',
          content: `You are an expert content strategist specializing in antique and art valuation content. Analyze the provided data and create a comprehensive content plan optimized for user intent and conversions.`
        },
        {
          role: 'user',
          content: `Create an intent-optimized content plan for "${keyword}". Consider these data points:\n\n${JSON.stringify(collectedData, null, 2)}`
        }
      ];

      const response = await this.chat(messages);
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('[OPENAI] Content analysis failed:', error);
      throw error;
    }
  }

  async generateValuationDescription(keyword, collectedData) {
    try {
      const messages = [
        {
          role: 'assistant',
          content: 'Create a concise 10-word description of this antique item for valuation purposes.'
        },
        {
          role: 'user',
          content: `Create a 10-word description for: "${keyword}"\n\nData: ${JSON.stringify(collectedData, null, 2)}`
        }
      ];

      const response = await this.chat(messages);
      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('[OPENAI] Valuation description generation failed:', error);
      throw error;
    }
  }
}

module.exports = new ContentService();