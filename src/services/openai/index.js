const ImageGenerationService = require('./image.service');
const ContentService = require('./content.service');
const EnhancementService = require('./enhancement.service');

// Create service instances
const imageService = new ImageGenerationService();
const contentService = new ContentService();
const enhancementService = new EnhancementService();

// Initialize all services
async function initializeServices() {
  try {
    await Promise.all([
      imageService.initialize(),
      contentService.initialize(),
      enhancementService.initialize()
    ]);
    console.log('[OPENAI] All services initialized successfully');
    return true;
  } catch (error) {
    console.error('[OPENAI] Failed to initialize services:', error);
    throw error;
  }
}

module.exports = {
  imageService,
  contentService,
  enhancementService,
  initializeServices
};