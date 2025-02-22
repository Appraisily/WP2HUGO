const client = require('./client');
const imageService = require('./image.service');
const contentStorage = require('../../utils/storage');

class WordPressPostService {
  async createPost(content) {
    try {
      console.log('[WORDPRESS] Creating new post');

      // First upload featured image if available
      let featuredImageId = null;
      if (content.images && content.images.length > 0) {
        const featuredImage = content.images.find(img => img.type === 'featured');
        if (featuredImage) {
          const uploadResult = await imageService.uploadFeaturedImage(featuredImage.url);
          featuredImageId = uploadResult.id;
        }
      }

      // Process content images
      const processedHtml = await imageService.processContentImages(
        content.content.html,
        content.images
      );

      // Prepare post data
      const postData = {
        title: content.title,
        content: processedHtml,
        status: 'draft',
        slug: content.slug,
        meta: {
          _yoast_wpseo_metadesc: content.meta.description,
          _yoast_wpseo_focuskw: content.meta.focus_keyword,
          _yoast_wpseo_title: content.meta.title
        }
      };

      if (featuredImageId) {
        postData.featured_media = featuredImageId;
      }

      // Create the post
      const response = await client.request('post', '/posts', postData);

      // Log success
      await this.logPostCreation('success', content, response);

      return {
        success: true,
        wordpress_id: response.id,
        wordpress_url: response.link,
        created_at: response.date
      };

    } catch (error) {
      console.error('[WORDPRESS] Error creating post:', error);
      await this.logPostCreation('error', content, error);
      throw error;
    }
  }

  async updatePost(postId, content) {
    try {
      console.log(`[WORDPRESS] Updating post ${postId}`);

      // Process content images first
      const processedHtml = await imageService.processContentImages(
        content.content.html,
        content.images
      );

      // Prepare update data
      const updateData = {
        title: content.title,
        content: processedHtml,
        meta: {
          _yoast_wpseo_metadesc: content.meta.description,
          _yoast_wpseo_focuskw: content.meta.focus_keyword,
          _yoast_wpseo_title: content.meta.title
        }
      };

      // Update the post
      const response = await client.request('put', `/posts/${postId}`, updateData);

      return {
        success: true,
        wordpress_id: response.id,
        wordpress_url: response.link,
        updated_at: response.modified
      };

    } catch (error) {
      console.error(`[WORDPRESS] Error updating post ${postId}:`, error);
      throw error;
    }
  }

  async getPost(postId) {
    try {
      console.log(`[WORDPRESS] Fetching post ${postId}`);
      const response = await client.request('get', `/posts/${postId}?_embed`);
      
      return {
        id: response.id,
        title: response.title?.rendered,
        content: response.content?.rendered,
        slug: response.slug,
        status: response.status,
        date: response.date,
        modified: response.modified,
        link: response.link,
        featured_media: response.featured_media
      };

    } catch (error) {
      console.error(`[WORDPRESS] Error fetching post ${postId}:`, error);
      throw error;
    }
  }

  async getMediaUrl(mediaId) {
    try {
      console.log(`[WORDPRESS] Fetching media ${mediaId}`);
      const response = await client.request('get', `/media/${mediaId}`);
      return response.source_url;
    } catch (error) {
      console.error(`[WORDPRESS] Error fetching media ${mediaId}:`, error);
      return null;
    }
  }

  async getPosts(params = {}) {
    try {
      console.log('[WORDPRESS] Fetching posts with params:', params);

      const queryParams = new URLSearchParams({
        page: params.page || 1,
        per_page: params.perPage || 10,
        orderby: params.orderBy || 'date',
        order: params.order || 'desc',
        ...params.categories && { categories: params.categories.join(',') },
        ...params.tags && { tags: params.tags.join(',') },
        ...params.search && { search: params.search }
      });

      const response = await client.request('get', `/posts?${queryParams}`);
      
      return {
        posts: response.map(post => ({
          id: post.id,
          title: post.title.rendered,
          excerpt: post.excerpt.rendered,
          slug: post.slug,
          status: post.status,
          date: post.date,
          modified: post.modified,
          link: post.link
        })),
        total: parseInt(response.headers?.['x-wp-total'] || 0),
        totalPages: parseInt(response.headers?.['x-wp-totalpages'] || 0)
      };

    } catch (error) {
      console.error('[WORDPRESS] Error fetching posts:', error);
      throw error;
    }
  }

  async deletePost(postId) {
    try {
      console.log(`[WORDPRESS] Deleting post ${postId}`);
      await client.request('delete', `/posts/${postId}`);
      
      return {
        success: true,
        message: `Post ${postId} deleted successfully`
      };

    } catch (error) {
      console.error(`[WORDPRESS] Error deleting post ${postId}:`, error);
      throw error;
    }
  }

  async logPostCreation(status, content, result) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      status,
      content: {
        title: content.title,
        slug: content.slug,
        meta: content.meta
      },
      result: status === 'success' ? {
        wordpress_id: result.id,
        wordpress_url: result.link,
        created_at: result.date
      } : {
        error: result.message,
        details: result.response?.data
      }
    };

    await contentStorage.storeContent(
      `seo/logs/wordpress/posts/${new Date().toISOString().split('T')[0]}/${status}.json`,
      logEntry,
      {
        type: 'post_creation_log',
        timestamp: logEntry.timestamp
      }
    );
  }
}

module.exports = new WordPressPostService();