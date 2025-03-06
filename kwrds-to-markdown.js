/**
 * KWRDS API to Markdown Generator
 * 
 * A streamlined, properly structured process to:
 * 1. Read keywords from keywords.txt
 * 2. Fetch SERP data from KWRDS API using proper authentication
 * 3. Generate markdown content for each keyword
 * 4. Save all data with proper logging
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const keywordReader = require('./src/utils/keyword-reader');
const { createSlug } = require('./src/utils/slug');

// API Configuration
const API_CONFIG = {
  apiKey: '687f70ae-0590-4ede-8d4a-3d29e38b9e7b',
  baseUrl: 'https://keywordresearch.api.kwrds.ai',
  endpoints: {
    serp: '/serp'
  }
};

// Ensure required directories exist
async function ensureDirectories() {
  const outputDir = path.join(process.cwd(), 'output');
  await fs.ensureDir(outputDir);
  console.log(`[SETUP] Output directory initialized: ${outputDir}`);
  return outputDir;
}

// Check if cached SERP data exists for a keyword
async function getCachedSerpData(keyword) {
  try {
    const slug = createSlug(keyword);
    const researchDir = path.join(process.cwd(), 'data', 'research');
    const localCachePath = path.join(researchDir, `${slug}-serp.json`);
    
    if (await fs.pathExists(localCachePath)) {
      console.log(`[SERP] Using cached SERP data from: ${localCachePath}`);
      const rawData = await fs.readFile(localCachePath, 'utf8');
      return { 
        success: true, 
        data: JSON.parse(rawData),
        source: 'cache',
        message: 'Retrieved from local cache'
      };
    }
    
    return { success: false, message: 'No cached data found' };
  } catch (error) {
    console.error(`[SERP] Error retrieving cached data: ${error.message}`);
    return { success: false, message: `Cache error: ${error.message}` };
  }
}

// Fetch SERP data from KWRDS API
async function fetchSerpData(keyword) {
  console.log(`[SERP] Fetching data for keyword: "${keyword}"`);
  
  // Try to get cached data first
  const cachedData = await getCachedSerpData(keyword);
  if (cachedData.success) {
    return cachedData;
  }
  
  try {
    console.log(`[SERP] Making API request to ${API_CONFIG.baseUrl}${API_CONFIG.endpoints.serp}`);
    const response = await axios.post(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.serp}`, {
      search_question: keyword,
      search_country: 'en-US'
    }, {
      headers: {
        'X-API-KEY': API_CONFIG.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    // Save the API response to cache
    const slug = createSlug(keyword);
    const researchDir = path.join(process.cwd(), 'data', 'research');
    await fs.ensureDir(researchDir);
    const localCachePath = path.join(researchDir, `${slug}-serp.json`);
    await fs.writeJson(localCachePath, response.data, { spaces: 2 });
    console.log(`[SERP] Saved API response to cache: ${localCachePath}`);
    
    return { 
      success: true, 
      data: response.data,
      source: 'api',
      statusCode: response.status,
      message: 'Successfully retrieved SERP data'
    };
  } catch (error) {
    const errorData = {
      success: false,
      source: 'api',
      statusCode: error.response?.status || 500,
      message: error.message,
      details: error.response?.data || {}
    };
    
    console.error(`[SERP] API error for keyword "${keyword}":`, {
      status: errorData.statusCode,
      message: errorData.message,
      details: errorData.details
    });
    
    // If we have a 429 error, we need to report it but still try to use cached data if available
    console.log(`[SERP] Reporting API error: ${errorData.statusCode} - ${errorData.message}`);
    console.log(`[SERP] API response details:`, errorData.details);
    
    return errorData;
  }
}

// Generate frontmatter for Hugo
function generateFrontmatter(title, keyword, metadata = {}) {
  const slug = createSlug(keyword);
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const description = metadata.description || `Complete guide to ${keyword} including value, history, and market analysis.`;
  const tags = metadata.tags || [keyword, 'value', 'guide', 'antiques', 'collectibles'];
  
  return `---
title: "${title}"
description: "${description}"
date: ${date}
lastmod: ${date}
slug: "${slug}"
categories: ["Collectibles", "Antiques"]
tags: [${tags.map(t => `"${t}"`).join(', ')}]
featured_image: "/images/${slug}/featured.jpg"
draft: false
---

`;
}

// Generate content structure from SERP data
function generateContentStructure(keyword, serpData) {
  // Extract useful data
  const pasf = serpData.pasf || [];
  const pasfTrending = serpData.pasf_trending || [];
  const serpResults = serpData.serp || [];
  
  // Extract titles from SERP results for inspiration
  const titles = serpResults.map(result => result.title).filter(Boolean);
  
  // Build structure
  return {
    keyword,
    title: `Complete Guide to ${keyword}: Value, History, and Market Analysis`,
    sections: [
      {
        type: "introduction",
        title: "Introduction",
        content: `An introduction to ${keyword} and why it's valuable in today's market.`
      },
      {
        type: "main",
        title: "History and Background",
        content: `The historical context of ${keyword} from its origins to present day.`,
        subsections: [
          {
            title: "Origins and Development",
            content: `Exploring the origins of ${keyword} and how they've evolved over time.`
          },
          {
            title: "Notable Historical Examples",
            content: "Significant historical examples and their importance."
          }
        ]
      },
      {
        type: "main",
        title: "Value Factors and Pricing",
        content: "Key factors that determine the value including condition, rarity, and provenance.",
        subsections: [
          {
            title: "Condition Assessment",
            content: "How condition affects value and what to look for."
          },
          {
            title: "Rarity and Scarcity",
            content: "The impact of rarity on market value."
          },
          {
            title: "Authentication Considerations",
            content: "How to authenticate and verify genuine items."
          }
        ]
      },
      {
        type: "main",
        title: "Market Analysis",
        content: "Current trends, auction results, and future market predictions.",
        subsections: [
          {
            title: "Current Market Trends",
            content: "Analysis of current pricing and demand patterns."
          },
          {
            title: "Investment Potential",
            content: "Evaluation of investment prospects and long-term value."
          }
        ]
      },
      {
        type: "faq",
        title: "Frequently Asked Questions",
        content: "Common questions about these collectibles.",
        questions: pasf.slice(0, 5).map(q => ({ question: q }))
      },
      {
        type: "conclusion",
        title: "Conclusion",
        content: "Summary of key points and investment outlook."
      }
    ],
    meta: {
      description: `Discover everything about ${keyword} including its value, history, and current market trends.`,
      tags: [keyword].concat(pasf.slice(0, 3)),
      trending_topics: pasfTrending,
      serp_titles: titles,
      related_questions: pasf
    }
  };
}

// Generate the markdown content
function generateMarkdownContent(structure) {
  // Create frontmatter
  const frontmatter = generateFrontmatter(structure.title, structure.keyword, structure.meta);
  
  // Generate content sections
  let content = frontmatter + `# ${structure.title}\n\n`;
  
  // Introduction
  const intro = structure.sections.find(s => s.type === "introduction");
  content += `## ${intro.title}\n\n${intro.content}\n\nWelcome to our comprehensive guide on ${structure.keyword}. In this article, we'll explore everything you need to know about this fascinating topic, from its rich history to its current market value and future prospects.\n\n`;
  
  // Main sections
  const mainSections = structure.sections.filter(s => s.type === "main");
  mainSections.forEach(section => {
    content += `## ${section.title}\n\n${section.content}\n\n`;
    
    // Add subsections if they exist
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach(sub => {
        content += `### ${sub.title}\n\n${sub.content}\n\n`;
      });
    }
  });
  
  // FAQ section
  const faq = structure.sections.find(s => s.type === "faq");
  if (faq && faq.questions && faq.questions.length > 0) {
    content += `## ${faq.title}\n\n${faq.content}\n\n`;
    
    faq.questions.forEach(qa => {
      content += `### ${qa.question}\n\nThis is an important question about ${structure.keyword}. The value, authenticity, and market demand are all factors that impact this aspect.\n\n`;
    });
  }
  
  // Conclusion
  const conclusion = structure.sections.find(s => s.type === "conclusion");
  content += `## ${conclusion.title}\n\n${conclusion.content}\n\nIn conclusion, ${structure.keyword} represents a fascinating area with significant historical importance and potential market value. Whether you're a collector, enthusiast, or investor, understanding the factors that influence its value and authenticity is crucial.\n\n`;
  
  // Add trending topics if available
  if (structure.meta && structure.meta.trending_topics && structure.meta.trending_topics.length > 0) {
    content += `## Trending Topics\n\nHere are some currently trending topics related to ${structure.keyword}:\n\n`;
    structure.meta.trending_topics.forEach(topic => {
      content += `* ${topic}\n`;
    });
    content += '\n';
  }
  
  // Add related topics
  if (structure.meta && structure.meta.tags && structure.meta.tags.length > 0) {
    content += `## Related Topics\n\nIf you found this article helpful, you might also be interested in:\n\n`;
    structure.meta.tags.slice(0, 5).forEach(tag => {
      content += `* [${tag}](/collectibles/${createSlug(tag)})\n`;
    });
    content += '\n';
  }
  
  return {
    title: structure.title,
    content: content,
    meta: structure.meta
  };
}

// Create log file for the process
async function createProcessLog(keywordDir, processData) {
  const logFile = path.join(keywordDir, 'process.json');
  await fs.writeJson(logFile, processData, { spaces: 2 });
  console.log(`[LOG] Process details saved to: ${logFile}`);
}

// Process a single keyword
async function processKeyword(keyword, outputDir) {
  console.log(`\n\n[PROCESS] ===== Processing keyword: "${keyword}" =====`);
  const startTime = new Date();
  const slug = createSlug(keyword);
  const keywordDir = path.join(outputDir, slug);
  await fs.ensureDir(keywordDir);
  
  const processLog = {
    keyword,
    processStarted: startTime.toISOString(),
    steps: []
  };
  
  try {
    // Step 1: Fetch SERP data
    console.log(`[SERP] Fetching SERP data for keyword: "${keyword}"`);
    const serpResponse = await fetchSerpData(keyword);
    
    processLog.steps.push({
      step: 'fetchSerpData',
      timestamp: new Date().toISOString(),
      success: serpResponse.success,
      statusCode: serpResponse.statusCode,
      message: serpResponse.message
    });
    
    if (!serpResponse.success) {
      processLog.processCompleted = new Date().toISOString();
      processLog.success = false;
      processLog.error = `Failed to fetch SERP data: ${serpResponse.message}`;
      await createProcessLog(keywordDir, processLog);
      
      return { 
        success: false, 
        keyword, 
        error: serpResponse.message 
      };
    }
    
    // Save raw SERP data
    const serpFile = path.join(keywordDir, 'serp-data.json');
    await fs.writeJson(serpFile, serpResponse.data, { spaces: 2 });
    console.log(`[SERP] Raw data saved to: ${serpFile}`);
    
    // Step 2: Generate content structure
    console.log(`[CONTENT] Generating content structure for: "${keyword}"`);
    const contentStructure = generateContentStructure(keyword, serpResponse.data);
    
    // Save content structure
    const structureFile = path.join(keywordDir, 'content-structure.json');
    await fs.writeJson(structureFile, contentStructure, { spaces: 2 });
    console.log(`[CONTENT] Structure saved to: ${structureFile}`);
    
    processLog.steps.push({
      step: 'generateContentStructure',
      timestamp: new Date().toISOString(),
      success: true
    });
    
    // Step 3: Generate markdown content
    console.log(`[MARKDOWN] Generating markdown content for: "${keyword}"`);
    const markdownContent = generateMarkdownContent(contentStructure);
    
    processLog.steps.push({
      step: 'generateMarkdownContent',
      timestamp: new Date().toISOString(),
      success: true,
      contentLength: markdownContent.content.length
    });
    
    // Step 4: Save the markdown content
    const markdownFile = path.join(keywordDir, 'content.md');
    await fs.writeFile(markdownFile, markdownContent.content, 'utf8');
    console.log(`[MARKDOWN] Content saved to: ${markdownFile}`);
    
    // Complete the process log
    processLog.processCompleted = new Date().toISOString();
    processLog.success = true;
    processLog.processingTimeMs = new Date() - startTime;
    await createProcessLog(keywordDir, processLog);
    
    return { 
      success: true, 
      keyword, 
      outputPath: markdownFile,
      metadata: {
        title: markdownContent.title,
        contentLength: markdownContent.content.length
      }
    };
  } catch (error) {
    console.error(`[PROCESS] ❌ Error processing keyword "${keyword}":`, error);
    
    // Complete the process log with error
    processLog.processCompleted = new Date().toISOString();
    processLog.success = false;
    processLog.error = error.message;
    processLog.processingTimeMs = new Date() - startTime;
    await createProcessLog(keywordDir, processLog);
    
    return { 
      success: false, 
      keyword, 
      error: error.message 
    };
  }
}

// Main function
async function main() {
  try {
    console.log('[START] Initializing KWRDS to markdown generation process...');
    
    // Step 1: Ensure directories exist
    const outputDir = await ensureDirectories();
    
    // Step 2: Load keywords
    await keywordReader.initialize();
    const keywords = await keywordReader.getKeywords();
    console.log(`[KEYWORDS] Loaded ${keywords.length} keywords from file`);
    
    // Step 3: Process each keyword
    const results = [];
    for (const keyword of keywords) {
      const result = await processKeyword(keyword, outputDir);
      results.push(result);
    }
    
    // Step 4: Print summary
    console.log('\n\n[SUMMARY] Processing complete:');
    const successful = results.filter(r => r.success).length;
    console.log(`- Total keywords: ${keywords.length}`);
    console.log(`- Successfully processed: ${successful}`);
    console.log(`- Failed: ${keywords.length - successful}`);
    
    if (keywords.length - successful > 0) {
      console.log('\nFailed keywords:');
      results
        .filter(r => !r.success)
        .forEach(r => console.log(`- "${r.keyword}": ${r.error}`));
    }
    
    if (successful > 0) {
      console.log(`\n[SUCCESS] Generated content can be found in: ${outputDir}`);
    }
    
  } catch (error) {
    console.error('[ERROR] Critical error in main process:', error);
  }
}

// Run the main function
main();