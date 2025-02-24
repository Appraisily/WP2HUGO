const BaseAIService = require('../base');
const contentPrompts = require('../prompts/content');

class ContentEnhancerService extends BaseAIService {
  async enhance(content, keyword) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: contentPrompts.enhance.system
        },
        {
          role: 'user',
          content: `Enhance this content for keyword "${keyword}":\n${content}`
        }
      ];

      // Store prompt
      const promptData = await this.storePrompt(messages, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_enhancement'
      });

      // Get completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: contentPrompts.enhance.temperature
      });

      // Store response
      await this.storeResponse(completion, promptData, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_enhancement'
      });

      return completion.choices[0].message.content;
    } catch (error) {
      await this.handleError(error, {
        type: 'content_enhancement',
        keyword
      });
    }
  }
}

module.exports = new ContentEnhancerService();