/**
 * Content Workflow Service
 * 
 * This service coordinates the entire process of going from a keyword to a finished
 * Hugo-compatible markdown article by orchestrating various specialized services.
 */

const { keywordResearchService, serpService, paaService } = require('./kwrds');
const perplexityService = require('./perplexity.service');
const googleAiService = require('./google-ai.service');
const imageGenerationService = require('./image-generation.service');
const openaiService = require('./openai/enhancement.service');
const markdownGeneratorService = require('./markdown-generator.service');
const contentStorage = require('../utils/storage');
const slugify = require('../utils/slugify');
const path = require('path');

class WorkflowService {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the workflow service
   */
  async initialize() {
    try {
      console.log('[WORKFLOW] Initializing workflow service...');
      
      // Initialize all required services
      await contentStorage.initialize();
      
      this.initialized = true;
      console.log('[WORKFLOW] Workflow service initialized successfully');
      return true;
    } catch (error) {
      console.error('[WORKFLOW] Error initializing workflow service:', error);
      throw error;
    }
  }
  
  /**
   * Process a keyword to generate a complete Hugo-compatible markdown article
   * @param {string} keyword - The keyword to process
   * @returns {object} - The workflow result containing all generated data
   */
  async processKeyword(keyword) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[WORKFLOW] Starting workflow for keyword: "${keyword}"`);
    
    try {
      // Create workflow object to track progress
      const workflowId = Date.now().toString();
      const workflow = {
        id: workflowId,
        keyword,
        status: 'in_progress',
        startTime: new Date().toISOString(),
        steps: [],
        result: null
      };
      
      // Save initial workflow state
      await this.saveWorkflowState(workflow);
      
      // Step 1: Keyword Research (search volume, intent, etc.)
      await this.updateWorkflowStep(workflow, 'keyword_research', 'in_progress');
      const kwResearchData = await keywordResearchService.getKeywordData(keyword);
      await this.updateWorkflowStep(workflow, 'keyword_research', 'completed', { data: kwResearchData });
      
      // Step 2: SERP Analysis
      await this.updateWorkflowStep(workflow, 'serp_analysis', 'in_progress');
      const serpData = await serpService.getSerpData(keyword);
      await this.updateWorkflowStep(workflow, 'serp_analysis', 'completed', { data: serpData });
      
      // Step 3: People Also Ask Data
      await this.updateWorkflowStep(workflow, 'paa_research', 'in_progress');
      const paaData = await paaService.getPaaData(keyword);
      await this.updateWorkflowStep(workflow, 'paa_research', 'completed', { data: paaData });
      
      // Step 4: Perplexity Research
      await this.updateWorkflowStep(workflow, 'perplexity_research', 'in_progress');
      const perplexityData = await perplexityService.query(keyword);
      await this.updateWorkflowStep(workflow, 'perplexity_research', 'completed', { data: perplexityData });
      
      // Step 5: Content Structure Generation
      await this.updateWorkflowStep(workflow, 'content_structure', 'in_progress');
      const structureData = await googleAiService.generateStructure(
        keyword, 
        kwResearchData, 
        perplexityData, 
        { serpData, paaData }
      );
      await this.updateWorkflowStep(workflow, 'content_structure', 'completed', { data: structureData });
      
      // Step 6: Image Concept Generation
      await this.updateWorkflowStep(workflow, 'image_concepts', 'in_progress');
      const imageConcepts = await this.generateImageConcepts(keyword, structureData);
      await this.updateWorkflowStep(workflow, 'image_concepts', 'completed', { data: imageConcepts });
      
      // Step 7: Image Generation
      await this.updateWorkflowStep(workflow, 'image_generation', 'in_progress');
      const imageData = await imageGenerationService.generateImage(keyword);
      await this.updateWorkflowStep(workflow, 'image_generation', 'completed', { data: imageData });
      
      // Step 8: Section Content Generation
      await this.updateWorkflowStep(workflow, 'content_generation', 'in_progress');
      const contentData = await this.generateSectionContent(keyword, structureData);
      await this.updateWorkflowStep(workflow, 'content_generation', 'completed', { data: contentData });
      
      // Step 9: Markdown Generation
      await this.updateWorkflowStep(workflow, 'markdown_generation', 'in_progress');
      const markdownData = await this.generateFinalMarkdown(keyword, {
        ...contentData,
        image: imageData,
        structure: structureData,
        kwResearchData,
        serpData,
        paaData,
        perplexityData,
        date: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });
      await this.updateWorkflowStep(workflow, 'markdown_generation', 'completed', { data: markdownData });
      
      // Update workflow status to completed
      workflow.status = 'completed';
      workflow.endTime = new Date().toISOString();
      workflow.result = {
        keyword,
        markdownPath: markdownData.markdownPath,
        title: contentData.title || structureData.title,
        imageUrl: imageData.imageUrl
      };
      
      await this.saveWorkflowState(workflow);
      
      console.log(`[WORKFLOW] Completed workflow for keyword: "${keyword}"`);
      return workflow;
    } catch (error) {
      console.error(`[WORKFLOW] Error processing keyword "${keyword}":`, error);
      
      // Update workflow to failed status
      const failedWorkflow = {
        ...await this.getWorkflow(keyword),
        status: 'failed',
        error: {
          message: error.message,
          stack: error.stack
        },
        endTime: new Date().toISOString()
      };
      
      await this.saveWorkflowState(failedWorkflow);
      
      throw error;
    }
  }
  
  /**
   * Generate image concepts using Google AI
   * @param {string} keyword - The keyword
   * @param {object} structure - The content structure
   * @returns {object} - The image concepts
   */
  async generateImageConcepts(keyword, structure) {
    console.log(`[WORKFLOW] Generating image concepts for: "${keyword}"`);
    
    // This is where we'd use Google AI to generate image concepts
    // For now, we'll create a simple placeholder
    return {
      mainConcept: `Professional image representing ${keyword}`,
      variations: [
        `Close-up view of ${keyword}`,
        `${keyword} in context`,
        `${keyword} with related elements`,
        `Abstract representation of ${keyword}`,
        `${keyword} in use or action`
      ],
      style: "Modern, professional, high-quality photographic style"
    };
  }
  
  /**
   * Generate content for each section using OpenAI
   * @param {string} keyword - The keyword
   * @param {object} structure - The content structure
   * @returns {object} - The generated content
   */
  async generateSectionContent(keyword, structure) {
    console.log(`[WORKFLOW] Generating section content for: "${keyword}"`);
    
    // In a real implementation, we'd use OpenAI to generate content for each section
    // For now, we'll create a placeholder
    const headings = structure.headings || [];
    
    // Create content sections
    const sections = headings.map(heading => {
      return {
        heading: heading.text,
        content: heading.content || `This is placeholder content for the section "${heading.text}". In the real implementation, this would be high-quality content generated by OpenAI based on the keyword research and content structure.`,
        level: heading.level
      };
    });
    
    return {
      title: structure.title,
      description: structure.description,
      sections,
      tags: structure.tags || [],
      categories: structure.categories || [],
      seoTitle: structure.seoTitle,
      seoDescription: structure.description
    };
  }
  
  /**
   * Generate final markdown using Google AI
   * @param {string} keyword - The keyword
   * @param {object} data - All collected data
   * @returns {object} - The markdown generation result
   */
  async generateFinalMarkdown(keyword, data) {
    console.log(`[WORKFLOW] Generating final markdown for: "${keyword}"`);
    
    // Use the markdown generator service to create the final markdown
    const markdownPath = await markdownGeneratorService.generateAndSave(keyword, data);
    
    return {
      keyword,
      markdownPath,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Update a workflow step's status
   * @param {object} workflow - The workflow object
   * @param {string} stepName - The name of the step
   * @param {string} status - The new status
   * @param {object} result - Optional result data
   */
  async updateWorkflowStep(workflow, stepName, status, result = null) {
    console.log(`[WORKFLOW] Updating step "${stepName}" to "${status}"`);
    
    // Find existing step or create a new one
    const stepIndex = workflow.steps.findIndex(step => step.name === stepName);
    
    if (stepIndex >= 0) {
      // Update existing step
      workflow.steps[stepIndex] = {
        ...workflow.steps[stepIndex],
        status,
        endTime: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        result: result || workflow.steps[stepIndex].result
      };
    } else {
      // Add new step
      workflow.steps.push({
        name: stepName,
        status,
        startTime: new Date().toISOString(),
        endTime: status === 'completed' || status === 'failed' ? new Date().toISOString() : null,
        result
      });
    }
    
    // Save updated workflow
    await this.saveWorkflowState(workflow);
  }
  
  /**
   * Save workflow state to storage
   * @param {object} workflow - The workflow object
   */
  async saveWorkflowState(workflow) {
    try {
      const workflowPath = `workflows/${slugify(workflow.keyword)}-${workflow.id}.json`;
      await contentStorage.storeContent(workflowPath, workflow);
    } catch (error) {
      console.error('[WORKFLOW] Error saving workflow state:', error);
    }
  }
  
  /**
   * Get workflow for a keyword
   * @param {string} keyword - The keyword
   * @returns {object|null} - The workflow object or null if not found
   */
  async getWorkflow(keyword) {
    try {
      // List all workflows
      const workflowsDir = 'workflows/';
      const workflowFiles = await contentStorage.listContent(workflowsDir);
      
      // Find workflows for this keyword
      const keywordSlug = slugify(keyword);
      const matchingFiles = workflowFiles.filter(file => 
        path.basename(file).startsWith(keywordSlug)
      );
      
      if (matchingFiles.length === 0) {
        return null;
      }
      
      // Sort by timestamp (newest first)
      matchingFiles.sort().reverse();
      
      // Load the most recent workflow
      const latestWorkflow = await contentStorage.getContent(matchingFiles[0]);
      return latestWorkflow;
    } catch (error) {
      console.error(`[WORKFLOW] Error getting workflow for "${keyword}":`, error);
      return null;
    }
  }
}

module.exports = new WorkflowService();