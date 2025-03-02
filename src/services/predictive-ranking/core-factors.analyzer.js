const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');

/**
 * Analyzes core ranking factors that have been consistently important
 * over time and are expected to remain important in the future
 */
class CoreFactorsAnalyzer {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Define core ranking factors to analyze
    this.coreFactors = {
      CONTENT_QUALITY: {
        id: 'content_quality',
        name: 'Content Quality',
        description: 'Measures the overall quality, depth, and value of content',
        weight: 0.25,
        components: ['comprehensiveness', 'accuracy', 'expertise', 'structure']
      },
      E_A_T: {
        id: 'e_a_t',
        name: 'E-E-A-T',
        description: 'Experience, Expertise, Authoritativeness, and Trustworthiness',
        weight: 0.20,
        components: ['expertise_signals', 'authority_signals', 'trustworthiness', 'experience']
      },
      RELEVANCE: {
        id: 'relevance',
        name: 'Relevance',
        description: 'How well content matches search intent and query semantics',
        weight: 0.20,
        components: ['keyword_usage', 'semantic_match', 'intent_alignment']
      },
      PAGE_EXPERIENCE: {
        id: 'page_experience',
        name: 'Page Experience',
        description: 'Technical factors that impact user experience',
        weight: 0.15,
        components: ['speed', 'mobile_usability', 'security', 'stability']
      },
      LINKS_AND_CITATIONS: {
        id: 'links_citations',
        name: 'Links and Citations',
        description: 'External and internal link quality and relevance',
        weight: 0.10,
        components: ['backlink_profile', 'internal_linking', 'external_citations']
      },
      FRESHNESS: {
        id: 'freshness',
        name: 'Content Freshness',
        description: 'Recency and update frequency where relevant',
        weight: 0.10,
        components: ['update_frequency', 'first_published', 'last_updated', 'topic_timeliness']
      }
    };
  }

  setForceApi(value) {
    this.forceApi = value;
    console.log(`[CORE-FACTORS] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      console.log('[CORE-FACTORS] Analyzer initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[CORE-FACTORS] Failed to initialize Core Factors Analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze core ranking factors for the content
   * 
   * @param {string} keyword - Target keyword
   * @param {object} contentData - Content data
   * @param {object} keywordData - Keyword research data
   * @returns {object} - Analysis of core ranking factors
   */
  async analyze(keyword, contentData, keywordData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[CORE-FACTORS] Analyzing core ranking factors for: "${keyword}"`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-core-factors.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[CORE-FACTORS] Using cached core factors analysis for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Create analysis object with all factors
      const analysis = {
        keyword,
        timestamp: new Date().toISOString(),
        factors: {},
        overallScore: 0,
        strengths: [],
        weaknesses: [],
        opportunities: []
      };
      
      // Analyze each core factor
      for (const factorKey in this.coreFactors) {
        const factor = this.coreFactors[factorKey];
        const factorAnalysis = await this.analyzeFactor(factor, contentData, keywordData);
        analysis.factors[factor.id] = factorAnalysis;
      }
      
      // Calculate overall score (weighted average)
      let weightedScoreSum = 0;
      let weightSum = 0;
      
      for (const factorKey in this.coreFactors) {
        const factor = this.coreFactors[factorKey];
        const factorAnalysis = analysis.factors[factor.id];
        weightedScoreSum += factorAnalysis.score * factor.weight;
        weightSum += factor.weight;
      }
      
      analysis.overallScore = weightedScoreSum / weightSum;
      
      // Identify strengths and weaknesses
      this.identifyStrengthsAndWeaknesses(analysis);
      
      // Generate opportunities for improvement
      this.generateOpportunities(analysis);
      
      // Cache results
      await localStorage.saveFile(cachePath, analysis);
      
      return analysis;
    } catch (error) {
      console.error(`[CORE-FACTORS] Error analyzing core factors for "${keyword}":`, error);
      throw error;
    }
  }
  
  /**
   * Analyze a specific ranking factor
   */
  async analyzeFactor(factor, contentData, keywordData) {
    // Analyze a specific factor based on its ID
    switch (factor.id) {
      case 'content_quality':
        return this.analyzeContentQuality(contentData);
      case 'e_a_t':
        return this.analyzeEAT(contentData);
      case 'relevance':
        return this.analyzeRelevance(contentData, keywordData);
      case 'page_experience':
        return this.analyzePageExperience(contentData);
      case 'links_citations':
        return this.analyzeLinksAndCitations(contentData);
      case 'freshness':
        return this.analyzeFreshness(contentData);
      default:
        return {
          score: 0.5,
          components: {},
          issues: [],
          recommendations: []
        };
    }
  }

  /**
   * Analyze content quality
   */
  analyzeContentQuality(contentData) {
    const analysis = {
      score: 0,
      components: {},
      issues: [],
      recommendations: []
    };
    
    // Comprehensiveness - check for content length and coverage
    let comprehensivenessScore = 0;
    const contentLength = this.getContentLength(contentData);
    
    if (contentLength > 2000) {
      comprehensivenessScore += 0.8;
    } else if (contentLength > 1000) {
      comprehensivenessScore += 0.6;
    } else if (contentLength > 500) {
      comprehensivenessScore += 0.4;
    } else {
      comprehensivenessScore += 0.2;
      analysis.issues.push('Content is too short (<500 words)');
      analysis.recommendations.push('Increase content length to at least 1000-1500 words for comprehensive coverage');
    }
    
    // Check for section count
    const sectionCount = (contentData.sections || []).length;
    
    if (sectionCount < 3) {
      comprehensivenessScore *= 0.8;
      analysis.issues.push('Too few content sections/headings');
      analysis.recommendations.push('Break content into more sections with descriptive headings');
    } else if (sectionCount > 8) {
      comprehensivenessScore += 0.1;
    }
    
    // Check for presence of FAQs
    if (!contentData.faqs || contentData.faqs.length < 3) {
      analysis.issues.push('Few or no FAQ items');
      analysis.recommendations.push('Add comprehensive FAQ section with at least 5-7 common questions');
    } else {
      comprehensivenessScore += 0.1;
    }
    
    analysis.components.comprehensiveness = {
      score: comprehensivenessScore,
      contentLength,
      sectionCount,
      faqCount: (contentData.faqs || []).length
    };
    
    // Accuracy - simplified for demonstration
    // In a production system, this would use external fact-checking or ML models
    const accuracyScore = 0.8; // Placeholder - would be dynamically calculated
    
    analysis.components.accuracy = {
      score: accuracyScore,
      // Would include fact-checking metrics
    };
    
    // Expertise - check for signals of expertise
    let expertiseScore = 0.5; // Base score
    
    // Check for references/citations
    const hasCitations = this.checkForCitations(contentData);
    if (hasCitations) {
      expertiseScore += 0.2;
    } else {
      analysis.issues.push('No references or citations in content');
      analysis.recommendations.push('Add citations to authoritative sources to demonstrate research quality');
    }
    
    // Check for author info
    if (contentData.author && contentData.author.bio) {
      expertiseScore += 0.2;
    } else {
      analysis.issues.push('Missing author information with expertise signals');
      analysis.recommendations.push('Add author bio with credentials relevant to the topic');
    }
    
    analysis.components.expertise = {
      score: expertiseScore,
      hasCitations,
      hasAuthorInfo: !!(contentData.author && contentData.author.bio)
    };
    
    // Structure - analyze content structure quality
    let structureScore = 0.5; // Base score
    
    // Check heading hierarchy
    const headingStructure = this.analyzeHeadingStructure(contentData);
    if (headingStructure.isWellStructured) {
      structureScore += 0.2;
    } else {
      analysis.issues.push('Poor heading structure or hierarchy');
      analysis.recommendations.push('Ensure proper heading hierarchy (H1 → H2 → H3) and descriptive heading text');
    }
    
    // Check for content blocks/elements
    const hasMultipleContentTypes = this.hasMultipleContentTypes(contentData);
    if (hasMultipleContentTypes) {
      structureScore += 0.2;
    } else {
      analysis.issues.push('Content is too text-heavy without variety');
      analysis.recommendations.push('Add varied content elements like lists, blockquotes, images, tables, etc.');
    }
    
    analysis.components.structure = {
      score: structureScore,
      headingStructure: headingStructure.isWellStructured,
      hasMultipleContentTypes
    };
    
    // Calculate overall content quality score (average of components)
    analysis.score = (
      analysis.components.comprehensiveness.score +
      analysis.components.accuracy.score +
      analysis.components.expertise.score +
      analysis.components.structure.score
    ) / 4;
    
    return analysis;
  }

  /**
   * Analyze E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness)
   */
  analyzeEAT(contentData) {
    const analysis = {
      score: 0,
      components: {},
      issues: [],
      recommendations: []
    };
    
    // Expertise signals
    let expertiseScore = 0.5; // Base score
    
    // Check for author expertise signals
    if (contentData.author && contentData.author.credentials) {
      expertiseScore += 0.2;
    } else {
      analysis.issues.push('Missing author expertise signals');
      analysis.recommendations.push('Add author credentials and relevant experience information');
    }
    
    // Check for detailed topic explanations
    const hasDetailedExplanations = this.checkForDetailedExplanations(contentData);
    if (hasDetailedExplanations) {
      expertiseScore += 0.2;
    } else {
      analysis.issues.push('Lacks detailed explanations that demonstrate expertise');
      analysis.recommendations.push('Add in-depth explanations of complex concepts with expert insights');
    }
    
    analysis.components.expertise_signals = {
      score: expertiseScore,
      hasAuthorCredentials: !!(contentData.author && contentData.author.credentials),
      hasDetailedExplanations
    };
    
    // Authority signals
    let authorityScore = 0.5; // Base score
    
    // Check for publisher/brand authority
    if (contentData.publisher && contentData.publisher.name) {
      authorityScore += 0.1;
    } else {
      analysis.issues.push('Missing publisher/brand information');
      analysis.recommendations.push('Add clear publisher information that establishes authority in the field');
    }
    
    // Check for expert quotes
    const hasExpertQuotes = this.checkForExpertQuotes(contentData);
    if (hasExpertQuotes) {
      authorityScore += 0.2;
    } else {
      analysis.issues.push('No quotes or insights from industry experts');
      analysis.recommendations.push('Include quotes or insights from recognized experts in the field');
    }
    
    // Check for contact information
    if (contentData.contactInfo) {
      authorityScore += 0.1;
    } else {
      analysis.issues.push('Missing contact information');
      analysis.recommendations.push('Add accessible contact information to establish legitimacy');
    }
    
    analysis.components.authority_signals = {
      score: authorityScore,
      hasPublisherInfo: !!(contentData.publisher && contentData.publisher.name),
      hasExpertQuotes,
      hasContactInfo: !!contentData.contactInfo
    };
    
    // Trustworthiness
    let trustworthinessScore = 0.5; // Base score
    
    // Check for references/citations
    const hasCitations = this.checkForCitations(contentData);
    if (hasCitations) {
      trustworthinessScore += 0.2;
    } else {
      analysis.issues.push('Lacks citations or references to support claims');
      analysis.recommendations.push('Add citations to authoritative sources for all factual claims');
    }
    
    // Check for balanced perspective
    const hasBalancedPerspective = this.checkForBalancedPerspective(contentData);
    if (hasBalancedPerspective) {
      trustworthinessScore += 0.2;
    } else {
      analysis.issues.push('Content presents a one-sided perspective');
      analysis.recommendations.push('Present multiple viewpoints for controversial topics and acknowledge limitations');
    }
    
    analysis.components.trustworthiness = {
      score: trustworthinessScore,
      hasCitations,
      hasBalancedPerspective
    };
    
    // Experience signals
    let experienceScore = 0.5; // Base score
    
    // Check for first-hand expertise signals
    const hasFirstHandExperience = this.checkForFirstHandExperience(contentData);
    if (hasFirstHandExperience) {
      experienceScore += 0.3;
    } else {
      analysis.issues.push('Lacks firsthand experience signals');
      analysis.recommendations.push('Add first-person accounts, personal experiences, or case studies that demonstrate direct experience with the topic');
    }
    
    analysis.components.experience = {
      score: experienceScore,
      hasFirstHandExperience
    };
    
    // Calculate overall E-A-T score (average of components)
    analysis.score = (
      analysis.components.expertise_signals.score +
      analysis.components.authority_signals.score +
      analysis.components.trustworthiness.score +
      analysis.components.experience.score
    ) / 4;
    
    return analysis;
  }

  /**
   * Analyze relevance to search intent
   */
  analyzeRelevance(contentData, keywordData) {
    const analysis = {
      score: 0,
      components: {},
      issues: [],
      recommendations: []
    };
    
    // Keyword usage analysis
    let keywordUsageScore = 0.5; // Base score
    const keyword = contentData.keyword || '';
    
    if (!keyword) {
      analysis.issues.push('Target keyword not defined');
      analysis.recommendations.push('Define a clear target keyword for the content');
      keywordUsageScore = 0.1;
    } else {
      // Check title
      if (contentData.title && contentData.title.toLowerCase().includes(keyword.toLowerCase())) {
        keywordUsageScore += 0.1;
      } else {
        analysis.issues.push('Target keyword missing from title');
        analysis.recommendations.push('Include the target keyword in the title');
      }
      
      // Check headings
      let keywordInHeadings = false;
      if (contentData.sections) {
        for (const section of contentData.sections) {
          if (section.title && section.title.toLowerCase().includes(keyword.toLowerCase())) {
            keywordInHeadings = true;
            break;
          }
        }
      }
      
      if (keywordInHeadings) {
        keywordUsageScore += 0.1;
      } else {
        analysis.issues.push('Target keyword missing from headings');
        analysis.recommendations.push('Include the target keyword in at least one section heading');
      }
      
      // Check content
      const contentText = this.getFullContentText(contentData);
      const keywordCount = (contentText.match(new RegExp(keyword, 'gi')) || []).length;
      const contentLength = contentText.length;
      const keywordDensity = keyword.length > 0 ? (keywordCount * keyword.length) / contentLength : 0;
      
      if (keywordDensity > 0.01 && keywordDensity < 0.03) {
        keywordUsageScore += 0.1;
      } else if (keywordDensity <= 0.01) {
        analysis.issues.push('Target keyword density too low');
        analysis.recommendations.push('Increase target keyword usage throughout content (aim for 1-3% density)');
      } else {
        analysis.issues.push('Target keyword density too high');
        analysis.recommendations.push('Reduce excessive keyword usage to avoid keyword stuffing');
      }
      
      // Check meta description
      if (contentData.description && contentData.description.toLowerCase().includes(keyword.toLowerCase())) {
        keywordUsageScore += 0.1;
      } else {
        analysis.issues.push('Target keyword missing from meta description');
        analysis.recommendations.push('Include the target keyword in the meta description');
      }
    }
    
    analysis.components.keyword_usage = {
      score: keywordUsageScore,
      keyword,
      inTitle: !!(contentData.title && contentData.title.toLowerCase().includes(keyword.toLowerCase())),
      inDescription: !!(contentData.description && contentData.description.toLowerCase().includes(keyword.toLowerCase())),
      // Other keyword metrics would be added here
    };
    
    // Semantic match analysis
    // In production, this would use more sophisticated semantic matching
    let semanticMatchScore = 0.6; // Base score
    
    // Check for topic coverage
    if (contentData.sections && contentData.sections.length >= 5) {
      semanticMatchScore += 0.2;
    } else {
      analysis.issues.push('Limited topic coverage');
      analysis.recommendations.push('Expand content to cover more aspects of the topic');
    }
    
    analysis.components.semantic_match = {
      score: semanticMatchScore,
      // Semantic analysis metrics would be added here
    };
    
    // Intent alignment analysis
    let intentAlignmentScore = 0.5; // Base score
    
    // Determine the likely search intent
    const searchIntent = keywordData?.intent || this.guessSearchIntent(contentData);
    
    // Check if content aligns with the search intent
    const intentAlignment = this.checkIntentAlignment(contentData, searchIntent);
    
    if (intentAlignment.aligned) {
      intentAlignmentScore += 0.3;
    } else {
      analysis.issues.push(`Content not well aligned with ${searchIntent} intent`);
      analysis.recommendations.push(intentAlignment.recommendation);
    }
    
    analysis.components.intent_alignment = {
      score: intentAlignmentScore,
      intent: searchIntent,
      aligned: intentAlignment.aligned
    };
    
    // Calculate overall relevance score (average of components)
    analysis.score = (
      analysis.components.keyword_usage.score +
      analysis.components.semantic_match.score +
      analysis.components.intent_alignment.score
    ) / 3;
    
    return analysis;
  }

  /**
   * Analyze page experience factors
   */
  analyzePageExperience(contentData) {
    // For demonstration - in production would analyze technical aspects
    const analysis = {
      score: 0.75, // Placeholder score
      components: {
        speed: {
          score: 0.8,
          // Metrics would be added here
        },
        mobile_usability: {
          score: 0.7,
          // Metrics would be added here
        },
        security: {
          score: 0.9,
          // Metrics would be added here
        },
        stability: {
          score: 0.6,
          // Metrics would be added here
        }
      },
      issues: [
        'No specific page experience metrics available'
      ],
      recommendations: [
        'Ensure content is optimized for mobile devices',
        'Optimize images and media for fast loading',
        'Minimize layout shifts and ensure content stability',
        'Use HTTPS and ensure secure connections'
      ]
    };
    
    return analysis;
  }

  /**
   * Analyze links and citations
   */
  analyzeLinksAndCitations(contentData) {
    const analysis = {
      score: 0,
      components: {},
      issues: [],
      recommendations: []
    };
    
    // Internal linking
    let internalLinkingScore = 0.5; // Base score
    
    // Count internal links
    const internalLinkCount = this.countInternalLinks(contentData);
    
    if (internalLinkCount >= 3) {
      internalLinkingScore += 0.3;
    } else {
      analysis.issues.push('Insufficient internal links');
      analysis.recommendations.push('Add more internal links to related content (aim for 3-5 links minimum)');
    }
    
    analysis.components.internal_linking = {
      score: internalLinkingScore,
      linkCount: internalLinkCount
    };
    
    // External linking
    let externalLinkingScore = 0.5; // Base score
    
    // Count external links
    const externalLinkCount = this.countExternalLinks(contentData);
    
    if (externalLinkCount >= 2) {
      externalLinkingScore += 0.3;
    } else {
      analysis.issues.push('Few or no external citations');
      analysis.recommendations.push('Add links to authoritative external sources (aim for 2-3 links minimum)');
    }
    
    analysis.components.external_citations = {
      score: externalLinkingScore,
      linkCount: externalLinkCount
    };
    
    // Backlink profile - placeholder as this requires external data
    const backlinkScore = 0.6; // Placeholder
    
    analysis.components.backlink_profile = {
      score: backlinkScore
    };
    
    // Calculate overall links score (average of components)
    analysis.score = (
      analysis.components.internal_linking.score +
      analysis.components.external_citations.score +
      analysis.components.backlink_profile.score
    ) / 3;
    
    return analysis;
  }

  /**
   * Analyze content freshness
   */
  analyzeFreshness(contentData) {
    const analysis = {
      score: 0,
      components: {},
      issues: [],
      recommendations: []
    };
    
    // Last updated analysis
    let lastUpdatedScore = 0.5; // Base score
    
    // Check publication/update date
    const now = new Date();
    const lastUpdated = contentData.lastUpdated ? new Date(contentData.lastUpdated) : null;
    const published = contentData.publishDate ? new Date(contentData.publishDate) : null;
    
    let daysSinceUpdate = null;
    if (lastUpdated) {
      daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
      
      if (daysSinceUpdate < 90) {
        lastUpdatedScore += 0.4;
      } else if (daysSinceUpdate < 180) {
        lastUpdatedScore += 0.2;
      } else {
        analysis.issues.push('Content not updated recently');
        analysis.recommendations.push('Update content with current information and refresh date');
      }
    } else if (published) {
      const daysSincePublish = Math.floor((now - published) / (1000 * 60 * 60 * 24));
      
      if (daysSincePublish < 90) {
        lastUpdatedScore += 0.3;
      } else if (daysSincePublish > 365) {
        lastUpdatedScore -= 0.1;
        analysis.issues.push('Content is over a year old with no update date');
        analysis.recommendations.push('Review and update content, adding an updated date');
      }
    } else {
      analysis.issues.push('No publish or update date specified');
      analysis.recommendations.push('Add clear publication and last updated dates');
    }
    
    analysis.components.last_updated = {
      score: lastUpdatedScore,
      daysSinceUpdate,
      hasPublishDate: !!published,
      hasUpdateDate: !!lastUpdated
    };
    
    // Update frequency - placeholder as this requires historical data
    const updateFrequencyScore = 0.6; // Placeholder
    
    analysis.components.update_frequency = {
      score: updateFrequencyScore
    };
    
    // Topic timeliness
    const timelinessScore = 0.7; // Placeholder
    
    analysis.components.topic_timeliness = {
      score: timelinessScore
    };
    
    // Calculate overall freshness score (average of components)
    analysis.score = (
      analysis.components.last_updated.score +
      analysis.components.update_frequency.score +
      analysis.components.topic_timeliness.score
    ) / 3;
    
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
      const factorName = Object.values(this.coreFactors)
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
          score: factorData.score,
          issues: factorData.issues.slice(0, 3) // Top 3 issues
        });
      }
    }
    
    // Sort strengths and weaknesses by score (descending for strengths, ascending for weaknesses)
    analysis.strengths.sort((a, b) => b.score - a.score);
    analysis.weaknesses.sort((a, b) => a.score - b.score);
  }

  /**
   * Generate opportunities for improvement
   */
  generateOpportunities(analysis) {
    // Clear existing array
    analysis.opportunities = [];
    
    // Focus on top weaknesses
    for (const weakness of analysis.weaknesses) {
      // Get recommendations for this weakness
      const factorData = analysis.factors[weakness.factor];
      const recommendations = factorData.recommendations || [];
      
      if (recommendations.length > 0) {
        // Add top recommendations as opportunities
        for (const recommendation of recommendations.slice(0, 2)) {
          analysis.opportunities.push({
            factor: weakness.factor,
            name: weakness.name,
            recommendation,
            impact: this.estimateImpact(weakness.score, weakness.factor)
          });
        }
      }
    }
    
    // Sort opportunities by estimated impact
    analysis.opportunities.sort((a, b) => b.impact - a.impact);
    
    // Limit to top 5
    analysis.opportunities = analysis.opportunities.slice(0, 5);
  }

  /**
   * Estimate the potential impact of an improvement
   */
  estimateImpact(currentScore, factorId) {
    // Get the weight of this factor
    const factorWeight = Object.values(this.coreFactors)
      .find(f => f.id === factorId)?.weight || 0.1;
    
    // Calculate potential improvement
    const potentialImprovement = 1 - currentScore;
    
    // Impact is based on factor weight and potential improvement
    return potentialImprovement * factorWeight * 10; // Scale to 0-10
  }

  /**
   * Helper: Get content length
   */
  getContentLength(contentData) {
    const fullText = this.getFullContentText(contentData);
    return fullText.split(/\s+/).length; // Word count
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
   * Helper: Check for citations
   */
  checkForCitations(contentData) {
    // Simple check for citation markers in content
    const fullText = this.getFullContentText(contentData);
    
    // Look for common citation patterns
    return /\[\d+\]|\(\d{4}\)|\d{4}[,.]/.test(fullText) || 
           this.countExternalLinks(contentData) >= 2;
  }

  /**
   * Helper: Analyze heading structure
   */
  analyzeHeadingStructure(contentData) {
    // Check if headings follow a logical hierarchy
    const isWellStructured = true; // Simplified - would check actual hierarchy
    
    return {
      isWellStructured
    };
  }

  /**
   * Helper: Check for multiple content types
   */
  hasMultipleContentTypes(contentData) {
    // Check if content has varied elements (lists, tables, images, etc.)
    let hasLists = false;
    let hasImages = false;
    
    // Simple check for list markers
    const fullText = this.getFullContentText(contentData);
    hasLists = /^\s*[\-\*\u2022]\s+/m.test(fullText) || // Bullet lists
               /^\s*\d+\.\s+/m.test(fullText);          // Numbered lists
    
    // Check for image references
    hasImages = (contentData.images && contentData.images.length > 0) ||
                (contentData.imageUrls && contentData.imageUrls.length > 0);
    
    return hasLists || hasImages || (contentData.tables && contentData.tables.length > 0);
  }

  /**
   * Helper: Check for detailed explanations
   */
  checkForDetailedExplanations(contentData) {
    // Check for detailed explanations of concepts
    if (!contentData.sections) return false;
    
    // Look for sections with substantial content
    let hasDetailedSections = false;
    
    for (const section of contentData.sections) {
      if (section.content && section.content.length > 200) {
        hasDetailedSections = true;
        break;
      }
    }
    
    return hasDetailedSections;
  }

  /**
   * Helper: Check for expert quotes
   */
  checkForExpertQuotes(contentData) {
    // Check for quotations from experts
    const fullText = this.getFullContentText(contentData);
    
    // Look for quote patterns
    return /[""].*[""]/.test(fullText) && 
           /according to|said|says|states|explains/.test(fullText.toLowerCase());
  }

  /**
   * Helper: Check for balanced perspective
   */
  checkForBalancedPerspective(contentData) {
    // Check if content presents multiple viewpoints
    const fullText = this.getFullContentText(contentData);
    
    // Look for phrases indicating balanced presentation
    return /however|on the other hand|alternatively|some argue|others believe|debate|while|despite|although/.test(fullText.toLowerCase());
  }

  /**
   * Helper: Check for first-hand experience
   */
  checkForFirstHandExperience(contentData) {
    // Check if content demonstrates first-hand experience
    const fullText = this.getFullContentText(contentData);
    
    // Look for first-person perspective
    return /\b(I|we|our team|my experience|we tested|we found|our analysis)\b/i.test(fullText);
  }

  /**
   * Helper: Count internal links
   */
  countInternalLinks(contentData) {
    // Would actually analyze link patterns
    return 3; // Placeholder
  }

  /**
   * Helper: Count external links
   */
  countExternalLinks(contentData) {
    // Would actually analyze link patterns
    return 2; // Placeholder
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
    
    return 'informational'; // Default
  }

  /**
   * Helper: Check intent alignment
   */
  checkIntentAlignment(contentData, searchIntent) {
    const fullText = this.getFullContentText(contentData);
    
    switch (searchIntent) {
      case 'informational':
        // Check for informational content signals
        if (/how\s+to|step-by-step|explanation|understand|learn/i.test(fullText)) {
          return { aligned: true };
        } else {
          return { 
            aligned: false,
            recommendation: 'Add more educational content, step-by-step instructions, and explanations'
          };
        }
        
      case 'transactional':
        // Check for transactional content signals
        if (/buy|price|deal|shop|purchase|shipping|checkout/i.test(fullText)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add pricing information, purchase options, and clear calls-to-action'
          };
        }
        
      case 'commercial':
        // Check for commercial content signals
        if (/best|vs|compare|pros|cons|review|rating/i.test(fullText)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add product comparisons, pros/cons lists, and specific recommendations'
          };
        }
        
      case 'navigational':
        // Check for navigational content signals
        if (/location|address|directions|contact|hours|website/i.test(fullText)) {
          return { aligned: true };
        } else {
          return {
            aligned: false,
            recommendation: 'Add clear location/contact information and official details'
          };
        }
        
      default:
        return { aligned: true };
    }
  }
}

module.exports = new CoreFactorsAnalyzer(); 