const wordpressService = require('../wordpress');
const contentStorage = require('../../utils/storage');

class ContentImageService {
  async generateAndUploadImages(structure) {
    const uploadedImages = [];

    for (const imageReq of structure.images) {
      try {
        // Generate a placeholder image URL instead of using DALL-E
        console.log('[CONTENT] Using placeholder image for:', imageReq.description);
        
        // Create a placeholder image URL based on the image description
        const placeholderSize = imageReq.type === 'featured' ? '1024x1024' : '800x600';
        const encodedText = encodeURIComponent(imageReq.description.substring(0, 50));
        const placeholderUrl = `https://via.placeholder.com/${placeholderSize}?text=${encodedText}`;
        
        // Upload to WordPress
        console.log('[CONTENT] Uploading placeholder image to WordPress');
        const uploadResult = await wordpressService.uploadImage(placeholderUrl);

        uploadedImages.push({
          ...imageReq,
          url: uploadResult.url,
          wordpress_id: uploadResult.id,
          wordpress_url: uploadResult.source_url
        });

        // Store success in logs
        await this.logImageOperation('success', imageReq, uploadResult);
      } catch (error) {
        console.error('[CONTENT] Error with image:', error);
        await this.logImageOperation('error', imageReq, error);
      }
    }

    return uploadedImages;
  }

  async logImageOperation(status, imagePlan, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      image_plan: imagePlan,
      result: status === 'success' ? {
        wordpress_id: result.id,
        wordpress_url: result.source_url
      } : {
        error: result.message,
        details: result.response?.data
      }
    };

    await contentStorage.storeContent(
      `seo/logs/image_operations/${new Date().toISOString().split('T')[0]}/${status}.json`,
      logEntry,
      {
        type: 'image_operation_log',
        timestamp: logEntry.timestamp
      }
    );
  }
}

module.exports = new ContentImageService();