/**
 * Content Template Service
 * 
 * This service provides templates for different types of content.
 * It enables consistent formatting across different content types
 * while allowing customization based on the specific needs.
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class ContentTemplateService {
  constructor() {
    this.initialized = false;
    this.templatePath = path.join(config.paths.root, 'templates');
    this.templates = {
      'default': {
        name: 'Standard Blog Post',
        description: 'Standard blog post structure for general topics'
      },
      'how-to': {
        name: 'How-To Guide',
        description: 'Step-by-step instructions for completing tasks'
      },
      'listicle': {
        name: 'List Article',
        description: 'Numbered or bulleted list of items or facts'
      },
      'comparison': {
        name: 'Comparison Article',
        description: 'Comparing two or more products, services, or concepts'
      },
      'review': {
        name: 'Review Article',
        description: 'In-depth review of a product, service, or resource'
      },
      'case-study': {
        name: 'Case Study',
        description: 'Analysis of a specific example or implementation'
      },
      'pillar-content': {
        name: 'Pillar Content',
        description: 'Comprehensive content covering a broad topic'
      }
    };
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      // Create templates directory if it doesn't exist
      await fs.mkdir(this.templatePath, { recursive: true });
      
      // Check for existing templates
      const templates = await this.loadOrCreateTemplates();
      
      this.initialized = true;
      console.log('[TEMPLATE] Content template service initialized with', Object.keys(templates).length, 'templates');
      return true;
    } catch (error) {
      console.error('[TEMPLATE] Failed to initialize content template service:', error);
      throw error;
    }
  }

  /**
   * Load existing templates or create default ones
   * @returns {object} - The templates
   */
  async loadOrCreateTemplates() {
    try {
      // Check if templates directory exists
      const templateFiles = await fs.readdir(this.templatePath);
      
      // If templates exist, load them
      if (templateFiles.length > 0) {
        const loadedTemplates = {};
        
        for (const file of templateFiles) {
          if (file.endsWith('.json')) {
            const templateName = file.replace('.json', '');
            const templatePath = path.join(this.templatePath, file);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            loadedTemplates[templateName] = JSON.parse(templateContent);
          }
        }
        
        if (Object.keys(loadedTemplates).length > 0) {
          console.log('[TEMPLATE] Loaded', Object.keys(loadedTemplates).length, 'templates');
          return loadedTemplates;
        }
      }
      
      // If no templates exist, create default ones
      console.log('[TEMPLATE] No templates found, creating default templates');
      await this.createDefaultTemplates();
      return this.templates;
    } catch (error) {
      console.error('[TEMPLATE] Error loading templates:', error);
      
      // Create default templates if error occurs
      await this.createDefaultTemplates();
      return this.templates;
    }
  }

  /**
   * Create default templates
   */
  async createDefaultTemplates() {
    try {
      // Create default templates
      for (const [key, template] of Object.entries(this.templates)) {
        const templateData = {
          ...template,
          type: key,
          frontmatter: this.getDefaultFrontmatter(key),
          structure: this.getDefaultStructure(key),
          formatting: this.getDefaultFormatting(key),
          instructions: this.getDefaultInstructions(key)
        };
        
        const templatePath = path.join(this.templatePath, `${key}.json`);
        await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2), 'utf-8');
        console.log(`[TEMPLATE] Created default template: ${key}`);
      }
    } catch (error) {
      console.error('[TEMPLATE] Error creating default templates:', error);
      throw error;
    }
  }

  /**
   * Get list of available templates
   * @returns {Array} - Array of template objects
   */
  async getTemplateList() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const templateFiles = await fs.readdir(this.templatePath);
      
      const templates = [];
      for (const file of templateFiles) {
        if (file.endsWith('.json')) {
          const templatePath = path.join(this.templatePath, file);
          const templateContent = await fs.readFile(templatePath, 'utf-8');
          const template = JSON.parse(templateContent);
          
          templates.push({
            type: template.type,
            name: template.name,
            description: template.description
          });
        }
      }
      
      return templates;
    } catch (error) {
      console.error('[TEMPLATE] Error getting template list:', error);
      throw error;
    }
  }

  /**
   * Get a template by type
   * @param {string} type - The template type
   * @returns {object} - The template
   */
  async getTemplate(type = 'default') {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const templatePath = path.join(this.templatePath, `${type}.json`);
      
      try {
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        return JSON.parse(templateContent);
      } catch (error) {
        console.warn(`[TEMPLATE] Template "${type}" not found, using default template`);
        const defaultTemplatePath = path.join(this.templatePath, 'default.json');
        const defaultTemplateContent = await fs.readFile(defaultTemplatePath, 'utf-8');
        return JSON.parse(defaultTemplateContent);
      }
    } catch (error) {
      console.error(`[TEMPLATE] Error getting template "${type}":`, error);
      throw error;
    }
  }

  /**
   * Create or update a template
   * @param {string} type - The template type
   * @param {object} templateData - The template data
   * @returns {boolean} - Success status
   */
  async saveTemplate(type, templateData) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Validate template data
      if (!templateData.name || !templateData.structure) {
        throw new Error('Invalid template data: name and structure are required');
      }
      
      // Ensure type is set
      templateData.type = type;
      
      // Save the template
      const templatePath = path.join(this.templatePath, `${type}.json`);
      await fs.writeFile(templatePath, JSON.stringify(templateData, null, 2), 'utf-8');
      
      console.log(`[TEMPLATE] Template "${type}" saved successfully`);
      return true;
    } catch (error) {
      console.error(`[TEMPLATE] Error saving template "${type}":`, error);
      throw error;
    }
  }

  /**
   * Delete a template
   * @param {string} type - The template type
   * @returns {boolean} - Success status
   */
  async deleteTemplate(type) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Don't allow deleting the default template
      if (type === 'default') {
        throw new Error('Cannot delete the default template');
      }
      
      // Delete the template
      const templatePath = path.join(this.templatePath, `${type}.json`);
      await fs.unlink(templatePath);
      
      console.log(`[TEMPLATE] Template "${type}" deleted successfully`);
      return true;
    } catch (error) {
      console.error(`[TEMPLATE] Error deleting template "${type}":`, error);
      throw error;
    }
  }

  /**
   * Get default frontmatter structure for a template type
   * @param {string} type - The template type
   * @returns {object} - The default frontmatter
   */
  getDefaultFrontmatter(type) {
    const common = {
      required: ['title', 'description', 'date', 'lastmod', 'slug'],
      optional: ['categories', 'tags', 'image', 'images', 'keywords', 'draft']
    };
    
    switch (type) {
      case 'how-to':
        return {
          ...common,
          optional: [...common.optional, 'difficulty', 'time_needed', 'tools', 'prerequisites']
        };
      case 'listicle':
        return {
          ...common,
          optional: [...common.optional, 'item_count', 'list_type']
        };
      case 'comparison':
        return {
          ...common,
          optional: [...common.optional, 'compared_items', 'winner', 'criteria']
        };
      case 'review':
        return {
          ...common,
          optional: [...common.optional, 'product_name', 'rating', 'pros', 'cons', 'price']
        };
      case 'case-study':
        return {
          ...common,
          optional: [...common.optional, 'client', 'industry', 'year', 'outcomes']
        };
      case 'pillar-content':
        return {
          ...common,
          optional: [...common.optional, 'toc', 'related_articles', 'topic_cluster']
        };
      default:
        return common;
    }
  }

  /**
   * Get default content structure for a template type
   * @param {string} type - The template type
   * @returns {object} - The default structure
   */
  getDefaultStructure(type) {
    switch (type) {
      case 'how-to':
        return {
          introduction: 'Introduction to the problem and why the solution is needed',
          prerequisites: 'List of things needed before starting',
          steps: [
            { 
              title: 'Step 1',
              content: 'Detailed instructions for step 1'
            },
            { 
              title: 'Step 2',
              content: 'Detailed instructions for step 2'
            },
            { 
              title: 'Step 3',
              content: 'Detailed instructions for step 3'
            }
          ],
          tips: 'Additional tips for success',
          troubleshooting: 'Common issues and how to solve them',
          conclusion: 'Summary and next steps'
        };
      case 'listicle':
        return {
          introduction: 'Introduction to the list and why it matters',
          items: [
            {
              title: 'Item 1',
              content: 'Detailed description of item 1'
            },
            {
              title: 'Item 2',
              content: 'Detailed description of item 2'
            },
            {
              title: 'Item 3',
              content: 'Detailed description of item 3'
            }
          ],
          conclusion: 'Summary and wrap-up'
        };
      case 'comparison':
        return {
          introduction: 'Introduction to what is being compared and why',
          criteria: 'Explanation of comparison criteria',
          items: [
            {
              name: 'Item A',
              pros: ['Pro 1', 'Pro 2'],
              cons: ['Con 1', 'Con 2'],
              details: 'Detailed analysis of Item A'
            },
            {
              name: 'Item B',
              pros: ['Pro 1', 'Pro 2'],
              cons: ['Con 1', 'Con 2'],
              details: 'Detailed analysis of Item B'
            }
          ],
          comparisonTable: 'Feature-by-feature comparison',
          verdict: 'Final verdict and recommendations',
          conclusion: 'Summary and contextual advice'
        };
      case 'review':
        return {
          introduction: 'Introduction to what is being reviewed',
          overview: 'Brief overview and key specifications',
          pros: ['Pro 1', 'Pro 2', 'Pro 3'],
          cons: ['Con 1', 'Con 2', 'Con 3'],
          features: 'Detailed analysis of features',
          performance: 'Performance evaluation',
          userExperience: 'User experience analysis',
          comparisons: 'How it compares to alternatives',
          pricing: 'Pricing details and value assessment',
          verdict: 'Final verdict and rating',
          conclusion: 'Summary and recommendations'
        };
      case 'case-study':
        return {
          introduction: 'Introduction to the case study',
          background: 'Background information and context',
          challenge: 'The challenge or problem faced',
          solution: 'The solution that was implemented',
          implementation: 'How the solution was implemented',
          results: 'Results and outcomes',
          lessons: 'Lessons learned',
          conclusion: 'Summary and key takeaways'
        };
      case 'pillar-content':
        return {
          introduction: 'Comprehensive introduction to the topic',
          tableOfContents: 'Detailed table of contents',
          sections: [
            {
              title: 'Section 1',
              content: 'Detailed content for section 1',
              subsections: [
                {
                  title: 'Subsection 1.1',
                  content: 'Detailed content for subsection 1.1'
                },
                {
                  title: 'Subsection 1.2',
                  content: 'Detailed content for subsection 1.2'
                }
              ]
            },
            {
              title: 'Section 2',
              content: 'Detailed content for section 2',
              subsections: [
                {
                  title: 'Subsection 2.1',
                  content: 'Detailed content for subsection 2.1'
                },
                {
                  title: 'Subsection 2.2',
                  content: 'Detailed content for subsection 2.2'
                }
              ]
            }
          ],
          faqs: [
            {
              question: 'Frequently Asked Question 1',
              answer: 'Detailed answer to question 1'
            },
            {
              question: 'Frequently Asked Question 2',
              answer: 'Detailed answer to question 2'
            }
          ],
          relatedTopics: 'List of related topics and resources',
          conclusion: 'Comprehensive conclusion and next steps'
        };
      default:
        return {
          introduction: 'Introduction to the topic',
          sections: [
            {
              title: 'Section 1',
              content: 'Detailed content for section 1'
            },
            {
              title: 'Section 2',
              content: 'Detailed content for section 2'
            },
            {
              title: 'Section 3',
              content: 'Detailed content for section 3'
            }
          ],
          faqs: [
            {
              question: 'Frequently Asked Question 1',
              answer: 'Detailed answer to question 1'
            },
            {
              question: 'Frequently Asked Question 2',
              answer: 'Detailed answer to question 2'
            }
          ],
          conclusion: 'Summary and key takeaways'
        };
    }
  }

  /**
   * Get default formatting for a template type
   * @param {string} type - The template type
   * @returns {object} - The default formatting
   */
  getDefaultFormatting(type) {
    const common = {
      headingStyle: '#', // Use # for h1, ## for h2, etc.
      bold: '**',        // Use ** for bold
      italic: '_',       // Use _ for italic
      listStyle: '-',    // Use - for unordered lists
      codeBlock: '```',  // Use ``` for code blocks
      blockquote: '>',   // Use > for blockquotes
      horizontalRule: '---', // Use --- for horizontal rules
      imageStyle: '![{alt}]({url})', // Image format
      linkStyle: '[{text}]({url})' // Link format
    };
    
    switch (type) {
      // Customize formatting for specific template types if needed
      case 'how-to':
        return {
          ...common,
          stepStyle: '### Step {number}: {title}' // Format for steps
        };
      case 'listicle':
        return {
          ...common,
          itemStyle: '## {number}. {title}' // Format for list items
        };
      default:
        return common;
    }
  }

  /**
   * Get default instructions for a template type
   * @param {string} type - The template type
   * @returns {string} - The default instructions
   */
  getDefaultInstructions(type) {
    switch (type) {
      case 'how-to':
        return `This is a How-To guide template. Focus on clear, step-by-step instructions.
Include prerequisite information, tools needed, and estimated time to complete.
Use numbered steps with descriptive headings.
Include images or diagrams to illustrate steps when possible.
Add troubleshooting tips for common issues.`;
      
      case 'listicle':
        return `This is a List Article template. Focus on creating a compelling list.
Use consistent formatting for each list item.
Include a strong introduction explaining the value of the list.
Make each item stand out with unique information.
Consider using images for each list item.`;
      
      case 'comparison':
        return `This is a Comparison Article template. Focus on fair comparison between items.
Clearly define the comparison criteria upfront.
Use tables for feature-by-feature comparison.
Highlight pros and cons for each item.
Include a clear verdict or recommendation.
Consider different use cases for different audiences.`;
      
      case 'review':
        return `This is a Review Article template. Focus on thorough, balanced assessment.
Include specifications and key features.
List clear pros and cons.
Use a rating system (e.g., 1-5 stars or 1-10 scale).
Include personal experience and testing methodology.
Compare to alternatives when relevant.
Include pricing information and where to purchase.`;
      
      case 'case-study':
        return `This is a Case Study template. Focus on a specific example or implementation.
Provide context and background information.
Clearly describe the challenge or problem.
Detail the solution and implementation process.
Include measurable results and outcomes.
Share lessons learned and best practices.
Use quotes from stakeholders if available.`;
      
      case 'pillar-content':
        return `This is a Pillar Content template. Focus on comprehensive coverage of a topic.
Create detailed table of contents for navigation.
Use clear section hierarchy with descriptive headings.
Include a mix of basic and advanced information.
Link to related resources and content.
Include FAQ section for common questions.
Make content skimmable with bullet points and highlighted key points.
Consider adding a downloadable resource (PDF version, checklist, etc.).`;
      
      default:
        return `This is a Standard Blog Post template. Focus on creating engaging, informative content.
Use a clear introduction that hooks the reader.
Organize content with descriptive headings.
Include relevant images, examples, or case studies.
End with a conclusion that summarizes key points.
Add calls to action when appropriate.`;
    }
  }
}

module.exports = new ContentTemplateService(); 