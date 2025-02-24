const BaseOpenAIService = require('./base.service');
const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentService extends BaseOpenAIService {
  async analyzeContent(keyword, collectedData) {
    this.checkInitialization();

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

    const completion = await this.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.choices[0].message.content);
  }

  async generateValuationDescription(keyword, collectedData) {
    this.checkInitialization();

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

    const completion = await this.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return completion.choices[0].message.content.trim();
  }
}

module.exports = new ContentService();