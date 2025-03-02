const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');

/**
 * Analyzes user engagement signals that influence search rankings
 * Focuses on metrics that indicate user satisfaction and content relevance
 */
class UserSignalsAnalyzer {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Define user engagement signals to analyze
    this.userSignals = {
      CLICK_THROUGH_RATE: {
        id: 'ctr',
        name: 'Click-Through Rate',
        description: 'Estimated CTR based on title, description, and content appeal',
        weight: 0.25
      },
      DWELL_TIME: {
        id: 'dwell_time',
        name: 'Dwell Time',
        description: 'Estimated time users will spend engaging with content',
        weight: 0.25
      },
      BOUNCE_RATE: {
        id: 'bounce_rate',
        name: 'Bounce Rate',
        description: 'Likelihood of users leaving without further engagement',
        weight: 0.15
      },
      POGO_STICKING: {
        id: 'pogo_sticking',
        name: 'Pogo-Sticking',
        description: 'Risk of users returning to search results after viewing',
        weight: 0.15
      },
      USER_SATISFACTION: {
        id: 'user_satisfaction',
        name: 'Overall User Satisfaction',
        description: 'Combined assessment of user satisfaction signals',
        weight: 0.20
      }
    };
  }

  setForceApi(value) {
    this.forceApi = value;
    console.log(`[USER-SIGNALS] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[USER-SIGNALS] Analyzer initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[USER-SIGNALS] Failed to initialize User Signals Analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze user engagement signals for the content
   * 
   * @param {string} keyword - Target keyword
   * @param {object} contentData - Content data
   * @param {object} competitorData - Competitor analysis data
   * @returns {object} - Analysis of user engagement signals
   */
  async analyze(keyword, contentData, competitorData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[USER-SIGNALS] Analyzing user signals for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-user-signals.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[USER-SIGNALS] Using cached user signals analysis for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Create analysis object
      const analysis = {
        keyword,
        timestamp: new Date().toISOString(),
        signals: {},
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        recommendations: []
      };
      
      // Analyze each user signal
      for (const signalKey in this.userSignals) {
        const signal = this.userSignals[signalKey];
        const signalAnalysis = await this.analyzeSignal(signal, contentData, competitorData);
        analysis.signals[signal.id] = signalAnalysis;
      }
      
      // Calculate overall score (weighted average)
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      for (const signalKey in this.userSignals) {
        const signal = this.userSignals[signalKey];
        const signalAnalysis = analysis.signals[signal.id];
        weightedScoreSum += signalAnalysis.score * signal.weight;
        weightSum += signal.weight;
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
      console.error(`[USER-SIGNALS] Error analyzing user signals for "${keyword}":`, error);
      throw error;
    }
  }
  
  /**
   * Analyze a specific user signal
   */
  async analyzeSignal(signal, contentData, competitorData) {
    // Analyze a specific signal based on its ID
    switch (signal.id) {
      case 'ctr':
        return this.analyzeClickThroughRate(contentData);
      case 'dwell_time':
        return this.analyzeDwellTime(contentData);
      case 'bounce_rate':
        return this.analyzeBounceRate(contentData);
      case 'pogo_sticking':
        return this.analyzePogoSticking(contentData, competitorData);
      case 'user_satisfaction':
        return this.analyzeUserSatisfaction(contentData, competitorData);
      default:
        return {
          score: 0.5,
          issues: [],
          recommendations: []
        };
    }
  }

  /**
   * Analyze estimated click-through rate
   */
  analyzeClickThroughRate(contentData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Title attractiveness
    let titleScore = 0.5;
    
    // Check if title contains numbers
    if (contentData.title && /\d+/.test(contentData.title)) {
      titleScore += 0.1;
    } else {
      analysis.issues.push('Title lacks numbers which can improve CTR');
      analysis.recommendations.push('Add specific numbers to your title (e.g., "7 Ways..." or "...in 2024")');
    }
    
    // Check if title contains power words
    if (contentData.title && this.containsPowerWords(contentData.title)) {
      titleScore += 0.1;
    } else {
      analysis.issues.push('Title lacks emotional trigger words');
      analysis.recommendations.push('Add compelling power words to your title (e.g., "essential", "proven", "ultimate")');
    }
    
    // Check title length
    if (contentData.title) {
      const titleLength = contentData.title.length;
      if (titleLength > 40 && titleLength < 60) {
        titleScore += 0.1;
      } else if (titleLength <= 40) {
        analysis.issues.push('Title may be too short for optimal CTR');
        analysis.recommendations.push('Expand your title to 50-60 characters for better visibility');
      } else {
        analysis.issues.push('Title may be too long and get cut off in search results');
        analysis.recommendations.push('Shorten your title to 50-60 characters to prevent truncation');
      }
    }
    
    // Meta description attractiveness
    let descriptionScore = 0.5;
    
    // Check if description contains call to action
    if (contentData.description && /find out|discover|learn|get|read|see how|why|when|what/i.test(contentData.description)) {
      descriptionScore += 0.1;
    } else {
      analysis.issues.push('Meta description lacks clear call-to-action');
      analysis.recommendations.push('Add a compelling call-to-action in your meta description');
    }
    
    // Check description length
    if (contentData.description) {
      const descLength = contentData.description.length;
      if (descLength > 120 && descLength < 155) {
        descriptionScore += 0.1;
      } else if (descLength <= 120) {
        analysis.issues.push('Meta description may be too short');
        analysis.recommendations.push('Expand your meta description to 140-155 characters');
      } else {
        analysis.issues.push('Meta description may be too long and get cut off');
        analysis.recommendations.push('Shorten your meta description to 140-155 characters');
      }
    }
    
    // Keyword relevance in title and description
    let keywordScore = 0.5;
    const keyword = contentData.keyword || '';
    
    if (keyword && contentData.title && contentData.title.toLowerCase().includes(keyword.toLowerCase())) {
      keywordScore += 0.1;
      
      // Check if keyword is at the beginning of the title
      if (contentData.title.toLowerCase().indexOf(keyword.toLowerCase()) === 0) {
        keywordScore += 0.1;
      } else {
        analysis.recommendations.push('Move the target keyword closer to the beginning of your title');
      }
    } else {
      analysis.issues.push('Target keyword missing from title');
      analysis.recommendations.push('Include the exact target keyword in your title');
    }
    
    if (keyword && contentData.description && contentData.description.toLowerCase().includes(keyword.toLowerCase())) {
      keywordScore += 0.1;
    } else {
      analysis.issues.push('Target keyword missing from meta description');
      analysis.recommendations.push('Include the exact target keyword in your meta description');
    }
    
    // Calculate final score
    analysis.score = (titleScore + descriptionScore + keywordScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze expected dwell time
   */
  analyzeDwellTime(contentData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Content length
    let lengthScore = 0.5;
    
    // Estimate word count
    const wordCount = this.estimateWordCount(contentData);
    
    // Average reading speed is about 200-250 words per minute
    const estimatedReadingTimeMinutes = wordCount / 200;
    
    if (estimatedReadingTimeMinutes >= 5) {
      lengthScore += 0.3;
    } else if (estimatedReadingTimeMinutes >= 3) {
      lengthScore += 0.1;
    } else {
      analysis.issues.push('Content may be too short for good dwell time');
      analysis.recommendations.push('Expand your content to at least 1000 words to increase reading time');
    }
    
    // Content engagement factors
    let engagementScore = 0.5;
    
    // Check for media elements
    const mediaCount = this.countMediaElements(contentData);
    
    if (mediaCount >= 3) {
      engagementScore += 0.2;
    } else {
      analysis.issues.push('Content lacks sufficient media elements');
      analysis.recommendations.push('Add more images, videos, or interactive elements to increase engagement');
    }
    
    // Check for content structure
    let structureScore = 0.5;
    
    // Check section count
    const sectionCount = (contentData.sections || []).length;
    
    if (sectionCount >= 5) {
      structureScore += 0.2;
    } else {
      analysis.issues.push('Content has too few sections/headings');
      analysis.recommendations.push('Break content into more sections with informative headings');
    }
    
    // Check for interactive elements
    if (this.hasInteractiveElements(contentData)) {
      structureScore += 0.2;
    } else {
      analysis.issues.push('Content lacks interactive elements');
      analysis.recommendations.push('Add interactive elements like calculators, quizzes, or expandable sections');
    }
    
    // Calculate final score
    analysis.score = (lengthScore + engagementScore + structureScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze expected bounce rate
   */
  analyzeBounceRate(contentData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Initial content quality
    let initialContentScore = 0.5;
    
    // Check if first paragraph is engaging
    if (contentData.sections && contentData.sections[0] && contentData.sections[0].content) {
      const firstParagraph = contentData.sections[0].content.split('\n')[0] || '';
      
      if (firstParagraph.length > 150) {
        initialContentScore += 0.2;
      } else {
        analysis.issues.push('First paragraph may be too short to engage users');
        analysis.recommendations.push('Expand your first paragraph to make it more substantial and engaging');
      }
      
      // Check if first paragraph uses engaging language
      if (this.containsEngagingLanguage(firstParagraph)) {
        initialContentScore += 0.1;
      } else {
        analysis.issues.push('First paragraph lacks engaging language');
        analysis.recommendations.push('Use more engaging language in your introduction to hook readers');
      }
    }
    
    // Internal linking score
    let internalLinkingScore = 0.5;
    const internalLinkCount = this.estimateInternalLinks(contentData);
    
    if (internalLinkCount >= 5) {
      internalLinkingScore += 0.3;
    } else if (internalLinkCount >= 3) {
      internalLinkingScore += 0.1;
    } else {
      analysis.issues.push('Content has too few internal links');
      analysis.recommendations.push('Add more internal links to related content to reduce bounce rate');
    }
    
    // Content relevance to search intent
    let relevanceScore = 0.5;
    
    // Check if content has a table of contents
    if (this.hasTableOfContents(contentData)) {
      relevanceScore += 0.2;
    } else {
      analysis.issues.push('Content lacks a table of contents');
      analysis.recommendations.push('Add a table of contents to help users navigate longer content');
    }
    
    // Check for content comprehensiveness
    if (contentData.sections && contentData.sections.length >= 5) {
      relevanceScore += 0.2;
    } else {
      analysis.issues.push('Content may not comprehensively address the topic');
      analysis.recommendations.push('Expand content to cover more aspects of the topic');
    }
    
    // Calculate final score
    // Note: For bounce rate, higher score means LOWER bounce rate
    analysis.score = (initialContentScore + internalLinkingScore + relevanceScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze risk of pogo-sticking
   */
  analyzePogoSticking(contentData, competitorData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Content quality vs. competitors
    let competitiveQualityScore = 0.5;
    
    // If we have competitor data, compare content quality
    if (competitorData && competitorData.competitors) {
      // This would be a more sophisticated analysis in production
      competitiveQualityScore += 0.2;
    }
    
    // Title accuracy
    let titleAccuracyScore = 0.5;
    
    // Check if title makes promises the content delivers on
    if (contentData.title && contentData.sections) {
      // Extract key terms from title
      const titleTerms = this.extractKeyTerms(contentData.title);
      
      // Check if these terms are addressed in the content
      let termsAddressed = 0;
      
      for (const term of titleTerms) {
        for (const section of contentData.sections) {
          if (section.content && section.content.toLowerCase().includes(term.toLowerCase())) {
            termsAddressed++;
            break;
          }
        }
      }
      
      const termsCoverageRatio = titleTerms.length > 0 ? termsAddressed / titleTerms.length : 0;
      
      if (termsCoverageRatio >= 0.8) {
        titleAccuracyScore += 0.3;
      } else if (termsCoverageRatio >= 0.5) {
        titleAccuracyScore += 0.1;
      } else {
        analysis.issues.push('Content may not deliver on promises made in the title');
        analysis.recommendations.push('Ensure your content thoroughly addresses all key terms mentioned in the title');
      }
    }
    
    // Immediate value
    let immediateValueScore = 0.5;
    
    // Check if content provides immediate value (answers the query quickly)
    if (contentData.sections && contentData.sections[0]) {
      const firstSectionContent = contentData.sections[0].content || '';
      
      if (firstSectionContent.length > 300 && this.providesDirectAnswer(firstSectionContent, contentData.keyword)) {
        immediateValueScore += 0.3;
      } else {
        analysis.issues.push('Content may not provide immediate value to users');
        analysis.recommendations.push('Answer the main query directly in the first section of your content');
      }
    }
    
    // Calculate final score
    // Note: For pogo-sticking, higher score means LOWER risk
    analysis.score = (competitiveQualityScore + titleAccuracyScore + immediateValueScore) / 3;
    
    return analysis;
  }

  /**
   * Analyze overall user satisfaction
   */
  analyzeUserSatisfaction(contentData, competitorData) {
    const analysis = {
      score: 0,
      issues: [],
      recommendations: []
    };
    
    // Content completeness
    let completenessScore = 0.5;
    
    // Check for comprehensive FAQ section
    if (contentData.faqs && contentData.faqs.length >= 5) {
      completenessScore += 0.2;
    } else {
      analysis.issues.push('Content lacks comprehensive FAQ section');
      analysis.recommendations.push('Add a thorough FAQ section addressing common user questions');
    }
    
    // Check for content structure
    if (contentData.sections && contentData.sections.length >= 7) {
      completenessScore += 0.2;
    } else {
      analysis.issues.push('Content structure may not be comprehensive enough');
      analysis.recommendations.push('Expand your content with more sections covering different aspects of the topic');
    }
    
    // Mobile usability
    let mobileUsabilityScore = 0.6; // Assumed baseline
    
    // Content formatting
    let formattingScore = 0.5;
    
    // Check for short paragraphs
    if (this.hasShortParagraphs(contentData)) {
      formattingScore += 0.2;
    } else {
      analysis.issues.push('Content may have paragraphs that are too long');
      analysis.recommendations.push('Break long paragraphs into shorter ones (3-4 sentences max) for better readability');
    }
    
    // Check for bulleted lists
    if (this.hasBulletLists(contentData)) {
      formattingScore += 0.2;
    } else {
      analysis.issues.push('Content lacks sufficient bullet points or lists');
      analysis.recommendations.push('Convert appropriate content into bullet points or numbered lists');
    }
    
    // Calculate final score
    analysis.score = (completenessScore + mobileUsabilityScore + formattingScore) / 3;
    
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
    
    // Check each signal
    for (const signalId in analysis.signals) {
      const signalData = analysis.signals[signalId];
      const signalName = Object.values(this.userSignals)
        .find(s => s.id === signalId)?.name || signalId;
      
      if (signalData.score >= STRENGTH_THRESHOLD) {
        analysis.strengths.push({
          signal: signalId,
          name: signalName,
          score: signalData.score
        });
      } else if (signalData.score < WEAKNESS_THRESHOLD) {
        analysis.weaknesses.push({
          signal: signalId,
          name: signalName,
          score: signalData.score
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
      const signalData = analysis.signals[weakness.signal];
      
      if (signalData.recommendations && signalData.recommendations.length > 0) {
        // Add top 2 recommendations from each weak signal
        for (const recommendation of signalData.recommendations.slice(0, 2)) {
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
   * Helper: Check if text contains power words
   */
  containsPowerWords(text) {
    const powerWords = [
      'exclusive', 'amazing', 'incredible', 'essential', 'absolute', 'ultimate',
      'proven', 'guaranteed', 'powerful', 'remarkable', 'revolutionary', 'stunning',
      'jaw-dropping', 'wonderful', 'phenomenal', 'sensational', 'extraordinary',
      'unbelievable', 'spectacular', 'awesome', 'mind-blowing', 'legendary'
    ];
    
    return powerWords.some(word => text.toLowerCase().includes(word.toLowerCase()));
  }

  /**
   * Helper: Estimate word count from content data
   */
  estimateWordCount(contentData) {
    let totalText = '';
    
    // Add title
    if (contentData.title) {
      totalText += contentData.title + ' ';
    }
    
    // Add sections
    if (contentData.sections && Array.isArray(contentData.sections)) {
      for (const section of contentData.sections) {
        if (section.title) {
          totalText += section.title + ' ';
        }
        if (section.content) {
          totalText += section.content + ' ';
        }
      }
    }
    
    // Add FAQs
    if (contentData.faqs && Array.isArray(contentData.faqs)) {
      for (const faq of contentData.faqs) {
        if (faq.question) {
          totalText += faq.question + ' ';
        }
        if (faq.answer) {
          totalText += faq.answer + ' ';
        }
      }
    }
    
    // Count words (split by spaces and filter out empty strings)
    return totalText.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Helper: Count media elements
   */
  countMediaElements(contentData) {
    let count = 0;
    
    // Count images
    if (contentData.images && Array.isArray(contentData.images)) {
      count += contentData.images.length;
    }
    
    // Count image URLs
    if (contentData.imageUrls && Array.isArray(contentData.imageUrls)) {
      count += contentData.imageUrls.length;
    }
    
    // Count videos
    if (contentData.videos && Array.isArray(contentData.videos)) {
      count += contentData.videos.length;
    }
    
    // Count other media embedded in content sections
    if (contentData.sections && Array.isArray(contentData.sections)) {
      for (const section of contentData.sections) {
        if (section.content) {
          // Count image markdown/HTML tags
          const imgMatches = section.content.match(/!\[.*?\]\(.*?\)|<img[^>]*>/g);
          if (imgMatches) {
            count += imgMatches.length;
          }
          
          // Count video embeds
          const videoMatches = section.content.match(/<iframe[^>]*>|<video[^>]*>/g);
          if (videoMatches) {
            count += videoMatches.length;
          }
        }
      }
    }
    
    return count;
  }

  /**
   * Helper: Check for interactive elements
   */
  hasInteractiveElements(contentData) {
    // This would be more sophisticated in production
    // For now, we'll assume there are no interactive elements
    return false;
  }

  /**
   * Helper: Check if text contains engaging language
   */
  containsEngagingLanguage(text) {
    const engagingPatterns = [
      /\b(you|your)\b/i,  // Second person
      /\?$/m,             // Questions
      /\bdiscover\b/i,    // Discovery words
      /\bimagine\b/i,     // Imagination prompts
      /\bsecret\b/i,      // Intrigue words
      /\bwhy\b/i,         // Explanation prompts
      /\bhow\b/i          // Process words
    ];
    
    return engagingPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Helper: Estimate internal links
   */
  estimateInternalLinks(contentData) {
    // This would analyze actual links in a production system
    // For now, return a placeholder value
    return 3;
  }

  /**
   * Helper: Check if content has a table of contents
   */
  hasTableOfContents(contentData) {
    // This would look for actual TOC patterns in a production system
    // For now, we'll check for patterns that suggest a TOC
    
    if (contentData.sections && contentData.sections.length > 0) {
      const firstSectionContent = contentData.sections[0].content || '';
      
      // Look for patterns like "Table of Contents", "In this article", or a list of links
      return /table\s+of\s+contents|in\s+this\s+article|contents|jump\s+to/i.test(firstSectionContent) ||
             (firstSectionContent.match(/\[.*?\]\(#.*?\)/g) || []).length >= 3;
    }
    
    return false;
  }

  /**
   * Helper: Extract key terms from text
   */
  extractKeyTerms(text) {
    if (!text) return [];
    
    // Remove common stop words
    const stopWords = ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as'];
    
    // Split text into words, convert to lowercase, and filter out stop words and short words
    return text
      .replace(/[^\w\s]/g, '')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => !stopWords.includes(word) && word.length > 3);
  }

  /**
   * Helper: Check if text provides a direct answer to the keyword query
   */
  providesDirectAnswer(text, keyword) {
    if (!text || !keyword) return false;
    
    // This would be more sophisticated in production using NLP
    // For now, do a simple check for query terms in the text
    const keyTerms = this.extractKeyTerms(keyword);
    
    return keyTerms.every(term => text.toLowerCase().includes(term.toLowerCase()));
  }

  /**
   * Helper: Check if content has short paragraphs
   */
  hasShortParagraphs(contentData) {
    if (!contentData.sections) return false;
    
    let longParagraphCount = 0;
    let totalParagraphCount = 0;
    
    for (const section of contentData.sections) {
      if (!section.content) continue;
      
      // Split content into paragraphs
      const paragraphs = section.content.split(/\n\s*\n|\r\n\s*\r\n/);
      
      for (const paragraph of paragraphs) {
        totalParagraphCount++;
        
        // Count sentences by looking for period, question mark, or exclamation followed by space
        const sentenceCount = (paragraph.match(/[.!?]\s/g) || []).length + 1;
        
        if (sentenceCount > 4) {
          longParagraphCount++;
        }
      }
    }
    
    // If more than 70% of paragraphs are short, return true
    return totalParagraphCount > 0 && (longParagraphCount / totalParagraphCount) < 0.3;
  }

  /**
   * Helper: Check if content has bullet lists
   */
  hasBulletLists(contentData) {
    if (!contentData.sections) return false;
    
    for (const section of contentData.sections) {
      if (!section.content) continue;
      
      // Check for markdown list patterns
      if (/^[\s]*[\*\-]\s+/m.test(section.content) || /^[\s]*\d+\.\s+/m.test(section.content)) {
        return true;
      }
      
      // Check for HTML list tags
      if (/<ul>|<ol>|<li>/i.test(section.content)) {
        return true;
      }
    }
    
    return false;
  }
}

module.exports = new UserSignalsAnalyzer(); 