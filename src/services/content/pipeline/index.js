const collector = require('./collector');
const analyzer = require('./analyzer');
const enhancer = require('./enhancer');
const publisher = require('./publisher');
const contentStorage = require('../../storage/content');

class ContentPipeline {
  constructor() {
    this.stages = [
      collector,
      analyzer,
      enhancer,
      publisher
    ];

    // Set up event listeners
    this.stages.forEach(stage => {
      stage.on('complete', this.handleStageComplete.bind(this));
      stage.on('error', this.handleStageError.bind(this));
    });
  }

  async initialize() {
    console.log('[PIPELINE] Initializing content pipeline');
    await Promise.all(this.stages.map(stage => stage.initialize()));
    console.log('[PIPELINE] Content pipeline initialized');
  }

  async process(keyword) {
    if (!keyword) {
      throw new Error('Keyword is required for content pipeline');
    }

    console.log('[PIPELINE] Starting content pipeline for:', keyword);

    let data = { keyword };
    
    try {
      // Check if we already have processed content
      const existingContent = await contentStorage.getLatestContent(keyword);
      if (existingContent) {
        console.log('[PIPELINE] Found existing content for:', keyword);
        return existingContent;
      }

      for (const stage of this.stages) {
        data = await stage.process(data);
      }

      console.log('[PIPELINE] Content pipeline completed for:', keyword);
      return data;
    } catch (error) {
      console.error('[PIPELINE] Pipeline failed:', error);
      await this.handlePipelineError(error, keyword, data);
      throw error;
    }
  }

  async handleStageComplete({ stage, result }) {
    console.log(`[PIPELINE] Stage ${stage} completed`);
    
    // Store intermediate results
    await contentStorage.store(
      `pipeline/${result.keyword}/stages/${stage}.json`,
      result,
      {
        type: 'pipeline_stage',
        stage,
        keyword: result.keyword
      }
    );
  }

  async handleStageError({ stage, error }) {
    console.error(`[PIPELINE] Stage ${stage} failed:`, error);
  }

  async handlePipelineError(error, keyword, data) {
    console.error('[PIPELINE] Pipeline error:', error);

    // Store error state
    await contentStorage.store(
      `pipeline/${keyword}/error.json`,
      {
        error: {
          message: error.message,
          stack: error.stack
        },
        lastData: data,
        timestamp: new Date().toISOString()
      },
      {
        type: 'pipeline_error',
        keyword
      }
    );
  }
}

module.exports = new ContentPipeline();