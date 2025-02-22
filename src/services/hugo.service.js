const path = require('path');
const fs = require('fs').promises;
const contentStorage = require('../utils/storage');

class HugoService {
  constructor() {
    this.contentDir = path.join(process.cwd(), 'content', 'blog');
  }

  async initialize() {
    try {
      // Ensure Hugo content directories exist
      await fs.mkdir(this.contentDir, { recursive: true });
      console.log('[HUGO] Content directory initialized:', this.contentDir);
      return true;
    } catch (error) {
      console.error('[HUGO] Initialization failed:', error);
      throw error;
    }
  }

  async createPost(postData) {
    try {
      console.log('[HUGO] Creating post for:', postData.metadata.keyword);

      // Generate front matter
      const frontMatter = this.generateFrontMatter(postData);

      // Convert HTML to Markdown
      const markdown = await this.convertContent(postData.post.content);

      // Combine front matter and content
      const fullContent = `${frontMatter}\n\n${markdown}`;

      // Create the file
      const slug = this.createSlug(postData.metadata.keyword);
      const filePath = path.join(this.contentDir, `${slug}.md`);
      
      await fs.writeFile(filePath, fullContent, 'utf8');
      
      console.log('[HUGO] Successfully created post:', filePath);
      return { success: true, slug, filePath };
    } catch (error) {
      console.error('[HUGO] Error creating post:', error);
      throw error;
    }
  }

  generateFrontMatter(postData) {
    const { post, metadata } = postData;
    const date = new Date(metadata.processedDate || new Date());
    
    return `---
title: "${metadata.seoTitle || post.title}"
date: ${date.toISOString()}
lastmod: ${new Date().toISOString()}
draft: false
description: "${this.cleanDescription(post.content)}"
slug: "${this.createSlug(metadata.keyword)}"
keywords: ["${metadata.keyword}"]
tags: ["antiques", "valuation"]
categories: ["Antiques"]
author: "Appraisily"
image: "${post.mainImageUrl || ''}"
---`;
  }

  async convertContent(html) {
    // Use existing content service for conversion
    const contentService = require('./content/content.service');
    return contentService.convertToMarkdown(html, { enhance: true });
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  cleanDescription(html) {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 157) + '...';
  }
}

module.exports = new HugoService();