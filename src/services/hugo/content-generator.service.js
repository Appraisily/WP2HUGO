const contentStorage = require('../../utils/storage');
const { createSlug } = require('../../utils/slug');

class ContentGeneratorService {
  async generateStructure(keyword, keywordData, paaData, serpData) {
    try {
      console.log('[HUGO] Generating content structure for:', keyword);
      
      // Extract useful data from the input
      const relatedKeywords = keywordData?.relatedKeywords || [];
      const questions = paaData?.results?.slice(0, 5) || [];
      const serpResults = serpData?.serp?.slice(0, 3) || [];
      
      // Create a more sophisticated structure based on the keyword and collected data
      const content = {
        keyword,
        title: `Complete Guide to ${keyword}: Value, History, and Market Analysis`,
        sections: [
          {
            type: "introduction",
            title: "Introduction",
            content: `An introduction to ${keyword} and why it's valuable in today's market.`,
            subsections: []
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
            questions: questions.map(q => ({
              question: q.question || `What is the value of ${keyword}?`,
              answer: `This is an important question about ${keyword}.`
            }))
          },
          {
            type: "conclusion",
            title: "Conclusion",
            content: "Summary of key points and investment outlook.",
            subsections: []
          }
        ],
        meta: {
          description: `Discover everything about ${keyword} including its value, history, and current market trends.`,
          keywords: [keyword].concat(
            relatedKeywords.slice(0, 5).map(k => k.keyword || ""),
            ["value", "history", "market", "price", "investment"]
          ),
          search_volume: keywordData?.researchData?.metrics?.monthly_search_volume || 0,
          related_questions: questions.map(q => q.question || ""),
          related_keywords: relatedKeywords.slice(0, 5).map(k => k.keyword || "")
        }
      };
      
      // Store the generated structure
      await contentStorage.storeContent(
        `${createSlug(keyword)}/structure.json`,
        content,
        { type: 'content_structure', keyword }
      );

      return content;
    } catch (error) {
      console.error('[HUGO] Error generating content structure:', error);
      throw error;
    }
  }

  async generateContent(structure) {
    try {
      console.log('[HUGO] Generating markdown content from structure');
      
      // Create frontmatter for Hugo
      const frontmatter = this._generateFrontmatter(structure);
      
      // Generate comprehensive markdown content based on the structure
      const markdownContent = 
        frontmatter +
        `# ${structure.title}\n\n` +
        this._generateIntroduction(structure) +
        this._generateMainSections(structure) +
        this._generateFAQSection(structure) +
        this._generateConclusion(structure) +
        this._generateRelatedContent(structure);
      
      const content = {
        title: structure.title,
        content: markdownContent,
        meta: structure.meta || {}
      };
      
      // Store the generated content
      await contentStorage.storeContent(
        `${createSlug(structure.keyword || structure.title)}/content.json`,
        content,
        { type: 'generated_content', keyword: structure.keyword || createSlug(structure.title) }
      );

      return content;
    } catch (error) {
      console.error('[HUGO] Error generating content:', error);
      throw error;
    }
  }
  
  /**
   * Generate Hugo frontmatter for the markdown file
   * @param {object} structure - The content structure
   * @returns {string} - The frontmatter text
   */
  _generateFrontmatter(structure) {
    const { title, meta = {} } = structure;
    const slug = createSlug(structure.keyword || title);
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Construct the frontmatter
    return `---
title: "${title}"
description: "${meta.description || ''}"
date: ${date}
lastmod: ${date}
slug: "${slug}"
categories: ["Collectibles", "Antiques"]
tags: [${meta.keywords ? meta.keywords.map(k => `"${k}"`).join(', ') : ''}]
featured_image: "/images/${slug}/featured.jpg"
draft: false
---

`;
  }
  
  /**
   * Generate the introduction section
   * @param {object} structure - The content structure
   * @returns {string} - The markdown text for the introduction
   */
  _generateIntroduction(structure) {
    const introSection = structure.sections.find(s => s.type === "introduction") || {};
    
    return `## ${introSection.title || 'Introduction'}\n\n` +
           `${introSection.content || `Welcome to our comprehensive guide on ${structure.keyword}. ` +
           `In this article, we'll explore everything you need to know about this fascinating topic, ` +
           `from its rich history to its current market value and future prospects.`}\n\n`;
  }
  
  /**
   * Generate the main content sections
   * @param {object} structure - The content structure
   * @returns {string} - The markdown text for the main sections
   */
  _generateMainSections(structure) {
    const mainSections = structure.sections.filter(s => s.type === "main");
    
    return mainSections.map(section => {
      let sectionContent = `## ${section.title}\n\n${section.content}\n\n`;
      
      // Add subsections if they exist
      if (section.subsections && section.subsections.length > 0) {
        sectionContent += section.subsections.map(sub => 
          `### ${sub.title}\n\n${sub.content}\n\n`
        ).join('');
      }
      
      return sectionContent;
    }).join('');
  }
  
  /**
   * Generate the FAQ section
   * @param {object} structure - The content structure
   * @returns {string} - The markdown text for the FAQ section
   */
  _generateFAQSection(structure) {
    const faqSection = structure.sections.find(s => s.type === "faq");
    
    if (!faqSection || !faqSection.questions || faqSection.questions.length === 0) {
      return '';
    }
    
    let faqContent = `## ${faqSection.title || 'Frequently Asked Questions'}\n\n`;
    
    // Add each question and answer
    faqContent += faqSection.questions.map(qa => 
      `### ${qa.question}\n\n${qa.answer}\n\n`
    ).join('');
    
    return faqContent;
  }
  
  /**
   * Generate the conclusion section
   * @param {object} structure - The content structure
   * @returns {string} - The markdown text for the conclusion
   */
  _generateConclusion(structure) {
    const conclusionSection = structure.sections.find(s => s.type === "conclusion") || {};
    
    return `## ${conclusionSection.title || 'Conclusion'}\n\n` +
           `${conclusionSection.content || `In conclusion, ${structure.keyword} represents a fascinating area ` +
           `with significant historical importance and potential market value. Whether you're a collector, ` +
           `enthusiast, or investor, understanding the factors that influence its value and authenticity is crucial.`}\n\n`;
  }
  
  /**
   * Generate related content section
   * @param {object} structure - The content structure
   * @returns {string} - The markdown text for related content
   */
  _generateRelatedContent(structure) {
    const { meta = {} } = structure;
    const relatedKeywords = meta.related_keywords || [];
    
    if (relatedKeywords.length === 0) {
      return '';
    }
    
    let relatedContent = `## Related Topics\n\n`;
    relatedContent += `If you found this article on ${structure.keyword} helpful, you might also be interested in these related topics:\n\n`;
    
    relatedContent += relatedKeywords.map(keyword => 
      `* [${keyword}](/collectibles/${createSlug(keyword)})\n`
    ).join('');
    
    return `\n${relatedContent}\n\n`;
  }
}

module.exports = new ContentGeneratorService();