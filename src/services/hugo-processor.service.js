const contentStorage = require('../utils/storage');
const workflowService = require('./hugo/workflow.service');
const contentGenerator = require('./hugo/content-generator.service');
const { createSlug } = require('../utils/slug');
const keywordResearchService = require('./keyword-research.service');

class HugoProcessorService {
  async processWorkflow(keyword) {
    try {
      if (!keyword) {
        console.log('[HUGO] No specific keyword provided, processing batch workflow');
        return await workflowService.processWorkflow();
      }

      console.log(`[HUGO] Processing workflow for specific keyword: ${keyword}`);
      
      // Step 1: Fetch data from all KWRDS API endpoints
      console.log(`[HUGO] Fetching all KWRDS data for keyword: ${keyword}`);
      const kwrdsData = await keywordResearchService.fetchAllKwrdsData(keyword);
      
      console.log(`[HUGO] Successfully fetched KWRDS data for keyword: ${keyword}`);
      
      // Step 2: Process the remaining workflow
      return await workflowService.processRow({ 'KWs': keyword });
    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      return {
        success: false,
        keyword,
        error: error.message,
        message: `Error processing workflow: ${error.message}`
      };
    }
  }

  /**
   * Generate markdown content for a single keyword
   * This method handles the complete process from data collection to markdown generation
   * @param {string} keyword - The keyword to generate markdown for
   * @returns {object} - The result object containing the markdown content or error details
   */
  async generateMarkdown(keyword) {
    try {
      console.log(`[HUGO] Generating markdown for keyword: ${keyword}`);

      // Step 1: Process the workflow to collect data
      const processResult = await workflowService.processRow({ 'KWs': keyword });
      
      if (!processResult.success) {
        console.error(`[HUGO] Failed to process keyword: ${processResult.error}`);
        return {
          success: false,
          keyword,
          error: processResult.error,
          message: `Failed to generate markdown: ${processResult.error}`
        };
      }

      // Step 2: Generate content structure
      const slug = createSlug(keyword);
      const folderPath = `${slug}`;
      
      // Retrieve collected data
      const collectedDataResult = await contentStorage.getContent(`${folderPath}/collected-data.json`);
      
      if (!collectedDataResult || !collectedDataResult.data) {
        throw new Error(`Could not retrieve collected data for keyword: ${keyword}`);
      }
      
      const collectedData = collectedDataResult.data;
      
      // Step 3: Generate content structure based on the collected data
      const contentStructure = await contentGenerator.generateStructure(
        keyword, 
        collectedData.keywordData, 
        collectedData.paaData, 
        collectedData.serpData
      );
      
      // Step 4: Generate markdown content from the structure
      const markdownContent = await contentGenerator.generateContent(contentStructure);
      
      // Step 5: Save the markdown content
      const timestamp = new Date().toISOString();
      await contentStorage.storeContent(
        `${folderPath}/markdown-content.md`,
        markdownContent.content,
        { type: 'markdown_content', keyword, timestamp }
      );
      
      // Return the successful result with the generated markdown
      return {
        success: true,
        keyword,
        markdown: markdownContent.content,
        message: `Successfully generated markdown for keyword: ${keyword}`,
        metadata: {
          title: markdownContent.title,
          description: markdownContent.meta?.description || '',
          contentLength: markdownContent.content.length,
          timestamp
        }
      };
    } catch (error) {
      console.error(`[HUGO] Error generating markdown for keyword "${keyword}":`, error);
      return {
        success: false,
        keyword,
        error: error.message,
        message: `Failed to generate markdown: ${error.message}`
      };
    }
  }
}

module.exports = new HugoProcessorService();