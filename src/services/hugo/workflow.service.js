const axios = require('axios');
const contentStorage = require('../../utils/storage');
const sheetsService = require('../sheets.service');
const dataCollector = require('./data-collector.service');
const contentGenerator = require('./content-generator.service');
const contentAnalyzer = require('./content-analyzer.service');
const { createSlug } = require('../../utils/slug');

class WorkflowService {
  constructor() {
    this.isProcessing = false;
    this.batchSize = 20; // Process 20 keywords at once
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

      // Get rows data (up to batchSize)
      const rows = await this.getRowData();
      if (!rows || rows.length === 0) {
        return {
          success: true,
          message: 'No rows to process',
          processed: 0
        };
      }

      console.log(`[HUGO] Processing ${rows.length} keywords (max batch size: ${this.batchSize})`);

      // Process multiple rows in parallel
      const results = await Promise.all(
        rows.map(row => this.processRow(row))
      );

      // Store final summary
      await this.storeSummary(results);

      return {
        success: true,
        message: 'Workflow processing completed',
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        },
        results
      };

    } catch (error) {
      console.error('[HUGO] Critical error in workflow processing:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  async getRowData() {
    console.log(`[HUGO] Fetching up to ${this.batchSize} rows from sheets`);
    const allRows = await sheetsService.getAllRows();
    
    if (!allRows || allRows.length === 0) {
      console.log('[HUGO] No rows found in spreadsheet');
      return null;
    }

    // Limit to batchSize rows
    const rows = allRows.slice(0, this.batchSize);
    
    console.log(`[HUGO] Retrieved ${rows.length} rows for processing`);
    return rows;
  }

  async processRow(row) {
    try {
      const keyword = row['KWs'];
      
      if (!keyword) {
        throw new Error('Missing keyword in row');
      }

      console.log('[HUGO] Processing keyword:', keyword);

      // Create folder path
      const slug = createSlug(keyword);
      const folderPath = `${slug}`;

      // Collect data
      const collectedData = await dataCollector.collectData(keyword, folderPath);

      // Analyze collected data
      console.log('[HUGO] Analyzing collected data');
      const contentAnalysis = await contentAnalyzer.analyzeKeyword(keyword, collectedData);

      // Variable to store valuation response
      let valuationResponse = null;

      // Send valuation description to valuation agent if available
      if (contentAnalysis.valuation_description) {
        try {
          console.log('[HUGO] Sending to valuation agent:', contentAnalysis.valuation_description);
          valuationResponse = await axios.post(
            'https://valuer-agent-856401495068.us-central1.run.app/api/find-value-range',
            { text: contentAnalysis.valuation_description },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          // Log the value range response
          console.log('[HUGO] Received valuation range:', {
            minValue: valuationResponse.data.minValue,
            maxValue: valuationResponse.data.maxValue,
            mostLikelyValue: valuationResponse.data.mostLikelyValue
          });
          
          // Store valuation response
          await contentStorage.storeContent(
            `${folderPath}/research/valuation-data.json`,
            {
              description: contentAnalysis.valuation_description,
              value_range: {
                min: valuationResponse.data.minValue,
                max: valuationResponse.data.maxValue,
                most_likely: valuationResponse.data.mostLikelyValue
              },
              explanation: valuationResponse.data.explanation,
              auction_results: valuationResponse.data.auctionResults,
              timestamp: new Date().toISOString()
            },
            { type: 'valuation_data', keyword }
          );
        } catch (error) {
          console.error('[HUGO] Error getting valuation:', error);
          // Continue processing even if valuation fails
        }
      }

      // Prepare final data object
      const finalData = {
        ...collectedData,
        contentAnalysis,
        valuation: valuationResponse?.data ? {
          value_range: {
            min: valuationResponse.data.minValue,
            max: valuationResponse.data.maxValue,
            most_likely: valuationResponse.data.mostLikelyValue
          },
          explanation: valuationResponse.data.explanation,
          auction_results: valuationResponse.data.auctionResults
        } : null,
        metadata: {
          keyword,
          processedDate: new Date().toISOString(),
          status: 'data_collected',
          has_valuation: Boolean(valuationResponse?.data)
        }
      };

      // Store collected data in regular path
      await contentStorage.storeContent(
        `${folderPath}/collected-data.json`,
        finalData,
        { type: 'collected_data', keyword }
      );

      // Store the same data in a dedicated GCS folder with keyword as filename
      await contentStorage.storeContent(
        `seo_keywords/${keyword}.json`,
        finalData,
        { type: 'keyword_data', keyword }
      );

      return {
        keyword,
        slug: createSlug(keyword),
        folderPath,
        gcsPath: `seo_keywords/${keyword}.json`,
        dataCollected: {
          hasKeywordData: Boolean(collectedData.keywordData),
          hasPaaData: Boolean(collectedData.paaData?.results?.length),
          hasSerpData: Boolean(collectedData.serpData?.serp?.length),
          hasPerplexityData: Boolean(collectedData.perplexityData),
          hasContentAnalysis: Boolean(contentAnalysis),
          hasValuation: Boolean(valuationResponse?.data)
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