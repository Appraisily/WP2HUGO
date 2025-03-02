const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class SeoQualityService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      console.log('[SEO-QUALITY] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[SEO-QUALITY] Failed to initialize SEO quality service:', error);
      throw error;
    }
  }

  /**
   * Assess the SEO quality of content
   * @param {string} keyword - The target keyword 
   * @param {object} contentData - The full content data
   * @returns {object} - Quality assessment results
   */
  async assessQuality(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[SEO-QUALITY] Assessing SEO quality for: "${keyword}"`);
    
    try {
      const assessment = {
        keyword,
        timestamp: new Date().toISOString(),
        overallScore: 0,
        issues: [],
        improvements: [],
        strengths: []
      };
      
      // 1. Check title quality
      this.assessTitle(assessment, contentData);
      
      // 2. Check meta description
      this.assessMetaDescription(assessment, contentData);
      
      // 3. Check headings structure
      this.assessHeadings(assessment, contentData);
      
      // 4. Check content quality
      this.assessContent(assessment, contentData);
      
      // 5. Check keyword usage
      this.assessKeywordUsage(assessment, contentData, keyword);
      
      // 6. Check content completeness
      this.assessCompleteness(assessment, contentData);
      
      // 7. Calculate overall score
      assessment.overallScore = this.calculateOverallScore(assessment);
      
      return assessment;
    } catch (error) {
      console.error(`[SEO-QUALITY] Error assessing quality for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Assess the quality of the title
   */
  assessTitle(assessment, contentData) {
    const title = contentData.title || contentData.structure?.title || '';
    
    // Check title length
    const titleLength = title.length;
    if (titleLength < 30) {
      assessment.issues.push('Title is too short (< 30 characters)');
    } else if (titleLength > 60) {
      assessment.issues.push('Title is too long (> 60 characters)');
    } else {
      assessment.strengths.push('Title length is optimal');
    }
    
    // Check if title contains the keyword
    const keyword = contentData.keyword.toLowerCase();
    if (!title.toLowerCase().includes(keyword)) {
      assessment.issues.push('Title does not contain the main keyword');
    } else {
      assessment.strengths.push('Title contains the main keyword');
    }
    
    // Check if title has power words
    const powerWords = ['ultimate', 'best', 'complete', 'essential', 'guide', 'how', 'why', 'what'];
    const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
    
    if (!hasPowerWord) {
      assessment.improvements.push('Consider adding power words to the title for better CTR');
    } else {
      assessment.strengths.push('Title includes power words');
    }
  }

  /**
   * Assess the quality of the meta description
   */
  assessMetaDescription(assessment, contentData) {
    const description = contentData.description || contentData.structure?.meta_description || '';
    
    // Check description length
    const descriptionLength = description.length;
    if (descriptionLength < 120) {
      assessment.issues.push('Meta description is too short (< 120 characters)');
    } else if (descriptionLength > 160) {
      assessment.issues.push('Meta description is too long (> 160 characters)');
    } else {
      assessment.strengths.push('Meta description length is optimal');
    }
    
    // Check if description contains the keyword
    const keyword = contentData.keyword.toLowerCase();
    if (!description.toLowerCase().includes(keyword)) {
      assessment.issues.push('Meta description does not contain the main keyword');
    } else {
      assessment.strengths.push('Meta description contains the main keyword');
    }
    
    // Check if description has a call to action
    const ctaPhrases = ['learn', 'discover', 'find out', 'read', 'see', 'check', 'get', 'download'];
    const hasCta = ctaPhrases.some(phrase => description.toLowerCase().includes(phrase));
    
    if (!hasCta) {
      assessment.improvements.push('Consider adding a call-to-action in the meta description');
    } else {
      assessment.strengths.push('Meta description includes a call-to-action');
    }
  }

  /**
   * Assess headings structure
   */
  assessHeadings(assessment, contentData) {
    // Get sections
    const sections = contentData.structure?.sections || [];
    
    if (sections.length < 3) {
      assessment.issues.push('Content has too few sections (< 3)');
    } else {
      assessment.strengths.push('Content has a good number of sections');
    }
    
    // Check if headings contain keywords or related terms
    const keyword = contentData.keyword.toLowerCase();
    const keywordParts = keyword.split(' ');
    
    let headingsWithKeyword = 0;
    
    sections.forEach(section => {
      const heading = (section.heading || '').toLowerCase();
      
      const hasKeyword = heading.includes(keyword) || 
                        keywordParts.some(part => heading.includes(part));
      
      if (hasKeyword) {
        headingsWithKeyword++;
      }
      
      // Check subsections
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          const subheading = (subsection.heading || '').toLowerCase();
          const hasKeywordInSub = subheading.includes(keyword) || 
                                keywordParts.some(part => subheading.includes(part));
          
          if (hasKeywordInSub) {
            headingsWithKeyword++;
          }
        });
      }
    });
    
    const totalHeadings = sections.length + sections.reduce((count, section) => 
      count + (section.subsections ? section.subsections.length : 0), 0);
    
    const keywordHeadingPercentage = (headingsWithKeyword / totalHeadings) * 100;
    
    if (keywordHeadingPercentage < 30) {
      assessment.improvements.push('Consider using the main keyword or related terms in more headings');
    } else {
      assessment.strengths.push('Good keyword usage in headings');
    }
  }

  /**
   * Assess content quality
   */
  assessContent(assessment, contentData) {
    // Get sections
    const sections = contentData.structure?.sections || [];
    
    // Check content length
    let totalContentLength = 0;
    sections.forEach(section => {
      totalContentLength += (section.content || '').length;
      
      // Add subsection content
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          totalContentLength += (subsection.content || '').length;
        });
      }
    });
    
    // Roughly estimate word count (divide by average word length + space)
    const estimatedWordCount = Math.floor(totalContentLength / 6);
    
    if (estimatedWordCount < 500) {
      assessment.issues.push('Content is too short (< 500 words)');
    } else if (estimatedWordCount < 1000) {
      assessment.improvements.push('Content could be longer for better ranking (currently < 1000 words)');
    } else if (estimatedWordCount > 1500) {
      assessment.strengths.push('Content has good length for SEO ranking');
    }
    
    // Check FAQ section
    const hasFaq = contentData.structure?.faqs && contentData.structure.faqs.length > 0;
    
    if (!hasFaq) {
      assessment.improvements.push('Consider adding a FAQ section for better featured snippet opportunities');
    } else {
      assessment.strengths.push('Content includes FAQ section for rich results');
    }
  }

  /**
   * Assess keyword usage
   */
  assessKeywordUsage(assessment, contentData, keyword) {
    // Get all content text
    const sections = contentData.structure?.sections || [];
    let allText = '';
    
    // Combine all text content
    sections.forEach(section => {
      allText += ' ' + (section.heading || '');
      allText += ' ' + (section.content || '');
      
      // Add subsection content
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          allText += ' ' + (subsection.heading || '');
          allText += ' ' + (subsection.content || '');
        });
      }
    });
    
    // Add FAQ content
    if (contentData.structure?.faqs) {
      contentData.structure.faqs.forEach(faq => {
        allText += ' ' + (faq.question || '');
        allText += ' ' + (faq.answer || '');
      });
    }
    
    // Count keyword occurrences
    const keywordRegExp = new RegExp(keyword, 'gi');
    const keywordCount = (allText.match(keywordRegExp) || []).length;
    
    // Estimate total word count
    const totalWords = allText.split(/\s+/).length;
    
    // Calculate keyword density
    const keywordDensity = (keywordCount / totalWords) * 100;
    
    if (keywordDensity < 0.5) {
      assessment.issues.push('Keyword density is too low (< 0.5%)');
    } else if (keywordDensity > 3) {
      assessment.issues.push('Keyword density may be too high (> 3%)');
    } else if (keywordDensity >= 0.5 && keywordDensity <= 2) {
      assessment.strengths.push('Keyword density is in the optimal range (0.5-2%)');
    }
    
    // Check for keyword in first 100 characters
    const first100Chars = allText.substring(0, 100).toLowerCase();
    
    if (!first100Chars.includes(keyword.toLowerCase())) {
      assessment.improvements.push('Consider adding the main keyword in the first paragraph');
    } else {
      assessment.strengths.push('Main keyword appears in the first paragraph');
    }
  }

  /**
   * Assess content completeness
   */
  assessCompleteness(assessment, contentData) {
    // Check if important elements are present
    
    // 1. Check for introduction
    const hasIntro = contentData.structure?.sections && 
                    contentData.structure.sections.length > 0 && 
                    contentData.structure.sections[0].content && 
                    contentData.structure.sections[0].content.length > 200;
    
    if (!hasIntro) {
      assessment.improvements.push('Consider adding a more comprehensive introduction');
    } else {
      assessment.strengths.push('Content has a good introduction');
    }
    
    // 2. Check for conclusion
    const hasConclusion = contentData.structure?.sections && 
                        contentData.structure.sections.length > 0 && 
                        contentData.structure.sections[contentData.structure.sections.length - 1].heading &&
                        contentData.structure.sections[contentData.structure.sections.length - 1].heading.toLowerCase().includes('conclusion');
    
    if (!hasConclusion) {
      assessment.improvements.push('Consider adding a conclusion section');
    } else {
      assessment.strengths.push('Content has a conclusion section');
    }
    
    // 3. Check for schema markup
    const hasSchema = contentData.schema && Object.keys(contentData.schema).length > 0;
    
    if (!hasSchema) {
      assessment.issues.push('Content is missing schema markup');
    } else {
      assessment.strengths.push('Content includes schema markup');
    }
    
    // 4. Check for internal links
    const hasInternalLinks = contentData.internalLinks && contentData.internalLinks.length > 0;
    
    if (!hasInternalLinks) {
      assessment.improvements.push('Consider adding internal links');
    } else {
      assessment.strengths.push('Content has internal links');
    }
  }

  /**
   * Calculate overall SEO score
   */
  calculateOverallScore(assessment) {
    // Base score
    let score = 70;
    
    // Deduct points for issues
    score -= assessment.issues.length * 5;
    
    // Add points for strengths
    score += assessment.strengths.length * 3;
    
    // Deduct points for needed improvements (but less than for issues)
    score -= assessment.improvements.length * 2;
    
    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));
    
    return Math.round(score);
  }

  /**
   * Generate improvement recommendations
   * @param {string} keyword - The target keyword
   * @param {object} assessment - The quality assessment results
   * @returns {object} - Specific improvement recommendations
   */
  async generateRecommendations(keyword, assessment) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[SEO-QUALITY] Generating recommendations for: "${keyword}"`);
    
    try {
      const recommendations = {
        keyword,
        timestamp: new Date().toISOString(),
        overallScore: assessment.overallScore,
        prioritizedActions: []
      };
      
      // Prioritize issues first
      assessment.issues.forEach(issue => {
        recommendations.prioritizedActions.push({
          priority: 'High',
          issue: issue,
          recommendation: this.getRecommendationForIssue(issue)
        });
      });
      
      // Then add improvements
      assessment.improvements.forEach(improvement => {
        recommendations.prioritizedActions.push({
          priority: 'Medium',
          issue: improvement,
          recommendation: this.getRecommendationForIssue(improvement)
        });
      });
      
      // Add score-based general recommendations
      if (assessment.overallScore < 50) {
        recommendations.prioritizedActions.push({
          priority: 'Critical',
          issue: 'Overall SEO score is very low',
          recommendation: 'Consider a complete revision of the content with focus on keyword usage, content structure, and comprehensive coverage of the topic.'
        });
      } else if (assessment.overallScore < 70) {
        recommendations.prioritizedActions.push({
          priority: 'High',
          issue: 'Overall SEO score needs improvement',
          recommendation: 'Address all high priority issues and focus on enhancing content depth and keyword optimization.'
        });
      }
      
      return recommendations;
    } catch (error) {
      console.error(`[SEO-QUALITY] Error generating recommendations for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Get specific recommendation for an issue
   */
  getRecommendationForIssue(issue) {
    const recommendationMap = {
      // Title issues
      'Title is too short (< 30 characters)': 'Expand the title to be between 30-60 characters while including the main keyword and a compelling hook.',
      'Title is too long (> 60 characters)': 'Shorten the title to 60 characters or less while retaining the main keyword and value proposition.',
      'Title does not contain the main keyword': 'Rewrite the title to naturally include the main keyword, preferably near the beginning.',
      'Consider adding power words to the title for better CTR': 'Add compelling power words like "Ultimate", "Complete", "Essential", or "Guide" to boost click-through rate.',
      
      // Meta description issues
      'Meta description is too short (< 120 characters)': 'Expand the meta description to 120-160 characters with a clear value proposition and call to action.',
      'Meta description is too long (> 160 characters)': 'Shorten the meta description to 160 characters or less while retaining the main keyword and call to action.',
      'Meta description does not contain the main keyword': 'Rewrite the meta description to naturally include the main keyword.',
      'Consider adding a call-to-action in the meta description': 'Add a compelling call-to-action such as "Learn more", "Discover", or "Find out" to encourage clicks.',
      
      // Content issues
      'Content is too short (< 500 words)': 'Expand the content to at least 1000-1500 words, focusing on adding more depth, examples, and expert insights.',
      'Content could be longer for better ranking (currently < 1000 words)': 'Consider expanding the content to 1500+ words for better search ranking, especially if competitors have longer content.',
      'Consider adding a FAQ section for better featured snippet opportunities': 'Add a FAQ section with 5-7 questions that target common queries related to the main keyword.',
      
      // Keyword issues
      'Keyword density is too low (< 0.5%)': 'Increase the usage of the main keyword to achieve 0.5-2% density. Add the keyword to headings, introduction, and conclusion.',
      'Keyword density may be too high (> 3%)': 'Reduce keyword repetition and use more LSI keywords and semantic variations instead to avoid keyword stuffing penalties.',
      'Consider adding the main keyword in the first paragraph': 'Rewrite the introduction to include the main keyword within the first 100 characters for better SEO.',
      
      // Structure issues
      'Content has too few sections (< 3)': 'Expand the content structure to include at least 5-7 main sections with meaningful H2 headings.',
      'Consider using the main keyword or related terms in more headings': 'Revise headings to naturally include the main keyword or closely related terms in at least 30-50% of headings.',
      'Consider adding a more comprehensive introduction': 'Expand the introduction to 150-200 words that clearly states what the reader will learn and why it matters.',
      'Consider adding a conclusion section': 'Add a conclusion section that summarizes key points and includes a clear call-to-action.',
      
      // Technical issues
      'Content is missing schema markup': 'Implement appropriate schema markup (Article, FAQPage, HowTo, etc.) based on the content type.',
      'Consider adding internal links': 'Add 3-5 internal links to related content on your site using descriptive anchor text.'
    };
    
    return recommendationMap[issue] || 'Address this issue to improve SEO performance.';
  }
}

module.exports = new SeoQualityService(); 