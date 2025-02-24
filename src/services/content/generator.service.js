const { contentService } = require('../openai/index');
const contentStorage = require('../../utils/storage');

class ContentGeneratorService {
  async generateContent(structure, images) {
    console.log('[CONTENT] Starting detailed content generation');
    
    const messages = [
      {
        role: 'assistant',
        content: `You are an expert SEO content writer. Create comprehensive, high-quality content that fully addresses user intent for the given topic.

CRITICAL REQUIREMENTS:
1. Create long-form, authoritative content
2. Use proper HTML semantic structure
3. Include schema.org markup
4. Integrate provided WordPress images naturally
5. Optimize for featured snippets
6. Include clear calls-to-action

Your response must be a valid JSON object with EXACTLY these fields:
{
  "title": "SEO-optimized title",
  "slug": "url-friendly-slug",
  "meta": {
    "title": "SEO meta title",
    "description": "Meta description with call-to-action",
    "focus_keyword": "primary keyword"
  },
  "content": {
    "html": "COMPLETE HTML CONTENT HERE - ALL HTML MUST BE IN THIS SINGLE FIELD"
  }
}

IMPORTANT HTML GUIDELINES:
1. Put ALL HTML content in the content.html field
2. Use semantic HTML5 elements (article, section, header, etc.)
3. Create proper heading hierarchy (h1-h6)
4. Include schema.org markup in script tags
5. Format images with proper classes:
   <img src="[url]" alt="[alt]" class="wp-image aligncenter" style="max-width: 800px; height: auto;">
6. Add descriptive captions under images
7. Include table of contents for long content
8. Use proper formatting for lists, quotes, and tables

CRITICAL: DO NOT split content into sections. Put ALL HTML in the content.html field.
Return ONLY valid JSON with no additional text or formatting.`
      },
      {
        role: 'user',
        content: `Create comprehensive content using these WordPress images.

CRITICAL: Return ONLY a valid JSON object with ALL HTML in the content.html field.

Structure:
${JSON.stringify(structure, null, 2)}

Available Images:
${JSON.stringify(images, null, 2)}

IMPORTANT:
- Create detailed, valuable content
- Put ALL HTML in content.html field
- Use proper HTML structure
- Integrate images naturally
- Include schema.org markup
- Focus on user intent and value`
      }
    ];

    // Store the input state
    await contentStorage.storeContent(
      `seo/keywords/${structure.slug}/detailed_content_input.json`,
      { structure, images },
      { type: 'detailed_content_input' }
    );

    console.log('[CONTENT] Sending request to OpenAI');
    const content = await contentService.analyzeContent(structure.keyword, { messages });
    
    // Process image sizes and formatting if needed
    if (images && images.length > 0 && content.content?.html) {
      content.content.html = this.processImageFormatting(content.content.html);
    }
    
    // Store the generated content
    await contentStorage.storeContent(
      `seo/keywords/${structure.slug}/generated_content.json`,
      content,
      { type: 'generated_content' }
    );
    
    return content;
  }

  processImageFormatting(html) {
    // Add proper image formatting and responsive classes
    return html.replace(
      /<img([^>]*)>/g,
      '<img$1 class="wp-image aligncenter" style="max-width: 800px; height: auto;">'
    );
  }
}

module.exports = new ContentGeneratorService();