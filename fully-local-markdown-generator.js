/**
 * Fully Local Markdown Generator
 * 
 * This script generates markdown content from keywords without relying on any cloud services.
 * It directly:
 * 1. Reads keywords from keywords.txt
 * 2. Uses cached SERP data or generates mock data
 * 3. Creates content structure and markdown entirely locally
 * 4. Saves the markdown content to the content directory
 */
require('dotenv').config();
const fs = require('fs-extra');
const path = require('path');
const { serpService } = require('./src/services/kwrds');
const keywordReader = require('./src/utils/keyword-reader');
const { createSlug } = require('./src/utils/slug');

// Ensure required directories exist
async function ensureDirectories() {
  const contentDir = path.join(process.cwd(), 'content');
  const dataDir = path.join(process.cwd(), 'data', 'research');
  const outputDir = path.join(process.cwd(), 'output');
  
  await fs.ensureDir(contentDir);
  await fs.ensureDir(dataDir);
  await fs.ensureDir(outputDir);
  
  console.log(`[SETUP] Directories initialized`);
  return { contentDir, dataDir, outputDir };
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
  const questions = pasf.slice(0, 5).map(q => ({ question: q }));
  
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
        questions: questions
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
      related_questions: questions.map(q => q.question)
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
  
  // Add related topics if available
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

// Process a single keyword
async function processKeyword(keyword, outputDir) {
  console.log(`\n\n[PROCESS] ===== Processing keyword: "${keyword}" =====`);
  
  try {
    // Step 1: Fetch SERP data
    console.log(`[SERP] Fetching SERP data for keyword: "${keyword}"`);
    const serpData = await serpService.getSerpData(keyword);
    console.log(`[SERP] Successfully retrieved data for: "${keyword}"`);
    
    // Step 2: Generate content structure
    console.log(`[CONTENT] Generating content structure for: "${keyword}"`);
    const contentStructure = generateContentStructure(keyword, serpData);
    console.log(`[CONTENT] Successfully generated structure for: "${keyword}"`);
    
    // Step 3: Generate markdown content
    console.log(`[MARKDOWN] Generating markdown content for: "${keyword}"`);
    const markdownContent = generateMarkdownContent(contentStructure);
    console.log(`[MARKDOWN] Successfully generated content for: "${keyword}"`);
    
    // Step 4: Save to file system
    const slug = createSlug(keyword);
    const outputPath = path.join(outputDir, `${slug}.md`);
    await fs.writeFile(outputPath, markdownContent.content, 'utf8');
    console.log(`[OUTPUT] Content saved to: ${outputPath}`);
    
    return { 
      success: true, 
      keyword, 
      outputPath,
      metadata: {
        title: markdownContent.title,
        contentLength: markdownContent.content.length
      }
    };
  } catch (error) {
    console.error(`[PROCESS] ❌ Error processing keyword "${keyword}":`, error);
    return { success: false, keyword, error: error.message };
  }
}

// Main function
async function main() {
  try {
    console.log('[START] Initializing markdown generation process...');
    
    // Step 1: Ensure directories exist
    const { contentDir, dataDir, outputDir } = await ensureDirectories();
    
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
      console.log(`\n[SUCCESS] Generated markdown files can be found in: ${outputDir}`);
    }
    
  } catch (error) {
    console.error('[ERROR] Critical error in main process:', error);
  }
}

// Run the main function
main();