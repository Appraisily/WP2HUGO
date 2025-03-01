const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentGeneratorService {
  async generateStructure(keyword, keywordData, paaData, serpData) {
    try {
      console.log('[HUGO] Generating content structure for:', keyword);
      
      // Create a static structure based on the keyword
      const content = {
        title: `Complete Guide to ${keyword}: Value, History, and Market Analysis`,
        sections: [
          {
            type: "introduction",
            title: "Introduction",
            content: `An introduction to ${keyword} and why it's valuable in today's market.`
          },
          {
            type: "main",
            title: "History and Background",
            content: `The historical context of ${keyword} from its origins to present day.`
          },
          {
            type: "main",
            title: "Value Factors and Pricing",
            content: "Key factors that determine the value including condition, rarity, and provenance."
          },
          {
            type: "main",
            title: "Market Analysis",
            content: "Current trends, auction results, and future market predictions."
          },
          {
            type: "conclusion",
            title: "Conclusion",
            content: "Summary of key points and investment outlook."
          }
        ],
        meta: {
          description: `Discover everything about ${keyword} including its value, history, and current market trends.`,
          keywords: keyword.split(" ").concat(["value", "history", "market", "price", "investment"]),
          search_volume: 1200,
          related_questions: [
            `How much is ${keyword} worth?`,
            `What affects ${keyword} value?`,
            `Where to buy ${keyword}?`,
            `How to authenticate ${keyword}?`
          ]
        }
      };
      
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
      
      // Create static content based on the structure
      const content = {
        title: structure.title,
        content: `# ${structure.title}\n\n` +
          structure.sections.map(section => {
            return `## ${section.title}\n\n${section.content}\n\n`;
          }).join('') +
          `\n\n*This article was generated to provide information about ${structure.title.toLowerCase()}.*`,
        meta: {
          description: structure.meta.description,
          keywords: structure.meta.keywords
        }
      };
      
      // Store the generated content
      await contentStorage.storeContent(
        `${structure.keyword || createSlug(structure.title)}/content.json`,
        content,
        { type: 'generated_content', keyword: structure.keyword || createSlug(structure.title) }
      );

      return content;
    } catch (error) {
      console.error('[HUGO] Error generating content:', error);
      throw error;
    }
  }
}

module.exports = new ContentGeneratorService();