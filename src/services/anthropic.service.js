const axios = require('axios');
const path = require('path');
const config = require('../config');
const localStorage = require('../utils/local-storage');
const slugify = require('../utils/slugify');

class AnthropicService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.baseUrl = 'https://api.anthropic.com/v1';
    this.model = 'claude-3-opus-20240229';
    this.useMockData = false;
    this.forceApi = false;
  }

  // Add method to force using API data
  setForceApi(value) {
    this.forceApi = value;
    console.log(`[ANTHROPIC] Force API set to: ${value}`);
  }

  async initialize() {
    try {
      // Get API key from environment variable
      this.apiKey = process.env.ANTHROPIC_API_KEY;
      
      if (!this.apiKey) {
        console.warn('[ANTHROPIC] Anthropic API key not found. Using mock data for testing.');
        this.useMockData = true;
      } else {
        console.log('[ANTHROPIC] API key found. Using real API data.');
        this.useMockData = false;
      }
      
      console.log('[ANTHROPIC] Service initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[ANTHROPIC] Failed to initialize Anthropic service:', error);
      this.useMockData = true;
      this.initialized = true; // Still mark as initialized so we can use mock data
      return true;
    }
  }

  /**
   * Enhance content quality and SEO using Claude
   * @param {string} keyword - The keyword to enhance content for
   * @param {object} structureData - The structure data from Google AI
   * @param {object} perplexityData - The data from Perplexity
   * @param {object} competitorAnalysis - Data about competitors (if available)
   * @returns {object} - Enhanced content
   */
  async enhanceContent(keyword, structureData, perplexityData, competitorAnalysis = null) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[ANTHROPIC] Enhancing content for: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-anthropic-enhanced.json`);
      
      if (!this.forceApi && await localStorage.fileExists(filePath)) {
        console.log(`[ANTHROPIC] Using cached enhanced content for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, return the input structure
      if (this.useMockData) {
        console.log(`[ANTHROPIC] Using mock data for: "${keyword}"`);
        const mockData = {
          ...structureData,
          seoScore: 85,
          enhancementApplied: true,
          enhancementTimestamp: new Date().toISOString()
        };
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Extract section data
      let sections = [];
      if (structureData.response && structureData.response.candidates && structureData.response.candidates[0]) {
        const content = structureData.response.candidates[0].content.parts[0].text;
        sections = this.extractSectionsFromStructure(content);
      } else if (structureData.sections) {
        sections = structureData.sections;
      }
      
      // Extract Perplexity insights
      let perplexityInsights = '';
      if (perplexityData && perplexityData.meaning) {
        // For the new format where we already have processed data
        perplexityInsights = `
Key meaning: ${perplexityData.meaning}
Key aspects: ${perplexityData.key_aspects ? perplexityData.key_aspects.join(', ') : ''}
Common questions: ${perplexityData.common_questions ? perplexityData.common_questions.map(q => `${q.question}: ${q.answer}`).join('\n') : ''}
Expert insights: ${perplexityData.expert_insights ? perplexityData.expert_insights.join(', ') : ''}
Current trends: ${perplexityData.current_trends ? perplexityData.current_trends.join(', ') : ''}
Statistics: ${perplexityData.statistics ? perplexityData.statistics.join(', ') : ''}
`;
      } else if (perplexityData && perplexityData.response && perplexityData.response.choices) {
        // For the raw API response format
        perplexityInsights = perplexityData.response.choices[0].message.content;
      }
      
      // Competitor analysis insights
      let competitorInsights = '';
      if (competitorAnalysis) {
        competitorInsights = `
Average word count: ${competitorAnalysis.contentStatistics?.averageWordCount || 'Unknown'}
Critical topics to cover: ${competitorAnalysis.criticalTopics ? competitorAnalysis.criticalTopics.join(', ') : 'None provided'}
Content gaps to fill: ${competitorAnalysis.contentGaps ? competitorAnalysis.contentGaps.join(', ') : 'None identified'}
`;
      }
      
      // Construct the prompt for Claude
      const prompt = `I need to enhance the SEO quality of a blog post about "${keyword}". 

Here is the current structure:
${JSON.stringify(sections, null, 2)}

Here are insights from Perplexity AI:
${perplexityInsights}

${competitorInsights ? `Here are competitor insights:\n${competitorInsights}` : ''}

Please enhance this content to maximize SEO effectiveness by:

1. Improving each section's content to be more comprehensive and valuable
2. Ensuring proper keyword density and LSI keyword usage
3. Adding semantic depth and authoritative information
4. Restructuring content for better readability and engagement
5. Suggesting additional sections or subsections to cover content gaps
6. Improving titles and headings for better CTR and user engagement
7. Adding expert quotes, statistical data, and current trends where appropriate
8. Optimizing the content for featured snippets and rich results

For each section, provide enhanced and expanded content that is engaging, authoritative, and optimized for both users and search engines. Focus on making this content better than the top-ranking competitors.

Return the enhanced structure in JSON format with:
- title (improved SEO title)
- meta_description (improved meta description)
- sections (array of enhanced sections with heading and content)
- faqs (improved set of FAQs)
- seoScore (numerical assessment of SEO quality from 0-100)
- keyInsights (array of key takeaways)
- richDataSuggestions (suggestions for structured data)`;
      
      // Make API request
      console.log(`[ANTHROPIC] Calling API for: "${keyword}"`);
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: 4000,
          temperature: 0.2,
          system: "You are a world-class SEO content expert who specializes in creating highly optimized, engaging, and authoritative content that ranks well. Your output should be well-structured, comprehensive, and focused on providing exceptional value to readers while satisfying search engine algorithms.",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      // Process the response to extract the enhanced content
      let enhancedContent;
      try {
        // Extract JSON from the response
        const content = response.data.content[0].text;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) || 
                         content.match(/{[\s\S]*?}/);
                         
        if (jsonMatch) {
          enhancedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          // If no JSON found, create a structured response
          enhancedContent = {
            title: this.extractTitle(content),
            meta_description: this.extractMetaDescription(content),
            sections: this.extractSections(content),
            faqs: this.extractFAQs(content),
            seoScore: this.extractSeoScore(content),
            keyInsights: this.extractKeyInsights(content),
            richDataSuggestions: this.extractRichDataSuggestions(content)
          };
        }
      } catch (parseError) {
        console.error('[ANTHROPIC] Error parsing enhanced content:', parseError);
        // Create a simple enhanced version if parsing fails
        enhancedContent = {
          ...structureData,
          enhancementAttempted: true,
          enhancementError: parseError.message,
          rawResponse: response.data.content[0].text
        };
      }
      
      const data = {
        keyword,
        timestamp: new Date().toISOString(),
        enhancedContent,
        originalStructure: structureData
      };
      
      // Save response data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[ANTHROPIC] Error enhancing content for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }

  // Helper method to extract sections from Google AI structure output
  extractSectionsFromStructure(structureText) {
    try {
      // Try to find a section structure
      const sections = [];
      const headingRegex = /##\s+(.*?)(?=\n|$)/g;
      const contentRegex = /##\s+(.*?)(?=\n)([\s\S]*?)(?=##|$)/g;
      
      let match;
      while ((match = contentRegex.exec(structureText)) !== null) {
        const heading = match[1].trim();
        const content = match[2].trim();
        
        sections.push({
          heading,
          content
        });
      }
      
      // If no sections found, try another approach
      if (sections.length === 0) {
        const lines = structureText.split('\n');
        let currentSection = null;
        
        for (const line of lines) {
          if (line.startsWith('# ') || line.startsWith('## ') || line.startsWith('### ')) {
            if (currentSection) {
              sections.push(currentSection);
            }
            
            currentSection = {
              heading: line.replace(/^#+ /, ''),
              content: ''
            };
          } else if (currentSection) {
            currentSection.content += line + '\n';
          }
        }
        
        if (currentSection) {
          sections.push(currentSection);
        }
      }
      
      return sections;
    } catch (error) {
      console.error('[ANTHROPIC] Error extracting sections:', error);
      return [];
    }
  }
  
  // Helper methods to extract parts from Claude's response if needed
  extractTitle(content) {
    const match = content.match(/Title:[\s]*(.*?)(?=\n|$)/i) || 
                 content.match(/SEO Title:[\s]*(.*?)(?=\n|$)/i);
    return match ? match[1].trim() : '';
  }
  
  extractMetaDescription(content) {
    const match = content.match(/Meta Description:[\s]*(.*?)(?=\n|$)/i) || 
                 content.match(/Description:[\s]*(.*?)(?=\n|$)/i);
    return match ? match[1].trim() : '';
  }
  
  extractSections(content) {
    try {
      const sections = [];
      const sectionRegex = /##\s+(.*?)(?=\n)([\s\S]*?)(?=##|$)/g;
      
      let match;
      while ((match = sectionRegex.exec(content)) !== null) {
        sections.push({
          heading: match[1].trim(),
          content: match[2].trim()
        });
      }
      
      return sections;
    } catch (error) {
      console.error('[ANTHROPIC] Error extracting sections:', error);
      return [];
    }
  }
  
  extractFAQs(content) {
    try {
      const faqs = [];
      const faqRegex = /Q:[\s]*(.*?)(?=\n|$)[\s\S]*?A:[\s]*([\s\S]*?)(?=Q:|$)/g;
      
      let match;
      while ((match = faqRegex.exec(content)) !== null) {
        faqs.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      }
      
      return faqs;
    } catch (error) {
      console.error('[ANTHROPIC] Error extracting FAQs:', error);
      return [];
    }
  }
  
  extractSeoScore(content) {
    const match = content.match(/SEO Score:[\s]*(\d+)/i) || 
                 content.match(/seoScore:[\s]*(\d+)/i);
    return match ? parseInt(match[1]) : 75; // Default score
  }
  
  extractKeyInsights(content) {
    try {
      const insightsMatch = content.match(/Key Insights:([\s\S]*?)(?=##|$)/i);
      
      if (insightsMatch) {
        const insightsText = insightsMatch[1];
        return insightsText
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('[ANTHROPIC] Error extracting key insights:', error);
      return [];
    }
  }
  
  extractRichDataSuggestions(content) {
    try {
      const richDataMatch = content.match(/Rich Data Suggestions:([\s\S]*?)(?=##|$)/i) || 
                            content.match(/Structured Data Suggestions:([\s\S]*?)(?=##|$)/i);
      
      if (richDataMatch) {
        const richDataText = richDataMatch[1];
        return richDataText
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.replace(/^[-*]\s*/, '').trim())
          .filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('[ANTHROPIC] Error extracting rich data suggestions:', error);
      return [];
    }
  }
  
  /**
   * Create optimized content with perfect keyword density
   * @param {string} keyword - The primary keyword
   * @param {object} enhancedStructure - The enhanced structure from Claude
   * @returns {object} - Fully optimized content
   */
  async optimizeContentForSeo(keyword, enhancedStructure) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`[ANTHROPIC] Performing final SEO optimization for: "${keyword}"`);
    
    try {
      // Check if we already have this data
      const slug = slugify(keyword);
      const filePath = path.join(config.paths.research, `${slug}-anthropic-seo-optimized.json`);
      
      if (!this.forceApi && await localStorage.fileExists(filePath)) {
        console.log(`[ANTHROPIC] Using cached SEO-optimized content for: "${keyword}"`);
        return await localStorage.readFile(filePath);
      }
      
      // If using mock data, return the input structure
      if (this.useMockData) {
        console.log(`[ANTHROPIC] Using mock data for SEO optimization: "${keyword}"`);
        const mockData = {
          ...enhancedStructure,
          seoOptimized: true,
          keywordDensity: "2.1%",
          contentScore: 92,
          optimizationTimestamp: new Date().toISOString()
        };
        await localStorage.saveFile(filePath, mockData);
        return mockData;
      }
      
      // Extract content structure
      let structureToOptimize = enhancedStructure;
      if (enhancedStructure.enhancedContent) {
        structureToOptimize = enhancedStructure.enhancedContent;
      }
      
      // Construct the prompt for Claude for final SEO optimization
      const prompt = `I need to perform final SEO optimization on this blog post about "${keyword}".

Here is the current structure:
${JSON.stringify(structureToOptimize, null, 2)}

Please perform the following optimizations:

1. Ensure ideal keyword density (1.5-2%) for the primary keyword "${keyword}" without keyword stuffing
2. Add LSI keywords and semantic variations naturally throughout the content
3. Optimize the introduction to boost engagement metrics (reduce bounce rate)
4. Enhance readability with proper paragraph length, transition phrases, and bucket brigades
5. Add content hooks within each section to keep readers engaged
6. Ensure all sections link together cohesively
7. Optimize subheadings to include relevant keywords where natural
8. Add internal linking suggestions with anchor text recommendations
9. Fine-tune the meta description for maximum CTR
10. Suggest a compelling CTA for the conclusion
11. Ensure content covers topics comprehensively to satisfy search intent
12. Add "power words" strategically to improve engagement

Return the fully optimized content in the same JSON structure as provided, with these additional fields:
- seoOptimized: true
- keywordDensity: the calculated keyword density
- contentScore: an estimated SEO score (0-100)
- internalLinkingSuggestions: array of anchor text recommendations
- ctaSuggestion: a compelling call to action
- readabilityEnhancements: list of applied readability improvements
- powerWords: list of power words used`;
      
      // Make API request
      console.log(`[ANTHROPIC] Calling API for final SEO optimization: "${keyword}"`);
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          model: this.model,
          max_tokens: 4000,
          temperature: 0.2,
          system: "You are a world-class SEO optimization expert who specializes in the technical aspects of on-page optimization. You understand how to craft content that perfectly balances keyword optimization with readability and engagement. Your goal is to create content that will rank well and convert effectively.",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      // Process the response to extract the optimized content
      let optimizedContent;
      try {
        // Extract JSON from the response
        const content = response.data.content[0].text;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                         content.match(/```\n([\s\S]*?)\n```/) || 
                         content.match(/{[\s\S]*?}/);
                         
        if (jsonMatch) {
          optimizedContent = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('[ANTHROPIC] Error parsing optimized content:', parseError);
        optimizedContent = {
          ...structureToOptimize,
          seoOptimized: true,
          optimizationAttempted: true,
          optimizationError: parseError.message,
          rawResponse: response.data.content[0].text
        };
      }
      
      const data = {
        keyword,
        timestamp: new Date().toISOString(),
        optimizedContent,
        enhancedStructure
      };
      
      // Save response data
      await localStorage.saveFile(filePath, data);
      
      return data;
    } catch (error) {
      console.error(`[ANTHROPIC] Error optimizing content for "${keyword}":`, error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new AnthropicService(); 