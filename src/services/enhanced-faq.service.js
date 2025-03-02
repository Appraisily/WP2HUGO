const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

/**
 * Service for generating enhanced, comprehensive FAQs
 * based on search intent analysis and real user questions
 */
class EnhancedFaqService {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Common FAQ question patterns
    this.questionPatterns = {
      informational: [
        'What is {keyword}?',
        'How does {keyword} work?',
        'Why is {keyword} important?',
        'What are the benefits of {keyword}?',
        'What types of {keyword} exist?',
        'How can I learn more about {keyword}?',
        'What should I know about {keyword}?'
      ],
      transactional: [
        'Where can I buy {keyword}?',
        'How much does {keyword} cost?',
        'What is the best price for {keyword}?',
        'Are there discounts for {keyword}?',
        'How do I order {keyword}?',
        'Is {keyword} available online?',
        'What payment options are available for {keyword}?'
      ],
      commercial: [
        'What is the best {keyword}?',
        'How does {keyword} compare to alternatives?',
        'What are the pros and cons of {keyword}?',
        'Is {keyword} worth the money?',
        'Which {keyword} is best for beginners?',
        'What features should I look for in {keyword}?',
        'What do users say about {keyword}?'
      ],
      navigational: [
        'Where is {keyword} located?',
        'How do I contact {keyword}?',
        'What are the hours for {keyword}?',
        'How do I find the official website for {keyword}?',
        'Is {keyword} available in my area?',
        'Can I visit {keyword} in person?',
        'What is the address for {keyword}?'
      ]
    };
    
