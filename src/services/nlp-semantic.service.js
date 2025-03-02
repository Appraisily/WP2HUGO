const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

/**
 * Service for enhancing content with NLP semantic analysis
 * to better match search intent and semantic search algorithms
 */
class NlpSemanticService {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Common search intent categories
    this.intentCategories = {
      INFORMATIONAL: 'informational',
      NAVIGATIONAL: 'navigational',
      TRANSACTIONAL: 'transactional',
      COMMERCIAL: 'commercial_investigation'
    };
    
    // Semantic fields to analyze
    this.semanticFields = [
      'topicCoverage',
      'entityRelationships',
      'conceptualDepth',
      'lexicalDiversity',
      'contextualRelevance',
      'semanticCohesion'
    ];
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[NLP-SEMANTIC] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[NLP-SEMANTIC] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[NLP-SEMANTIC] Failed to initialize NLP Semantic service:', error);
      throw error;
    }
  }

  /**
   * Analyze content semantically and enhance it to better match search intent
   * @param {string} keyword - The target keyword
   * @param {object} contentData - The content data with sections, title, etc.
   * @param {object} keywordData - Keyword research data
   * @returns {object} - Enhanced content with semantic improvements
   */
  async enhanceSemantics(keyword, contentData, keywordData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[NLP-SEMANTIC] Enhancing semantics for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-semantic-enhanced.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[NLP-SEMANTIC] Using cached semantic analysis for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Extract content text from contentData
      const contentText = this.extractContentText(contentData);
      
      // Determine search intent
      const searchIntent = await this.determineSearchIntent(keyword, keywordData);
      
      // Analyze semantic gaps
      const semanticAnalysis = await this.analyzeSemantics(contentText, keyword, searchIntent);
      
      // Generate semantic enhancement suggestions
      const semanticEnhancements = this.generateSemanticEnhancements(
        contentData, 
        semanticAnalysis, 
        searchIntent
      );
      
      // Enhance content based on semantic analysis
      const enhancedContent = this.enhanceContentSemantics(
        contentData, 
        semanticAnalysis, 
        semanticEnhancements,
        searchIntent
      );
      
      // Cache the results
      await localStorage.saveFile(cachePath, enhancedContent);
      
      return enhancedContent;
    } catch (error) {
      console.error(`[NLP-SEMANTIC] Error enhancing semantics for "${keyword}":`, error);
      // Return original content if there's an error
      return contentData;
    }
  }

  /**
   * Extract all text content from the content data structure
   */
  extractContentText(contentData) {
    let text = contentData.title || '';
    
    // Add description
    if (contentData.description) {
      text += ' ' + contentData.description;
    }
    
    // Add section content
    if (contentData.sections && Array.isArray(contentData.sections)) {
      contentData.sections.forEach(section => {
        if (section.title) text += ' ' + section.title;
        if (section.content) text += ' ' + section.content;
      });
    }
    
    // Add FAQs content
    if (contentData.faqs && Array.isArray(contentData.faqs)) {
      contentData.faqs.forEach(faq => {
        if (faq.question) text += ' ' + faq.question;
        if (faq.answer) text += ' ' + faq.answer;
      });
    }
    
    return text;
  }

  /**
   * Determine the search intent for a keyword
   * In a production environment, this would use advanced NLP models
   */
  async determineSearchIntent(keyword, keywordData) {
    // Default to informational if no keyword data
    if (!keywordData) {
      return {
        primaryIntent: this.intentCategories.INFORMATIONAL,
        confidence: 0.7,
        subIntents: []
      };
    }
    
    // Check for specific intent indicators in the keyword
    const keywordLower = keyword.toLowerCase();
    
    // Determine primary intent
    let primaryIntent = this.intentCategories.INFORMATIONAL; // Default
    let confidence = 0.7;
    const subIntents = [];
    
    // Check for transactional intent markers
    if (/\b(buy|price|discount|deal|shop|purchase|order|cheap|affordable)\b/i.test(keywordLower)) {
      primaryIntent = this.intentCategories.TRANSACTIONAL;
      confidence = 0.85;
      subIntents.push(this.intentCategories.COMMERCIAL);
    } 
    // Check for commercial investigation intent
    else if (/\b(best|vs|versus|review|compare|top|comparison|alternative)\b/i.test(keywordLower)) {
      primaryIntent = this.intentCategories.COMMERCIAL;
      confidence = 0.85;
      subIntents.push(this.intentCategories.INFORMATIONAL);
    }
    // Check for navigational intent
    else if (/\b(login|website|official|site|homepage|address|location|hours|phone|contact)\b/i.test(keywordLower)) {
      primaryIntent = this.intentCategories.NAVIGATIONAL;
      confidence = 0.8;
    }
    // Otherwise informational (already default)
    else if (/\b(how|what|why|when|who|guide|tutorial|learn|explain)\b/i.test(keywordLower)) {
      primaryIntent = this.intentCategories.INFORMATIONAL;
      confidence = 0.9;
    }
    
    // Use SERP data from keyword research if available
    if (keywordData.serp && keywordData.serp.results) {
      // Analyze SERP titles and descriptions for intent signals
      const serpTexts = keywordData.serp.results.map(r => 
        `${r.title || ''} ${r.description || ''}`
      ).join(' ').toLowerCase();
      
      // Count intent signals in SERP
      const intentSignals = {
        [this.intentCategories.INFORMATIONAL]: (serpTexts.match(/\b(guide|how|what|why|learn|understand|explained)\b/gi) || []).length,
        [this.intentCategories.TRANSACTIONAL]: (serpTexts.match(/\b(buy|price|shop|order|purchase)\b/gi) || []).length,
        [this.intentCategories.COMMERCIAL]: (serpTexts.match(/\b(best|review|top|vs|compare)\b/gi) || []).length,
        [this.intentCategories.NAVIGATIONAL]: (serpTexts.match(/\b(official|login|contact|website|address)\b/gi) || []).length
      };
      
      // Find strongest signal from SERP
      const maxSignal = Math.max(...Object.values(intentSignals));
      const serpIntent = Object.keys(intentSignals).find(key => intentSignals[key] === maxSignal);
      
      // If SERP shows strong signal, adjust our prediction
      if (maxSignal > 3 && serpIntent !== primaryIntent) {
        subIntents.unshift(primaryIntent); // Add current primary as subintent
        primaryIntent = serpIntent; // Set new primary from SERP
        confidence = 0.75; // Adjust confidence
      }
    }
    
    // Make sure subIntents doesn't include the primary intent
    const filteredSubIntents = subIntents.filter(intent => intent !== primaryIntent);
    
    return {
      primaryIntent,
      confidence,
      subIntents: filteredSubIntents
    };
  }

  /**
   * Analyze the semantic aspects of content
   */
  async analyzeSemantics(contentText, keyword, searchIntent) {
    // This would use advanced NLP APIs in production
    // For now, we'll implement a simplified analysis
    
    const analysis = {
      keyword,
      searchIntent,
      semanticFields: {},
      gaps: [],
      strengths: [],
      opportunities: []
    };
    
    // Analyze topic coverage - how well does content cover the main topic?
    analysis.semanticFields.topicCoverage = this.analyzeTopicCoverage(contentText, keyword);
    
    // Analyze lexical diversity - variety of vocabulary
    analysis.semanticFields.lexicalDiversity = this.analyzeLexicalDiversity(contentText);
    
    // Analyze conceptual depth - how deeply the content explores concepts
    analysis.semanticFields.conceptualDepth = this.analyzeConceptualDepth(contentText, keyword);
    
    // Analyze contextual relevance - how relevant to search intent
    analysis.semanticFields.contextualRelevance = this.analyzeContextualRelevance(contentText, searchIntent);
    
    // Analyze semantic cohesion - how well the content flows
    analysis.semanticFields.semanticCohesion = this.analyzeSemanticCohesion(contentText);
    
    // Identify semantic gaps based on intent
    analysis.gaps = this.identifySemanticGaps(analysis);
    
    // Identify semantic strengths
    analysis.strengths = this.identifySemanticStrengths(analysis);
    
    // Identify semantic opportunities
    analysis.opportunities = this.identifySemanticOpportunities(analysis);
    
    return analysis;
  }

  /**
   * Analyze topic coverage score
   */
  analyzeTopicCoverage(contentText, keyword) {
    // Check how thoroughly the content covers the topic
    // In production, this would use topic modeling techniques
    
    const contentLength = contentText.length;
    const keywordCount = (contentText.match(new RegExp(keyword, 'gi')) || []).length;
    const keywordVariants = this.generateKeywordVariants(keyword);
    
    // Check if related terms are included
    let relatedTermsCount = 0;
    keywordVariants.forEach(variant => {
      relatedTermsCount += (contentText.match(new RegExp(variant, 'gi')) || []).length;
    });
    
    // Calculate basic topic coverage score
    let coverageScore = 0;
    
    // Length impact (longer content typically covers more aspects)
    if (contentLength > 5000) coverageScore += 25;
    else if (contentLength > 3000) coverageScore += 20;
    else if (contentLength > 1500) coverageScore += 15;
    else if (contentLength > 800) coverageScore += 10;
    else coverageScore += 5;
    
    // Keyword usage impact
    if (keywordCount > 0) {
      const density = (keywordCount * keyword.length) / contentLength;
      if (density >= 0.01 && density <= 0.03) coverageScore += 20; // Optimal density
      else if (density > 0.03) coverageScore += 10; // Too high
      else coverageScore += 15; // Too low
    }
    
    // Related terms impact
    if (relatedTermsCount >= 10) coverageScore += 25;
    else if (relatedTermsCount >= 5) coverageScore += 20;
    else if (relatedTermsCount >= 3) coverageScore += 15;
    else if (relatedTermsCount >= 1) coverageScore += 10;
    else coverageScore += 0;
    
    // Normalize to 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, coverageScore / 70));
    
    return {
      score: normalizedScore,
      keywordCount,
      relatedTermsCount,
      keywordVariants,
      contentLength
    };
  }

  /**
   * Generate variants of a keyword for semantic analysis
   */
  generateKeywordVariants(keyword) {
    // In production, this would use word embeddings or a thesaurus API
    // For now, use a simplified approach
    
    const words = keyword.toLowerCase().split(' ');
    const variants = [];
    
    // Generate simple variants
    if (words.length > 1) {
      // Reorder words
      variants.push(words.slice(1).join(' ') + ' ' + words[0]);
      
      // Use synonyms for common words (very simplified)
      const synonyms = {
        'guide': ['tutorial', 'how-to', 'instruction', 'manual'],
        'best': ['top', 'greatest', 'finest', 'leading'],
        'review': ['analysis', 'assessment', 'evaluation'],
        'how': ['way', 'method', 'approach'],
        'what': ['which', 'the'],
        'tips': ['advice', 'strategies', 'techniques']
      };
      
      // Replace words with synonyms where possible
      words.forEach(word => {
        if (synonyms[word]) {
          synonyms[word].forEach(synonym => {
            const newVariant = keyword.toLowerCase().replace(word, synonym);
            variants.push(newVariant);
          });
        }
      });
    }
    
    // Add plurals or singulars
    if (keyword.endsWith('s')) {
      variants.push(keyword.slice(0, -1));
    } else {
      variants.push(keyword + 's');
    }
    
    return [...new Set(variants)]; // Remove duplicates
  }

  /**
   * Analyze lexical diversity score
   */
  analyzeLexicalDiversity(contentText) {
    // Type-token ratio (unique words / total words)
    const words = contentText.toLowerCase().match(/\b[\w']+\b/g) || [];
    const uniqueWords = [...new Set(words)];
    
    const typeTokenRatio = words.length > 0 ? uniqueWords.length / words.length : 0;
    
    // Normalize TTR (it naturally decreases with text length)
    // Using root TTR as it's more stable for longer texts
    const rootTTR = words.length > 0 ? uniqueWords.length / Math.sqrt(words.length) : 0;
    
    // Convert to a 0-1 score (rough calibration, would be refined in production)
    const normalizedScore = Math.min(1, Math.max(0, rootTTR / 10));
    
    return {
      score: normalizedScore,
      uniqueWordCount: uniqueWords.length,
      totalWordCount: words.length,
      typeTokenRatio,
      rootTTR
    };
  }

  /**
   * Analyze conceptual depth score
   */
  analyzeConceptualDepth(contentText, keyword) {
    // In production, this would analyze how deeply concepts are explored
    // Here we use simplified metrics
    
    // Count sentences as a proxy for distinct points made
    const sentences = contentText.match(/[.!?]+(?=\s|$)/g) || [];
    const sentenceCount = sentences.length;
    
    // Count paragraphs as a proxy for distinct ideas explored
    const paragraphs = contentText.split(/\n\s*\n/) || [];
    const paragraphCount = paragraphs.length;
    
    // Check if content has definitions (simplified)
    const hasDefinitions = /\bis\s+(a|an|the)\s+|\bmeans\s+|\brefers\s+to\s+|\bdefined\s+as\s+/i.test(contentText);
    
    // Check if content has examples
    const hasExamples = /\bfor\s+example|\binstance|\bsuch\s+as|\be\.g\.|\billustrat/i.test(contentText);
    
    // Calculate depth score
    let depthScore = 0;
    
    // Sentence impact
    if (sentenceCount > 100) depthScore += 20;
    else if (sentenceCount > 50) depthScore += 15;
    else if (sentenceCount > 25) depthScore += 10;
    else depthScore += 5;
    
    // Paragraph impact
    if (paragraphCount > 20) depthScore += 20;
    else if (paragraphCount > 10) depthScore += 15;
    else if (paragraphCount > 5) depthScore += 10;
    else depthScore += 5;
    
    // Definition impact
    if (hasDefinitions) depthScore += 10;
    
    // Examples impact
    if (hasExamples) depthScore += 10;
    
    // Check for deeper explanations
    const hasDeepExpanations = /\bwhy\s+this\s+(is|works|happens)|\bbecause\s+|\bthe\s+reason\s+|\bexplain\s+/i.test(contentText);
    if (hasDeepExpanations) depthScore += 10;
    
    // Normalize to 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, depthScore / 70));
    
    return {
      score: normalizedScore,
      sentenceCount,
      paragraphCount,
      hasDefinitions,
      hasExamples,
      hasDeepExpanations
    };
  }

  /**
   * Analyze contextual relevance score based on search intent
   */
  analyzeContextualRelevance(contentText, searchIntent) {
    const { primaryIntent, subIntents } = searchIntent;
    
    // Different intent types should have different content focuses
    const intentRelevancePatterns = {
      [this.intentCategories.INFORMATIONAL]: {
        patterns: [
          /how\s+to/i, 
          /what\s+is/i, 
          /why\s+\w+/i, 
          /\blearn\b/i, 
          /\bguide\b/i, 
          /\btutorial\b/i,
          /\bunderstand\b/i,
          /\bexplain\b/i
        ],
        contextMarkers: ['explanation', 'information', 'guide', 'tutorial', 'steps', 'process']
      },
      [this.intentCategories.TRANSACTIONAL]: {
        patterns: [
          /\bbuy\b/i, 
          /\bprice\b/i, 
          /\bcost\b/i, 
          /\border\b/i, 
          /\bpurchase\b/i, 
          /\bshop\b/i,
          /\bdeal\b/i,
          /\bdiscount\b/i
        ],
        contextMarkers: ['purchase', 'price', 'deal', 'shipping', 'discount', 'shop', 'offer']
      },
      [this.intentCategories.COMMERCIAL]: {
        patterns: [
          /\bbest\b/i, 
          /\btop\b/i, 
          /\breview\b/i, 
          /\bvs\b/i, 
          /\bcompare\b/i, 
          /\bcomparison\b/i,
          /\boption\b/i,
          /\balternative\b/i
        ],
        contextMarkers: ['comparison', 'review', 'pros', 'cons', 'benefits', 'drawbacks']
      },
      [this.intentCategories.NAVIGATIONAL]: {
        patterns: [
          /\bofficial\b/i, 
          /\bwebsite\b/i, 
          /\blogin\b/i, 
          /\baddress\b/i, 
          /\bcontact\b/i, 
          /\bhours\b/i,
          /\blocation\b/i,
          /\bphone\b/i
        ],
        contextMarkers: ['contact', 'address', 'hours', 'website', 'official', 'headquarters']
      }
    };
    
    // Check primary intent relevance
    const primaryPatterns = intentRelevancePatterns[primaryIntent].patterns;
    let primaryMatchCount = 0;
    
    primaryPatterns.forEach(pattern => {
      const matches = contentText.match(pattern) || [];
      primaryMatchCount += matches.length;
    });
    
    // Check for context markers
    const primaryMarkers = intentRelevancePatterns[primaryIntent].contextMarkers;
    let markerMatchCount = 0;
    
    primaryMarkers.forEach(marker => {
      const markerRegex = new RegExp('\\b' + marker + '\\b', 'i');
      if (markerRegex.test(contentText)) {
        markerMatchCount++;
      }
    });
    
    // Check subintent relevance
    let subIntentMatchCount = 0;
    subIntents.forEach(subIntent => {
      const subPatterns = intentRelevancePatterns[subIntent]?.patterns || [];
      subPatterns.forEach(pattern => {
        const matches = contentText.match(pattern) || [];
        subIntentMatchCount += matches.length;
      });
    });
    
    // Calculate relevance score
    let relevanceScore = 0;
    
    // Primary intent pattern matches (most important)
    if (primaryMatchCount > 10) relevanceScore += 35;
    else if (primaryMatchCount > 5) relevanceScore += 25;
    else if (primaryMatchCount > 2) relevanceScore += 15;
    else if (primaryMatchCount > 0) relevanceScore += 5;
    
    // Context marker matches
    relevanceScore += markerMatchCount * 5; // 5 points per marker, up to 30 (6 markers)
    
    // Subintent pattern matches (less important)
    if (subIntentMatchCount > 5) relevanceScore += 15;
    else if (subIntentMatchCount > 2) relevanceScore += 10;
    else if (subIntentMatchCount > 0) relevanceScore += 5;
    
    // Normalize to 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, relevanceScore / 80));
    
    return {
      score: normalizedScore,
      primaryIntentMatchCount: primaryMatchCount,
      subIntentMatchCount,
      markerMatchCount,
      primaryIntent,
      subIntents
    };
  }

  /**
   * Analyze semantic cohesion score
   */
  analyzeSemanticCohesion(contentText) {
    // In production, this would analyze semantic relationships between sentences/paragraphs
    // Here we use simplified metrics based on transition words
    
    // Count transition words/phrases as a proxy for coherent flow
    const transitionPatterns = [
      /\bfirst\b|\bsecond\b|\bthird\b|\bfinally\b|\bnext\b|\bthen\b|\blast\b|\bmoreover\b/i,
      /\bin addition\b|\bfurthermore\b|\balso\b|\bbeside\b|\bbesides\b/i,
      /\bhowever\b|\balthough\b|\bdespite\b|\bon the other hand\b|\bin contrast\b/i,
      /\bbecause\b|\btherefore\b|\bas a result\b|\bconsequently\b|\bthus\b/i,
      /\bfor example\b|\bfor instance\b|\bspecifically\b|\bto illustrate\b/i,
      /\bin conclusion\b|\bto sum up\b|\boverall\b|\bin summary\b/i
    ];
    
    let transitionCount = 0;
    transitionPatterns.forEach(pattern => {
      const matches = contentText.match(pattern) || [];
      transitionCount += matches.length;
    });
    
    // Count paragraphs to normalize transition count
    const paragraphs = contentText.split(/\n\s*\n/) || [];
    const paragraphCount = paragraphs.length;
    
    // Calculate transition density (transitions per paragraph)
    const transitionDensity = paragraphCount > 0 ? transitionCount / paragraphCount : 0;
    
    // Check for semantic theme consistency with paragraph topic analysis
    // In production, this would use topic modeling
    // For now, simplified
    
    // Calculate cohesion score
    let cohesionScore = 0;
    
    // Transition count impact
    if (transitionCount > 20) cohesionScore += 35;
    else if (transitionCount > 10) cohesionScore += 25;
    else if (transitionCount > 5) cohesionScore += 15;
    else if (transitionCount > 0) cohesionScore += 5;
    
    // Transition density impact
    if (transitionDensity > 2) cohesionScore += 35;
    else if (transitionDensity > 1) cohesionScore += 25;
    else if (transitionDensity > 0.5) cohesionScore += 15;
    else if (transitionDensity > 0) cohesionScore += 5;
    
    // Normalize to 0-1 range
    const normalizedScore = Math.min(1, Math.max(0, cohesionScore / 70));
    
    return {
      score: normalizedScore,
      transitionCount,
      paragraphCount,
      transitionDensity
    };
  }

  /**
   * Identify semantic gaps in content
   */
  identifySemanticGaps(analysis) {
    const gaps = [];
    const { semanticFields, searchIntent } = analysis;
    
    // Check topic coverage
    if (semanticFields.topicCoverage.score < 0.6) {
      gaps.push({
        type: 'topicCoverage',
        severity: 'high',
        description: 'Content does not adequately cover the topic or key aspects are missing',
        currentScore: semanticFields.topicCoverage.score,
        recommendedActions: [
          'Expand content to cover more aspects of the topic',
          'Include more related terms and concepts',
          'Add more depth to existing subtopics'
        ]
      });
    }
    
    // Check lexical diversity
    if (semanticFields.lexicalDiversity.score < 0.5) {
      gaps.push({
        type: 'lexicalDiversity',
        severity: 'medium',
        description: 'Content uses limited vocabulary, which may impact engagement and semantic richness',
        currentScore: semanticFields.lexicalDiversity.score,
        recommendedActions: [
          'Use more varied vocabulary',
          'Replace repetitive terms with synonyms',
          'Incorporate field-specific terminology'
        ]
      });
    }
    
    // Check conceptual depth
    if (semanticFields.conceptualDepth.score < 0.6) {
      gaps.push({
        type: 'conceptualDepth',
        severity: 'high',
        description: 'Content lacks depth in explaining concepts and ideas',
        currentScore: semanticFields.conceptualDepth.score,
        recommendedActions: [
          'Include definitions of key concepts',
          'Provide examples to illustrate ideas',
          'Explain underlying principles and reasons'
        ]
      });
    }
    
    // Check contextual relevance
    if (semanticFields.contextualRelevance.score < 0.7) {
      // Recommendations based on intent
      const intentRecommendations = {
        [this.intentCategories.INFORMATIONAL]: [
          'Add more explanatory content about the topic',
          'Include step-by-step instructions or processes',
          'Expand on the "why" behind important points'
        ],
        [this.intentCategories.TRANSACTIONAL]: [
          'Include pricing information',
          'Add clear call-to-action for purchases',
          'Provide information about buying options'
        ],
        [this.intentCategories.COMMERCIAL]: [
          'Add comparison tables or sections',
          'Include pros and cons analysis',
          'Provide specific recommendations based on different needs'
        ],
        [this.intentCategories.NAVIGATIONAL]: [
          'Include contact information',
          'Add location details if applicable',
          'Provide direct links to official resources'
        ]
      };
      
      gaps.push({
        type: 'contextualRelevance',
        severity: 'high',
        description: `Content does not strongly align with the ${searchIntent.primaryIntent} search intent`,
        currentScore: semanticFields.contextualRelevance.score,
        recommendedActions: intentRecommendations[searchIntent.primaryIntent] || []
      });
    }
    
    // Check semantic cohesion
    if (semanticFields.semanticCohesion.score < 0.5) {
      gaps.push({
        type: 'semanticCohesion',
        severity: 'medium',
        description: 'Content lacks smooth transitions and logical flow between ideas',
        currentScore: semanticFields.semanticCohesion.score,
        recommendedActions: [
          'Add transition phrases between paragraphs and sections',
          'Ensure logical progression of ideas',
          'Connect related concepts across the content'
        ]
      });
    }
    
    return gaps;
  }

  /**
   * Identify semantic strengths in content
   */
  identifySemanticStrengths(analysis) {
    const strengths = [];
    const { semanticFields } = analysis;
    
    // Identify areas where content performs well
    Object.keys(semanticFields).forEach(field => {
      if (semanticFields[field].score >= 0.8) {
        const strengthDescriptions = {
          topicCoverage: 'Excellent topic coverage with comprehensive discussion of key aspects',
          lexicalDiversity: 'Rich and varied vocabulary enhances content quality and engagement',
          conceptualDepth: 'Impressive depth of concept exploration with detailed explanations',
          contextualRelevance: 'Strong alignment with user search intent',
          semanticCohesion: 'Excellent flow and logical progression between ideas'
        };
        
        strengths.push({
          type: field,
          description: strengthDescriptions[field] || `Strong performance in ${field}`,
          score: semanticFields[field].score
        });
      }
    });
    
    return strengths;
  }

  /**
   * Identify semantic enhancement opportunities
   */
  identifySemanticOpportunities(analysis) {
    const opportunities = [];
    const { semanticFields, searchIntent } = analysis;
    
    // Check for opportunities beyond basic gaps
    // These are "nice to have" enhancements rather than critical fixes
    
    // Topic expansion opportunity
    if (semanticFields.topicCoverage.score >= 0.6 && semanticFields.topicCoverage.score < 0.8) {
      opportunities.push({
        type: 'topicExpansion',
        description: 'Expand coverage of related topics to increase content comprehensiveness',
        potentialImpact: 'medium',
        implementationSuggestion: 'Add 1-2 new sections covering related subtopics or concepts'
      });
    }
    
    // Intent-specific enhancement opportunities
    switch (searchIntent.primaryIntent) {
      case this.intentCategories.INFORMATIONAL:
        // For informational, suggest adding visualization if not present
        opportunities.push({
          type: 'visualExplanation',
          description: 'Add diagrams or visual explanations to enhance understanding',
          potentialImpact: 'high',
          implementationSuggestion: 'Create 1-2 diagrams or flowcharts to visualize complex processes or relationships'
        });
        break;
        
      case this.intentCategories.COMMERCIAL:
        // For commercial, suggest adding comparison elements
        opportunities.push({
          type: 'comparisonElements',
          description: 'Add visual comparison elements to strengthen commercial investigation content',
          potentialImpact: 'high',
          implementationSuggestion: 'Create comparison tables or side-by-side feature lists'
        });
        break;
        
      case this.intentCategories.TRANSACTIONAL:
        // For transactional, suggest enhancing CTAs
        opportunities.push({
          type: 'enhancedCTA',
          description: 'Strengthen call-to-action elements to improve conversion potential',
          potentialImpact: 'high',
          implementationSuggestion: 'Add clear, benefit-oriented CTAs with specific action language'
        });
        break;
    }
    
    // If subintents exist, suggest addressing them more explicitly
    if (searchIntent.subIntents && searchIntent.subIntents.length > 0) {
      opportunities.push({
        type: 'subIntentContent',
        description: `Add content specifically addressing secondary intent: ${searchIntent.subIntents[0]}`,
        potentialImpact: 'medium',
        implementationSuggestion: 'Create a dedicated section addressing the secondary user intent'
      });
    }
    
    return opportunities;
  }

  /**
   * Generate semantic enhancement recommendations
   */
  generateSemanticEnhancements(contentData, semanticAnalysis, searchIntent) {
    const enhancements = {
      title: [],
      description: [],
      sections: [],
      structure: [],
      language: []
    };
    
    // Title enhancements
    const title = contentData.title || '';
    const titleLower = title.toLowerCase();
    const keyword = contentData.keyword || '';
    
    // Check if title could be more intent-aligned
    if (searchIntent.primaryIntent === this.intentCategories.INFORMATIONAL && 
        !(/how|what|why|guide|tutorial/i.test(titleLower))) {
      enhancements.title.push({
        type: 'intentAlignment',
        suggestion: `Consider adding informational markers like "Guide", "How to", or "Understanding" to the title`,
        examples: [
          `A Complete Guide to ${keyword}`,
          `How to ${keyword} - Essential Steps`,
          `Understanding ${keyword}: Everything You Need to Know`
        ]
      });
    } else if (searchIntent.primaryIntent === this.intentCategories.COMMERCIAL && 
               !(/best|top|vs|comparison|review/i.test(titleLower))) {
      enhancements.title.push({
        type: 'intentAlignment',
        suggestion: `Consider adding commercial investigation markers like "Best", "vs", or "Review" to the title`,
        examples: [
          `The Best ${keyword} in ${new Date().getFullYear()}`,
          `${keyword} Review: Is It Worth It?`,
          `${keyword} vs Alternatives: Complete Comparison`
        ]
      });
    }
    
    // Description enhancements
    const description = contentData.description || '';
    
    // Check if description addresses search intent
    if (semanticAnalysis.semanticFields.contextualRelevance.score < 0.7) {
      const intentPhrases = {
        [this.intentCategories.INFORMATIONAL]: [
          `Learn everything about ${keyword}`,
          `Discover the essential facts about ${keyword}`,
          `This comprehensive guide explains ${keyword}`
        ],
        [this.intentCategories.COMMERCIAL]: [
          `Find the best ${keyword} for your needs`,
          `Compare top ${keyword} options`,
          `Honest review of ${keyword} with pros and cons`
        ],
        [this.intentCategories.TRANSACTIONAL]: [
          `Get the best deals on ${keyword}`,
          `Where to buy ${keyword} at the best price`,
          `Purchase ${keyword} with confidence`
        ],
        [this.intentCategories.NAVIGATIONAL]: [
          `Find official ${keyword} information`,
          `Contact details and location for ${keyword}`,
          `Everything you need to know about accessing ${keyword}`
        ]
      };
      
      enhancements.description.push({
        type: 'intentAlignment',
        suggestion: `Revise meta description to better align with ${searchIntent.primaryIntent} search intent`,
        examples: intentPhrases[searchIntent.primaryIntent] || []
      });
    }
    
    // Section content enhancements based on semantic gaps
    const gaps = semanticAnalysis.gaps || [];
    
    gaps.forEach(gap => {
      if (gap.type === 'topicCoverage' || gap.type === 'conceptualDepth') {
        // Specific section enhancement recommendation
        enhancements.sections.push({
          type: gap.type,
          description: gap.description,
          recommendations: gap.recommendedActions
        });
      } else if (gap.type === 'semanticCohesion') {
        // Structural enhancement recommendation
        enhancements.structure.push({
          type: 'improveFlow',
          description: 'Improve content flow and logical progression',
          recommendations: [
            'Add transition phrases between paragraphs',
            'Ensure sections build on each other in a logical sequence',
            'Use signposting to guide readers through the content'
          ]
        });
      } else if (gap.type === 'lexicalDiversity') {
        // Language enhancement recommendation
        enhancements.language.push({
          type: 'vocabularyVariation',
          description: 'Improve vocabulary variation and term usage',
          recommendations: [
            'Use synonyms for frequently repeated terms',
            'Incorporate more field-specific terminology',
            'Vary sentence structures and lengths'
          ]
        });
      }
    });
    
    // Return all enhancement suggestions
    return enhancements;
  }

  /**
   * Enhance content based on semantic analysis
   */
  enhanceContentSemantics(contentData, semanticAnalysis, semanticEnhancements, searchIntent) {
    // Create a deep copy of the content to avoid modifying the original
    const enhancedContent = JSON.parse(JSON.stringify(contentData));
    
    // Add semantic analysis data
    enhancedContent.semanticAnalysis = semanticAnalysis;
    
    // Add enhancement recommendations
    enhancedContent.semanticEnhancements = semanticEnhancements;
    
    // Add search intent information
    enhancedContent.searchIntent = searchIntent;
    
    return enhancedContent;
  }
}

module.exports = new NlpSemanticService(); 