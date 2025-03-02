/**
 * SEO Quality Service
 * 
 * This service evaluates content for SEO quality and provides feedback
 * for improvement. It includes a mock implementation for testing without API access.
 */

const fs = require('fs').promises;
const path = require('path');
const slugify = require('../utils/slugify');

class SeoQualityService {
  constructor() {
    this.forceApi = false;
    this.mockDelay = 800; // Simulate API delay in ms
  }

  /**
   * Set whether to force using the API even when cache exists
   * @param {boolean} value - Whether to force API usage
   */
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[SEO-QUALITY] Force API set to: ${value}`);
  }

  /**
   * Evaluate content for SEO quality
   * @param {string} keyword - The keyword to evaluate content for
   * @param {object} content - Content to evaluate
   * @returns {Promise<object>} - The evaluation results
   */
  async evaluateContent(keyword, content) {
    console.log(`[SEO-QUALITY] Evaluating content for SEO quality: "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      const cachePath = path.join(process.cwd(), 'output', 'research', `${slug}-seo-evaluation.json`);
      
      // Check if cache exists and we're not forcing API usage
      try {
        if (!this.forceApi) {
          const cacheExists = await fs.access(cachePath).then(() => true).catch(() => false);
          if (cacheExists) {
            console.log(`[SEO-QUALITY] Using cached SEO evaluation for "${keyword}"`);
            const cachedData = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(cachedData);
          }
        }
      } catch (error) {
        // Cache doesn't exist or is invalid, proceed with evaluation
      }
      
      // Check if we have API access
      if (!process.env.SEO_QUALITY_API_KEY) {
        console.warn('[SEO-QUALITY] API key not found, using mock implementation');
        return this.generateMockEvaluation(keyword, content);
      }
      
      // TODO: Implement real API call to SEO quality service
      console.warn('[SEO-QUALITY] Real API implementation not available, using mock');
      return this.generateMockEvaluation(keyword, content);
    } catch (error) {
      console.error(`[SEO-QUALITY] Error evaluating content: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate mock SEO evaluation for testing
   * @param {string} keyword - The keyword to evaluate content for
   * @param {object} content - Content to evaluate
   * @returns {Promise<object>} - The mock evaluation results
   */
  async generateMockEvaluation(keyword, content) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));
    
    // Extract content details for evaluation
    const title = content.seoTitle || content.title || '';
    const description = content.seoDescription || content.description || '';
    const hasKeywordInTitle = title.toLowerCase().includes(keyword.toLowerCase());
    const hasKeywordInDescription = description.toLowerCase().includes(keyword.toLowerCase());
    
    // Calculate mock scores
    const titleScore = hasKeywordInTitle ? 100 : 70;
    const descriptionScore = hasKeywordInDescription ? 100 : 70;
    const contentScore = Math.floor(Math.random() * 20) + 80; // Random score between 80-100
    const readabilityScore = Math.floor(Math.random() * 15) + 85; // Random score between 85-100
    const keywordDensityScore = Math.floor(Math.random() * 10) + 90; // Random score between 90-100
    
    // Calculate overall score (weighted average)
    const overallScore = Math.floor(
      (titleScore * 0.15) +
      (descriptionScore * 0.15) +
      (contentScore * 0.4) +
      (readabilityScore * 0.15) +
      (keywordDensityScore * 0.15)
    );
    
    // Generate feedback based on scores
    const feedback = [];
    
    if (!hasKeywordInTitle) {
      feedback.push({
        aspect: 'Title',
        issue: 'Keyword missing from title',
        recommendation: `Include the keyword "${keyword}" in the title for better SEO`,
        priority: 'High'
      });
    }
    
    if (!hasKeywordInDescription) {
      feedback.push({
        aspect: 'Meta Description',
        issue: 'Keyword missing from meta description',
        recommendation: `Include the keyword "${keyword}" in the meta description for better SEO`,
        priority: 'High'
      });
    }
    
    if (title.length > 60) {
      feedback.push({
        aspect: 'Title',
        issue: 'Title too long',
        recommendation: 'Keep title under 60 characters for optimal display in search results',
        priority: 'Medium'
      });
    }
    
    if (description.length > 160) {
      feedback.push({
        aspect: 'Meta Description',
        issue: 'Meta description too long',
        recommendation: 'Keep meta description under 160 characters for optimal display in search results',
        priority: 'Medium'
      });
    }
    
    // Add random feedback items
    const randomFeedback = [
      {
        aspect: 'Content Structure',
        issue: 'Heading hierarchy could be improved',
        recommendation: 'Ensure proper use of H2, H3, and H4 headings for better content structure',
        priority: 'Medium'
      },
      {
        aspect: 'Internal Linking',
        issue: 'Limited internal links',
        recommendation: 'Add more internal links to related content on your site',
        priority: 'Medium'
      },
      {
        aspect: 'External Linking',
        issue: 'No authoritative external links',
        recommendation: 'Include links to authoritative sources to improve credibility',
        priority: 'Low'
      },
      {
        aspect: 'Image Optimization',
        issue: 'Images missing alt text',
        recommendation: 'Add descriptive alt text to all images, including the keyword where appropriate',
        priority: 'Medium'
      },
      {
        aspect: 'Content Length',
        issue: 'Content could be more comprehensive',
        recommendation: 'Consider expanding the content to cover the topic more thoroughly',
        priority: 'Low'
      }
    ];
    
    // Add 2-3 random feedback items
    const numRandomFeedback = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numRandomFeedback; i++) {
      const randomIndex = Math.floor(Math.random() * randomFeedback.length);
      feedback.push(randomFeedback[randomIndex]);
      randomFeedback.splice(randomIndex, 1);
    }
    
    // Create evaluation result
    const evaluation = {
      keyword,
      score: overallScore,
      scores: {
        title: titleScore,
        description: descriptionScore,
        content: contentScore,
        readability: readabilityScore,
        keywordDensity: keywordDensityScore
      },
      feedback,
      timestamp: new Date().toISOString()
    };
    
    // Save evaluation to cache
    const slug = slugify(keyword);
    const cachePath = path.join(process.cwd(), 'output', 'research', `${slug}-seo-evaluation.json`);
    
    try {
      await fs.writeFile(cachePath, JSON.stringify(evaluation, null, 2));
    } catch (error) {
      console.error(`[SEO-QUALITY] Error saving evaluation to cache: ${error.message}`);
    }
    
    return evaluation;
  }
}

module.exports = new SeoQualityService(); 