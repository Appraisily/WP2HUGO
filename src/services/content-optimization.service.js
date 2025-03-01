/**
 * Content Optimization Service
 * 
 * This service analyzes content for readability, SEO optimization,
 * and provides suggestions for improvement.
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const googleAiService = require('./google-ai.service');

class ContentOptimizationService {
  constructor() {
    this.initialized = false;
    this.readabilityLevels = {
      90: 'Very Easy',
      80: 'Easy',
      70: 'Fairly Easy',
      60: 'Standard',
      50: 'Fairly Difficult',
      30: 'Difficult',
      0: 'Very Difficult'
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await googleAiService.initialize();
      this.initialized = true;
      console.log('[CONTENT-OPT] Content optimization service initialized successfully');
      return true;
    } catch (error) {
      console.error('[CONTENT-OPT] Failed to initialize content optimization service:', error);
      throw error;
    }
  }

  /**
   * Analyze markdown content for readability and SEO optimization
   * @param {string} keyword - The target keyword
   * @param {string} markdownContent - The markdown content to analyze
   * @param {object} metadata - Additional metadata for context
   * @returns {object} - Analysis results
   */
  async analyzeContent(keyword, markdownContent, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[CONTENT-OPT] Analyzing content for keyword: "${keyword}"`);
    
    try {
      // Basic text metrics
      const textMetrics = this.calculateTextMetrics(markdownContent);
      
      // SEO analysis
      const seoAnalysis = this.analyzeSeo(keyword, markdownContent, metadata);
      
      // Readability analysis
      const readabilityScore = this.calculateReadabilityScore(markdownContent);
      const readabilityLevel = this.getReadabilityLevel(readabilityScore);
      
      // Combine results
      const analysisResults = {
        textMetrics,
        seoAnalysis,
        readabilityScore,
        readabilityLevel,
        timestamp: new Date().toISOString()
      };
      
      // Get AI-powered improvement suggestions
      if (process.env.GOOGLEAI_API_KEY) {
        try {
          analysisResults.suggestions = await this.getImprovedSuggestions(
            keyword, 
            markdownContent, 
            analysisResults
          );
        } catch (error) {
          console.warn('[CONTENT-OPT] Failed to get AI suggestions:', error.message);
          analysisResults.suggestions = this.getBasicSuggestions(analysisResults);
        }
      } else {
        analysisResults.suggestions = this.getBasicSuggestions(analysisResults);
      }
      
      return analysisResults;
    } catch (error) {
      console.error(`[CONTENT-OPT] Error analyzing content for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Calculate basic text metrics
   * @param {string} text - The text to analyze
   * @returns {object} - Text metrics
   */
  calculateTextMetrics(text) {
    // Remove markdown syntax for accurate text analysis
    const plainText = this.stripMarkdown(text);
    
    // Split into words, sentences, and paragraphs
    const words = plainText.match(/\b\w+\b/g) || [];
    const sentences = plainText.match(/[.!?]+(\s|$)/g) || [];
    const paragraphs = plainText.split(/\n\s*\n/) || [];
    
    // Calculate word lengths
    const wordLengths = words.map(word => word.length);
    const averageWordLength = wordLengths.reduce((sum, len) => sum + len, 0) / (words.length || 1);
    
    // Count difficult words (words with 3+ syllables)
    const difficultWords = words.filter(word => this.countSyllables(word) >= 3);
    const difficultWordsPercentage = (difficultWords.length / (words.length || 1)) * 100;
    
    return {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: words.length / (sentences.length || 1),
      averageWordLength,
      difficultWordsCount: difficultWords.length,
      difficultWordsPercentage
    };
  }

  /**
   * Analyze SEO factors in the content
   * @param {string} keyword - The target keyword
   * @param {string} content - The content to analyze
   * @param {object} metadata - Additional metadata
   * @returns {object} - SEO analysis results
   */
  analyzeSeo(keyword, content, metadata) {
    // Extract the first 1000 characters for title and meta description analysis
    const firstPart = content.substring(0, 1000);
    
    // Check for frontmatter
    const hasFrontmatter = /^---\n[\s\S]+?\n---/.test(content);
    
    // Get frontmatter if available
    let frontmatter = '';
    if (hasFrontmatter) {
      const match = content.match(/^---\n([\s\S]+?)\n---/);
      frontmatter = match ? match[1] : '';
    }
    
    // Check for title in frontmatter
    const titleMatch = frontmatter.match(/title:\s*"([^"]+)"/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // Check for description in frontmatter
    const descMatch = frontmatter.match(/description:\s*"([^"]+)"/);
    const description = descMatch ? descMatch[1] : '';
    
    // Calculate keyword density
    const keywordRegex = new RegExp(this.escapeRegExp(keyword), 'gi');
    const keywordMatches = content.match(keywordRegex) || [];
    const plainText = this.stripMarkdown(content);
    const words = plainText.match(/\b\w+\b/g) || [];
    const keywordDensity = (keywordMatches.length / (words.length || 1)) * 100;
    
    // Check headings
    const headings = content.match(/(?:^|\n)#{1,6}\s+(.+)$/gm) || [];
    const h1 = content.match(/(?:^|\n)#\s+(.+)$/gm) || [];
    const h2 = content.match(/(?:^|\n)##\s+(.+)$/gm) || [];
    const h3 = content.match(/(?:^|\n)###\s+(.+)$/gm) || [];
    
    // Check for keyword in headings
    const keywordInHeadings = headings.filter(h => keywordRegex.test(h)).length;
    
    // Check for links and images
    const links = content.match(/(?<!!)\[.*?\]\(.*?\)/g) || [];
    const images = content.match(/!\[.*?\]\(.*?\)/g) || [];
    
    // Check for alt text in images
    const imagesWithAlt = images.filter(img => {
      const altMatch = img.match(/!\[(.*?)\]/);
      return altMatch && altMatch[1] && altMatch[1].trim() !== '';
    });
    
    return {
      keywordDensity,
      keywordCount: keywordMatches.length,
      title: {
        exists: !!title,
        length: title.length,
        hasKeyword: keywordRegex.test(title),
        isOptimalLength: title.length >= 30 && title.length <= 60
      },
      description: {
        exists: !!description,
        length: description.length,
        hasKeyword: keywordRegex.test(description),
        isOptimalLength: description.length >= 120 && description.length <= 160
      },
      headings: {
        total: headings.length,
        h1Count: h1.length,
        h2Count: h2.length,
        h3Count: h3.length,
        keywordInHeadings,
        hasKeywordInFirstHeading: h1.length > 0 && keywordRegex.test(h1[0])
      },
      links: {
        count: links.length,
        density: (links.length / (paragraphs.length || 1))
      },
      images: {
        count: images.length,
        withAlt: imagesWithAlt.length,
        altTextQuality: imagesWithAlt.length / (images.length || 1)
      }
    };
  }

  /**
   * Calculate readability score (Flesch-Kincaid Reading Ease)
   * @param {string} text - The text to analyze
   * @returns {number} - Readability score (0-100)
   */
  calculateReadabilityScore(text) {
    // Strip markdown for accurate text analysis
    const plainText = this.stripMarkdown(text);
    
    // Count sentences, words, and syllables
    const sentences = plainText.match(/[.!?]+(\s|$)/g) || [];
    const words = plainText.match(/\b\w+\b/g) || [];
    
    // Ensure we have words and sentences
    if (words.length === 0 || sentences.length === 0) {
      return 0;
    }
    
    // Count total syllables
    let totalSyllables = 0;
    for (const word of words) {
      totalSyllables += this.countSyllables(word);
    }
    
    // Calculate averages
    const avgSentenceLength = words.length / sentences.length;
    const avgSyllablesPerWord = totalSyllables / words.length;
    
    // Flesch-Kincaid Reading Ease formula
    // 206.835 - (1.015 × ASL) - (84.6 × ASW)
    // ASL = average sentence length (words per sentence)
    // ASW = average syllables per word
    const score = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
    
    // Clamp score between 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get the readability level description based on score
   * @param {number} score - The readability score
   * @returns {string} - Readability level description
   */
  getReadabilityLevel(score) {
    // Find the appropriate readability level
    for (const [threshold, level] of Object.entries(this.readabilityLevels)) {
      if (score >= parseInt(threshold)) {
        return level;
      }
    }
    return 'Unknown';
  }

  /**
   * Get basic improvement suggestions based on analysis
   * @param {object} analysis - The content analysis results
   * @returns {object} - Improvement suggestions
   */
  getBasicSuggestions(analysis) {
    const suggestions = {
      readability: [],
      seo: [],
      structure: []
    };
    
    // Readability suggestions
    if (analysis.readabilityScore < 60) {
      suggestions.readability.push('Consider using shorter sentences and simpler words to improve readability.');
    }
    
    if (analysis.textMetrics.averageWordsPerSentence > 20) {
      suggestions.readability.push('Your sentences are quite long. Try breaking them into shorter sentences.');
    }
    
    if (analysis.textMetrics.difficultWordsPercentage > 10) {
      suggestions.readability.push('You\'re using many complex words. Consider simpler alternatives where possible.');
    }
    
    // SEO suggestions
    const { seoAnalysis } = analysis;
    
    if (!seoAnalysis.title.exists || !seoAnalysis.title.hasKeyword) {
      suggestions.seo.push('Include your target keyword in the title for better SEO.');
    }
    
    if (!seoAnalysis.title.isOptimalLength) {
      suggestions.seo.push('Aim for a title length between 30-60 characters for optimal SEO.');
    }
    
    if (!seoAnalysis.description.exists || !seoAnalysis.description.hasKeyword) {
      suggestions.seo.push('Include your target keyword in the meta description.');
    }
    
    if (!seoAnalysis.description.isOptimalLength) {
      suggestions.seo.push('Aim for a meta description length between 120-160 characters.');
    }
    
    if (seoAnalysis.keywordDensity < 0.5) {
      suggestions.seo.push('Your keyword density is low. Include your target keyword more frequently.');
    } else if (seoAnalysis.keywordDensity > 3) {
      suggestions.seo.push('Your keyword density is too high, which might appear as keyword stuffing. Reduce keyword frequency.');
    }
    
    if (seoAnalysis.keywordInHeadings < 1) {
      suggestions.seo.push('Include your target keyword in at least one heading for better SEO.');
    }
    
    // Structure suggestions
    if (seoAnalysis.headings.total < 3) {
      suggestions.structure.push('Add more headings to better structure your content.');
    }
    
    if (seoAnalysis.links.count < 2) {
      suggestions.structure.push('Include more internal or external links to enhance content value.');
    }
    
    if (seoAnalysis.images.count < 1) {
      suggestions.structure.push('Add at least one image to make your content more engaging.');
    } else if (seoAnalysis.images.altTextQuality < 1) {
      suggestions.structure.push('Ensure all images have descriptive alt text for better accessibility and SEO.');
    }
    
    if (analysis.textMetrics.paragraphCount < 5) {
      suggestions.structure.push('Your content is quite short. Consider expanding it for more comprehensive coverage.');
    }
    
    return suggestions;
  }

  /**
   * Get AI-powered improvement suggestions
   * @param {string} keyword - The target keyword
   * @param {string} content - The content to analyze
   * @param {object} analysis - The analysis results
   * @returns {object} - AI-generated improvement suggestions
   */
  async getImprovedSuggestions(keyword, content, analysis) {
    try {
      // Prepare the prompt for the AI
      const prompt = `
As an SEO and content optimization expert, analyze this content about "${keyword}" and provide specific improvement suggestions.

Content Analysis Summary:
- Readability Score: ${analysis.readabilityScore.toFixed(1)} (${analysis.readabilityLevel})
- Word Count: ${analysis.textMetrics.wordCount}
- Keyword Density: ${analysis.seoAnalysis.keywordDensity.toFixed(2)}%
- Headings: ${analysis.seoAnalysis.headings.total}
- Links: ${analysis.seoAnalysis.links.count}
- Images: ${analysis.seoAnalysis.images.count}

Provide 3-5 specific, actionable suggestions for each category:
1. Readability improvements
2. SEO optimization
3. Content structure and formatting
4. User engagement
`;

      // Get suggestions from Google AI
      const aiResponse = await googleAiService.generateResponse(prompt);
      
      // Process and structure the AI response
      const suggestions = this.parseAiSuggestions(aiResponse.text);
      
      // Combine with basic suggestions for completeness
      const basicSuggestions = this.getBasicSuggestions(analysis);
      
      return {
        ...suggestions,
        readability: [...(suggestions.readability || []), ...basicSuggestions.readability],
        seo: [...(suggestions.seo || []), ...basicSuggestions.seo],
        structure: [...(suggestions.structure || []), ...basicSuggestions.structure],
        engagement: suggestions.engagement || []
      };
    } catch (error) {
      console.warn('[CONTENT-OPT] Failed to get AI suggestions:', error.message);
      return this.getBasicSuggestions(analysis);
    }
  }

  /**
   * Parse AI response into structured suggestions
   * @param {string} aiResponse - The AI's response text
   * @returns {object} - Structured suggestions
   */
  parseAiSuggestions(aiResponse) {
    const suggestions = {
      readability: [],
      seo: [],
      structure: [],
      engagement: []
    };
    
    // Extract readability suggestions
    const readabilityMatch = aiResponse.match(/Readability improvements:?([\s\S]*?)(?:\d\.|\n\n|$)/i);
    if (readabilityMatch && readabilityMatch[1]) {
      const readabilityText = readabilityMatch[1].trim();
      const readabilityItems = readabilityText.split(/\n\s*[-•]\s*/);
      suggestions.readability = readabilityItems.filter(item => item.trim().length > 0);
    }
    
    // Extract SEO suggestions
    const seoMatch = aiResponse.match(/SEO optimization:?([\s\S]*?)(?:\d\.|\n\n|$)/i);
    if (seoMatch && seoMatch[1]) {
      const seoText = seoMatch[1].trim();
      const seoItems = seoText.split(/\n\s*[-•]\s*/);
      suggestions.seo = seoItems.filter(item => item.trim().length > 0);
    }
    
    // Extract structure suggestions
    const structureMatch = aiResponse.match(/Content structure and formatting:?([\s\S]*?)(?:\d\.|\n\n|$)/i);
    if (structureMatch && structureMatch[1]) {
      const structureText = structureMatch[1].trim();
      const structureItems = structureText.split(/\n\s*[-•]\s*/);
      suggestions.structure = structureItems.filter(item => item.trim().length > 0);
    }
    
    // Extract engagement suggestions
    const engagementMatch = aiResponse.match(/User engagement:?([\s\S]*?)(?:\d\.|\n\n|$)/i);
    if (engagementMatch && engagementMatch[1]) {
      const engagementText = engagementMatch[1].trim();
      const engagementItems = engagementText.split(/\n\s*[-•]\s*/);
      suggestions.engagement = engagementItems.filter(item => item.trim().length > 0);
    }
    
    return suggestions;
  }

  /**
   * Count the approximate number of syllables in a word
   * @param {string} word - The word to count syllables for
   * @returns {number} - Syllable count
   */
  countSyllables(word) {
    word = word.toLowerCase().trim();
    
    // Special cases
    if (word.length <= 3) return 1;
    
    // Remove ending 'e', except for 'le'
    word = word.replace(/(?:[^l]e|ed|es)$/, '');
    
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g);
    
    return vowelGroups ? vowelGroups.length : 1;
  }

  /**
   * Strip markdown formatting for plain text analysis
   * @param {string} markdown - The markdown content
   * @returns {string} - Plain text without markdown formatting
   */
  stripMarkdown(markdown) {
    // Remove frontmatter
    let text = markdown.replace(/^---\n[\s\S]*?\n---/, '');
    
    // Remove headings, links, images, code blocks
    text = text
      .replace(/!\[.*?\]\(.*?\)/g, '') // Images
      .replace(/\[.*?\]\(.*?\)/g, '$1') // Links (keep link text)
      .replace(/(?:^|\n)#{1,6}\s+(.*)/g, '$1') // Headings
      .replace(/`{3}[\s\S]*?`{3}/g, '') // Code blocks
      .replace(/`.*?`/g, '') // Inline code
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/__(.*?)__/g, '$1') // Bold
      .replace(/_(.*?)_/g, '$1') // Italic
      .replace(/~{2}(.*?)~{2}/g, '$1') // Strikethrough
      .replace(/>\s*(.*)/g, '$1') // Blockquotes
      .replace(/---/g, '') // Horizontal rule
      .replace(/\|.*\|/g, '') // Tables
      .replace(/^-\s+/gm, '') // Unordered lists
      .replace(/^\d+\.\s+/gm, ''); // Ordered lists
    
    // Clean up excessive whitespace
    text = text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    return text;
  }

  /**
   * Escape special regex characters in a string
   * @param {string} string - The string to escape
   * @returns {string} - Escaped string for regex use
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new ContentOptimizationService(); 