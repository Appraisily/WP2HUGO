const OpenAI = require('openai');
const { getSecret } = require('../utils/secrets');
const { secretNames } = require('../config');
const { createSlug } = require('../utils/slug');

class OpenAIService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const apiKey = await getSecret(secretNames.openAiKey);
      this.openai = new OpenAI({ apiKey });
      // Test the connection
      await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'system', content: 'Test connection' }]
      });
      this.isInitialized = true;
      console.log('[OPENAI] Successfully initialized');
    } catch (error) {
      console.error('[OPENAI] Initialization failed:', error);
      throw error;
    }
  }

  async generateImage(prompt, size = "1024x1024") {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      console.log('[OPENAI] Generating image with prompt:', prompt);
      
      const response = await this.openai.createImage({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'url'
      });

      if (!response.data || !response.data.data || !response.data.data[0] || !response.data.data[0].url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      const imageUrl = response.data.data[0].url;
      console.log('[OPENAI] Successfully generated image:', imageUrl);
      
      return {
        success: true,
        url: imageUrl
      };
    } catch (error) {
      console.error('[OPENAI] Error generating image:', error);
      
      // Log detailed API error if available
      if (error.response) {
        console.error('[OPENAI] API error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
      }

      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  async enhanceContent(prompt, keyword, version = 'v1') {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      console.log(`[OPENAI] Sending request to enhance content (${version}) with keyword:`, keyword);
      
      // Use o1-mini for v3, gpt-4o for others
      const model = version === 'v3' ? 'gpt-4-turbo-preview' : 'gpt-4-turbo-preview';
      
      // Use 'assistant' role for o1-mini, 'system' for others
      const instructionRole = model === 'o1-mini' ? 'assistant' : 'system';

      // Store the prompt in GCS
      const promptData = {
        model,
        messages,
        temperature: 0.7,
        timestamp: new Date().toISOString()
      };

      const slug = createSlug(keyword);
      const dateFolder = new Date().toISOString().split('T')[0];

      await contentStorage.storeContent(
        `${slug}/prompts/${dateFolder}/${model}-${Date.now()}.json`,
        promptData,
        { type: 'openai_prompt', model, keyword }
      );
      
      const completion = await this.openai.chat.completions.create({
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

      // Store the response in GCS
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
      
      // Check for truncation
      if (completion.choices[0].finish_reason === 'length') {
        console.error(`[OPENAI] Response was truncated (${version})`);
        throw new Error(`Response truncated - content too long (${version})`);
      }

      console.log(`[OPENAI] Successfully received enhanced content (${version})`);
      
      return enhancedContent;
    } catch (error) {
      // Log the full error response from OpenAI
      console.error(`[OPENAI] Full error response:`, error.response?.data);
      console.error('[OPENAI] Error details:', error.response?.data?.error);
      
      // Check for specific OpenAI errors
      if (error.response?.data?.error?.code === 'context_length_exceeded') {
        console.error(`[OPENAI] Context length exceeded (${version}):`, error.response.data.error);
        throw new Error(`Content too long for processing (${version})`);
      }
      
      console.error(`[OPENAI] Error enhancing content (${version}):`, error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();