    // Question types for topic exploration
    this.questionTypes = [
      'what', 'why', 'how', 'when', 'where', 'who', 'which', 
      'can', 'do', 'should', 'will', 'are', 'is'
    ];
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[ENHANCED-FAQ] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[ENHANCED-FAQ] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[ENHANCED-FAQ] Failed to initialize Enhanced FAQ service:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive FAQs based on keyword, search intent and existing content
   * @param {string} keyword - The target keyword
   * @param {object} contentData - The content data with sections, title, etc.
   * @param {object} searchIntent - The search intent analysis
   * @param {object} competitorData - Data from competitor analysis
   * @returns {object} - Enhanced content with comprehensive FAQs
   */
  async generateEnhancedFaqs(keyword, contentData, searchIntent, competitorData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[ENHANCED-FAQ] Generating enhanced FAQs for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-enhanced-faqs.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[ENHANCED-FAQ] Using cached enhanced FAQs for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Extract existing FAQs if any
      const existingFaqs = contentData.faqs || [];
      
      // Identify missing question types and generate comprehensive FAQs
      const missingFaqTypes = this.identifyMissingFaqTypes(existingFaqs, searchIntent);
      
      // Generate FAQs for missing types
      const generatedFaqs = await this.generateFaqsForTypes(keyword, missingFaqTypes, contentData);
      
      // Extract competitor FAQs if available
      const competitorFaqs = this.extractCompetitorFaqs(competitorData);
      
      // Get related questions from "People Also Ask" data if available
      const paaQuestions = this.extractPaaQuestions(competitorData);
      
      // Generate FAQ questions from content sections
      const contentBasedFaqs = this.generateContentBasedFaqs(contentData);
      
      // Combine all FAQs, remove duplicates, and sort by relevance
      const combinedFaqs = this.combineAndPrioritizeFaqs(
        existingFaqs,
        generatedFaqs,
        competitorFaqs,
        paaQuestions,
        contentBasedFaqs,
        searchIntent
      );
      
      // Add comprehensive answers to the FAQs
      const enhancedFaqs = await this.generateFaqAnswers(combinedFaqs, contentData, keyword);
      
      // Structure the FAQs for optimal presentation
      const structuredFaqs = this.structureFaqsForPresentation(enhancedFaqs, searchIntent);
      
      // Add the enhanced FAQs to the content
      const enhancedContent = JSON.parse(JSON.stringify(contentData));
      enhancedContent.faqs = structuredFaqs.faqs;
      enhancedContent.faqGroups = structuredFaqs.faqGroups;
      enhancedContent.faqStats = {
        total: structuredFaqs.faqs.length,
        byPriority: {
          high: structuredFaqs.faqs.filter(faq => faq.priority === 'high').length,
          medium: structuredFaqs.faqs.filter(faq => faq.priority === 'medium').length,
          low: structuredFaqs.faqs.filter(faq => faq.priority === 'low').length
        },
        bySource: {
          existing: existingFaqs.length,
          generated: generatedFaqs.length,
          competitor: competitorFaqs.length,
          paa: paaQuestions.length,
          contentBased: contentBasedFaqs.length
        }
      };
      
      // Add FAQ optimization recommendations
      enhancedContent.faqRecommendations = this.generateFaqRecommendations(structuredFaqs, searchIntent);
      
      // Cache the results
      await localStorage.saveFile(cachePath, enhancedContent);
      
      return enhancedContent;
    } catch (error) {
      console.error(`[ENHANCED-FAQ] Error generating enhanced FAQs for "${keyword}":`, error);
      // Return original content if there's an error
      return contentData;
    }
  }

  /**
   * Identify missing FAQ types based on existing FAQs and search intent
   */
  identifyMissingFaqTypes(existingFaqs, searchIntent) {
    const { primaryIntent, subIntents } = searchIntent;
    const missingTypes = [];
    
    // Get question patterns for the primary intent
    const primaryIntentPatterns = this.questionPatterns[primaryIntent] || [];
    
    // Check which primary intent patterns are missing from existing FAQs
    primaryIntentPatterns.forEach(pattern => {
      // Check if any existing FAQ matches this pattern
      const patternExists = existingFaqs.some(faq => {
        const question = faq.question.toLowerCase();
        const patternBase = pattern.toLowerCase().replace('{keyword}', '').trim();
        return question.includes(patternBase);
      });
      
      if (!patternExists) {
        missingTypes.push({
          pattern,
          intent: primaryIntent,
          priority: 'high'
        });
      }
    });
    
    // Check for sub-intent patterns as well (with lower priority)
    subIntents.forEach(subIntent => {
      const subIntentPatterns = this.questionPatterns[subIntent] || [];
      
      subIntentPatterns.forEach(pattern => {
        const patternExists = existingFaqs.some(faq => {
          const question = faq.question.toLowerCase();
          const patternBase = pattern.toLowerCase().replace('{keyword}', '').trim();
          return question.includes(patternBase);
        });
        
        if (!patternExists) {
          missingTypes.push({
            pattern,
            intent: subIntent,
            priority: 'medium'
          });
        }
      });
    });
    
    // Add general exploration questions if needed (lower priority)
    const hasWhatQuestion = existingFaqs.some(faq => 
      faq.question.toLowerCase().startsWith('what is') || 
      faq.question.toLowerCase().startsWith('what are')
    );
    
    if (!hasWhatQuestion) {
      missingTypes.push({
        pattern: 'What is {keyword}?',
        intent: 'general',
        priority: 'high' // This is a fundamental question
      });
    }
    
    const hasHowQuestion = existingFaqs.some(faq => 
      faq.question.toLowerCase().startsWith('how does') || 
      faq.question.toLowerCase().startsWith('how do') ||
      faq.question.toLowerCase().startsWith('how to')
    );
    
    if (!hasHowQuestion) {
      missingTypes.push({
        pattern: 'How does {keyword} work?',
        intent: 'general',
        priority: 'high' // Also fundamental
      });
    }
    
    return missingTypes;
  }

  /**
   * Generate FAQs for the identified missing types
   */
  async generateFaqsForTypes(keyword, missingTypes, contentData) {
    const generatedFaqs = [];
    
    // For each missing type, generate a question and initial answer
    missingTypes.forEach(type => {
      const question = type.pattern.replace('{keyword}', keyword);
      
      const faq = {
        question,
        answer: '', // Will be filled in later
        intent: type.intent,
        priority: type.priority,
        source: 'generated',
        type: 'missing_type'
      };
      
      generatedFaqs.push(faq);
    });
    
    // Generate additional exploratory questions based on keyword
    const exploratoryQuestions = this.generateExploratoryQuestions(keyword, contentData);
    exploratoryQuestions.forEach(question => {
      generatedFaqs.push({
        question,
        answer: '',
        intent: 'exploratory',
        priority: 'medium',
        source: 'generated',
        type: 'exploratory'
      });
    });
    
    return generatedFaqs;
  }

  /**
   * Generate exploratory questions based on the keyword and content
   */
  generateExploratoryQuestions(keyword, contentData) {
    const questions = [];
    
    // Extract topics from content sections
    const topics = [];
    if (contentData.sections && Array.isArray(contentData.sections)) {
      contentData.sections.forEach(section => {
        if (section.title) {
          const title = section.title.toLowerCase();
          // Ignore generic sections
          if (!title.includes('introduction') && 
              !title.includes('conclusion') && 
              !title.includes('summary') &&
              !title.includes('overview')) {
            topics.push(section.title);
          }
        }
      });
    }
    
    // Generate questions for key topics
    topics.slice(0, 3).forEach(topic => {
      const questionType = this.questionTypes[Math.floor(Math.random() * 3)]; // Mostly use what, why, how
      let question = '';
      
      switch (questionType) {
        case 'what':
          question = `What is the relationship between ${keyword} and ${topic}?`;
          break;
        case 'why':
          question = `Why is ${topic} important for ${keyword}?`;
          break;
        case 'how':
          question = `How does ${topic} affect ${keyword}?`;
          break;
        default:
          question = `What should I know about ${topic} when considering ${keyword}?`;
      }
      
      questions.push(question);
    });
    
    // Generate comparative questions
    questions.push(`How does ${keyword} compare to alternatives?`);
    
    // Generate future-oriented questions
    questions.push(`What are the future trends for ${keyword}?`);
    
    // Generate cost/value questions
    questions.push(`What factors affect the value of ${keyword}?`);
    
    return questions;
  }

  /**
   * Extract FAQs from competitor data
   */
  extractCompetitorFaqs(competitorData) {
    const competitorFaqs = [];
    
    if (!competitorData || !competitorData.competitors) {
      return competitorFaqs;
    }
    
    // Look for FAQ sections in competitor content
    competitorData.competitors.forEach(competitor => {
      if (competitor.faqs && Array.isArray(competitor.faqs)) {
        competitor.faqs.forEach(faq => {
          competitorFaqs.push({
            question: faq.question,
            answer: '', // We'll generate our own answers
            intent: 'competitor',
            priority: 'medium',
            source: 'competitor',
            type: 'competitor'
          });
        });
      }
    });
    
    return competitorFaqs;
  }

  /**
   * Extract questions from "People Also Ask" data
   */
  extractPaaQuestions(competitorData) {
    const paaQuestions = [];
    
    if (!competitorData || !competitorData.paa || !Array.isArray(competitorData.paa)) {
      return paaQuestions;
    }
    
    // Extract questions from PAA data
    competitorData.paa.forEach(item => {
      paaQuestions.push({
        question: item.question,
        answer: '', // We'll generate our own answers
        intent: 'paa',
        priority: 'high', // PAA questions are highly relevant
        source: 'paa',
        type: 'paa'
      });
    });
    
    return paaQuestions;
  }

  /**
   * Generate FAQ questions based on content sections
   */
  generateContentBasedFaqs(contentData) {
    const contentFaqs = [];
    
    if (!contentData.sections || !Array.isArray(contentData.sections)) {
      return contentFaqs;
    }
    
    // Transform main sections into questions
    contentData.sections.forEach(section => {
      if (!section.title) return;
      
      const title = section.title.trim();
      
      // Skip generic sections
      if (title.toLowerCase().includes('introduction') || 
          title.toLowerCase().includes('conclusion') || 
          title.toLowerCase().includes('summary') ||
          title.toLowerCase().includes('overview')) {
        return;
      }
      
      // Transform section title to question
      let question = '';
      if (title.match(/^How to|^Why|^What|^When|^Where/i)) {
        // Already in question format
        question = title.endsWith('?') ? title : `${title}?`;
      } else if (title.includes(':')) {
        // Title with colon - transform appropriately
        const parts = title.split(':');
        question = `What is ${parts[0].trim()} and ${parts[1].trim()}?`;
      } else if (title.match(/benefits|advantages|pros|cons/i)) {
        // Benefits/pros/cons section
        question = `What are the ${title.toLowerCase()}?`;
      } else if (title.match(/types|kinds|varieties/i)) {
        // Types/categories section
        question = `What are the different ${title.toLowerCase()}?`;
      } else if (title.match(/cost|price|value/i)) {
        // Cost/price section
        question = `What is the ${title.toLowerCase()}?`;
      } else {
        // Default transformation
        question = `What should I know about ${title}?`;
      }
      
      contentFaqs.push({
        question,
        answer: '', // Will be filled in later
        intent: 'content',
        priority: 'medium',
        source: 'content',
        type: 'section_based',
        sectionId: section.id || null
      });
    });
    
    return contentFaqs;
  }

  /**
   * Combine and prioritize FAQs from different sources
   */
  combineAndPrioritizeFaqs(existingFaqs, generatedFaqs, competitorFaqs, paaQuestions, contentBasedFaqs, searchIntent) {
    // Combine all FAQs
    const allFaqs = [
      ...existingFaqs.map(faq => ({
        ...faq,
        source: faq.source || 'existing',
        priority: faq.priority || 'high'
      })),
      ...generatedFaqs,
      ...competitorFaqs,
      ...paaQuestions,
      ...contentBasedFaqs
    ];
    
    // Remove duplicates based on question similarity
    const uniqueFaqs = this.removeDuplicateFaqs(allFaqs);
    
    // Prioritize based on search intent
    const prioritizedFaqs = this.prioritizeFaqsByIntent(uniqueFaqs, searchIntent);
    
    return prioritizedFaqs;
  }

  /**
   * Remove duplicate FAQs based on question similarity
   */
  removeDuplicateFaqs(faqs) {
    const uniqueFaqs = [];
    const questionMap = new Map();
    
    // First pass: normalize questions and track them
    faqs.forEach(faq => {
      const normalizedQuestion = this.normalizeQuestion(faq.question);
      
      if (!questionMap.has(normalizedQuestion)) {
        questionMap.set(normalizedQuestion, {
          count: 1,
          faq: faq
        });
      } else {
        const existing = questionMap.get(normalizedQuestion);
        existing.count += 1;
        
        // If the new FAQ has higher priority, replace the existing one
        if (this.getPriorityWeight(faq.priority) > this.getPriorityWeight(existing.faq.priority)) {
          existing.faq = faq;
        }
        // If same priority but from a better source, replace
        else if (this.getPriorityWeight(faq.priority) === this.getPriorityWeight(existing.faq.priority) &&
                this.getSourceWeight(faq.source) > this.getSourceWeight(existing.faq.source)) {
          existing.faq = faq;
        }
      }
    });
    
    // Second pass: check for similar questions (not exact matches)
    const normalizedQuestions = Array.from(questionMap.keys());
    
    for (let i = 0; i < normalizedQuestions.length; i++) {
      const q1 = normalizedQuestions[i];
      let isDuplicate = false;
      
      for (let j = 0; j < i; j++) {
        const q2 = normalizedQuestions[j];
        
        if (this.areQuestionsSimilar(q1, q2)) {
          isDuplicate = true;
          
          // Keep the higher priority one
          const item1 = questionMap.get(q1);
          const item2 = questionMap.get(q2);
          
          if (this.getPriorityWeight(item1.faq.priority) > this.getPriorityWeight(item2.faq.priority)) {
            // q1 has higher priority, replace q2
            questionMap.set(q2, item1);
          }
          
          break;
        }
      }
      
      if (isDuplicate) {
        questionMap.delete(q1);
      }
    }
    
    // Build final unique FAQs list
    questionMap.forEach(item => {
      uniqueFaqs.push(item.faq);
    });
    
    return uniqueFaqs;
  }

  /**
   * Normalize a question for comparison
   */
  normalizeQuestion(question) {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }

  /**
   * Check if two questions are semantically similar
   */
  areQuestionsSimilar(q1, q2) {
    // This is a simplified implementation
    // In production, this would use more advanced NLP techniques
    
    // If one is a substring of the other (with some leniency)
    if (q1.includes(q2) || q2.includes(q1)) {
      return true;
    }
    
    // Check word overlap
    const words1 = q1.split(' ');
    const words2 = q2.split(' ');
    
    let matchCount = 0;
    words1.forEach(word => {
      if (words2.includes(word)) {
        matchCount++;
      }
    });
    
    // Calculate Jaccard similarity
    const union = new Set([...words1, ...words2]).size;
    const similarity = matchCount / union;
    
    // If similarity is above threshold, consider them similar
    return similarity > 0.6;
  }

  /**
   * Get numerical weight for priority level
   */
  getPriorityWeight(priority) {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  /**
   * Get numerical weight for source type
   */
  getSourceWeight(source) {
    switch (source) {
      case 'paa': return 5;        // People Also Ask is highly valuable
      case 'existing': return 4;    // Existing FAQs already vetted
      case 'content': return 3;     // Content-based questions are good
      case 'generated': return 2;   // Generated questions may need refinement
      case 'competitor': return 1;  // Competitor questions lowest priority
      default: return 1;
    }
  }

  /**
   * Prioritize FAQs based on search intent
   */
  prioritizeFaqsByIntent(faqs, searchIntent) {
    const { primaryIntent, subIntents } = searchIntent;
    
    // Helper function to check if a question aligns with an intent
    const getIntentMatch = (question, intent) => {
      const lowerQuestion = question.toLowerCase();
      
      switch (intent) {
        case 'informational':
          return /\b(what|how|why|when|explain|understand)\b/i.test(lowerQuestion) ? 1 : 0;
        case 'transactional':
          return /\b(buy|price|cost|purchase|order|shop|deal)\b/i.test(lowerQuestion) ? 1 : 0;
        case 'commercial':
          return /\b(best|compare|review|vs|versus|difference|better|top|recommend)\b/i.test(lowerQuestion) ? 1 : 0;
        case 'navigational':
          return /\b(where|location|address|contact|website|visit|hours|phone)\b/i.test(lowerQuestion) ? 1 : 0;
        default:
          return 0;
      }
    };
    
    // Adjust priority based on intent match
    return faqs.map(faq => {
      const primaryMatch = getIntentMatch(faq.question, primaryIntent);
      
      // Calculate subintent matches
      let subIntentMatch = 0;
      subIntents.forEach(intent => {
        subIntentMatch += getIntentMatch(faq.question, intent);
      });
      
      // Adjust priority based on intent matches
      let adjustedPriority = faq.priority;
      
      if (primaryMatch > 0 && faq.priority !== 'high') {
        adjustedPriority = 'high';
      } else if (subIntentMatch > 0 && faq.priority === 'low') {
        adjustedPriority = 'medium';
      }
      
      return {
        ...faq,
        priority: adjustedPriority,
        intentMatch: {
          primary: primaryMatch > 0,
          secondary: subIntentMatch > 0
        }
      };
    });
  }

  /**
   * Generate comprehensive answers for the FAQs
   */
  async generateFaqAnswers(faqs, contentData, keyword) {
    // For demonstration, we'll generate simplified answers based on content
    // In a production environment, this would use LLMs or other techniques
    
    return faqs.map(faq => {
      // Keep existing answers if available
      if (faq.answer && faq.answer.length > 20) {
        return faq;
      }
      
      let answer = '';
      
      // Try to find content in the existing sections
      if (contentData.sections && Array.isArray(contentData.sections)) {
        for (const section of contentData.sections) {
          if (!section.content) continue;
          
          // Look for content that might answer the question
          const questionWords = this.extractKeywords(faq.question);
          const contentMatchScore = this.calculateContentMatch(questionWords, section.content);
          
          if (contentMatchScore > 0.6) {
            // Extract a relevant portion of the content
            answer = this.extractRelevantContent(section.content, questionWords);
            break;
          }
        }
      }
      
      // If no good content match found, generate a placeholder answer
      if (!answer || answer.length < 30) {
        answer = this.generatePlaceholderAnswer(faq.question, keyword, faq.intent);
      }
      
      return {
        ...faq,
        answer: answer
      };
    });
  }

  /**
   * Extract keywords from a question for content matching
   */
  extractKeywords(question) {
    const stopWords = ['what', 'when', 'where', 'why', 'how', 'is', 'are', 'do', 'does', 'can', 'will', 'should', 'the', 'a', 'an', 'in', 'for', 'of', 'to', 'with', 'on', 'at', 'from', 'by'];
    
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(' ')
      .filter(word => !stopWords.includes(word) && word.length > 2);
  }

  /**
   * Calculate how well content matches question keywords
   */
  calculateContentMatch(keywords, content) {
    if (!keywords.length) return 0;
    
    const contentLower = content.toLowerCase();
    let matchCount = 0;
    
    keywords.forEach(keyword => {
      if (contentLower.includes(keyword)) {
        matchCount++;
      }
    });
    
    return matchCount / keywords.length;
  }

  /**
   * Extract the most relevant portion of content for a question
   */
  extractRelevantContent(content, keywords) {
    // Split content into sentences
    const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
    if (!sentences.length) return content;
    
    // Score each sentence for relevance
    const scoredSentences = sentences.map(sentence => {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;
      
      keywords.forEach(keyword => {
        if (sentenceLower.includes(keyword)) {
          score++;
        }
      });
      
      return { sentence, score };
    });
    
    // Sort by score and take top 2-3 sentences
    scoredSentences.sort((a, b) => b.score - a.score);
    
    // Take top scoring sentences, up to 3
    const topSentences = scoredSentences
      .slice(0, Math.min(3, scoredSentences.length))
      .map(item => item.sentence);
    
    return topSentences.join(' ').trim();
  }

  /**
   * Generate a placeholder answer when content matching fails
   */
  generatePlaceholderAnswer(question, keyword, intent) {
    // This is a placeholder implementation
    // In production, this would use an LLM or other advanced technique
    
    // Check question type
    const questionLower = question.toLowerCase();
    
    if (questionLower.startsWith('what is')) {
      return `${keyword} refers to an important concept in its field. Understanding ${keyword} can help you make better decisions and achieve better results.`;
    } else if (questionLower.startsWith('how to') || questionLower.startsWith('how do')) {
      return `To effectively work with ${keyword}, it's important to follow best practices and established techniques. The process typically involves several key steps which should be adapted to your specific needs.`;
    } else if (questionLower.startsWith('why')) {
      return `${keyword} is important for several key reasons. It provides significant benefits and addresses critical needs in its context.`;
    } else if (questionLower.includes('best') || questionLower.includes('top')) {
      return `When looking for the best ${keyword}, consider factors like quality, reliability, performance, and value. The optimal choice will depend on your specific requirements and circumstances.`;
    } else if (questionLower.includes('cost') || questionLower.includes('price')) {
      return `The cost of ${keyword} can vary significantly based on several factors including quality, brand, features, and where you purchase it. It's important to compare options to find the best value.`;
    } else {
      return `This is an important question about ${keyword}. The answer depends on several factors and should be considered in the context of your specific situation and goals.`;
    }
  }

  /**
   * Structure FAQs for optimal presentation
   */
  structureFaqsForPresentation(faqs, searchIntent) {
    // Sort FAQs by priority
    faqs.sort((a, b) => {
      // First by priority
      const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by intent match
      if (a.intentMatch?.primary && !b.intentMatch?.primary) return -1;
      if (!a.intentMatch?.primary && b.intentMatch?.primary) return 1;
      
      // Then by question length (shorter questions first)
      return a.question.length - b.question.length;
    });
    
    // Limit to a reasonable number (8-12) of FAQs
    const limitedFaqs = faqs.slice(0, Math.min(12, faqs.length));
    
    // Group FAQs by theme for better presentation
    const faqGroups = [];
    
    // Basic/definitional group
    const basicFaqs = limitedFaqs.filter(faq => 
      faq.question.toLowerCase().startsWith('what is') ||
      faq.question.toLowerCase().startsWith('what are') ||
      faq.question.toLowerCase().startsWith('who ')
    );
    
    if (basicFaqs.length > 0) {
      faqGroups.push({
        title: 'Basic Information',
        faqs: basicFaqs.map(faq => faq.question)
      });
    }
    
    // How-to/process group
    const howToFaqs = limitedFaqs.filter(faq => 
      faq.question.toLowerCase().startsWith('how to') ||
      faq.question.toLowerCase().startsWith('how do') ||
      faq.question.toLowerCase().includes('process') ||
      faq.question.toLowerCase().includes('steps')
    );
    
    if (howToFaqs.length > 0) {
      faqGroups.push({
        title: 'How-To & Process',
        faqs: howToFaqs.map(faq => faq.question)
      });
    }
    
    // Comparison/evaluation group
    const comparisonFaqs = limitedFaqs.filter(faq => 
      faq.question.toLowerCase().includes('best') ||
      faq.question.toLowerCase().includes('vs') ||
      faq.question.toLowerCase().includes('versus') ||
      faq.question.toLowerCase().includes('compare') ||
      faq.question.toLowerCase().includes('difference')
    );
    
    if (comparisonFaqs.length > 0) {
      faqGroups.push({
        title: 'Comparison & Evaluation',
        faqs: comparisonFaqs.map(faq => faq.question)
      });
    }
    
    // Pricing/value group
    const pricingFaqs = limitedFaqs.filter(faq => 
      faq.question.toLowerCase().includes('cost') ||
      faq.question.toLowerCase().includes('price') ||
      faq.question.toLowerCase().includes('worth') ||
      faq.question.toLowerCase().includes('value')
    );
    
    if (pricingFaqs.length > 0) {
      faqGroups.push({
        title: 'Pricing & Value',
        faqs: pricingFaqs.map(faq => faq.question)
      });
    }
    
    // Return structured FAQ data
    return {
      faqs: limitedFaqs,
      faqGroups
    };
  }

  /**
   * Generate recommendations for FAQ optimization
   */
  generateFaqRecommendations(structuredFaqs, searchIntent) {
    const recommendations = [];
    const faqs = structuredFaqs.faqs;
    
    // Check if we have enough FAQs
    if (faqs.length < 5) {
      recommendations.push({
        type: 'quantity',
        severity: 'high',
        description: 'Insufficient number of FAQs - add more questions to enhance content comprehensiveness',
        recommendation: 'Add at least 5-8 more relevant frequently asked questions with detailed answers'
      });
    }
    
    // Check for FAQ Schema markup
    recommendations.push({
      type: 'schema',
      severity: 'high',
      description: 'Implement FAQ Schema markup for better search visibility',
      recommendation: 'Add structured data markup for FAQs using the schema.org FAQPage format'
    });
    
    // Check for intent alignment
    const { primaryIntent } = searchIntent;
    const intentAlignedFaqs = faqs.filter(faq => faq.intentMatch?.primary);
    
    if (intentAlignedFaqs.length < faqs.length * 0.5) {
      recommendations.push({
        type: 'intentAlignment',
        severity: 'medium',
        description: `FAQ section not fully aligned with ${primaryIntent} search intent`,
        recommendation: `Add more questions that address ${primaryIntent} intent aspects of the topic`
      });
    }
    
    // Check answer quality (simplistic check)
    const shortAnswers = faqs.filter(faq => faq.answer.length < 50);
    if (shortAnswers.length > 0) {
      recommendations.push({
        type: 'answerQuality',
        severity: 'medium',
        description: 'Some FAQ answers are too brief to be fully helpful',
        recommendation: 'Expand answers to be more comprehensive, aiming for 2-3 sentences minimum',
        affectedQuestions: shortAnswers.map(faq => faq.question)
      });
    }
    
    // Check for grouping implementation
    if (structuredFaqs.faqGroups.length >= 2) {
      recommendations.push({
        type: 'presentation',
        severity: 'low',
        description: 'Consider organizing FAQs into thematic groups for better user experience',
        recommendation: 'Implement FAQ accordion groups based on the suggested groupings'
      });
    }
    
    return recommendations;
  }
}

module.exports = new EnhancedFaqService(); 