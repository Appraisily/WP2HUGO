const openaiService = require('../openai.service');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');
const { getSecret } = require('../../utils/secrets');
const { secretNames } = require('../../config');

class ContentAnalyzerService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      await openaiService.initialize();
      this.isInitialized = true;
      console.log('[ANALYZER] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[ANALYZER] Service initialization failed:', error);
      throw error;
    }
  }

  async analyzeKeyword(keyword, collectedData) {
    try {
      if (!this.isInitialized) {
        console.log('[ANALYZER] Service not initialized, initializing now...');
        await this.initialize();
      }

      console.log('[ANALYZER] Starting content analysis for:', keyword);
      
      // Get both the content analysis and valuation description
      const [analysis, valuationDesc] = await Promise.all([
        this.getContentAnalysis(keyword, collectedData),
        this.getValuationDescription(keyword, collectedData)
      ]);

      // Store both results
      await this.storeResults(keyword, analysis, valuationDesc, collectedData);

      return {
        ...analysis,
        valuation_description: valuationDesc
      };

    } catch (error) {
      console.error('[ANALYZER] Error analyzing content:', error);
      throw error;
    }
  }

  async getContentAnalysis(keyword, collectedData) {
    try {
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

      const completion = await openaiService.openai.createChatCompletion({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.5
      });

      const analysis = JSON.parse(completion.data.choices[0].message.content);
      return analysis;
    } catch (error) {
      console.error('[ANALYZER] Error getting content analysis:', error);
      throw error;
    }
  }

  async getValuationDescription(keyword, collectedData) {
    try {
      console.log('[ANALYZER] Generating valuation description for:', keyword);

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

      const completion = await openaiService.openai.createChatCompletion({
        model: 'gpt-4-turbo-preview',
        messages,
        temperature: 0.3
      });

      return completion.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('[ANALYZER] Error generating valuation description:', error);
      throw error;
    }
  }

  async storeResults(keyword, analysis, valuationDesc, collectedData) {
    const slug = createSlug(keyword);
    const timestamp = new Date().toISOString();

    await contentStorage.storeContent(
      `${slug}/research/content-analysis.json`,
      {
        keyword,
        analysis,
        valuation_description: valuationDesc,
        metadata: {
          timestamp,
          dataPoints: {
            keywordData: Boolean(collectedData.keywordData),
            paaData: Boolean(collectedData.paaData),
            serpData: Boolean(collectedData.serpData),
            perplexityData: Boolean(collectedData.perplexityData)
          }
        }
      },
      { type: 'content_analysis', keyword }
    );
  }
}

module.exports = new ContentAnalyzerService();