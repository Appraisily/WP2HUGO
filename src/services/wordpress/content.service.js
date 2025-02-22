const openaiService = require('../openai.service');
const client = require('./client');
const TurndownService = require('turndown');
const contentStorage = require('../../utils/storage');

class WordPressContentService {
  constructor() {
    this.turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletListMarker: '-',
      emDelimiter: '_'
    });

    // Configure Turndown rules
    this.configureTurndownRules();
  }

  configureTurndownRules() {
    // Preserve line breaks
    this.turndown.addRule('lineBreaks', {
      filter: ['br'],
      replacement: () => '\n'
    });

    // Handle code blocks
    this.turndown.addRule('codeBlocks', {
      filter: ['pre', 'code'],
      replacement: (content, node) => {
        const language = node.getAttribute('class')?.replace('language-', '') || '';
        return `\n\`\`\`${language}\n${content}\n\`\`\`\n`;
      }
    });

    // Handle tables
    this.turndown.addRule('tables', {
      filter: ['table'],
      replacement: (content) => `\n${content}\n`
    });
  }

  async convertToMarkdown(html, options = {}) {
    try {
      console.log('[WORDPRESS] Starting HTML to Markdown conversion');

      // Initial conversion using Turndown
      const initialMarkdown = this.turndown.turndown(html);

      // Enhance with OpenAI if requested
      if (options.enhance) {
        return await this.enhanceMarkdown(initialMarkdown);
      }

      return initialMarkdown;
    } catch (error) {
      console.error('[WORDPRESS] Error converting HTML to Markdown:', error);
      throw error;
    }
  }

  async enhanceMarkdown(markdown) {
    try {
      console.log('[WORDPRESS] Enhancing markdown with OpenAI');
      
      const messages = [
        {
          role: 'assistant',
          content: `You are a markdown enhancement expert. Your task is to improve the provided markdown content while maintaining its structure and meaning.

CRITICAL REQUIREMENTS:
1. Preserve all headings and their levels
2. Maintain all links and references
3. Keep all code blocks intact
4. Preserve lists and their hierarchy
5. Maintain image references
6. Improve readability without changing meaning
7. Add front matter with:
   - title
   - date
   - lastmod
   - description
   - keywords
   - categories
   - tags

Return ONLY the enhanced markdown content with front matter.`
        },
        {
          role: 'user',
          content: markdown
        }
      ];

      const completion = await openaiService.openai.createChatCompletion({
        model: 'o3-mini',
        messages,
        temperature: 0.7
      });

      return completion.data.choices[0].message.content;
    } catch (error) {
      console.error('[WORDPRESS] Error enhancing markdown:', error);
      // Return original markdown if enhancement fails
      return markdown;
    }
  }

  async convertPost(post) {
    try {
      console.log(`[WORDPRESS] Converting post ${post.id} to markdown`);

      // Convert main content
      const markdown = await this.convertToMarkdown(post.content.rendered, { enhance: true });

      // Store conversion result
      await this.storeConversion(post.id, {
        original: post.content.rendered,
        markdown,
        meta: {
          title: post.title.rendered,
          date: post.date,
          modified: post.modified,
          status: post.status
        }
      });

      return {
        id: post.id,
        title: post.title.rendered,
        content: {
          html: post.content.rendered,
          markdown
        },
        date: post.date,
        modified: post.modified,
        status: post.status
      };
    } catch (error) {
      console.error(`[WORDPRESS] Error converting post ${post.id}:`, error);
      throw error;
    }
  }

  async storeConversion(postId, data) {
    try {
      const timestamp = new Date().toISOString();
      await contentStorage.storeContent(
        `seo/conversions/${postId}/${timestamp}.json`,
        data,
        {
          type: 'markdown_conversion',
          post_id: postId,
          timestamp
        }
      );
    } catch (error) {
      console.error('[WORDPRESS] Error storing conversion:', error);
      // Continue without failing the main operation
    }
  }
}

module.exports = new WordPressContentService();