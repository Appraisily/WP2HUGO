const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');

/**
 * Processes analysis results from multiple analyzers and generates 
 * optimized content recommendations that balance various ranking factors
 */
class RankingOptimizer {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    this.optimizationMode = 'balanced'; // balanced, aggressive, conservative
  }

  setForceApi(value) {
    this.forceApi = value;
    console.log(`[RANKING-OPTIMIZER] Force API set to: ${value}`);
  }

  setOptimizationMode(mode) {
    const validModes = ['balanced', 'aggressive', 'conservative'];
    
    if (validModes.includes(mode)) {
      this.optimizationMode = mode;
      console.log(`[RANKING-OPTIMIZER] Optimization mode set to: ${mode}`);
    } else {
      console.warn(`[RANKING-OPTIMIZER] Invalid optimization mode: ${mode}. Using default 'balanced' mode.`);
      this.optimizationMode = 'balanced';
    }
  }

  async initialize() {
    try {
      console.log('[RANKING-OPTIMIZER] Optimizer initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[RANKING-OPTIMIZER] Failed to initialize Ranking Optimizer:', error);
      throw error;
    }
  }

  /**
   * Optimize content based on analyses from multiple ranking factor analyzers
   * 
   * @param {string} keyword - Target keyword
   * @param {object} contentData - Content data
   * @param {object} coreFactorsAnalysis - Analysis from CoreFactorsAnalyzer
   * @param {object} userSignalsAnalysis - Analysis from UserSignalsAnalyzer
   * @param {object} aiFactorsAnalysis - Analysis from AiFactorsAnalyzer
   * @param {object} [futureFactorsAnalysis] - Optional analysis from FutureFactorsPredictor
   * @returns {object} - Optimized content recommendations
   */
  async optimizeContent(keyword, contentData, coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis, futureFactorsAnalysis = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[RANKING-OPTIMIZER] Optimizing content for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-ranking-optimizer.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[RANKING-OPTIMIZER] Using cached optimization results for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Create optimization response object
      const optimization = {
        keyword,
        timestamp: new Date().toISOString(),
        optimizationMode: this.optimizationMode,
        contentSummary: this.summarizeContent(contentData),
        recommendations: {
          priority: [], // High priority recommendations
          secondary: [], // Secondary recommendations
          advanced: []   // Advanced/future-focused recommendations
        },
        contentTemplate: null,
        optimizedMetadata: this.generateOptimizedMetadata(keyword, contentData, coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis),
        optimizationScore: 0
      };
      
      // Process recommendations from each analysis
      this.processRecommendations(optimization, coreFactorsAnalysis, 'Core', 1.0);
      this.processRecommendations(optimization, userSignalsAnalysis, 'User Signals', 0.8);
      this.processRecommendations(optimization, aiFactorsAnalysis, 'AI', 0.7);
      
      if (futureFactorsAnalysis) {
        this.processRecommendations(optimization, futureFactorsAnalysis, 'Future', 0.5);
      }
      
      // Sort and deduplicate recommendations
      this.finalizeRecommendations(optimization);
      
      // Generate content template if optimization mode is aggressive
      if (this.optimizationMode === 'aggressive') {
        optimization.contentTemplate = this.generateContentTemplate(contentData, optimization.recommendations.priority);
      }
      
      // Calculate overall optimization score
      optimization.optimizationScore = this.calculateOptimizationScore(contentData, coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis, futureFactorsAnalysis);
      
      // Cache results
      await localStorage.saveFile(cachePath, optimization);
      
      return optimization;
    } catch (error) {
      console.error(`[RANKING-OPTIMIZER] Error optimizing content for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Process recommendations from an analyzer and add them to optimization results
   */
  processRecommendations(optimization, analysis, analysisType, priorityWeight) {
    if (!analysis || !analysis.recommendations) {
      return;
    }
    
    // Process each recommendation
    for (const recommendation of analysis.recommendations) {
      // Create recommendation object with source information
      const recommendationObj = {
        text: recommendation,
        source: `${analysisType} Factors Analysis`,
        priorityScore: priorityWeight
      };
      
      // Determine recommendation priority based on optimization mode and priority weight
      if (this.optimizationMode === 'aggressive' || (this.optimizationMode === 'balanced' && priorityWeight >= 0.8)) {
        optimization.recommendations.priority.push(recommendationObj);
      } else if (this.optimizationMode === 'conservative' || priorityWeight >= 0.5) {
        optimization.recommendations.secondary.push(recommendationObj);
      } else {
        optimization.recommendations.advanced.push(recommendationObj);
      }
    }
  }

  /**
   * Finalize recommendations by sorting, deduplicating, and limiting quantity
   */
  finalizeRecommendations(optimization) {
    // Helper function to sort recommendations by priority score
    const sortByPriority = (a, b) => b.priorityScore - a.priorityScore;
    
    // Helper function to deduplicate recommendations
    const deduplicate = (recommendations) => {
      const seen = new Set();
      return recommendations.filter(rec => {
        // Create a normalized version of the text for comparison
        const normalizedText = rec.text.toLowerCase().trim();
        if (seen.has(normalizedText)) {
          return false;
        }
        seen.add(normalizedText);
        return true;
      });
    };
    
    // Sort recommendations by priority score
    optimization.recommendations.priority.sort(sortByPriority);
    optimization.recommendations.secondary.sort(sortByPriority);
    optimization.recommendations.advanced.sort(sortByPriority);
    
    // Deduplicate recommendations
    optimization.recommendations.priority = deduplicate(optimization.recommendations.priority);
    optimization.recommendations.secondary = deduplicate(optimization.recommendations.secondary);
    optimization.recommendations.advanced = deduplicate(optimization.recommendations.advanced);
    
    // Limit the number of recommendations based on optimization mode
    const priorityLimit = this.optimizationMode === 'aggressive' ? 10 : (this.optimizationMode === 'balanced' ? 7 : 5);
    const secondaryLimit = this.optimizationMode === 'aggressive' ? 10 : (this.optimizationMode === 'balanced' ? 7 : 5);
    const advancedLimit = this.optimizationMode === 'aggressive' ? 5 : (this.optimizationMode === 'balanced' ? 3 : 2);
    
    optimization.recommendations.priority = optimization.recommendations.priority.slice(0, priorityLimit);
    optimization.recommendations.secondary = optimization.recommendations.secondary.slice(0, secondaryLimit);
    optimization.recommendations.advanced = optimization.recommendations.advanced.slice(0, advancedLimit);
  }

  /**
   * Summarize content for optimization context
   */
  summarizeContent(contentData) {
    const summary = {
      title: contentData.title || '',
      description: contentData.description || '',
      wordCount: 0,
      sectionCount: contentData.sections ? contentData.sections.length : 0,
      mediaCount: 0,
      faqCount: contentData.faqs ? contentData.faqs.length : 0
    };
    
    // Calculate word count
    let contentText = summary.title + ' ' + summary.description;
    
    if (contentData.sections) {
      for (const section of contentData.sections) {
        if (section.title) contentText += ' ' + section.title;
        if (section.content) contentText += ' ' + section.content;
      }
    }
    
    if (contentData.faqs) {
      for (const faq of contentData.faqs) {
        if (faq.question) contentText += ' ' + faq.question;
        if (faq.answer) contentText += ' ' + faq.answer;
      }
    }
    
    summary.wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Count media elements
    if (contentData.images && Array.isArray(contentData.images)) {
      summary.mediaCount += contentData.images.length;
    }
    
    if (contentData.videos && Array.isArray(contentData.videos)) {
      summary.mediaCount += contentData.videos.length;
    }
    
    // Check content sections for embedded media
    if (contentData.sections) {
      for (const section of contentData.sections) {
        if (section.content) {
          // Count image markdown/HTML
          const imgMatches = (section.content.match(/!\[.*?\]\(.*?\)|<img[^>]*>/g) || []).length;
          summary.mediaCount += imgMatches;
          
          // Count video embeds
          const videoMatches = (section.content.match(/<iframe[^>]*>|<video[^>]*>/g) || []).length;
          summary.mediaCount += videoMatches;
        }
      }
    }
    
    return summary;
  }

  /**
   * Generate optimized metadata based on analysis results
   */
  generateOptimizedMetadata(keyword, contentData, coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis) {
    const metadata = {
      title: contentData.title || '',
      description: contentData.description || '',
      suggestedTitleImprovements: [],
      suggestedDescriptionImprovements: [],
      optimizedSchema: this.suggestSchemaType(contentData, coreFactorsAnalysis)
    };
    
    // Title improvement suggestions
    if (contentData.title) {
      // Check title length
      const titleLength = contentData.title.length;
      if (titleLength < 40) {
        metadata.suggestedTitleImprovements.push('Extend title to 50-60 characters for optimal display in SERPs');
      } else if (titleLength > 60) {
        metadata.suggestedTitleImprovements.push('Shorten title to 50-60 characters to prevent truncation in SERPs');
      }
      
      // Check if title contains numbers
      if (!/\d+/.test(contentData.title)) {
        metadata.suggestedTitleImprovements.push('Add specific numbers to your title (e.g., "7 Ways..." or "...in 2024")');
      }
      
      // Check if keyword is in title
      if (keyword && !contentData.title.toLowerCase().includes(keyword.toLowerCase())) {
        metadata.suggestedTitleImprovements.push(`Include target keyword "${keyword}" in the title`);
      } else if (keyword && contentData.title.toLowerCase().indexOf(keyword.toLowerCase()) > 10) {
        metadata.suggestedTitleImprovements.push(`Move target keyword "${keyword}" closer to the beginning of the title`);
      }
    }
    
    // Description improvement suggestions
    if (contentData.description) {
      // Check description length
      const descLength = contentData.description.length;
      if (descLength < 120) {
        metadata.suggestedDescriptionImprovements.push('Extend meta description to 140-155 characters for optimal display');
      } else if (descLength > 155) {
        metadata.suggestedDescriptionImprovements.push('Shorten meta description to 140-155 characters to prevent truncation');
      }
      
      // Check if description contains call to action
      if (!/discover|learn|find|get|read|see how|why|when|what/i.test(contentData.description)) {
        metadata.suggestedDescriptionImprovements.push('Add a compelling call-to-action in your meta description');
      }
      
      // Check if keyword is in description
      if (keyword && !contentData.description.toLowerCase().includes(keyword.toLowerCase())) {
        metadata.suggestedDescriptionImprovements.push(`Include target keyword "${keyword}" in the meta description`);
      }
    }
    
    return metadata;
  }

  /**
   * Suggest appropriate schema type based on content and analysis
   */
  suggestSchemaType(contentData, coreFactorsAnalysis) {
    // This would be more sophisticated in production
    // For now, suggest schema based on simple content patterns
    
    // Default schema suggestion
    let schemaType = 'Article';
    let schemaProperties = ['headline', 'author', 'datePublished', 'image'];
    
    // Check for specific content patterns
    if (contentData.faqs && contentData.faqs.length >= 3) {
      schemaType = 'FAQPage';
      schemaProperties = ['mainEntity', 'name', 'acceptedAnswer', 'text'];
    } else if (contentData.title && /how\s+to|guide|tutorial/i.test(contentData.title)) {
      schemaType = 'HowTo';
      schemaProperties = ['name', 'description', 'step', 'image', 'tool', 'supply'];
    } else if (contentData.title && /review|vs|best|top|comparison/i.test(contentData.title)) {
      schemaType = 'Review';
      schemaProperties = ['itemReviewed', 'reviewRating', 'author', 'reviewBody'];
    }
    
    return {
      type: schemaType,
      recommendedProperties: schemaProperties,
      implementation: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "${schemaType}",
  ${this.generateSchemaPlaceholders(schemaType, schemaProperties)}
}
</script>`
    };
  }

  /**
   * Generate placeholder schema JSON for the suggested schema type
   */
  generateSchemaPlaceholders(schemaType, properties) {
    // Generate example schema properties based on schema type
    let propertiesJson = '';
    
    switch (schemaType) {
      case 'Article':
        propertiesJson = `
  "headline": "ARTICLE_TITLE",
  "author": {
    "@type": "Person",
    "name": "AUTHOR_NAME"
  },
  "datePublished": "YYYY-MM-DD",
  "image": "IMAGE_URL"`;
        break;
        
      case 'FAQPage':
        propertiesJson = `
  "mainEntity": [
    {
      "@type": "Question",
      "name": "FAQ_QUESTION_1",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "FAQ_ANSWER_1"
      }
    },
    {
      "@type": "Question",
      "name": "FAQ_QUESTION_2",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "FAQ_ANSWER_2"
      }
    }
  ]`;
        break;
        
      case 'HowTo':
        propertiesJson = `
  "name": "HOW_TO_TITLE",
  "description": "HOW_TO_DESCRIPTION",
  "step": [
    {
      "@type": "HowToStep",
      "text": "STEP_1_TEXT"
    },
    {
      "@type": "HowToStep",
      "text": "STEP_2_TEXT"
    }
  ],
  "image": "IMAGE_URL"`;
        break;
        
      case 'Review':
        propertiesJson = `
  "itemReviewed": {
    "@type": "Product",
    "name": "PRODUCT_NAME"
  },
  "reviewRating": {
    "@type": "Rating",
    "ratingValue": "RATING_VALUE",
    "bestRating": "5"
  },
  "author": {
    "@type": "Person",
    "name": "REVIEWER_NAME"
  },
  "reviewBody": "REVIEW_CONTENT"`;
        break;
        
      default:
        propertiesJson = properties.map(prop => `  "${prop}": "VALUE_FOR_${prop.toUpperCase()}"`).join(',\n');
    }
    
    return propertiesJson;
  }

  /**
   * Generate a content template with section suggestions based on recommendations
   */
  generateContentTemplate(contentData, recommendations) {
    // This would be more sophisticated in production
    // For now, generate a basic content template based on existing sections and recommendations
    
    const template = {
      title: contentData.title || 'Suggested Title',
      description: contentData.description || 'Suggested Meta Description',
      sections: [],
      suggestedFAQs: []
    };
    
    // Start with existing sections if available
    if (contentData.sections && contentData.sections.length > 0) {
      template.sections = contentData.sections.map(section => ({
        title: section.title || '',
        contentSuggestion: '',
        improvement: ''
      }));
      
      // Add improvement suggestions to existing sections
      for (let i = 0; i < template.sections.length; i++) {
        if (i === 0) {
          template.sections[i].improvement = 'Strengthen introduction with a clear thesis statement and overview of what readers will learn';
        } else if (i === template.sections.length - 1) {
          template.sections[i].improvement = 'Add a compelling conclusion with key takeaways and next steps for the reader';
        } else if (template.sections[i].title && template.sections[i].title.toLowerCase().includes('what')) {
          template.sections[i].improvement = 'Expand definition with more comprehensive explanation and examples';
        } else if (template.sections[i].title && template.sections[i].title.toLowerCase().includes('how')) {
          template.sections[i].improvement = 'Add step-by-step instructions with specific details and consider adding a visual aid';
        } else if (template.sections[i].title && template.sections[i].title.toLowerCase().includes('why')) {
          template.sections[i].improvement = 'Strengthen with data points, expert quotes, or research findings';
        } else {
          template.sections[i].improvement = 'Add more depth, examples, or relevant supporting details';
        }
      }
    } else {
      // Suggest a basic section structure if no sections exist
      template.sections = [
        {
          title: 'Introduction',
          contentSuggestion: 'Introduce the topic, explain its importance, and provide a brief overview of what the reader will learn.',
          improvement: ''
        },
        {
          title: 'What is [Main Topic]',
          contentSuggestion: 'Define the main concept and provide background information. Include any essential terminology.',
          improvement: ''
        },
        {
          title: 'Why [Main Topic] Matters',
          contentSuggestion: 'Explain the significance and benefits of understanding or implementing the main topic.',
          improvement: ''
        },
        {
          title: 'How to [Implement/Use/Understand] [Main Topic]',
          contentSuggestion: 'Provide step-by-step instructions or a detailed explanation of the process.',
          improvement: ''
        },
        {
          title: 'Common Challenges and Solutions',
          contentSuggestion: 'Address potential obstacles and provide practical solutions.',
          improvement: ''
        },
        {
          title: 'Conclusion',
          contentSuggestion: 'Summarize key points and provide next steps or calls to action for the reader.',
          improvement: ''
        }
      ];
    }
    
    // Suggest additional sections based on recommendations
    const sectionSuggestions = new Set();
    
    for (const rec of recommendations) {
      if (rec.text.includes('Add a section') || rec.text.includes('Include a section')) {
        // Extract section suggestion from recommendation
        const match = rec.text.match(/Add a section (on|about|covering) [^.]+/i) || 
                      rec.text.match(/Include a section (on|about|covering) [^.]+/i);
        
        if (match) {
          sectionSuggestions.add(match[0].replace(/Add a section (on|about|covering) /i, '').replace(/Include a section (on|about|covering) /i, ''));
        }
      }
    }
    
    // Add suggested sections to template
    for (const suggestion of sectionSuggestions) {
      template.sections.push({
        title: this.generateSectionTitle(suggestion),
        contentSuggestion: `Add content about ${suggestion}. Include relevant details, examples, and supporting evidence.`,
        improvement: 'New section based on content gap analysis'
      });
    }
    
    // Generate FAQ suggestions
    template.suggestedFAQs = this.generateFAQSuggestions(contentData, recommendations);
    
    return template;
  }

  /**
   * Generate a section title from a topic suggestion
   */
  generateSectionTitle(topic) {
    // Convert topic to title case
    const titleCase = topic.replace(/\b\w/g, l => l.toUpperCase());
    
    // Check if topic is a question
    if (/what|how|why|when|where|which|can|should/i.test(topic.split(' ')[0])) {
      return titleCase + '?';
    }
    
    // Check if topic is process-oriented
    if (topic.includes('steps') || topic.includes('process') || topic.includes('method')) {
      return `How to ${titleCase}`;
    }
    
    // Check if topic is benefit-oriented
    if (topic.includes('benefit') || topic.includes('advantage')) {
      return `Benefits of ${titleCase}`;
    }
    
    // Default section title format
    return `Understanding ${titleCase}`;
  }

  /**
   * Generate FAQ suggestions based on content and recommendations
   */
  generateFAQSuggestions(contentData, recommendations) {
    const faqs = [];
    
    // Check if existing FAQs need to be supplemented
    if (!contentData.faqs || contentData.faqs.length < 3) {
      // Add basic FAQ suggestions
      faqs.push({
        question: `What is the most important thing to know about ${contentData.keyword || 'this topic'}?`,
        answerSuggestion: 'Provide a concise response that highlights the most critical information or insight.'
      });
      
      faqs.push({
        question: `How does ${contentData.keyword || 'this topic'} compare to alternatives?`,
        answerSuggestion: 'Compare and contrast with other similar options, highlighting key differences.'
      });
      
      faqs.push({
        question: `What common mistakes should people avoid with ${contentData.keyword || 'this topic'}?`,
        answerSuggestion: 'List 3-5 common pitfalls and explain how to avoid them.'
      });
    }
    
    // Extract FAQ suggestions from recommendations
    for (const rec of recommendations) {
      if (rec.text.includes('common questions') || rec.text.includes('FAQ')) {
        // Add question suggestions based on recommendation themes
        if (rec.text.includes('beginner') || rec.text.includes('getting started')) {
          faqs.push({
            question: `How do beginners get started with ${contentData.keyword || 'this topic'}?`,
            answerSuggestion: 'Provide a simple step-by-step guide for absolute beginners.'
          });
        }
        
        if (rec.text.includes('cost') || rec.text.includes('price') || rec.text.includes('budget')) {
          faqs.push({
            question: `How much does ${contentData.keyword || 'this'} typically cost?`,
            answerSuggestion: 'Discuss pricing ranges, factors that affect cost, and budget considerations.'
          });
        }
        
        if (rec.text.includes('best practices') || rec.text.includes('tips')) {
          faqs.push({
            question: `What are the best practices for ${contentData.keyword || 'this'}?`,
            answerSuggestion: 'List 5-7 best practices with brief explanations of each.'
          });
        }
      }
    }
    
    return faqs;
  }

  /**
   * Calculate an overall optimization score based on analysis results
   */
  calculateOptimizationScore(contentData, coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis, futureFactorsAnalysis) {
    // Define weights for each analysis type based on optimization mode
    let weights = {
      core: 0.4,
      userSignals: 0.3,
      ai: 0.2,
      future: 0.1
    };
    
    // Adjust weights based on optimization mode
    if (this.optimizationMode === 'aggressive') {
      weights = {
        core: 0.35,
        userSignals: 0.25,
        ai: 0.25,
        future: 0.15
      };
    } else if (this.optimizationMode === 'conservative') {
      weights = {
        core: 0.5,
        userSignals: 0.3,
        ai: 0.15,
        future: 0.05
      };
    }
    
    // Calculate weighted score
    let totalScore = 0;
    let totalWeight = 0;
    
    if (coreFactorsAnalysis && coreFactorsAnalysis.overallScore !== undefined) {
      totalScore += coreFactorsAnalysis.overallScore * weights.core;
      totalWeight += weights.core;
    }
    
    if (userSignalsAnalysis && userSignalsAnalysis.overallScore !== undefined) {
      totalScore += userSignalsAnalysis.overallScore * weights.userSignals;
      totalWeight += weights.userSignals;
    }
    
    if (aiFactorsAnalysis && aiFactorsAnalysis.overallScore !== undefined) {
      totalScore += aiFactorsAnalysis.overallScore * weights.ai;
      totalWeight += weights.ai;
    }
    
    if (futureFactorsAnalysis && futureFactorsAnalysis.overallScore !== undefined) {
      totalScore += futureFactorsAnalysis.overallScore * weights.future;
      totalWeight += weights.future;
    }
    
    // Calculate normalized score
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }
}

module.exports = new RankingOptimizer(); 