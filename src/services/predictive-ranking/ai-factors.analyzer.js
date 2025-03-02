const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');

/**
 * Analyzes content for AI-specific ranking factors that influence performance
 * in modern search engines using large language models and neural networks
 */
class AiFactorsAnalyzer {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Define AI-specific ranking factors to analyze
    this.aiFactors = {
      SEMANTIC_RELEVANCE: {
        id: 'semantic_relevance',
        name: 'Semantic Relevance',
        description: 'How well content matches query meaning beyond keywords',
        weight: 0.25
      },
      CONTENT_NATURALNESS: {
        id: 'content_naturalness',
        name: 'Content Naturalness',
        description: 'How natural and human-like the content reads',
        weight: 0.20
      },
      ENTITY_RECOGNITION: {
        id: 'entity_recognition',
        name: 'Entity Recognition',
        description: 'Presence of identifiable entities and knowledge graph connections',
        weight: 0.20
      },
      QUERY_INTENT_MATCHING: {
        id: 'query_intent',
        name: 'Query Intent Matching',
        description: 'How well content addresses the underlying intent of queries',
        weight: 0.20
      },
      PASSAGE_RELEVANCE: {
        id: 'passage_relevance',
        name: 'Passage-Based Relevance',
        description: 'Presence of highly relevant passages for featured snippets',
        weight: 0.15
      }
    };
  }

  setForceApi(value) {
    this.forceApi = value;
    console.log(`[AI-FACTORS] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[AI-FACTORS] Analyzer initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[AI-FACTORS] Failed to initialize AI Factors Analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze AI-specific ranking factors for the content
   * 
   * @param {string} keyword - Target keyword
   * @param {object} contentData - Content data
   * @param {object} keywordData - Keyword research data
   * @returns {object} - Analysis of AI-specific ranking factors
   */
  async analyze(keyword, contentData, keywordData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[AI-FACTORS] Analyzing AI factors for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-ai-factors.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[AI-FACTORS] Using cached AI factors analysis for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Create analysis object
      const analysis = {
        keyword,
        timestamp: new Date().toISOString(),
        factors: {},
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: []
      };
      
      // Analyze each AI factor
      for (const factorKey in this.aiFactors) {
        const factor = this.aiFactors[factorKey];
        const factorAnalysis = await this.analyzeFactor(factor, contentData, keywordData);
        analysis.factors[factor.id] = factorAnalysis;
      }
      
      // Calculate overall score (weighted average)
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      for (const factorKey in this.aiFactors) {
        const factor = this.aiFactors[factorKey];
        const factorAnalysis = analysis.factors[factor.id];
        weightedScoreSum += factorAnalysis.score * factor.weight;
        weightSum += factor.weight;
      }
      
      analysis.overallScore = weightedScoreSum / weightSum;
      
      // Identify strengths and weaknesses
      this.identifyStrengthsAndWeaknesses(analysis);
      
      // Generate recommendations
      this.generateRecommendations(analysis);
      
      // Cache results
      await localStorage.saveFile(cachePath, analysis);
      
      return analysis;
    } catch (error) {
      console.error(`[AI-FACTORS] Error analyzing AI factors for "${keyword}":`, error);
      throw error;
    }
  }
  
  /**
   * Analyze a specific AI factor
   */
  async analyzeFactor(factor, contentData, keywordData) {
    // Analyze a specific factor based on its ID
    switch (factor.id) {
      case 'semantic_relevance':
        return this.analyzeSemanticRelevance(contentData, keywordData);
      case 'content_naturalness':
        return this.analyzeContentNaturalness(contentData);
      case 'entity_recognition':
        return this.analyzeEntityRecognition(contentData, keywordData);
      case 'query_intent':
        return this.analyzeQueryIntent(contentData, keywordData);
      case 'passage_relevance':
        return this.analyzePassageRelevance(contentData, keywordData);
      default:
        return {
          score: 0.5,
          issues: [],
          recommendations: []
        };
    }
  }

  /**
   * Analyze semantic relevance (beyond keyword matching)
   */
  analyzeSemanticRelevance(contentData, keywordData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Topic coverage score
    let topicCoverageScore = 0.5;
    
    // Check for topic comprehensiveness
    const contentText = this.getFullContentText(contentData);
    const wordCount = contentText.split(/\s+/).length;
    
    if (wordCount > 1500) {
      topicCoverageScore += 0.2;
    } else if (wordCount < 800) {
      analysis.issues.push('Content may be too short for comprehensive topic coverage');
      analysis.recommendations.push('Expand content to at least 1500 words to improve semantic relevance');
    }
    
    // Check for section count and topical coverage
    const sectionCount = (contentData.sections || []).length;
    
    if (sectionCount >= 6) {
      topicCoverageScore += 0.2;
    } else {
      analysis.issues.push('Too few content sections to fully cover the topic');
      analysis.recommendations.push('Add more sections covering different aspects of the topic');
    }
    
    // Related terms score
    let relatedTermsScore = 0.5;
    
    // Check for related terms/topics (would use more sophisticated analysis in production)
    if (keywordData && keywordData.relatedTerms) {
      const relatedTermsFound = this.countRelatedTermsInContent(contentText, keywordData.relatedTerms);
      const relatedTermsRatio = keywordData.relatedTerms.length > 0 ? 
        relatedTermsFound / keywordData.relatedTerms.length : 0;
      
      if (relatedTermsRatio > 0.7) {
        relatedTermsScore += 0.3;
      } else if (relatedTermsRatio > 0.4) {
        relatedTermsScore += 0.1;
      } else {
        analysis.issues.push('Content lacks sufficient coverage of semantically related terms');
        analysis.recommendations.push('Include more terminology that\'s semantically related to your main topic');
      }
    } else {
      // Simplified check without keyword data
      const hasRelatedConcepts = this.hasRelatedConceptsForKeyword(contentData);
      
      if (hasRelatedConcepts) {
        relatedTermsScore += 0.2;
      } else {
        analysis.issues.push('Content may lack semantic depth');
        analysis.recommendations.push('Expand content with related concepts and terminology');
      }
    }
    
    // Check for synonyms usage
    let synonymScore = 0.5;
    const keywordSynonymsUsed = this.checkForSynonymsUsage(contentData);
    
    if (keywordSynonymsUsed) {
      synonymScore += 0.3;
    } else {
      analysis.issues.push('Content relies too heavily on exact keyword matches');
      analysis.recommendations.push('Use synonyms and variations of your main keyword throughout the content');
    }
    
    // Calculate final score
    analysis.score = (topicCoverageScore + relatedTermsScore + synonymScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze content naturalness (avoiding AI-generated patterns)
   */
  analyzeContentNaturalness(contentData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Writing style naturalness
    let writingStyleScore = 0.5;
    
    // Check for natural language patterns
    const contentText = this.getFullContentText(contentData);
    
    // Check for sentence variety
    const sentenceVarietyScore = this.analyzeSentenceVariety(contentText);
    
    if (sentenceVarietyScore > 0.7) {
      writingStyleScore += 0.2;
    } else {
      analysis.issues.push('Sentence structure lacks variety');
      analysis.recommendations.push('Vary sentence length and structure to sound more natural');
    }
    
    // Check for transition words
    if (this.hasAdequateTransitionWords(contentText)) {
      writingStyleScore += 0.1;
    } else {
      analysis.issues.push('Content lacks natural transitions between ideas');
      analysis.recommendations.push('Add more transition words to improve flow (e.g., however, additionally, therefore)');
    }
    
    // Check for overuse of certain phrases or patterns
    const repetitivePatterns = this.detectRepetitivePatterns(contentText);
    
    if (repetitivePatterns) {
      analysis.issues.push('Content contains repetitive phrases or patterns');
      analysis.recommendations.push('Reduce repetition of phrases and sentence structures');
      writingStyleScore -= 0.1;
    }
    
    // Word choice naturalness
    let wordChoiceScore = 0.5;
    
    // Check for variety in word choice
    const wordVarietyScore = this.analyzeWordVariety(contentText);
    
    if (wordVarietyScore > 0.7) {
      wordChoiceScore += 0.2;
    } else {
      analysis.issues.push('Limited vocabulary variety');
      analysis.recommendations.push('Use a more diverse vocabulary throughout your content');
    }
    
    // Check for overuse of jargon or buzzwords
    if (this.hasExcessiveJargon(contentText)) {
      analysis.issues.push('Content contains excessive jargon or buzzwords');
      analysis.recommendations.push('Reduce industry jargon and explain technical terms');
      wordChoiceScore -= 0.1;
    }
    
    // Personal voice and conversational tone
    let personalVoiceScore = 0.5;
    
    // Check for conversational elements
    if (this.hasConversationalElements(contentText)) {
      personalVoiceScore += 0.3;
    } else {
      analysis.issues.push('Content lacks conversational tone');
      analysis.recommendations.push('Add more conversational elements like questions, personal pronouns (you, we), and direct address');
    }
    
    // Calculate final score
    analysis.score = (writingStyleScore + wordChoiceScore + personalVoiceScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze entity recognition (named entities, concepts)
   */
  analyzeEntityRecognition(contentData, keywordData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Entity presence
    let entityPresenceScore = 0.5;
    
    // Check for named entities in content
    const contentText = this.getFullContentText(contentData);
    const entityCount = this.countNamedEntities(contentText);
    
    if (entityCount > 10) {
      entityPresenceScore += 0.3;
    } else if (entityCount > 5) {
      entityPresenceScore += 0.1;
    } else {
      analysis.issues.push('Content contains few recognized entities');
      analysis.recommendations.push('Include more named entities relevant to your topic (people, places, brands, etc.)');
    }
    
    // Entity definition and context
    let entityContextScore = 0.5;
    
    // Check if entities are well defined
    if (this.entitiesHaveContext(contentData)) {
      entityContextScore += 0.3;
    } else {
      analysis.issues.push('Entities in content lack sufficient context');
      analysis.recommendations.push('Provide clear context and explanations for key entities mentioned');
    }
    
    // Entity relationships
    let entityRelationshipScore = 0.5;
    
    // Check for relationships between entities
    if (this.hasEntityRelationships(contentData)) {
      entityRelationshipScore += 0.3;
    } else {
      analysis.issues.push('Content doesn\'t establish clear relationships between entities');
      analysis.recommendations.push('Clarify relationships between entities mentioned in your content');
    }
    
    // Calculate final score
    analysis.score = (entityPresenceScore + entityContextScore + entityRelationshipScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze query intent matching
   */
  analyzeQueryIntent(contentData, keywordData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Determine search intent
    const searchIntent = keywordData?.intent || this.guessSearchIntent(contentData);
    
    // Intent-specific content assessment
    let intentAlignmentScore = 0.5;
    
    // Check content alignment with search intent
    const contentText = this.getFullContentText(contentData);
    const alignmentResult = this.checkIntentAlignment(contentText, searchIntent, contentData);
    
    if (alignmentResult.aligned) {
      intentAlignmentScore += 0.3;
    } else {
      analysis.issues.push(`Content doesn't fully align with ${searchIntent} search intent`);
      analysis.recommendations.push(alignmentResult.recommendation);
    }
    
    // Answer comprehensiveness
    let answerComprehensivenessScore = 0.5;
    
    // Check if content answers common questions for this intent
    if (this.answersCommonQuestions(contentData, searchIntent)) {
      answerComprehensivenessScore += 0.3;
    } else {
      analysis.issues.push('Content doesn\'t address common questions for this search intent');
      analysis.recommendations.push('Add sections that answer common questions users have for this topic');
    }
    
    // Intent satisfaction signals
    let intentSatisfactionScore = 0.5;
    
    // Check for intent satisfaction signals
    if (this.hasIntentSatisfactionSignals(contentData, searchIntent)) {
      intentSatisfactionScore += 0.3;
    } else {
      analysis.issues.push('Content lacks clear intent satisfaction signals');
      analysis.recommendations.push('Add clear indicators that you\'ve satisfied the user\'s search intent');
    }
    
    // Calculate final score
    analysis.score = (intentAlignmentScore + answerComprehensivenessScore + intentSatisfactionScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze passage-based relevance for featured snippets
   */
  analyzePassageRelevance(contentData, keywordData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Check for concise, direct answers
    let directAnswerScore = 0.5;
    
    if (this.hasDirectAnswerPassages(contentData)) {
      directAnswerScore += 0.3;
    } else {
      analysis.issues.push('Content lacks concise, direct answer passages');
      analysis.recommendations.push('Add clear, direct answers to likely user questions in 40-60 word passages');
    }
    
    // Check for structured data-friendly content
    let structuredContentScore = 0.5;
    
    if (this.hasStructuredContent(contentData)) {
      structuredContentScore += 0.3;
    } else {
      analysis.issues.push('Content lacks structured elements that are likely to be featured');
      analysis.recommendations.push('Add more lists, tables, and step-by-step instructions with clear headings');
    }
    
    // Check for question-matching content
    let questionMatchingScore = 0.5;
    
    if (this.hasQuestionMatchingContent(contentData)) {
      questionMatchingScore += 0.3;
    } else {
      analysis.issues.push('Content doesn\'t directly address likely user questions');
      analysis.recommendations.push('Include questions as subheadings followed by direct answers');
    }
    
    // Calculate final score
    analysis.score = (directAnswerScore + structuredContentScore + questionMatchingScore) / 3;
    
    return analysis;
  }

  /**
   * Identify strengths and weaknesses in the analysis
   */
  identifyStrengthsAndWeaknesses(analysis) {
    // Clear existing arrays
    analysis.strengths = [];
    analysis.weaknesses = [];
    
    // Threshold for strengths and weaknesses
    const STRENGTH_THRESHOLD = 0.8;
    const WEAKNESS_THRESHOLD = 0.6;
    
    // Check each factor
    for (const factorId in analysis.factors) {
      const factorData = analysis.factors[factorId];
      const factorName = Object.values(this.aiFactors)
        .find(f => f.id === factorId)?.name || factorId;
      
      if (factorData.score >= STRENGTH_THRESHOLD) {
        analysis.strengths.push({
          factor: factorId,
          name: factorName,
          score: factorData.score
        });
      } else if (factorData.score < WEAKNESS_THRESHOLD) {
        analysis.weaknesses.push({
          factor: factorId,
          name: factorName,
          score: factorData.score
        });
      }
    }
    
    // Sort strengths and weaknesses by score
    analysis.strengths.sort((a, b) => b.score - a.score);
    analysis.weaknesses.sort((a, b) => a.score - b.score);
  }

  /**
   * Generate recommendations for improvement
   */
  generateRecommendations(analysis) {
    // Clear existing array
    analysis.recommendations = [];
    
    // Add recommendations from weaknesses
    for (const weakness of analysis.weaknesses) {
      const factorData = analysis.factors[weakness.factor];
      
      if (factorData.recommendations && factorData.recommendations.length > 0) {
        // Add top 2 recommendations from each weak factor
        for (const recommendation of factorData.recommendations.slice(0, 2)) {
          if (!analysis.recommendations.includes(recommendation)) {
            analysis.recommendations.push(recommendation);
          }
        }
      }
    }
    
    // Limit to top 5 recommendations
    analysis.recommendations = analysis.recommendations.slice(0, 5);
  }

  /**
   * Helper: Get full content text
   */
  getFullContentText(contentData) {
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
   * Helper: Count related terms in content
   */
  countRelatedTermsInContent(contentText, relatedTerms) {
    if (!contentText || !relatedTerms || !Array.isArray(relatedTerms)) {
      return 0;
    }
    
    const contentLower = contentText.toLowerCase();
    let count = 0;
    
    for (const term of relatedTerms) {
      if (contentLower.includes(term.toLowerCase())) {
        count++;
      }
    }
    
    return count;
  }

  /**
   * Helper: Check for related concepts for a keyword
   */
  hasRelatedConceptsForKeyword(contentData) {
    // This would be more sophisticated in production
    // For now, we'll check if there are enough headings and content diversity
    
    if (!contentData.sections || contentData.sections.length < 5) {
      return false;
    }
    
    return true;
  }

  /**
   * Helper: Check for synonyms usage
   */
  checkForSynonymsUsage(contentData) {
    // This would use more sophisticated analysis in production
    // For now, a simple check for word variety
    
    const keyword = contentData.keyword || '';
    if (!keyword) return true;
    
    const contentText = this.getFullContentText(contentData);
    const contentLower = contentText.toLowerCase();
    
    // Simple check - does the exact keyword appear too frequently?
    const keywordCount = (contentLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    const totalWords = contentLower.split(/\s+/).length;
    
    // If keyword density is low but topic is covered, likely using synonyms
    return keywordCount < (totalWords * 0.02);
  }

  /**
   * Helper: Analyze sentence variety
   */
  analyzeSentenceVariety(text) {
    if (!text) return 0;
    
    // Split text into sentences
    const sentences = text.split(/[.!?]\s+/);
    
    if (sentences.length < 3) return 0.5;
    
    // Calculate average sentence length
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    
    // Calculate standard deviation of sentence lengths
    const variance = sentenceLengths.reduce((a, b) => a + Math.pow(b - avgLength, 2), 0) / sentenceLengths.length;
    const stdDev = Math.sqrt(variance);
    
    // Higher standard deviation means more variety in sentence length
    // Normalize to 0-1 scale (typical std dev for natural text is 5-15 words)
    return Math.min(stdDev / 10, 1);
  }

  /**
   * Helper: Check for adequate transition words
   */
  hasAdequateTransitionWords(text) {
    if (!text) return false;
    
    const transitionPatterns = [
      /\b(however|nevertheless|conversely|in contrast|on the other hand)\b/i,
      /\b(therefore|thus|consequently|as a result|accordingly)\b/i,
      /\b(furthermore|moreover|in addition|additionally)\b/i,
      /\b(for example|for instance|specifically|to illustrate)\b/i,
      /\b(in conclusion|to summarize|finally|in summary)\b/i
    ];
    
    let count = 0;
    for (const pattern of transitionPatterns) {
      if (pattern.test(text)) {
        count++;
      }
    }
    
    // Consider transitions adequate if at least 3 types are present
    return count >= 3;
  }

  /**
   * Helper: Detect repetitive patterns
   */
  detectRepetitivePatterns(text) {
    if (!text) return false;
    
    // This would be more sophisticated in production
    // For now, check for repeated sentence beginnings
    
    const sentences = text.split(/[.!?]\s+/).filter(s => s.length > 0);
    
    if (sentences.length < 5) return false;
    
    const beginningWords = sentences.map(s => {
      const words = s.split(/\s+/);
      return words.length > 0 ? words[0].toLowerCase() : '';
    }).filter(w => w.length > 0);
    
    // Count occurrences of each beginning word
    const beginningCounts = {};
    for (const word of beginningWords) {
      beginningCounts[word] = (beginningCounts[word] || 0) + 1;
    }
    
    // Check if any beginning word is used too frequently
    const sentenceCount = sentences.length;
    for (const word in beginningCounts) {
      if (beginningCounts[word] >= Math.max(3, sentenceCount * 0.25)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Helper: Analyze word variety
   */
  analyzeWordVariety(text) {
    if (!text) return 0;
    
    // Remove common stop words
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    
    // Split into words and convert to lowercase
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => !stopWords.includes(word) && word.length > 0);
    
    if (words.length === 0) return 0;
    
    // Count unique words
    const uniqueWords = new Set(words);
    
    // Calculate type-token ratio (unique words / total words)
    return uniqueWords.size / words.length;
  }

  /**
   * Helper: Check for excessive jargon
   */
  hasExcessiveJargon(text) {
    // This would use a more sophisticated jargon detection in production
    // For now, a simple placeholder check
    return false;
  }

  /**
   * Helper: Check for conversational elements
   */
  hasConversationalElements(text) {
    if (!text) return false;
    
    const conversationalPatterns = [
      /\b(you|your|yours)\b/i,  // Second person
      /\b(we|our|us)\b/i,       // First person plural
      /\b(I|my|me)\b/i,         // First person singular
      /\?/,                     // Questions
      /\b(let's|let us)\b/i     // Suggestions/invitations
    ];
    
    let count = 0;
    for (const pattern of conversationalPatterns) {
      if (pattern.test(text)) {
        count++;
      }
    }
    
    // Consider conversational if at least 3 patterns are present
    return count >= 3;
  }

  /**
   * Helper: Count named entities
   */
  countNamedEntities(text) {
    // This would use NER in production
    // For now, a simplified check for capitalized phrases
    
    if (!text) return 0;
    
    // Look for capitalized words that aren't at the beginning of sentences
    const potentialEntityMatches = text.match(/(?<![.!?]\s)[A-Z][a-zA-Z]+((\s+[A-Z][a-zA-Z]+)+)?/g);
    
    return potentialEntityMatches ? potentialEntityMatches.length : 0;
  }

  /**
   * Helper: Check if entities have context
   */
  entitiesHaveContext(contentData) {
    // This would be more sophisticated in production
    // For now, check if content has substantial paragraphs
    
    if (!contentData.sections) return false;
    
    for (const section of contentData.sections) {
      if (section.content && section.content.length > 150) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Helper: Check for entity relationships
   */
  hasEntityRelationships(contentData) {
    // This would use more sophisticated analysis in production
    // For now, check for sections with substantial content
    
    return this.entitiesHaveContext(contentData);
  }

  /**
   * Helper: Guess search intent
   */
  guessSearchIntent(contentData) {
    const keyword = contentData.keyword || '';
    
    // Simple intent classification
    if (/how|guide|tutorial|steps|process/i.test(keyword)) {
      return 'informational';
    } else if (/buy|price|cost|deal|shop/i.test(keyword)) {
      return 'transactional';
    } else if (/best|vs|review|compare/i.test(keyword)) {
      return 'commercial';
    } else if (/login|website|contact|address|location/i.test(keyword)) {
      return 'navigational';
    }
    
    // Default to informational
    return 'informational';
  }

  /**
   * Helper: Check content alignment with intent
   */
  checkIntentAlignment(text, intent, contentData) {
    switch (intent) {
      case 'informational':
        // Look for explanatory content
        if (/explain|understand|learn about|what is|how to|process for/i.test(text)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add more explanatory content with definitions and step-by-step instructions'
          };
        }
        
      case 'transactional':
        // Look for purchase-oriented content
        if (/buy|purchase|order|price|cost|shipping|checkout|shop/i.test(text)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add more purchase-oriented content with pricing, availability, and clear CTAs'
          };
        }
        
      case 'commercial':
        // Look for comparison/evaluation content
        if (/compare|review|best|top|rating|versus|pros|cons/i.test(text)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add more comparison content with pros/cons and specific recommendations'
          };
        }
        
      case 'navigational':
        // Look for location/access information
        if (/location|address|directions|contact|hours|website|login|access/i.test(text)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add more navigational information with clear location/access details'
          };
        }
        
      default:
        return { aligned: true };
    }
  }

  /**
   * Helper: Check if content answers common questions
   */
  answersCommonQuestions(contentData, intent) {
    // Check if content has FAQs
    if (contentData.faqs && contentData.faqs.length >= 3) {
      return true;
    }
    
    // Check for question-like headings in content
    if (contentData.sections) {
      for (const section of contentData.sections) {
        if (section.title && /what|how|why|when|where|which|can|should/i.test(section.title)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Helper: Check for intent satisfaction signals
   */
  hasIntentSatisfactionSignals(contentData, intent) {
    const contentText = this.getFullContentText(contentData);
    
    switch (intent) {
      case 'informational':
        // Check for summary, conclusion, or next steps
        return /in\s+summary|to\s+summarize|conclusion|key\s+takeaway|next\s+steps/i.test(contentText);
        
      case 'transactional':
        // Check for call to action
        return /click\s+here|buy\s+now|order\s+today|get\s+started|shop\s+now/i.test(contentText);
        
      case 'commercial':
        // Check for recommendation
        return /recommend|our\s+pick|top\s+choice|best\s+option|winner\s+is/i.test(contentText);
        
      case 'navigational':
        // Check for contact/location info
        return /contact\s+us|our\s+address|call\s+us|email\s+us|visit\s+us/i.test(contentText);
        
      default:
        return true;
    }
  }

  /**
   * Helper: Check for direct answer passages
   */
  hasDirectAnswerPassages(contentData) {
    // Look for concise paragraphs that provide direct answers
    if (!contentData.sections) return false;
    
    for (const section of contentData.sections) {
      if (!section.content) continue;
      
      // Split content into paragraphs
      const paragraphs = section.content.split(/\n\s*\n|\r\n\s*\r\n/);
      
      for (const para of paragraphs) {
        // Check if paragraph is a good length for a featured snippet (40-60 words)
        const wordCount = para.split(/\s+/).length;
        if (wordCount >= 40 && wordCount <= 60) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Helper: Check for structured content
   */
  hasStructuredContent(contentData) {
    // Check for lists, tables, or step-by-step instructions
    if (!contentData.sections) return false;
    
    for (const section of contentData.sections) {
      if (!section.content) continue;
      
      // Check for numbered lists
      if (/^\s*\d+\.\s+/m.test(section.content)) {
        return true;
      }
      
      // Check for bullet lists
      if (/^\s*[\*\-\u2022]\s+/m.test(section.content)) {
        return true;
      }
      
      // Check for tables
      if (/<table|<tr|<th|<td/i.test(section.content)) {
        return true;
      }
      
      // Check for steps/process indicators
      if (/step\s+\d+|first|second|third|finally|lastly/i.test(section.content)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Helper: Check for question-matching content
   */
  hasQuestionMatchingContent(contentData) {
    // Look for question-style headings followed by answers
    if (!contentData.sections) return false;
    
    for (const section of contentData.sections) {
      if (section.title && /^(what|how|why|when|where|which|can|are|is|do|does|should)/i.test(section.title) && section.content) {
        return true;
      }
    }
    
    // Check FAQs as well
    return !!(contentData.faqs && contentData.faqs.length > 0);
  }
}

module.exports = new AiFactorsAnalyzer(); 