const contentStorage = require('../../utils/storage');
const sheetsService = require('../sheets.service');
const dataCollector = require('./data-collector.service');
const contentGenerator = require('./content-generator.service');
const contentAnalyzer = require('./content-analyzer.service');

class WorkflowService {
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

      // Get row data
      const rows = await this.getRowData();
      if (!rows || rows.length === 0) {
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      // Process row
      const result = await this.processRow(rows[0]);

      // Store final summary
      await this.storeSummary([result]);

      return {
        success: true,
        message: 'Workflow processing completed',
        summary: {
          total: 1,
          successful: result.success ? 1 : 0,
          failed: result.success ? 0 : 1
        },
        results: [result]
      };

    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async getRowData() {
    console.log('[HUGO] Fetching row 2 from sheets');
    const rows = await sheetsService.getAllRows();
    
    if (!rows || rows.length === 0) {
      console.log('[HUGO] No rows found in spreadsheet');
      return null;
    }

    console.log('[HUGO] Row 2 data received:', {
      rowData: rows[0],
      hasKWs: Boolean(rows[0]?.['KWs']),
      hasTitle: Boolean(rows[0]?.['SEO TItle']),
      hasPostId: Boolean(rows[0]?.['Post ID']),
      hasDate: Boolean(rows[0]?.['2025-01-28T10:25:40.252Z'])
    });

    return rows;
  }

  async processRow(row) {
    try {
      const keyword = row['KWs'];
      
      if (!keyword) {
        throw new Error('Missing keyword in row 2');
      }

      console.log('[HUGO] Processing keyword:', keyword);

      // Create folder path
      const slug = this.createSlug(keyword);
      const folderPath = `${slug}`;

      // Collect data
      const collectedData = await dataCollector.collectData(keyword, folderPath);

      // Analyze collected data
      console.log('[HUGO] Analyzing collected data');
      const contentAnalysis = await contentAnalyzer.analyzeKeyword(keyword, collectedData);

      // Store collected data
      await contentStorage.storeContent(
        `${folderPath}/research/collected-data.json`,
        {
          ...collectedData,
          contentAnalysis,
          metadata: {
            keyword,
            processedDate: new Date().toISOString(),
            status: 'data_collected'
          }
        },
        { type: 'collected_data', keyword }
      );

      return {
        keyword,
        slug: this.createSlug(keyword),
        folderPath,
        dataCollected: {
          hasKeywordData: Boolean(collectedData.keywordData),
          hasPaaData: Boolean(collectedData.paaData?.results?.length),
          hasSerpData: Boolean(collectedData.serpData?.serp?.length),
          hasPerplexityData: Boolean(collectedData.perplexityData),
          hasContentAnalysis: Boolean(contentAnalysis)
        },
        success: true
      };

    } catch (error) {
      console.error('[HUGO] Error processing row:', error);
      return {
        keyword: row['KWs'],
        success: false,
        error: error.message
      };
    }
  }

  async storeSummary(results) {
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      timestamp: new Date().toISOString()
    };

    await contentStorage.storeContent(
      `logs/${new Date().toISOString().split('T')[0]}/workflow-summary.json`,
      { summary, results },
      { type: 'workflow_summary' }
    );
  }
}

module.exports = new WorkflowService();