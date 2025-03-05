const structureService = require('../services/content/structure.service');
const imageService = require('../services/content/image.service');
const generatorService = require('../services/content/generator.service');
const wordpressService = require('../services/wordpress');
const ContentRecoveryService = require('../services/content-recovery.service');
const PostCreationService = require('../services/post-creation.service');

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
      const { page = 1, perPage = 10 } = req.query;
      
      // Use mock data instead of calling sheets service
      const sheetsData = this.getMockWordPressPosts(page, perPage);
      
      if (!sheetsData || !sheetsData.length) {
        return res.json({
          success: true,
          message: 'No WordPress posts found to process',
          posts: []
        });
      }

      // Get WordPress post content
      const posts = await Promise.all(
        sheetsData.map(async (row) => {
          try {
            // Implementation details here
            return {
              keyword: row.keyword,
              wordpressId: row.wordpressId,
              status: 'pending'
            };
          } catch (error) {
            console.error(`[CONTENT] Error processing post ${row.wordpressId}:`, error);
            return {
              keyword: row.keyword,
              wordpressId: row.wordpressId,
              error: error.message,
              status: 'error'
            };
          }
        })
      );
      
      return res.json({
        success: true,
        posts: sheetsData,
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: sheetsData.length
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

  // Mock method to replace sheets service
  getMockWordPressPosts(page, perPage) {
    console.log('[CONTENT] Providing mock WordPress posts data (sheets service disabled)');
    return [
      {
        'keyword': 'antique electric hurricane lamps',
        'wordpressId': '123456',
        'rowNumber': 2
      }
    ];
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
}

module.exports = new ContentController();