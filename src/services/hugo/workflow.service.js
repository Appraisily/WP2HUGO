const axios = require('axios');
const contentStorage = require('../../utils/storage');
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
    console.log(`[HUGO] Providing mock data for processing (sheets service disabled)`);
    // Return mock data directly instead of using sheets service
    return [
      {
        'KWs': 'antique electric hurricane lamps',
        'SEO TItle': 'Antique Electric Hurricane Lamps: Value, History & Collecting Guide',
        'Post ID': '',
        '2025-01-28T10:25:40.252Z': ''
      }
    ];
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
      try {
        const collectedData = await dataCollector.collectData(keyword, folderPath);
        
        // Once data is collected successfully, proceed with the rest of the workflow
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
          success: true,
          keyword,
          message: `Successfully processed keyword: ${keyword}`
        };
      } catch (error) {
        // Handle data collection errors specifically
        console.error(`[HUGO] Error collecting data for keyword "${keyword}": ${error.message}`);
        return {
          success: false,
          keyword,
          error: `Data collection failed: ${error.message}`,
          message: `Failed to process keyword: ${keyword}`
        };
      }

    } catch (error) {
      console.error('[HUGO] Error processing row:', error);
      return {
        success: false,
        error: error.message,
        message: `Failed to process row: ${error.message}`
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