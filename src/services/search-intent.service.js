/**
 * Search Intent Analyzer Service
 * 
 * This service analyzes search intent for keywords to optimize content
 * structure and format for better Google rankings.
 */

const fs = require('fs').promises;
const path = require('path');
const slugify = require('../utils/slugify');

class SearchIntentService {
  constructor() {
    this.forceApi = false;
    this.cachedData = new Map();
    this.mockDelay = 1000; // Simulated API delay in ms
    this.outputDir = path.join(process.cwd(), 'output', 'research');
  }

  setForceApi(value) {
    this.forceApi = value;
    console.log(`[SEARCH-INTENT] Force API set to: ${value}`);
    return this;
  }

  /**
   * Analyze the search intent for a keyword
   * @param {string} keyword - The keyword to analyze
   * @param {Object} serpData - SERP data from keyword research
   * @returns {Promise<Object>} Intent analysis
   */
  async analyzeIntent(keyword, serpData = null) {
    console.log(`[SEARCH-INTENT] Analyzing intent for: "${keyword}"`);
    
    // Create cache directory if it doesn't exist
    await fs.mkdir(this.outputDir, { recursive: true });
    
    const slug = slugify(keyword);
    const cachePath = path.join(this.outputDir, `${slug}-intent.json`);
    
    // Check cache if not forcing API use
    if (!this.forceApi) {
      try {
        const cacheExists = await fs.access(cachePath).then(() => true).catch(() => false);
        if (cacheExists) {
          console.log(`[SEARCH-INTENT] Loading cached intent data for: "${keyword}"`);
          const cachedData = JSON.parse(await fs.readFile(cachePath, 'utf8'));
          return cachedData;
        }
      } catch (error) {
        console.warn(`[SEARCH-INTENT] Cache access error: ${error.message}`);
      }
    }
    
    // If we don't have serpData, try to load it
    if (!serpData) {
      const serpPath = path.join(this.outputDir, `${slug}-kwrds.json`);
      try {
        const serpExists = await fs.access(serpPath).then(() => true).catch(() => false);
        if (serpExists) {
          console.log(`[SEARCH-INTENT] Loading SERP data from: ${serpPath}`);
          serpData = JSON.parse(await fs.readFile(serpPath, 'utf8'));
        }
      } catch (error) {
        console.warn(`[SEARCH-INTENT] SERP data access error: ${error.message}`);
      }
    }
    
    // Process with API or generate mock data
    try {
      let intentData;
      
      // Check if API key exists
      const apiKey = process.env.SEARCH_INTENT_API_KEY;
      if (apiKey && apiKey !== 'your-api-key-here') {
        intentData = await this.callIntentApi(keyword, serpData);
      } else {
        console.log(`[SEARCH-INTENT] API key not found, using mock implementation`);
        intentData = await this.generateMockIntentData(keyword, serpData);
      }
      
      // Save to cache
      await fs.writeFile(cachePath, JSON.stringify(intentData, null, 2), 'utf8');
      
      return intentData;
    } catch (error) {
      console.error(`[SEARCH-INTENT] Error analyzing intent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Call the intent analysis API (implement with your preferred API)
   * @private
   */
  async callIntentApi(keyword, serpData) {
    // This would be implemented with your actual API service
    // For example, using a service like SEMrush, Clearscope, etc.
    throw new Error('API implementation required');
  }
  
  /**
   * Generate mock intent data for testing
   * @private
   */
  async generateMockIntentData(keyword, serpData) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    
    // Analyze keyword for intent signals
    const keywordLower = keyword.toLowerCase();
    const intentTypes = this.analyzeKeywordForIntent(keywordLower);
    const contentFormats = this.identifyContentFormats(keywordLower, serpData);
    const userJourney = this.mapToUserJourney(keywordLower, intentTypes.primaryIntent);
    
    // Generate questions based on keyword
    const questions = this.generateRelevantQuestions(keywordLower);
    
    // Generate featured snippet opportunities
    const snippetOpportunities = this.identifySnippetOpportunities(keywordLower, serpData);
    
    // Compile the complete intent data
    const intentData = {
      keyword,
      intent: {
        primaryIntent: intentTypes.primaryIntent,
        secondaryIntent: intentTypes.secondaryIntent,
        contentFormats: contentFormats,
        userJourney: userJourney,
        buyerStage: this.mapToBuyerStage(userJourney)
      },
      contentRecommendations: {
        recommendedFormat: contentFormats[0], // Best format
        secondaryFormats: contentFormats.slice(1),
        idealWordCount: this.estimateIdealWordCount(serpData, intentTypes.primaryIntent),
        headingStructure: this.recommendHeadingStructure(keywordLower, intentTypes.primaryIntent),
        contentElements: this.recommendContentElements(intentTypes.primaryIntent, userJourney)
      },
      searchFeatures: {
        featuredSnippetOpportunity: snippetOpportunities.hasFeaturedSnippetOpportunity,
        snippetType: snippetOpportunities.snippetType,
        peopleAlsoAsk: questions.slice(0, 4),
        allQuestions: questions,
        requiresLocalOptimization: this.requiresLocalOptimization(keywordLower),
        requiresMediaRich: this.requiresRichMedia(intentTypes.primaryIntent, keywordLower)
      },
      topicClusters: {
        mainTopic: this.identifyMainTopic(keywordLower),
        relatedSubtopics: this.generateRelatedSubtopics(keywordLower, serpData)
      },
      timestamp: new Date().toISOString()
    };
    
    return intentData;
  }
  
  /**
   * Analyze keyword text for intent signals
   * @private
   */
  analyzeKeywordForIntent(keyword) {
    // Informational intent signals
    const infoSignals = ['what', 'how', 'why', 'who', 'when', 'where', 'guide', 'tutorial', 'tips', 'ideas', 'vs', 'versus', 'difference', 'examples'];
    
    // Commercial intent signals
    const commercialSignals = ['best', 'top', 'review', 'compare', 'vs', 'versus', 'alternative', 'comparison'];
    
    // Transactional intent signals
    const transactionalSignals = ['buy', 'price', 'cost', 'cheap', 'purchase', 'deal', 'coupon', 'discount', 'shipping', 'order', 'shop'];
    
    // Navigational intent signals - usually brand names, specific websites
    const navigationalSignals = ['login', 'sign in', 'account', 'official', 'website'];
    
    // Count signal matches
    let infoCount = 0, commCount = 0, transCount = 0, navCount = 0;
    
    infoSignals.forEach(signal => { if (keyword.includes(signal)) infoCount++; });
    commercialSignals.forEach(signal => { if (keyword.includes(signal)) commCount++; });
    transactionalSignals.forEach(signal => { if (keyword.includes(signal)) transCount++; });
    navigationalSignals.forEach(signal => { if (keyword.includes(signal)) navCount++; });
    
    // Determine primary and secondary intent
    const scores = [
      {type: 'informational', score: infoCount},
      {type: 'commercial', score: commCount},
      {type: 'transactional', score: transCount},
      {type: 'navigational', score: navCount}
    ];
    
    scores.sort((a, b) => b.score - a.score);
    
    // Default to informational if no clear signals
    if (scores[0].score === 0) {
      return {
        primaryIntent: 'informational',
        secondaryIntent: null
      };
    }
    
    return {
      primaryIntent: scores[0].type,
      secondaryIntent: scores[1].score > 0 ? scores[1].type : null
    };
  }
  
  /**
   * Identify potential content formats based on keyword and SERP
   * @private
   */
  identifyContentFormats(keyword, serpData) {
    // Content format signals
    const formatSignals = {
      'how-to': ['how to', 'guide', 'tutorial', 'steps', 'instructions'],
      'list-post': ['best', 'top', 'reasons', 'ways', 'tips', 'ideas', 'examples'],
      'comparison': ['vs', 'versus', 'compare', 'comparison', 'difference between'],
      'ultimate-guide': ['complete', 'ultimate', 'comprehensive', 'definitive', 'guide'],
      'case-study': ['case study', 'example', 'success story', 'results'],
      'question-answer': ['what is', 'why', 'how does', 'where can']
    };
    
    // Check for format signals in keyword
    const matchedFormats = [];
    for (const [format, signals] of Object.entries(formatSignals)) {
      for (const signal of signals) {
        if (keyword.includes(signal)) {
          matchedFormats.push(format);
          break;
        }
      }
    }
    
    // Analyze SERP titles for format clues if available
    if (serpData && serpData.serp && Array.isArray(serpData.serp)) {
      const titleFormats = new Map();
      
      for (const result of serpData.serp.slice(0, 5)) { // Look at top 5 results
        if (result.title) {
          const title = result.title.toLowerCase();
          for (const [format, signals] of Object.entries(formatSignals)) {
            for (const signal of signals) {
              if (title.includes(signal)) {
                titleFormats.set(format, (titleFormats.get(format) || 0) + 1);
                break;
              }
            }
          }
        }
      }
      
      // Add formats that appear in SERP titles
      for (const [format, count] of titleFormats.entries()) {
        if (count >= 2 && !matchedFormats.includes(format)) { // If format appears in at least 2 results
          matchedFormats.push(format);
        }
      }
    }
    
    // Default to ultimate-guide if nothing was matched
    if (matchedFormats.length === 0) {
      matchedFormats.push('ultimate-guide');
    }
    
    // Remove duplicates and return
    return [...new Set(matchedFormats)];
  }
  
  /**
   * Map keyword to user journey stage
   * @private
   */
  mapToUserJourney(keyword, primaryIntent) {
    // Awareness signals
    const awarenessSignals = ['what is', 'definition', 'meaning', 'explained', 'basics', 'introduction', 'beginners', 'tutorial'];
    
    // Consideration signals
    const considerationSignals = ['best', 'top', 'review', 'compare', 'vs', 'benefits', 'advantages', 'disadvantages', 'pros and cons'];
    
    // Decision signals
    const decisionSignals = ['buy', 'price', 'cost', 'purchase', 'deal', 'discount', 'where to'];
    
    // Retention/loyalty signals
    const retentionSignals = ['how to use', 'tips', 'advanced', 'guide', 'troubleshooting', 'problems', 'help with'];
    
    // Check for signals
    for (const signal of awarenessSignals) {
      if (keyword.includes(signal)) return 'awareness';
    }
    
    for (const signal of considerationSignals) {
      if (keyword.includes(signal)) return 'consideration';
    }
    
    for (const signal of decisionSignals) {
      if (keyword.includes(signal)) return 'decision';
    }
    
    for (const signal of retentionSignals) {
      if (keyword.includes(signal)) return 'retention';
    }
    
    // Default mapping based on primary intent if no signals found
    switch (primaryIntent) {
      case 'informational': return 'awareness';
      case 'commercial': return 'consideration';
      case 'transactional': return 'decision';
      case 'navigational': return 'decision';
      default: return 'awareness';
    }
  }
  
  /**
   * Map user journey to buyer's journey stage
   * @private
   */
  mapToBuyerStage(userJourney) {
    switch (userJourney) {
      case 'awareness': return 'top-funnel';
      case 'consideration': return 'mid-funnel';
      case 'decision': return 'bottom-funnel';
      case 'retention': return 'post-purchase';
      default: return 'top-funnel';
    }
  }
  
  /**
   * Estimate ideal word count based on SERP data
   * @private
   */
  estimateIdealWordCount(serpData, primaryIntent) {
    // Default word counts by intent
    const defaultCounts = {
      'informational': 2000,
      'commercial': 2500,
      'transactional': 1500,
      'navigational': 1000
    };
    
    // If we have SERP data, analyze competitor word counts
    if (serpData && serpData.serp && Array.isArray(serpData.serp)) {
      const wordCounts = serpData.serp
        .slice(0, 5) // Look at top 5 results
        .filter(result => result.wordCount)
        .map(result => result.wordCount);
      
      if (wordCounts.length > 0) {
        // Calculate average and add 10% to beat competitors
        const average = wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length;
        return Math.round(average * 1.1);
      }
    }
    
    // Default based on intent
    return defaultCounts[primaryIntent] || 2000;
  }
  
  /**
   * Recommend heading structure based on keyword and intent
   * @private
   */
  recommendHeadingStructure(keyword, primaryIntent) {
    // Base structure by intent
    const baseStructure = {
      'informational': [
        { level: 1, text: `Complete Guide to ${this.toTitleCase(keyword)}` },
        { level: 2, text: `What is ${this.toTitleCase(keyword)}?` },
        { level: 2, text: `Benefits of ${this.toTitleCase(keyword)}` },
        { level: 2, text: `How to Get Started with ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Best Practices for ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Common Challenges and Solutions` },
        { level: 2, text: `${this.toTitleCase(keyword)} Case Studies` },
        { level: 2, text: `Future Trends in ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Conclusion` }
      ],
      'commercial': [
        { level: 1, text: `Best ${this.toTitleCase(keyword)}: Complete Guide & Reviews` },
        { level: 2, text: `Top ${this.toTitleCase(keyword)} in ${new Date().getFullYear()}` },
        { level: 2, text: `How to Choose the Right ${this.toTitleCase(keyword)}` },
        { level: 2, text: `What to Look for in ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Reviews of the Top 5 ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Comparison of ${this.toTitleCase(keyword)} Features` },
        { level: 2, text: `Budget Options for ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Premium Options for ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Final Recommendations` }
      ],
      'transactional': [
        { level: 1, text: `How to Buy ${this.toTitleCase(keyword)}: Complete Purchasing Guide` },
        { level: 2, text: `Best Places to Buy ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Current Pricing for ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Special Deals and Discounts` },
        { level: 2, text: `What's Included When You Purchase` },
        { level: 2, text: `Ordering Process Explained` },
        { level: 2, text: `Payment Options` },
        { level: 2, text: `Shipping and Delivery Information` },
        { level: 2, text: `Warranty and Return Policy` }
      ],
      'navigational': [
        { level: 1, text: `Official Guide to ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Overview of ${this.toTitleCase(keyword)}` },
        { level: 2, text: `How to Access ${this.toTitleCase(keyword)}` },
        { level: 2, text: `Features and Capabilities` },
        { level: 2, text: `Troubleshooting Common Issues` },
        { level: 2, text: `Contact Information` },
        { level: 2, text: `FAQs About ${this.toTitleCase(keyword)}` }
      ]
    };
    
    return baseStructure[primaryIntent] || baseStructure['informational'];
  }
  
