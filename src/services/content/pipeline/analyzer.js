const BasePipelineStage = require('./base');
const contentAnalyzer = require('../../ai/content/analyzer');

class AnalyzerStage extends BasePipelineStage {
  constructor() {
    super('Analyzer');
    this.analyzer = contentAnalyzer;
  }

  async _initialize() {
    await this.analyzer.initialize();
    return true;
  }

  async _process({ keyword, research }) {
    console.log('[ANALYZER] Starting content analysis for:', keyword);

    const [analysis, valuationDesc] = await Promise.all([
      this.analyzer.analyzeContent(keyword, research),
      this.analyzer.generateValuationDescription(keyword, research)
    ]);

    return {
      keyword,
      research,
      analysis: {
        content: analysis,
        valuation: valuationDesc
      }
    };
  }
}

module.exports = new AnalyzerStage();