const BaseAIService = require('../base');
const contentPrompts = require('../prompts/content');
const { createSlug } = require('../../../utils/slug');

class ContentAnalyzerService extends BaseAIService {
  async analyzeContent(keyword, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: contentPrompts.analyze.system
        },
        {
          role: 'user',
          content: `Analyze content for "${keyword}" with data:\n${JSON.stringify(data, null, 2)}`
        }
      ];

      // Store prompt
      const promptData = await this.storePrompt(messages, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_analysis'
      });

      // Get completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: contentPrompts.analyze.temperature
      });

      // Store response
      await this.storeResponse(completion, promptData, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_analysis'
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      await this.handleError(error, {
        type: 'content_analysis',
        keyword
      });
    }
  }

  async generateValuationDescription(keyword, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: contentPrompts.valuationDescription.system
        },
        {
          role: 'user',
          content: `Create description for: "${keyword}"\nData: ${JSON.stringify(data, null, 2)}`
        }
      ];

      // Store prompt
      const promptData = await this.storePrompt(messages, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'valuation_description'
      });

      // Get completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: contentPrompts.valuationDescription.temperature
      });

      // Store response
      await this.storeResponse(completion, promptData, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'valuation_description'
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      await this.handleError(error, {
        type: 'valuation_description',
        keyword
      });
    }
  }
}

module.exports = new ContentAnalyzerService();