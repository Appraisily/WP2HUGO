const BaseOpenAIService = require('./base.service');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class EnhancementService extends BaseOpenAIService {
  async enhanceContent(prompt, keyword, version = 'v1') {
    this.checkInitialization();

    try {
      console.log(`[OPENAI] Sending request to enhance content (${version}) with keyword:`, keyword);
      
      const model = 'o3-mini';
      const instructionRole = 'assistant';

      // Store the prompt
      const promptData = {
        model,
        version,
        keyword,
        prompt,
        timestamp: new Date().toISOString(),
        role: 'assistant'  // Always use assistant role for o3-mini
      };

      const slug = createSlug(keyword);
      const dateFolder = new Date().toISOString().split('T')[0];

      await contentStorage.storeContent(
        `${slug}/prompts/${dateFolder}/${model}-${Date.now()}.json`,
        promptData,
        { type: 'openai_prompt', model, keyword }
      );
      
      const completion = await this.openai.createChatCompletion({
        model,
        messages: [
          {
            role: instructionRole,
            content: "You are an expert content enhancer specializing in antiques and art valuation. Your task is to enhance WordPress content while maintaining HTML structure and adding compelling CTAs. Return only the enhanced content with HTML formatting."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      });

      // Store the response
      const responseData = {
        model,
        completion,
        timestamp: new Date().toISOString(),
        prompt: promptData
      };

      await contentStorage.storeContent(
        `${slug}/responses/${dateFolder}/${model}-${Date.now()}.json`,
        responseData,
        { type: 'openai_response', model, keyword }
      );

      const enhancedContent = completion.choices[0].message.content;
      
      if (completion.choices[0].finish_reason === 'length') {
        throw new Error(`Response truncated - content too long (${version})`);
      }

      return enhancedContent;
    } catch (error) {
      console.error(`[OPENAI] Error enhancing content (${version}):`, error);
      
      if (error.response?.data?.error?.code === 'context_length_exceeded') {
        throw new Error(`Content too long for processing (${version})`);
      }
      
      throw error;
    }
  }
}

module.exports = new EnhancementService();