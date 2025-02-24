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
      
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality: 'standard',
        response_format: 'url'
      });

      if (!response.data || !response.data[0] || !response.data[0].url) {
        throw new Error('Invalid response from DALL-E 3');
      }

      const imageUrl = response.data[0].url;
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

  async analyzeContent(keyword, collectedData) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    const messages = [
      {
        role: 'assistant',
        content: `You are an expert content strategist specializing in antique and art valuation content. Analyze the provided data and create a comprehensive content plan optimized for user intent and conversions.

CRITICAL: Return ONLY valid JSON with this structure:
{
  "analysis": {
    "primary_intent": "valuation|historical|identification",
    "user_stage": "research|consideration|decision",
    "target_audience": ["array of audience segments"],
    "pain_points": ["user problems to address"],
    "value_proposition": "unique selling proposition"
  },
  "structure": {
    "title": "SEO-optimized title",
    "meta_description": "Compelling meta description",
    "introduction": {
      "hook": "Attention-grabbing opening",
      "problem_statement": "User pain point",
      "value_preview": "What they'll learn"
    },
    "main_sections": [
      {
        "type": "section",
        "heading": "Section heading",
        "key_points": ["array of points"],
        "conversion_angle": "How this section drives value",
        "cta_placement": "natural conversion prompt",
        "expert_insights": ["credibility-building points"],
        "image_suggestions": ["what to show"]
      }
    ],
    "conversion_elements": {
      "primary_cta": "Main conversion action",
      "secondary_ctas": ["Other conversion points"],
      "trust_signals": ["Credibility elements"],
      "value_reinforcement": "Why take action"
    },
    "faq_section": [
      {
        "question": "User question",
        "answer_points": ["key points"],
        "conversion_tie_in": "How to link to value"
      }
    ]
  },
  "seo": {
    "primary_keyword": "main keyword",
    "semantic_clusters": [
      {
        "topic": "semantic topic",
        "related_terms": ["related keywords"],
        "user_intent": "intent for this cluster"
      }
    ],
    "featured_snippet_target": {
      "type": "table|list|paragraph",
      "content": "Optimized for snippet"
    }
  }
}`
      },
      {
        role: 'user',
        content: `Create an intent-optimized content plan for "${keyword}". Consider these data points:

Keyword Research:
${JSON.stringify(collectedData.keywordData, null, 2)}

User Questions (PAA):
${JSON.stringify(collectedData.paaData, null, 2)}

Competitive Analysis (SERP):
${JSON.stringify(collectedData.serpData, null, 2)}

Additional Insights:
${JSON.stringify(collectedData.perplexityData, null, 2)}

CRITICAL REQUIREMENTS:

1. Intent-Based Structure
- For valuation intent: Focus on factors affecting value, price ranges, and expert appraisal benefits
- For historical background: Emphasize provenance, historical significance, and collecting value
- For identification: Highlight key features, authenticity markers, and verification services

2. Strategic Conversion Points
- Place CTAs after establishing value
- Include social proof near decision points
- Link historical/educational content to valuation services

3. User Journey Alignment
- Match content depth to user stage
- Build trust before conversion attempts
- Provide clear next steps

4. Visual Strategy
- Plan image placement for maximum impact
- Include authentic examples
- Show value-indicating features

5. SEO Optimization
- Target featured snippets
- Include semantic variations
- Optimize for user satisfaction signals`
      }
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.5
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async generateValuationDescription(keyword, collectedData) {
    if (!this.isInitialized) {
      throw new Error('OpenAI service not initialized');
    }

    const messages = [
      {
        role: 'assistant',
        content: `Create a concise 10-word description of this antique item for valuation purposes.

CRITICAL:
- EXACTLY 10 words
- Focus on key identifying features
- Include era/period if known
- Mention material and condition
- Be specific and precise

Example good descriptions:
"Victorian mahogany dining table, carved legs, excellent condition, circa 1860"
"Art Deco bronze sculpture, female figure, signed, original patina"

Return ONLY the 10-word description, no other text or formatting.`
      },
      {
        role: 'user',
        content: `Create a 10-word description for: "${keyword}"

Use these insights:
${JSON.stringify(collectedData.perplexityData, null, 2)}

And this keyword data:
${JSON.stringify(collectedData.keywordData, null, 2)}

Remember: Return ONLY the 10-word description.`
      }
    ];

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.3
    });

    return completion.choices[0].message.content.trim();
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