/**
 * Competitor Analysis Service
 * 
 * This service analyzes top-ranking content for a keyword to identify
 * patterns, gaps, and winning strategies to outrank competitors.
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const config = require('../config');
const googleAiService = require('./google-ai.service');

class CompetitorAnalysisService {
  constructor() {
    this.initialized = false;
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      await googleAiService.initialize();
      this.initialized = true;
      console.log('[COMPETITOR] Competitor analysis service initialized');
      return true;
    } catch (error) {
      console.error('[COMPETITOR] Failed to initialize competitor analysis service:', error);
      throw error;
    }
  }

  /**
   * Analyze top competing content for a keyword
   * @param {string} keyword - The target keyword
   * @param {Array} searchResults - Array of search result objects
   * @returns {object} - Analysis of competing content
   */
  async analyzeCompetitors(keyword, searchResults) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[COMPETITOR] Analyzing competitors for "${keyword}"`);
    
    try {
      // Extract URLs from search results
      const topUrls = searchResults
        .filter(result => result.url && !result.url.includes('youtube.com') && !result.url.includes('pinterest.com'))
        .slice(0, 5)
        .map(result => result.url);
      
      if (topUrls.length === 0) {
        console.warn(`[COMPETITOR] No valid URLs found for "${keyword}"`);
        return {
          success: false,
          message: 'No valid URLs found for analysis'
        };
      }
      
      console.log(`[COMPETITOR] Found ${topUrls.length} top competitors to analyze`);
      
      // Analyze each URL
      const analysisResults = [];
      for (const url of topUrls) {
        try {
          console.log(`[COMPETITOR] Analyzing content at ${url}`);
          const analysis = await this.analyzeUrl(url);
          analysisResults.push({
            url,
            ...analysis
          });
        } catch (error) {
          console.error(`[COMPETITOR] Error analyzing ${url}:`, error.message);
          // Continue with other URLs even if one fails
        }
      }
      
      // Compile overall analysis
      const competitorInsights = await this.compileCompetitorInsights(keyword, analysisResults);
      
      return {
        success: true,
        keyword,
        analysisDate: new Date().toISOString(),
        topCompetitors: analysisResults,
        insights: competitorInsights
      };
    } catch (error) {
      console.error(`[COMPETITOR] Error analyzing competitors for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Analyze a specific URL
   * @param {string} url - The URL to analyze
   * @returns {object} - Analysis of the URL's content
   */
  async analyzeUrl(url) {
    try {
      // Fetch the page content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });
      
      const html = response.data;
      
      // Basic HTML analysis
      const textContent = this.extractTextContent(html);
      const wordCount = this.countWords(textContent);
      const headings = this.extractHeadings(html);
      const images = this.extractImages(html);
      const links = this.extractLinks(html);
      
      // Calculate metrics
      const readability = this.estimateReadability(textContent);
      
      return {
        wordCount,
        headings: {
          h1: headings.h1.length > 0 ? headings.h1[0] : '',
          h1Count: headings.h1.length,
          h2Count: headings.h2.length,
          h3Count: headings.h3.length,
          h2Headings: headings.h2,
          totalHeadings: headings.h1.length + headings.h2.length + headings.h3.length
        },
        images: {
          count: images.length,
          hasAlt: images.filter(img => img.alt && img.alt.trim() !== '').length
        },
        links: {
          count: links.length,
          internal: links.filter(link => link.isInternal).length,
          external: links.filter(link => !link.isInternal).length
        },
        readability,
        metrics: {
          avgWordsPerHeading: wordCount / (headings.h1.length + headings.h2.length + headings.h3.length || 1),
          imagesPerWord: images.length / (wordCount || 1) * 1000, // Images per 1000 words
          linksPerWord: links.length / (wordCount || 1) * 1000, // Links per 1000 words
        }
      };
    } catch (error) {
      console.error(`[COMPETITOR] Error analyzing ${url}:`, error.message);
      throw error;
    }
  }

  /**
   * Compile insights from competitor analyses
   * @param {string} keyword - The target keyword
   * @param {Array} analyses - Array of competitor analysis results
   * @returns {object} - Compiled insights and recommendations
   */
  async compileCompetitorInsights(keyword, analyses) {
    try {
      // Calculate averages
      const avgWordCount = analyses.reduce((sum, a) => sum + a.wordCount, 0) / analyses.length;
      const avgHeadings = analyses.reduce((sum, a) => sum + a.headings.totalHeadings, 0) / analyses.length;
      const avgImages = analyses.reduce((sum, a) => sum + a.images.count, 0) / analyses.length;
      const avgLinks = analyses.reduce((sum, a) => sum + a.links.count, 0) / analyses.length;
      
      // Extract all H2 headings for analysis
      const allH2Headings = analyses.flatMap(a => a.headings.h2Headings);
      
      // Use AI to analyze heading patterns and content structure
      let contentInsights = {};
      
      if (allH2Headings.length > 0 && process.env.GOOGLEAI_API_KEY) {
        const prompt = `
I'm analyzing top-ranking content for the keyword "${keyword}". Here are the H2 headings used by top competitors:

${allH2Headings.map(h => `- ${h}`).join('\n')}

Based on these headings, please provide:
1. Common patterns in how the content is structured
2. Important topics that should be covered based on these headings
3. Any gaps or opportunities for additional topics not covered
4. A recommended outline of H2 headings for a comprehensive article on "${keyword}" that would outrank these competitors

Format your response as JSON with the following structure:
{
  "patterns": ["pattern1", "pattern2", ...],
  "criticalTopics": ["topic1", "topic2", ...],
  "contentGaps": ["gap1", "gap2", ...],
  "recommendedOutline": ["heading1", "heading2", ...]
}
`;

        try {
          const aiResponse = await googleAiService.generateStructuredResponse(prompt);
          contentInsights = aiResponse;
        } catch (error) {
          console.warn('[COMPETITOR] Failed to get AI insights for headings:', error.message);
          contentInsights = this.generateBasicInsights(allH2Headings, keyword);
        }
      } else {
        contentInsights = this.generateBasicInsights(allH2Headings, keyword);
      }
      
      // Compile overall recommendations
      return {
        contentStatistics: {
          averageWordCount: Math.round(avgWordCount),
          averageHeadings: Math.round(avgHeadings),
          averageImages: Math.round(avgImages),
          averageLinks: Math.round(avgLinks),
          wordCountRange: {
            min: Math.min(...analyses.map(a => a.wordCount)),
            max: Math.max(...analyses.map(a => a.wordCount))
          }
        },
        contentPatterns: contentInsights.patterns || [],
        criticalTopics: contentInsights.criticalTopics || [],
        contentGaps: contentInsights.contentGaps || [],
        recommendedOutline: contentInsights.recommendedOutline || [],
        recommendations: {
          wordCount: Math.round(avgWordCount * 1.2), // Aim for 20% more than average
          headingsCount: Math.round(avgHeadings * 1.1),
          imagesCount: Math.round(avgImages * 1.2),
          linksCount: Math.round(avgLinks * 1.1)
        }
      };
    } catch (error) {
      console.error('[COMPETITOR] Error compiling insights:', error);
      return {
        error: 'Failed to compile competitor insights',
        message: error.message
      };
    }
  }

  /**
   * Generate basic insights without AI
   * @param {Array} headings - Array of headings
   * @param {string} keyword - The target keyword
   * @returns {object} - Basic insights and recommendations
   */
  generateBasicInsights(headings, keyword) {
    // Count heading frequencies
    const headingFrequency = {};
    for (const heading of headings) {
      const normalizedHeading = heading.toLowerCase();
      headingFrequency[normalizedHeading] = (headingFrequency[normalizedHeading] || 0) + 1;
    }
    
    // Sort by frequency
    const sortedHeadings = Object.entries(headingFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([heading]) => heading);
    
    // Extract common topics (top 5)
    const commonTopics = sortedHeadings.slice(0, 5);
    
    // Generate recommended outline
    const recommendedOutline = [
      `What is ${keyword}`,
      `Benefits of ${keyword}`,
      `How to use ${keyword}`,
      `Types of ${keyword}`,
      `Best practices for ${keyword}`,
      `Common mistakes with ${keyword}`,
      `${keyword} examples`,
      `FAQ about ${keyword}`
    ];
    
    return {
      patterns: ['Question-based headings', 'How-to sections', 'List-based content'],
      criticalTopics: commonTopics,
      contentGaps: ['Recent developments', 'Expert opinions', 'Case studies'],
      recommendedOutline
    };
  }

  /**
   * Extract text content from HTML
   * @param {string} html - HTML content
   * @returns {string} - Extracted text content
   */
  extractTextContent(html) {
    // Simple regex-based text extraction
    let text = html
      // Remove scripts and styles
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Replace HTML tags with space
      .replace(/<[^>]+>/g, ' ')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim();
    
    return text;
  }

  /**
   * Count words in text
   * @param {string} text - Text to count words in
   * @returns {number} - Word count
   */
  countWords(text) {
    const words = text.match(/\b\w+\b/g) || [];
    return words.length;
  }

  /**
   * Extract headings from HTML
   * @param {string} html - HTML content
   * @returns {object} - Extracted headings by level
   */
  extractHeadings(html) {
    const h1 = (html.match(/<h1[^>]*>(.*?)<\/h1>/gi) || [])
      .map(match => this.cleanHtml(match.replace(/<\/?h1[^>]*>/gi, '')));
    
    const h2 = (html.match(/<h2[^>]*>(.*?)<\/h2>/gi) || [])
      .map(match => this.cleanHtml(match.replace(/<\/?h2[^>]*>/gi, '')));
    
    const h3 = (html.match(/<h3[^>]*>(.*?)<\/h3>/gi) || [])
      .map(match => this.cleanHtml(match.replace(/<\/?h3[^>]*>/gi, '')));
    
    return { h1, h2, h3 };
  }

  /**
   * Extract images from HTML
   * @param {string} html - HTML content
   * @returns {Array} - Extracted image information
   */
  extractImages(html) {
    const imgRegex = /<img[^>]+>/gi;
    const imgMatches = html.match(imgRegex) || [];
    
    return imgMatches.map(img => {
      const srcMatch = img.match(/src=["']([^"']+)["']/i);
      const altMatch = img.match(/alt=["']([^"']*)["']/i);
      
      return {
        src: srcMatch ? srcMatch[1] : '',
        alt: altMatch ? altMatch[1] : ''
      };
    });
  }

  /**
   * Extract links from HTML
   * @param {string} html - HTML content
   * @param {string} baseUrl - Base URL for determining internal links
   * @returns {Array} - Extracted link information
   */
  extractLinks(html) {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi;
    const links = [];
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const url = match[1];
      const text = this.cleanHtml(match[2]);
      
      links.push({
        url,
        text,
        isInternal: !url.startsWith('http') || url.includes(new URL(url).hostname)
      });
    }
    
    return links;
  }

  /**
   * Clean HTML content
   * @param {string} html - HTML to clean
   * @returns {string} - Cleaned text
   */
  cleanHtml(html) {
    return html
      .replace(/<[^>]+>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  /**
   * Estimate readability of text
   * @param {string} text - Text to analyze
   * @returns {object} - Readability metrics
   */
  estimateReadability(text) {
    // Split into sentences and words
    const sentences = text.match(/[.!?]+\s+[A-Z]/g) || [];
    const words = text.match(/\b\w+\b/g) || [];
    
    if (words.length === 0 || sentences.length === 0) {
      return {
        avgWordsPerSentence: 0,
        level: 'Unknown'
      };
    }
    
    // Calculate average sentence length
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Determine readability level based on average sentence length
    let level = 'Medium';
    if (avgWordsPerSentence < 12) {
      level = 'Easy';
    } else if (avgWordsPerSentence > 20) {
      level = 'Difficult';
    }
    
    return {
      avgWordsPerSentence,
      level
    };
  }
}

module.exports = new CompetitorAnalysisService(); 