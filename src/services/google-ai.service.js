const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class GoogleAIService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = config.googleAi?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/models';
    this.model = config.googleAi?.model || 'gemini-1.5-pro';
    this.maxOutputTokens = config.googleAi?.maxOutputTokens || 4000;
    this.useMockData = false;
    this.forceApi = false;
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[GOOGLE-AI] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.GOOGLE_AI_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[GOOGLE-AI] Google AI API key not found. Using mock data for testing.');
        this.useMockData = true;
      }
      
      console.log('[GOOGLE-AI] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[GOOGLE-AI] Failed to initialize Google AI service:', error);
      this.useMockData = true;
      this.initialized = true; // Still mark as initialized so we can use mock data
      return true;
    }
  }

  /**
   * Generate mock blog post structure data
   * @param {string} keyword - The keyword to generate mock structure for
   * @returns {object} - The mock structure data
   */
  generateMockStructure(keyword) {
    console.log(`[GOOGLE-AI] Generating mock structure for: "${keyword}"`);
    
    return {
      title: `Complete ${keyword}: Expert Tips and Resources`,
      meta_description: `Discover everything you need to know about ${keyword}. Our expert guide provides detailed information, valuation tips, and resources for collectors and enthusiasts.`,
      slug: slugify(keyword),
      sections: [
        {
          heading: "Understanding Antique Value Guides",
          content: `Antique value guides are essential resources for collectors, dealers, and enthusiasts looking to determine the worth of their vintage items. These guides offer comprehensive information about different categories of antiques, their historical significance, and market valuations.\n\nThese guides typically provide detailed descriptions, photographs, and price ranges based on condition and rarity. They help users identify authentic pieces and distinguish valuable antiques from common reproductions.`,
          subsections: []
        },
        {
          heading: "Types of Antique Value Guides",
          content: "There are several formats of antique value guides available, each serving different purposes and levels of expertise. Understanding which guide to use depends on your specific needs and the type of antique you're researching.",
          subsections: [
            {
              heading: "Printed Reference Books",
              content: "Traditional printed guides remain popular among serious collectors. Examples include Kovels' Antiques & Collectibles Price Guide, Miller's Antiques Handbook & Price Guide, and Warman's Antiques & Collectibles. These comprehensive resources are updated annually to reflect current market values."
            },
            {
              heading: "Online Databases",
              content: "Digital platforms such as Worthpoint, LiveAuctioneers, and Invaluable provide real-time auction results and price comparisons. These services offer extensive searchable databases with millions of sold items, allowing for precise valuation based on recent market activity."
            },
            {
              heading: "Specialized Guides",
              content: "Some guides focus exclusively on specific categories like furniture, jewelry, porcelain, or art. These specialized resources provide in-depth information about particular types of antiques, including manufacturing methods, maker's marks, and valuation criteria specific to that category."
            }
          ]
        },
        {
          heading: "Key Factors Affecting Antique Values",
          content: "Understanding what influences the value of antiques is crucial when using value guides effectively. Several factors consistently impact pricing across all categories of antiques.",
          subsections: [
            {
              heading: "Provenance and Authentication",
              content: "An item's history and documented ownership can significantly increase its value. Antiques with clear provenance, especially those connected to historical events or notable individuals, often command premium prices. Authentication from recognized experts provides assurance of genuineness."
            },
            {
              heading: "Condition",
              content: "The condition of an antique is paramount in determining its value. Items in pristine or excellent original condition typically bring the highest prices. Restoration, repairs, or modifications generally decrease value, though professional conservation may be acceptable for very rare pieces."
            },
            {
              heading: "Rarity",
              content: "Scarcity significantly impacts value. Limited production runs, surviving examples of once-common items, and unique pieces all command higher prices. Regional variations or unusual features can also contribute to rarity."
            },
            {
              heading: "Market Demand",
              content: "Collecting trends influence values considerably. Currently popular styles like mid-century modern may see prices rise dramatically, while formerly sought-after categories might experience declining values as collector interests shift."
            }
          ]
        },
        {
          heading: "How to Use Antique Value Guides Effectively",
          content: "Getting the most from antique value guides requires understanding their limitations and knowing how to apply their information to your specific items.",
          subsections: [
            {
              heading: "Cross-Reference Multiple Sources",
              content: "No single guide is definitive. Consulting multiple resources provides a more accurate valuation range and helps confirm identification details. Compare information across printed guides, online databases, and specialist publications."
            },
            {
              heading: "Consider Regional Variations",
              content: "Antique values often vary by geographic location. Prices in major metropolitan areas typically exceed those in rural regions. Some items have stronger regional appeal, commanding higher prices in areas where they have historical significance."
            },
            {
              heading: "Account for Guide Publication Dates",
              content: "Values in printed guides may quickly become outdated. Consider the publication date and adjust expectations accordingly. The antiques market can fluctuate significantly, with some categories experiencing rapid value changes."
            }
          ]
        },
        {
          heading: "Professional Appraisals vs. Value Guides",
          content: "While value guides provide excellent reference points, they cannot replace professional appraisals for significant items. Understanding when to seek professional valuation is important for insurance, estate planning, or high-value sales.",
          subsections: [
            {
              heading: "When to Seek Professional Appraisal",
              content: "Consider professional appraisal for items of significant value, unusual pieces difficult to research, items needed for insurance coverage, or when planning an estate. Professional appraisers bring expertise, objectivity, and credibility to the valuation process."
            },
            {
              heading: "Finding Qualified Appraisers",
              content: "Look for appraisers with credentials from recognized organizations like the International Society of Appraisers (ISA), American Society of Appraisers (ASA), or Appraisers Association of America (AAA). Seek specialists with expertise in your specific type of antique."
            }
          ]
        },
        {
          heading: "Online Resources and Tools",
          content: "The digital age has transformed antique valuation with numerous online tools and resources available to collectors and enthusiasts.",
          subsections: [
            {
              heading: "Auction Archive Databases",
              content: "Platforms like Worthpoint, LiveAuctioneers, and Invaluable maintain extensive records of past auction sales, providing actual realized prices rather than estimates. These searchable databases often include photographs and detailed descriptions."
            },
            {
              heading: "Collector Forums and Communities",
              content: "Online communities like Antiquers.com and collector-specific forums offer valuable insights from experienced collectors. These platforms can help with identification challenges and provide perspective on market trends."
            },
            {
              heading: "Mobile Applications",
              content: "Several smartphone apps now offer instant research capabilities. Some utilize image recognition technology to help identify antiques, while others provide quick access to price databases or auction results."
            }
          ]
        },
        {
          heading: "Conclusion",
          content: "Antique value guides are invaluable tools for anyone interested in collecting, selling, or appraising vintage items. By understanding how to use these resources effectively and recognizing their limitations, you can make more informed decisions about your antiques.\n\nRemember that values fluctuate over time, and multiple factors influence an item's worth beyond what any guide can capture. Combining guide information with expert opinions and market awareness provides the most accurate understanding of an antique's true value.",
          subsections: []
        }
      ],
      faqs: [
        {
          question: "How accurate are antique value guides?",
          answer: "Antique value guides provide useful reference points rather than definitive valuations. Their accuracy varies based on publication date, the specificity of the item described, and current market conditions. For valuable items, guides should be used alongside professional appraisals."
        },
        {
          question: "How often should I update my antique value references?",
          answer: "Serious collectors should update reference materials annually, as antique values can fluctuate significantly based on market trends. Online subscription services provide the most current information, while printed guides typically publish new editions yearly."
        },
        {
          question: "Can antique value guides help identify reproductions?",
          answer: "Quality guides often include information about common reproductions and how to distinguish them from authentic pieces. They may highlight manufacturing details, materials, and markings that differ between originals and reproductions. However, for valuable items, expert authentication is recommended."
        },
        {
          question: "What should I do if my antique isn't listed in any value guides?",
          answer: "For unusual or rare items not found in standard guides, consult specialist references for that specific category. Online auction archives can help locate similar items that have sold recently. Alternatively, seek evaluation from an appraiser who specializes in that type of antique."
        },
        {
          question: "Are online antique value resources more accurate than books?",
          answer: "Online resources often provide more current pricing information based on recent sales, while books offer more comprehensive contextual information and identification details. Using both formats provides the most complete picture of an item's value and significance."
        }
      ],
      table_of_contents: true,
      metadata: {
        tags: ["antiques", "collectibles", "valuation", "appraisal", "collector guides"],
        categories: ["Antiques", "Collecting", "Reference Guides"],
        featured_image: "antique-value-guide-reference-books.jpg",
        publish_date: new Date().toISOString(),
        author: "Antiques Expert"
      }
    };
  }

  /**
   * Generate a blog post structure using Google AI
   * @param {string} keyword - The keyword to generate structure for
   * @param {object} keywordData - Research data for the keyword
   * @param {object} perplexityData - Perplexity data for the keyword
   * @param {object} serpData - SERP data for the keyword
   * @returns {object} - The generated structure
   */
  async generateStructure(keyword, keywordData, perplexityData, serpData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[GOOGLE-AI] Generating blog post structure for: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-googleai-structure.json`);
      
      if (!this.forceApi && await localStorage.fileExists(filePath)) {
        console.log(`[GOOGLE-AI] Using cached structure for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, generate mock structure
      if (this.useMockData) {
        const mockStructure = this.generateMockStructure(keyword);
        await localStorage.saveFile(filePath, mockStructure);
        return mockStructure;
      }
      
      // Extract relevant information from the research data
      const perplexityInfo = perplexityData?.response?.choices?.[0]?.message?.content || '';
      
      // Prepare SERP data summary
      const serpTitles = serpData?.organic_results?.map(result => result.title).join('\n- ') || '';
      
      // Construct the prompt for Google AI
      const prompt = `I need to create an SEO-optimized blog post about "${keyword}". Based on the research data provided, please create a detailed content structure that would be attractive to users and well-optimized for search engines.

RESEARCH DATA:
${perplexityInfo}

TOP SEARCH RESULTS:
- ${serpTitles}

Please provide a detailed blog post structure including:

1. A compelling SEO title (60-65 characters max)
2. A meta description (150-160 characters max)
3. An introduction that hooks the reader and clearly states the value of the article
4. A logical H2/H3 heading structure with brief notes about what to include in each section
5. Suggestions for tables, lists, or other formatting elements that would enhance the content
6. A conclusion that summarizes key points and includes a call to action

Make sure the structure is comprehensive, addresses user intent, and covers all important aspects of the topic. The goal is to create content that is more valuable and informative than the current top-ranking pages.`;
      
      // Make API request
      console.log(`[GOOGLE-AI] Calling API for: "${keyword}"`);
      const response = await axios.post(
        `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: this.maxOutputTokens,
            topP: 0.95,
            topK: 64
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      const data = {
        keyword,
        timestamp: new Date().toISOString(),
        response: response.data
      };
      
      // Save response data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[GOOGLE-AI] Error generating structure for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new GoogleAIService(); 