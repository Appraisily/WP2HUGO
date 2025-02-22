const sheetsService = require('./sheets.service');
const wordpressService = require('./wordpress');
const hugoService = require('./hugo.service');
const contentStorage = require('../utils/storage');

class HugoProcessorService {
  constructor() {
    this.isProcessing = false;
  }

  async processWorkflow() {
    if (this.isProcessing) {
      console.log('[HUGO] Workflow already in progress');
      return {
        success: false,
        message: 'Workflow already in progress'
      };
    }

    try {
      this.isProcessing = true;
      console.log('[HUGO] Starting workflow processing');

      // Get all rows from the Hugo sheet
      const rows = await sheetsService.getHugoRows();
      
      if (!rows || rows.length === 0) {
        console.log('[HUGO] No rows found in spreadsheet');
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      console.log(`[HUGO] Found ${rows.length} rows to process`);
      
      const results = [];
      for (const row of rows) {
        try {
          // Extract post ID and keyword
          const postId = row['Post ID'];
          const keyword = row['Keyword'];
          
          if (!postId) {
            console.warn('[HUGO] Missing Post ID in row:', row);
            continue;
          }

          console.log(`[HUGO] Processing Post ID: ${postId}`);
          
          // Fetch post content from WordPress
          const post = await wordpressService.getPost(postId);

          // Create Hugo post
          const hugoResult = await hugoService.createPost({
            post: {
              id: postId,
              title: post.title,
              content: post.content,
              slug: this.createSlug(keyword),
              date: row['Date'],
              status: post.status
            }
          });

          // Store the processed content
          await contentStorage.storeContent(
            `seo/keywords/${keyword}/hugo_conversion.json`,
            {
              original: post,
              hugo: hugoResult,
              metadata: {
                keyword,
                processedDate: row['Date'],
                status: 'success'
              }
            }
          );

          results.push({
            postId,
            keyword,
            title: post.title,
            hugoSlug: hugoResult.slug,
            success: true
          });

        } catch (error) {
          console.error('[HUGO] Error processing row:', error);
          results.push({
            postId: row['Post ID'],
            keyword: row['Keyword'],
            success: false,
            error: error.message
          });
        }
      }

      // Summarize results
      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      console.log('[HUGO] Workflow processing completed:', summary);

      return {
        success: true,
        message: 'Workflow processing completed',
        summary,
        results
      };

    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

module.exports = new HugoProcessorService();