const structureService = require('../services/content/structure.service');
const imageService = require('../services/content/image.service');
const generatorService = require('../services/content/generator.service');
const wordpressService = require('../services/wordpress');
const ContentRecoveryService = require('../services/content-recovery.service');
const PostCreationService = require('../services/post-creation.service');
const contentStorage = require('../utils/storage');

class ContentController {
  constructor() {
    this.recoveryService = new ContentRecoveryService();
    this.postCreationService = new PostCreationService();
  }

  async processContent(req, res) {
    try {
      console.log('[CONTENT] Starting content processing');
      const result = await this.createSeoPost(req, res);
      return result;
    } catch (error) {
      console.error('[CONTENT] Error processing content:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    }
  }

  async getWordPressPosts(req, res) {
    try {
      console.log('[CONTENT] Starting WordPress post retrieval');
      const {
        page = 1,
        perPage = 10,
        categories,
        tags,
        search,
        orderBy,
        order
      } = req.query;

      // Convert query parameters to appropriate types
      const params = {
        page: parseInt(page),
        perPage: parseInt(perPage),
        categories: categories ? categories.split(',').map(Number) : undefined,
        tags: tags ? tags.split(',').map(Number) : undefined,
        search,
        orderBy,
        order
      };

      // Get WordPress posts with pagination and filters
      const result = await wordpressService.getPosts(params);

      // Get categories and tags if requested
      let taxonomies = {};
      if (req.query.includeTaxonomies === 'true') {
        const [categories, tags] = await Promise.all([
          wordpressService.getCategories(),
          wordpressService.getTags()
        ]);
        taxonomies = { categories, tags };
      }

      return res.json({
        success: true,
        ...result,
        ...taxonomies
      });
    } catch (error) {
      console.error('[CONTENT] Error retrieving WordPress posts:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data,
        code: error.response?.status
      });
    }
  }

  async generateContent(req, res) {
    try {
      const { keyword } = req.body;
      if (!keyword) {
        return res.status(400).json({
          success: false,
          error: 'Keyword is required'
        });
      }

      // Generate structure first
      const structure = await structureService.generateStructure(keyword);

      // Generate and upload images
      const images = await imageService.generateAndUploadImages(structure);

      // Generate final content
      const content = await generatorService.generateContent(structure, images);

      return res.json({ success: true, content });
    } catch (error) {
      console.error('[CONTENT] Error generating content:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    }
  }

  async createSeoPost(req, res) {
    try {
      const result = await this.postCreationService.createPost();
      return res.json(result);
    } catch (error) {
      console.error('[CONTENT] Critical error in SEO post creation:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    }
  }

  async recoverPostCreation(req, res) {
    try {
      const { date, keyword } = req.params;
      const result = await this.recoveryService.recoverPost(date, keyword);
      return res.json(result);
    } catch (error) {
      console.error('[CONTENT] Critical error in post recovery:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.response?.data
      });
    }
  }

  async getContent(req, res) {
    try {
      const contentPath = req.params.path;
      
      if (!contentPath) {
        return res.status(400).json({
          success: false,
          error: 'Missing content path'
        });
      }
      
      console.log(`[CONTENT] Retrieving content from path: ${contentPath}`);
      
      const content = await contentStorage.getContent(contentPath);
      
      return res.json({
        success: true,
        content: content.data,
        metadata: content.metadata
      });
    } catch (error) {
      console.error(`[CONTENT] Error retrieving content: ${error.message}`);
      
      return res.status(error.message.includes('not found') ? 404 : 500).json({
        success: false,
        error: error.message
      });
    }
  }

  async storeContent(req, res) {
    try {
      const contentPath = req.params.path;
      const { content, metadata = {} } = req.body;
      
      if (!contentPath) {
        return res.status(400).json({
          success: false,
          error: 'Missing content path'
        });
      }
      
      if (!content) {
        return res.status(400).json({
          success: false,
          error: 'Missing content data'
        });
      }
      
      console.log(`[CONTENT] Storing content at path: ${contentPath}`);
      
      const result = await contentStorage.storeContent(contentPath, content, metadata);
      
      return res.json({
        success: true,
        path: result.path,
        url: result.url,
        metadata: result.metadata
      });
    } catch (error) {
      console.error(`[CONTENT] Error storing content: ${error.message}`);
      
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = new ContentController();