  /**
   * Recommend content elements based on intent and user journey
   * @private
   */
  recommendContentElements(primaryIntent, userJourney) {
    // Base elements for all content
    const baseElements = ['introduction', 'clear_headings', 'conclusion'];
    
    // Intent-specific elements
    const intentElements = {
      'informational': ['definitions', 'step_by_step_instructions', 'examples', 'expert_quotes'],
      'commercial': ['pros_cons_tables', 'comparison_tables', 'product_images', 'ratings'],
      'transactional': ['pricing_tables', 'cta_buttons', 'testimonials', 'guarantee_information'],
      'navigational': ['direct_links', 'contact_information', 'maps', 'business_hours']
    };
    
    // Journey-specific elements
    const journeyElements = {
      'awareness': ['beginner_explanations', 'infographics', 'video_introductions'],
      'consideration': ['comparison_charts', 'expert_opinions', 'case_studies'],
      'decision': ['detailed_specifications', 'pricing_information', 'social_proof'],
      'retention': ['advanced_tips', 'troubleshooting_guides', 'community_resources']
    };
    
    // Combine elements based on intent and journey
    const combinedElements = [
      ...baseElements,
      ...(intentElements[primaryIntent] || []),
      ...(journeyElements[userJourney] || [])
    ];
    
    return [...new Set(combinedElements)]; // Remove duplicates
  }
  
