const BaseAIService = require('../base');
const contentPrompts = require('../prompts/content');
const { createSlug } = require('../../../utils/slug');

class ContentGeneratorService extends BaseAIService {
  async generateStructure(keyword, data) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: contentPrompts.structure.system
        },
        {
          role: 'user',
          content: `Create content structure for "${keyword}" with data:\n${JSON.stringify(data, null, 2)}`
        }
      ];

      // Store prompt
      const promptData = await this.storePrompt(messages, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_structure'
      });

      // Get completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: contentPrompts.structure.temperature
      });

      // Store response
      await this.storeResponse(completion, promptData, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_structure'
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      await this.handleError(error, {
        type: 'content_structure',
        keyword
      });
    }
  }

  async generateContent(structure, keyword) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const messages = [
        {
          role: 'system',
          content: contentPrompts.generate.system
        },
        {
          role: 'user',
          content: `Generate content for "${keyword}" using structure:\n${JSON.stringify(structure, null, 2)}`
        }
      ];

      // Store prompt
      const promptData = await this.storePrompt(messages, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_generation'
      });

      // Get completion
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: contentPrompts.generate.temperature
      });

      // Store response
      await this.storeResponse(completion, promptData, {
        keyword,
        model: 'gpt-4-turbo-preview',
        type: 'content_generation'
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      await this.handleError(error, {
        type: 'content_generation',
        keyword
      });
    }
  }
}

module.exports = new ContentGeneratorService();