const contentStorage = require('../../utils/storage');
const keywordResearchService = require('../keyword-research.service');
const paaService = require('../paa.service');
const serpService = require('../serp.service');
const perplexityService = require('../perplexity.service');
const { createSlug } = require('../../utils/slug');
const fs = require('fs');

class DataCollectorService {
  async collectData(keyword, folderPath) {
    const slug = createSlug(keyword);
    const keywordPath = `${slug}`;

    // Get keyword research data
    console.log('[HUGO] Fetching keyword data for:', keyword);
    const keywordData = await this.getKeywordData(keyword, keywordPath);

    // Get People Also Ask questions
    console.log('[HUGO] Fetching PAA data for:', keyword);
    const paaData = await this.getPaaData(keyword, keywordPath);

    // Get SERP data
    console.log('[HUGO] Fetching SERP data for:', keyword);
    const serpData = await this.getSerpData(keyword, keywordData.volume || 0, keywordPath);

    // Get Perplexity insights
    console.log('[HUGO] Fetching Perplexity insights for:', keyword);
    const perplexityData = await this.getPerplexityData(keyword, keywordPath, serpData);

    return {
      keywordData,
      paaData,
      serpData,
      perplexityData
    };
  }

  async getKeywordData(keyword, folderPath) {
    try {
      const existingData = await contentStorage.getContent(`${folderPath}/research/keyword-data.json`);
      if (existingData?.data) {
        console.log('[HUGO] Using existing keyword data');
        return existingData.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing keyword data, fetching fresh');
    }

    try {
      // Get keyword data without allowing fallback to mock data
      const data = await keywordResearchService.getKeywordData(keyword); 
      console.log('[HUGO] Successfully retrieved keyword data from API');
      
      // Store the data if retrieval was successful
      await contentStorage.storeContent(
        `${folderPath}/research/keyword-data.json`,
        data,
        { type: 'keyword_data', keyword }
      );

      return data;
    } catch (error) {
      // Log the error and propagate it upward
      console.error(`[HUGO] Failed to get keyword data: ${error.message}`);
      
      // Throw a more descriptive error to be handled by the caller
      throw new Error(`Could not retrieve keyword data for "${keyword}": ${error.message}`);
    }
  }

  async getPaaData(keyword, folderPath) {
    try {
      const existingPaa = await contentStorage.getContent(`${folderPath}/research/paa-data.json`);
      if (existingPaa?.data) {
        console.log('[HUGO] Using existing PAA data');
        return existingPaa.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing PAA data, fetching fresh');
    }

    try {
      const data = await paaService.getQuestions(keyword);
      
      await contentStorage.storeContent(
        `${folderPath}/research/paa-data.json`,
        data,
        { type: 'paa_data', keyword }
      );
      
      return data;
    } catch (error) {
      console.error(`[HUGO] Failed to get PAA data: ${error.message}`);
      throw new Error(`Could not retrieve People Also Ask data for "${keyword}": ${error.message}`);
    }
  }

  async getSerpData(keyword, volume, folderPath) {
    try {
      const existingSerp = await contentStorage.getContent(`${folderPath}/research/serp-data.json`);
      if (existingSerp?.data) {
        console.log('[HUGO] Using existing SERP data');
        return existingSerp.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing SERP data, fetching fresh');
    }

    try {
      const data = await serpService.getSearchResults(keyword, volume);
      
      await contentStorage.storeContent(
        `${folderPath}/research/serp-data.json`,
        data,
        { type: 'serp_data', keyword }
      );
      
      return data;
    } catch (error) {
      console.error(`[HUGO] Failed to get SERP data: ${error.message}`);
      throw new Error(`Could not retrieve SERP data for "${keyword}": ${error.message}`);
    }
  }

  async getPerplexityData(keyword, folderPath, serpData) {
    try {
      const existingData = await contentStorage.getContent(`${folderPath}/research/perplexity-data.json`);
      if (existingData?.data) {
        console.log('[HUGO] Using existing Perplexity data');
        return existingData.data;
      }
    } catch (error) {
      console.log('[HUGO] No existing Perplexity data, fetching fresh');
    }

    try {
      // Collect all Perplexity insights in parallel
      const [variations, intent, context, topics, complement] = await Promise.all([
        perplexityService.generateKeywordVariations(keyword),
        perplexityService.analyzeSearchIntent(keyword),
        perplexityService.getContextualExpansion(keyword),
        perplexityService.generateContentTopics(keyword),
        perplexityService.complementStructuredData(keyword, serpData)
      ]);

      const data = {
        keyword_variations: variations,
        search_intent: intent,
        contextual_expansion: context,
        content_topics: topics,
        complementary_data: complement,
        timestamp: new Date().toISOString()
      };

      await contentStorage.storeContent(
        `${folderPath}/research/perplexity-data.json`,
        data,
        { type: 'perplexity_data', keyword }
      );

      return data;
    } catch (error) {
      console.error(`[HUGO] Failed to get Perplexity data: ${error.message}`);
      throw new Error(`Could not retrieve Perplexity insights for "${keyword}": ${error.message}`);
    }
  }
}

module.exports = new DataCollectorService();