  /**
   * Generate relevant questions based on keyword
   * @private
   */
  generateRelevantQuestions(keyword) {
    // Basic question templates
    const templates = [
      `What is ${keyword}?`,
      `How does ${keyword} work?`,
      `Why is ${keyword} important?`,
      `What are the benefits of ${keyword}?`,
      `How to get started with ${keyword}?`,
      `What are common problems with ${keyword}?`,
      `How much does ${keyword} cost?`,
      `What are alternatives to ${keyword}?`,
      `Is ${keyword} worth it?`,
      `How to choose the best ${keyword}?`
    ];
    
    // Generate keyword-specific questions by shuffling templates
    return templates
      .sort(() => 0.5 - Math.random())
      .slice(0, 7); // Return 7 random questions
  }
  
  /**
   * Identify featured snippet opportunities
   * @private
   */
  identifySnippetOpportunities(keyword, serpData) {
    // Check keyword for snippet signals
    const definitionSignals = ['what is', 'definition of', 'meaning of'];
    const listSignals = ['best', 'steps', 'ways to', 'tips for', 'how to'];
    const tableSignals = ['vs', 'versus', 'compare', 'comparison', 'price'];
    
    // Determine snippet type
    let snippetType = null;
    let hasFeaturedSnippetOpportunity = false;
    
    for (const signal of definitionSignals) {
      if (keyword.includes(signal)) {
        snippetType = 'definition';
        hasFeaturedSnippetOpportunity = true;
        break;
      }
    }
    
    if (!snippetType) {
      for (const signal of listSignals) {
        if (keyword.includes(signal)) {
          snippetType = 'list';
          hasFeaturedSnippetOpportunity = true;
          break;
        }
      }
    }
    
    if (!snippetType) {
      for (const signal of tableSignals) {
        if (keyword.includes(signal)) {
          snippetType = 'table';
          hasFeaturedSnippetOpportunity = true;
          break;
        }
      }
    }
    
    // If no clear signals but query is question-like, default to paragraph snippet
    if (!snippetType && (keyword.startsWith('how') || keyword.startsWith('what') || 
        keyword.startsWith('why') || keyword.startsWith('when') || keyword.startsWith('where'))) {
      snippetType = 'paragraph';
      hasFeaturedSnippetOpportunity = true;
    }
    
    return {
      hasFeaturedSnippetOpportunity,
      snippetType
    };
  }
  
