const openaiService = require('../openai.service');
const contentStorage = require('../../utils/storage');

class ContentAnalyzerService {
  async analyzeKeyword(keyword, collectedData) {
    try {
      console.log('[ANALYZER] Starting content analysis for:', keyword);

      const messages = [
        {
          role: 'assistant',
          content: `You are an expert content analyst. Analyze the provided keyword research data and create a comprehensive content plan.

CRITICAL: Return ONLY valid JSON with this structure:
{
  "analysis": {
    "primary_intent": "string - main user intent",
    "secondary_intents": ["array of other intents"],
    "target_audience": ["array of audience segments"],
    "content_angle": "unique perspective for content",
    "value_proposition": "why readers should care"
  },
  "structure": {
    "title": "SEO-optimized title",
    "meta_description": "Compelling meta description",
    "outline": [
      {
        "type": "section",
        "heading": "Section heading",
        "key_points": ["array of main points"],
        "sources": ["reference sources"],
        "perplexity_insights": ["relevant insights"]
      }
    ],
    "faq_section": [
      {
        "question": "FAQ question",
        "answer_points": ["key points for answer"]
      }
    ]
  },
  "seo": {
    "primary_keyword": "string",
    "secondary_keywords": ["array of keywords"],
    "featured_snippet_target": "string",
    "semantic_topics": ["related topics"]
  }
}`
        },
        {
          role: 'user',
          content: `Analyze this collected data for the keyword "${keyword}":

Keyword Research Data:
${JSON.stringify(collectedData.keywordData, null, 2)}

People Also Ask Data:
${JSON.stringify(collectedData.paaData, null, 2)}

SERP Analysis:
${JSON.stringify(collectedData.serpData, null, 2)}

Perplexity Insights:
${JSON.stringify(collectedData.perplexityData, null, 2)}

Create a comprehensive content plan that:
1. Addresses user intent
2. Covers key topics thoroughly
3. Targets featured snippets
4. Incorporates Perplexity insights
5. Uses competitive analysis
6. Optimizes for SEO`
        }
      ];

      const completion = await openaiService.openai.createChatCompletion({
        model: 'o3-mini-high',
        messages,
        temperature: 0.7
      });

      const analysis = JSON.parse(completion.data.choices[0].message.content);

      // Store the analysis
      await this.storeAnalysis(keyword, analysis, collectedData);

      return analysis;
    } catch (error) {
      console.error('[ANALYZER] Error analyzing content:', error);
      throw error;
    }
  }

  async storeAnalysis(keyword, analysis, collectedData) {
    const slug = this.createSlug(keyword);
    const timestamp = new Date().toISOString();

    await contentStorage.storeContent(
      `${slug}/research/content-analysis.json`,
      {
        keyword,
        analysis,
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

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new ContentAnalyzerService();