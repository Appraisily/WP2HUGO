const client = require('./client');
const postService = require('./post.service');
const imageService = require('./image.service');
const contentService = require('./content.service');

class WordPressService {
  constructor() {
    this.isInitialized = false;
    this.client = client;
    this.posts = postService;
    this.images = imageService;
    this.content = contentService;
  }

  async initialize() {
    try {
      await this.client.initialize();
      this.isInitialized = true;
      console.log('[WORDPRESS] Service initialized successfully');
      return true;
    } catch (error) {
      console.error('[WORDPRESS] Service initialization failed:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  // Post methods
  async getPost(postId) {
    return this.posts.getPost(postId);
  }

  async getPosts(params) {
    return this.posts.getPosts(params);
  }

  async createPost(content) {
    return this.posts.createPost(content);
  }

  async updatePost(postId, content) {
    return this.posts.updatePost(postId, content);
  }

  async deletePost(postId) {
    return this.posts.deletePost(postId);
  }

  // Media methods
  async getMediaUrl(mediaId) {
    return this.posts.getMediaUrl(mediaId);
  }

  async uploadImage(imageUrl) {
    return this.images.uploadFeaturedImage(imageUrl);
  }

  // Content methods
  async convertToMarkdown(html, options) {
    return this.content.convertToMarkdown(html, options);
  }
}

module.exports = new WordPressService();