  /**
   * Check if keyword requires local optimization
   * @private
   */
  requiresLocalOptimization(keyword) {
    const localSignals = ['near me', 'in my area', 'local', 'nearby', 'city', 'location'];
    
    for (const signal of localSignals) {
      if (keyword.includes(signal)) return true;
    }
    
    return false;
  }
  
  /**
   * Check if content likely requires rich media
   * @private
   */
  requiresRichMedia(primaryIntent, keyword) {
    // Visually oriented keywords
    const visualSignals = ['how to', 'tutorial', 'guide', 'examples', 'images', 'pictures', 'photos', 'design', 'look'];
    
    // Check for visual signals
    for (const signal of visualSignals) {
      if (keyword.includes(signal)) return true;
    }
    
    // By intent
    return primaryIntent === 'commercial' || primaryIntent === 'transactional';
  }
  
  /**
   * Identify main topic category
   * @private
   */
  identifyMainTopic(keyword) {
    // Extract likely main topic by removing modifiers
    const modifiers = ['how to', 'what is', 'best', 'top', 'guide to', 'tutorial'];
    let cleanKeyword = keyword;
    
    for (const modifier of modifiers) {
      cleanKeyword = cleanKeyword.replace(modifier, '').trim();
    }
    
    // Return first 2-3 words as main topic
    const words = cleanKeyword.split(' ');
    return words.slice(0, Math.min(3, words.length)).join(' ');
  }
  
  /**
   * Generate related subtopics
   * @private
   */
  generateRelatedSubtopics(keyword, serpData) {
    // If we have related keywords from SERP data, use them
    if (serpData && serpData.relatedKeywords && Array.isArray(serpData.relatedKeywords)) {
      return serpData.relatedKeywords.slice(0, 5);
    }
    
    // Otherwise generate some based on common patterns
    const mainTopic = this.identifyMainTopic(keyword);
    
    return [
      `best ${mainTopic}`,
      `${mainTopic} guide`,
      `how to use ${mainTopic}`,
      `${mainTopic} examples`,
      `${mainTopic} trends`
    ];
  }
  
  /**
   * Helper: Convert string to title case
   * @private
   */
  toTitleCase(str) {
    return str.replace(
      /\w\S*/g,
      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }
}

module.exports = new SearchIntentService(); 