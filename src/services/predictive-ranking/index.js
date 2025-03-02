const path = require('path');
const config = require('../../config');
const localStorage = require('../../utils/local-storage');
const slugify = require('../../utils/slugify');

// Import submodules
const coreFactorsAnalyzer = require('./core-factors.analyzer');
const userSignalsAnalyzer = require('./user-signals.analyzer');
const aiFactorsAnalyzer = require('./ai-factors.analyzer');
const futureFactorsPredictor = require('./future-factors.predictor');
const rankingOptimizer = require('./ranking-optimizer');

/**
 * Service for analyzing and optimizing content based on predicted future ranking factors
 * Uses a modular approach to handle different aspects of predictive ranking analysis
 */
class PredictiveRankingService {
  constructor() {
    this.initialized = false;
    this.forceApi = false;
    
    // Configure prediction timeframes
    this.timeframes = {
      SHORT_TERM: 'short_term', // Next 3-6 months
      MID_TERM: 'mid_term',     // Next 6-12 months
      LONG_TERM: 'long_term'    // Next 12-24 months
    };
    
    // Default optimization mode
    this.optimizationMode = 'balanced'; // Options: conservative, balanced, aggressive
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[PREDICTIVE-RANKING] Force API set to: ${value}`);
    
    // Propagate to submodules
    coreFactorsAnalyzer.setForceApi(value);
    userSignalsAnalyzer.setForceApi(value);
    aiFactorsAnalyzer.setForceApi(value);
    futureFactorsPredictor.setForceApi(value);
    rankingOptimizer.setForceApi(value);
  }
  
  // Set optimization mode
  setOptimizationMode(mode) {
    const validModes = ['conservative', 'balanced', 'aggressive'];
    if (validModes.includes(mode)) {
      this.optimizationMode = mode;
      console.log(`[PREDICTIVE-RANKING] Optimization mode set to: ${mode}`);
      
      // Propagate to ranking optimizer
      rankingOptimizer.setOptimizationMode(mode);
    } else {
      console.warn(`[PREDICTIVE-RANKING] Invalid optimization mode: ${mode}. Using default 'balanced'.`);
    }
  }

  async initialize() {
    try {
      // Initialize all submodules
      await Promise.all([
        coreFactorsAnalyzer.initialize(),
        userSignalsAnalyzer.initialize(),
        aiFactorsAnalyzer.initialize(),
        futureFactorsPredictor.initialize(),
        rankingOptimizer.initialize()
      ]);
      
      console.log('[PREDICTIVE-RANKING] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[PREDICTIVE-RANKING] Failed to initialize Predictive Ranking service:', error);
      throw error;
    }
  }

  /**
   * Analyze content and optimize for predicted future ranking factors
   * @param {string} keyword - The target keyword
   * @param {object} contentData - The content data with sections, title, etc.
   * @param {object} keywordData - Keyword research data
   * @param {object} competitorData - Competitor analysis data
   * @param {string} timeframe - Prediction timeframe (short_term, mid_term, long_term)
   * @returns {object} - Enhanced content optimized for predicted future ranking factors
   */
  async optimizeForFutureRanking(keyword, contentData, keywordData, competitorData, timeframe = this.timeframes.MID_TERM) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[PREDICTIVE-RANKING] Optimizing for future ranking factors: "${keyword}" (timeframe: ${timeframe})`);
    
    try {
      // Check for cached results first
      const slug = slugify(keyword);
      const cachePath = path.join(config.paths.research, `${slug}-predictive-ranking-${timeframe}.json`);
      
      if (!this.forceApi && await localStorage.fileExists(cachePath)) {
        console.log(`[PREDICTIVE-RANKING] Using cached predictive ranking analysis for "${keyword}"`);
        return await localStorage.readFile(cachePath);
      }
      
      // Analyze current core ranking factors (content quality, E-A-T, structure, etc.)
      const coreFactorsAnalysis = await coreFactorsAnalyzer.analyze(keyword, contentData, keywordData);
      
      // Analyze user signals factors (engagement metrics, bounce rates, etc.)
      const userSignalsAnalysis = await userSignalsAnalyzer.analyze(keyword, contentData, competitorData);
      
      // Analyze AI-specific ranking factors (semantic relevance, NLP patterns, etc.)
      const aiFactorsAnalysis = await aiFactorsAnalyzer.analyze(keyword, contentData, keywordData);
      
      // Predict future ranking factor importance based on current trends
      const futureFactorsPrediction = await futureFactorsPredictor.predictFactors(
        keyword, 
        timeframe, 
        { coreFactorsAnalysis, userSignalsAnalysis, aiFactorsAnalysis }
      );
      
      // Generate optimization recommendations based on predictions
      const optimizationRecommendations = await rankingOptimizer.generateRecommendations(
        keyword, 
        contentData, 
        futureFactorsPrediction, 
        this.optimizationMode
      );
      
      // Apply optimization recommendations to content
      const optimizedContent = await rankingOptimizer.applyOptimizations(
        contentData, 
        optimizationRecommendations
      );
      
      // Add analysis data for reference
      optimizedContent.predictiveRankingAnalysis = {
        coreFactors: coreFactorsAnalysis,
        userSignals: userSignalsAnalysis,
        aiFactors: aiFactorsAnalysis,
        futurePredictions: futureFactorsPrediction,
        recommendations: optimizationRecommendations,
        timeframe,
        optimizationMode: this.optimizationMode,
        timestamp: new Date().toISOString()
      };
      
      // Cache the results
      await localStorage.saveFile(cachePath, optimizedContent);
      
      return optimizedContent;
    } catch (error) {
      console.error(`[PREDICTIVE-RANKING] Error optimizing for future ranking: "${keyword}":`, error);
      // Return original content if there's an error
      return contentData;
    }
  }

  /**
   * Get a forecast of how ranking factors are likely to evolve
   * This provides insights without actually modifying content
   */
  async getFutureRankingFactorsForecast(keyword, timeframe = this.timeframes.MID_TERM) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[PREDICTIVE-RANKING] Getting future ranking factors forecast for: "${keyword}"`);
    
    try {
      // Just get the predictions without optimizing content
      return await futureFactorsPredictor.getForecast(keyword, timeframe);
    } catch (error) {
      console.error(`[PREDICTIVE-RANKING] Error getting future ranking forecast: "${keyword}":`, error);
      throw error;
    }
  }
}

module.exports = new PredictiveRankingService(); 