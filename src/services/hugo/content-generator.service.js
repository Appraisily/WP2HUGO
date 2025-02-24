const { contentService } = require('../openai/index');
const contentStorage = require('../../utils/storage');

class ContentGeneratorService {
  async generateStructure(keyword, keywordData, paaData, serpData) {
    try {
      console.log('[HUGO] Generating content structure for:', keyword);
      
      const messages = [
        {
          role: 'assistant',
          content: `Create a detailed content structure for a blog post about "${keyword}".
Use this keyword research data to optimize the content structure:
${JSON.stringify(keywordData, null, 2)}

And incorporate these related questions:
${JSON.stringify(paaData.results, null, 2)}

And use these search results for competitive analysis:
${JSON.stringify(serpData.serp, null, 2)}

Return ONLY valid JSON with this structure:
{
  "title": "SEO optimized title",
  "sections": [
    {
      "type": "introduction|main|conclusion",
      "title": "Section title",
      "content": "Detailed outline of section content"
    }
  ],
  "meta": {
    "description": "SEO meta description",
    "keywords": ["relevant", "keywords"],
    "search_volume": number,
    "related_questions": ["questions", "from", "PAA", "data"]
  }}`
        }
      ];

      const content = await contentService.analyzeContent(keyword, { messages });
      
      // Store the generated structure
      await contentStorage.storeContent(
        `${keyword}/structure.json`,
        content,
        { type: 'content_structure', keyword }
      );

      return content;
    } catch (error) {
      console.error('[HUGO] Error generating content structure:', error);
      throw error;
    }
  }

  async generateContent(structure) {
    try {
      console.log('[HUGO] Generating content from structure');
      
      const messages = [
        {
          role: 'assistant',
          content: `Create detailed blog post content based on this structure. 
Return ONLY valid JSON with this structure:
{
  "title": "Post title",
  "content": "Full markdown content",
  "meta": {
    "description": "Meta description",
    "keywords": ["keywords"]
  }}`
        },
        {
          role: 'user',
          content: JSON.stringify(structure)
        }
      ];

      const content = await contentService.analyzeContent(structure.keyword, { messages });
      
      // Store the generated content
      await contentStorage.storeContent(
        `${structure.keyword}/content.json`,
        content,
        { type: 'generated_content', keyword: structure.keyword }
      );

      return content;
    } catch (error) {
      console.error('[HUGO] Error generating content:', error);
      throw error;
    }
  }
}

module.exports = new ContentGeneratorService();