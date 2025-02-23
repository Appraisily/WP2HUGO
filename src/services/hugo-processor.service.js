const sheetsService = require('./sheets.service');
const contentStorage = require('../utils/storage');
const openaiService = require('./openai.service');
const keywordResearchService = require('./keyword-research.service');

class HugoProcessorService {
  constructor() {
    this.isProcessing = false;
  }

  createSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

      console.log('[HUGO] Fetching row 2 from sheets');
      console.log('[HUGO] Calling sheetsService.getAllRows()');
      const rows = await sheetsService.getAllRows();
      
      if (!rows || rows.length === 0) {
        console.log('[HUGO] No rows found in spreadsheet (getAllRows returned empty)');
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      console.log('[HUGO] Row 2 data received:', {
        rowData: rows[0],
        hasKWs: Boolean(rows[0]?.['KWs']),
        hasTitle: Boolean(rows[0]?.['SEO TItle']),
        hasPostId: Boolean(rows[0]?.['Post ID']),
        hasDate: Boolean(rows[0]?.['2025-01-28T10:25:40.252Z'])
      });
      
      const results = [];
      const row = rows[0]; // Only process first row (row 2 from sheet)
      try {
        const keyword = row['KWs'];
        
        if (!keyword) {
          console.error('[HUGO] Missing keyword in row 2:', {
            rowData: row,
            availableFields: Object.keys(row)
          });
          throw new Error('Missing keyword in row 2');
        }

        console.log('[HUGO] Starting processing for row 2:', {
          keyword,
          seoTitle: row['SEO TItle'],
          postId: row['Post ID'],
          processedDate: row['2025-01-28T10:25:40.252Z']
        });

        // Create slug for folder name
        const slug = this.createSlug(keyword);
        const folderPath = `content/${slug}`;
        console.log('[HUGO] Created paths:', { slug, folderPath });

        // Get keyword research data
        console.log('[HUGO] Fetching keyword data for:', keyword);
        const keywordData = await keywordResearchService.getKeywordData(keyword);
        console.log('[HUGO] Received keyword data:', {
          keyword,
          dataSize: JSON.stringify(keywordData).length,
          hasVolume: Boolean(keywordData.volume),
          hasIntent: Boolean(keywordData['search-intent'])
        });

        // Generate content structure
        console.log('[HUGO] Generating content structure');
        const structure = await this.generateStructure(keyword, keywordData);

        // Store structure
        console.log('[HUGO] Storing content structure');
        await contentStorage.storeContent(
          `${folderPath}/structure.json`,
          structure,
          { type: 'structure', keyword }
        );

        // Generate content
        console.log('[HUGO] Generating content');
        const content = await this.generateContent(structure);

        // Store content
        console.log('[HUGO] Storing generated content');
        await contentStorage.storeContent(
          `${folderPath}/content.json`,
          {
            content,
            metadata: {
              keyword,
              processedDate: new Date().toISOString(),
              status: 'success'
            }
          },
          { type: 'content', keyword }
        );

        results.push({
          keyword,
          slug,
          folderPath,
          success: true
        });

      } catch (error) {
        console.error('[HUGO] Error processing row 2:', error);
        results.push({
          keyword: row['KWs'],
          success: false,
          error: error.message
        });
      }

      const summary = {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };

      // Store final summary
      await contentStorage.storeContent(
        `logs/summary/${new Date().toISOString().split('T')[0]}.json`,
        { summary, results },
        { type: 'workflow_summary' }
      );

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

  async generateStructure(keyword, keywordData) {
    const messages = [
      {
        role: 'assistant',
        content: `Create a detailed content structure for a blog post about "${keyword}".
Use this keyword research data to optimize the content structure:
${JSON.stringify(keywordData, null, 2)}

Return ONLY valid JSON with this structure:
{
  "title": "SEO optimized title",
  "sections": [
    {
      "type": "introduction|main|conclusion",
      "title": "Section title",
      "content": "Detailed outline of section content"
    }
  ],
  "meta": {
    "description": "SEO meta description",
    "keywords": ["relevant", "keywords"],
    "search_volume": number
  }}`
      }
    ];

    const completion = await openaiService.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.data.choices[0].message.content);
  }

  async generateContent(structure) {
    const messages = [
      {
        role: 'assistant',
        content: `Create detailed blog post content based on this structure. 
Return ONLY valid JSON with this structure:
{
  "title": "Post title",
  "content": "Full markdown content",
  "meta": {
    "description": "Meta description",
    "keywords": ["keywords"]
  }}`
      },
      {
        role: 'user',
        content: JSON.stringify(structure)
      }
    ];

    const completion = await openaiService.openai.createChatCompletion({
      model: 'o3-mini',
      messages
    });

    return JSON.parse(completion.data.choices[0].message.content);
  }
}

module.exports = new HugoProcessorService();