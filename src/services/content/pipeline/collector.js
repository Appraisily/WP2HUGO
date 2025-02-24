const BasePipelineStage = require('./base');
const keywordResearch = require('../../research/keyword');
const paaService = require('../../research/paa');
const serpService = require('../../research/serp');
const perplexityService = require('../../research/perplexity');

class CollectorStage extends BasePipelineStage {
  constructor() {
    super('Collector');
    this.services = {
      keyword: keywordResearch,
      paa: paaService,
      serp: serpService,
      perplexity: perplexityService
    };
  }

  async _initialize() {
    await Promise.all(Object.values(this.services).map(service => service.initialize()));
    return true;
  }

  async _process({ keyword }) {
    console.log('[COLLECTOR] Starting data collection for:', keyword);

    const [keywordData, paaData, serpData] = await Promise.all([
      this.services.keyword.getKeywordData(keyword),
      this.services.paa.getQuestions(keyword),
      this.services.serp.getSearchResults(keyword)
    ]);

    // Get Perplexity insights using collected data
    const perplexityData = await this.services.perplexity.complementStructuredData(
      keyword,
      serpData
    );

    return {
      keyword,
      research: {
        keyword: keywordData,
        paa: paaData,
        serp: serpData,
        perplexity: perplexityData
      }
    };
  }
}

module.exports = new CollectorStage();