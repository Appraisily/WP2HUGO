const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentStructureService {
  async generateStructure(keyword) {
    console.log('[STRUCTURE] Generating structure for:', keyword);
    
    // Create a static structure with required images array
    const slug = createSlug(keyword);
    const structure = {
      title: `Comprehensive Guide to ${keyword}`,
      slug: slug,
      sections: [
        {
          title: "Introduction",
          content: `An introduction to ${keyword} and its significance.`
        },
        {
          title: "History and Origins",
          content: "Historical background and development over time."
        },
        {
          title: "Value Assessment",
          content: "How to determine value and important factors to consider."
        },
        {
          title: "Market Analysis",
          content: "Current market conditions and future outlook."
        },
        {
          title: "Collecting Guide",
          content: "Tips for collectors and enthusiasts."
        }
      ],
      meta: {
        description: `Learn everything about ${keyword} from history to value assessment.`,
        keywords: [keyword, "value", "collecting", "guide", "history"],
      },
      // The required images array
      images: [
        {
          type: "featured",
          description: `Professional photograph of ${keyword} on neutral background with dramatic lighting`,
          alt: `High-quality image of ${keyword} showing details and condition`,
          placement: "top of article"
        },
        {
          type: "content",
          description: `Historical ${keyword} examples showing evolution over time`,
          alt: `Historical timeline of ${keyword} development`,
          placement: "history section"
        },
        {
          type: "content",
          description: `Closeup of ${keyword} showing value factors and condition elements`,
          alt: `Detail view of ${keyword} highlighting value factors`,
          placement: "value assessment section"
        }
      ]
    };

    // Store the structure
    await contentStorage.storeContent(
      `seo/keywords/${slug}/structure.json`,
      structure,
      { type: 'structure', keyword }
    );

    return structure;
  }
}

module.exports = new ContentStructureService();