const workflow = require('../services/hugo/workflow.service');
const dataCollector = require('../services/hugo/data-collector.service');
const contentAnalyzer = require('../services/hugo/content-analyzer.service');
const contentStorage = require('../utils/storage');
const slugify = require('../utils/slugify');
const axios = require('axios');

async function processWorkflow(req, res) {
  try {
    const result = await workflow.processWorkflow();
    res.json(result);
  } catch (error) {
    console.error('Error processing workflow:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

async function processKeyword(req, res) {
  try {
    const { keyword, title, siteUrl, slug } = req.body;
    
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameter: keyword'
      });
    }
    
    console.log(`[WORKER] Processing keyword: "${keyword}"`);
    
    // Create new workflow
    const newWorkflow = await workflow.createWorkflow({
      keyword,
      title: title || `Complete Guide to ${keyword}`,
      siteUrl: siteUrl || '',
      slug: slug || slugify(keyword)
    });
    
    // Update research step to in_progress
    await workflow.updateWorkflowStep(newWorkflow.id, 'research', 'in_progress');
    
    // Start the data collection process
    const folderPath = newWorkflow.slug;
    let collectedData = null;
    
    try {
      console.log(`[WORKER] Collecting data for keyword: "${keyword}"`);
      collectedData = await dataCollector.collectData(keyword, folderPath);
      
      // Analyze the collected data
      console.log(`[WORKER] Analyzing data for keyword: "${keyword}"`);
      const contentAnalysis = await contentAnalyzer.analyzeKeyword(keyword, collectedData);
      
      // Variable to store valuation response
      let valuationResponse = null;
      
      // Send valuation description to valuation agent if available
      if (contentAnalysis.valuation_description) {
        try {
          console.log('[WORKER] Sending to valuation agent:', contentAnalysis.valuation_description);
          valuationResponse = await axios.post(
            'https://valuer-agent-856401495068.us-central1.run.app/api/find-value-range',
            { text: contentAnalysis.valuation_description },
            { headers: { 'Content-Type': 'application/json' } }
          );
          
          // Log the value range response
          console.log('[WORKER] Received valuation range:', {
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
          console.error('[WORKER] Error getting valuation:', error);
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
          title: newWorkflow.title,
          slug: newWorkflow.slug,
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
      
      // Update workflow status
      await workflow.updateWorkflowStep(newWorkflow.id, 'research', 'completed', {
        hasValuation: Boolean(valuationResponse?.data),
        completedAt: new Date().toISOString()
      });
      
      // Return success response
      res.json({
        success: true,
        message: `Successfully processed keyword: ${keyword}`,
        workflow: await workflow.getWorkflow(newWorkflow.id),
        resultsUrl: `/${folderPath}/collected-data.json`
      });
    } catch (error) {
      console.error(`[WORKER] Error processing keyword "${keyword}":`, error);
      
      // Update workflow status to failed
      await workflow.updateWorkflowStep(newWorkflow.id, 'research', 'failed', {
        error: error.message,
        failedAt: new Date().toISOString()
      });
      
      // Return error response
      res.status(500).json({
        success: false,
        message: `Failed to process keyword: ${keyword}`,
        error: error.message,
        workflow: await workflow.getWorkflow(newWorkflow.id)
      });
    }
  } catch (error) {
    console.error('Error in keyword processing endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
}

module.exports = {
  processWorkflow,
  processKeyword
};