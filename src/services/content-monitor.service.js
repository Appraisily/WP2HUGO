/**
 * Content Monitor Service
 * 
 * Analyzes content freshness, identifies outdated content,
 * and provides update recommendations based on content age,
 * performance metrics, and relevance signals.
 */

const fs = require('fs').promises;
const path = require('path');
const openai = require('../utils/openai');
const { getMarkdownFiles, extractFrontmatter } = require('../utils/files');

class ContentMonitorService {
  constructor() {
    this.initialized = false;
    this.contentDirectory = './output/markdown';
    this.apiClient = null;
    this.markdownFiles = [];
    this.contentMetadata = [];
    this.updateThresholds = {
      critical: 365, // 1 year
      recommended: 180, // 6 months
      suggested: 90, // 3 months
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.apiClient = openai;
      this.markdownFiles = await getMarkdownFiles(this.contentDirectory);
      this.contentMetadata = await this.loadContentMetadata();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ContentMonitorService:', error);
      throw error;
    }
  }

  /**
   * Load metadata from all markdown files
   * @returns {Array} - Array of content metadata objects
   */
  async loadContentMetadata() {
    try {
      const metadata = [];

      for (const file of this.markdownFiles) {
        try {
          const filePath = path.join(this.contentDirectory, file);
          const content = await fs.readFile(filePath, 'utf8');
          const frontmatter = extractFrontmatter(content);
          
          if (!frontmatter) {
            console.warn(`No frontmatter found in ${file}`);
            continue;
          }

          // Extract content body (without frontmatter)
          const contentBody = content.replace(/---[\s\S]*?---/, '').trim();
          
          // Calculate content age
          const lastUpdated = frontmatter.lastUpdated || frontmatter.date;
          let lastUpdatedDate = new Date();
          
          if (lastUpdated) {
            lastUpdatedDate = new Date(lastUpdated);
          }
          
          const ageInDays = Math.floor((Date.now() - lastUpdatedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          metadata.push({
            fileName: file,
            filePath: filePath,
            title: frontmatter.title || 'Untitled',
            keyword: frontmatter.keyword || '',
            lastUpdated: lastUpdatedDate.toISOString(),
            ageInDays: ageInDays,
            contentLength: contentBody.length,
            priority: frontmatter.priority || 'medium',
            performance: frontmatter.performance || {},
            contentSummary: this.generateContentSummary(contentBody)
          });
        } catch (error) {
          console.error(`Error processing file ${file}:`, error.message);
        }
      }

      return metadata;
    } catch (error) {
      console.error('Error loading content metadata:', error);
      throw error;
    }
  }

  /**
   * Generate a brief summary of content
   * @param {string} content - Content to summarize
   * @returns {string} - Brief summary
   */
  generateContentSummary(content) {
    // Extract first 250 characters as a simple summary
    const summary = content.substring(0, 250).replace(/\s+/g, ' ').trim();
    return summary + (content.length > 250 ? '...' : '');
  }

  /**
   * Generate content update suggestions
   * @param {object} contentItem - Content metadata
   * @returns {Promise<Array>} - Array of update suggestions
   */
  async generateUpdateSuggestions(contentItem) {
    try {
      if (!this.apiClient) {
        return ['API client not initialized for generating suggestions'];
      }

      const prompt = `
You are a content freshness analyzer helping update outdated content. 
Please provide 3-5 specific suggestions for updating this content that is ${contentItem.ageInDays} days old.

Content title: ${contentItem.title}
Main keyword: ${contentItem.keyword}
Content summary: ${contentItem.contentSummary}

Be specific in your suggestions about what to update, focusing on:
1. New information or developments that should be included
2. Statistics or data that should be refreshed
3. Sections that might need reorganization or expansion
4. New keywords that could be targeted
5. Any outdated information that should be removed

Format your response as a simple bulleted list with no preamble.
`;

      const response = await this.apiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      // Extract and clean suggestions
      const suggestions = response.choices[0].message.content
        .split('\n')
        .filter(line => line.trim().startsWith('- ') || line.trim().startsWith('* '))
        .map(line => line.trim().replace(/^[-*]\s+/, ''));

      return suggestions;
    } catch (error) {
      console.error('Error generating update suggestions:', error);
      return ['Error generating suggestions: API error'];
    }
  }

  /**
   * Generate a comprehensive update report
   * @param {boolean} includeAll - Include all content in report
   * @returns {Promise<object>} - Update report
   */
  async generateUpdateReport(includeAll = false) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const now = new Date();
      const criticalUpdates = [];
      const recommendedUpdates = [];
      const suggestedUpdates = [];
      const upToDate = [];

      // Calculate age statistics
      const ages = this.contentMetadata.map(item => item.ageInDays);
      const averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
      const oldest = Math.max(...ages);
      const newest = Math.min(...ages);

      // Process each content item
      for (const item of this.contentMetadata) {
        if (item.ageInDays >= this.updateThresholds.critical) {
          const suggestions = await this.generateUpdateSuggestions(item);
          criticalUpdates.push({ ...item, suggestions });
        } else if (item.ageInDays >= this.updateThresholds.recommended) {
          const suggestions = await this.generateUpdateSuggestions(item);
          recommendedUpdates.push({ ...item, suggestions });
        } else if (item.ageInDays >= this.updateThresholds.suggested) {
          const suggestions = await this.generateUpdateSuggestions(item);
          suggestedUpdates.push({ ...item, suggestions });
        } else if (includeAll) {
          upToDate.push({ ...item, suggestions: [] });
        }

        // Add a small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create the report
      const report = {
        generatedAt: now.toISOString(),
        contentCount: this.contentMetadata.length,
        ageStatistics: {
          averageAge,
          oldest,
          newest
        },
        updateSummary: {
          critical: criticalUpdates.length,
          recommended: recommendedUpdates.length,
          suggested: suggestedUpdates.length,
          upToDate: this.contentMetadata.length - criticalUpdates.length - recommendedUpdates.length - suggestedUpdates.length
        },
        criticalUpdates,
        recommendedUpdates,
        suggestedUpdates
      };

      // Include up-to-date content if requested
      if (includeAll) {
        report.upToDateContent = upToDate;
      }

      return report;
    } catch (error) {
      console.error('Error generating update report:', error);
      throw error;
    }
  }

  /**
   * Get a list of content items that need updating, sorted by priority
   * @returns {Promise<Array>} - Array of content items needing updates
   */
  async getContentNeedingUpdates() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const needsUpdate = this.contentMetadata
        .filter(item => item.ageInDays >= this.updateThresholds.suggested)
        .sort((a, b) => {
          // Sort by priority first
          const priorityMap = { high: 3, medium: 2, low: 1 };
          const priorityDiff = (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
          
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by age
          return b.ageInDays - a.ageInDays;
        });

      return needsUpdate;
    } catch (error) {
      console.error('Error getting content needing updates:', error);
      throw error;
    }
  }

  /**
   * Get content freshness statistics
   * @returns {object} - Content freshness statistics
   */
  getFreshnessStatistics() {
    if (!this.initialized || this.contentMetadata.length === 0) {
      return {
        averageAge: 0,
        percentNeedingUpdates: 0,
        totalContent: 0
      };
    }

    const ages = this.contentMetadata.map(item => item.ageInDays);
    const averageAge = Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length);
    
    const needingUpdates = this.contentMetadata.filter(
      item => item.ageInDays >= this.updateThresholds.suggested
    ).length;
    
    const percentNeedingUpdates = Math.round((needingUpdates / this.contentMetadata.length) * 100);

    return {
      averageAge,
      percentNeedingUpdates,
      totalContent: this.contentMetadata.length
    };
  }
}

module.exports = new ContentMonitorService(); 