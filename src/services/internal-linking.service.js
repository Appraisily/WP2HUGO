/**
 * Internal Linking Service
 * 
 * This service analyzes generated content to suggest and manage 
 * internal links between related articles for improved SEO.
 */

const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const slugify = require('../utils/slugify');

class InternalLinkingService {
  constructor() {
    this.initialized = false;
    this.contentRegistry = [];
    this.registryPath = path.join(config.paths.output, 'content-registry.json');
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this.initialized) return true;
    
    try {
      // Load or create content registry
      await this.loadContentRegistry();
      this.initialized = true;
      console.log('[LINKING] Internal linking service initialized');
      return true;
    } catch (error) {
      console.error('[LINKING] Failed to initialize internal linking service:', error);
      throw error;
    }
  }

  /**
   * Load the content registry
   */
  async loadContentRegistry() {
    try {
      // Check if registry exists
      try {
        const data = await fs.readFile(this.registryPath, 'utf8');
        this.contentRegistry = JSON.parse(data);
        console.log(`[LINKING] Loaded content registry with ${this.contentRegistry.length} entries`);
      } catch (error) {
        // Registry doesn't exist yet, create empty registry
        this.contentRegistry = [];
        await this.saveContentRegistry();
        console.log('[LINKING] Created new content registry');
      }
    } catch (error) {
      console.error('[LINKING] Error loading content registry:', error);
      this.contentRegistry = [];
    }
  }

  /**
   * Save the content registry
   */
  async saveContentRegistry() {
    try {
      await fs.mkdir(path.dirname(this.registryPath), { recursive: true });
      await fs.writeFile(this.registryPath, JSON.stringify(this.contentRegistry, null, 2), 'utf8');
    } catch (error) {
      console.error('[LINKING] Error saving content registry:', error);
      throw error;
    }
  }

  /**
   * Register a new content item in the registry
   * @param {string} keyword - The main keyword for the content
   * @param {object} contentData - The processed content data
   * @returns {object} - Updated registry entry
   */
  async registerContent(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LINKING] Registering content for "${keyword}"`);
    
    try {
      const slug = slugify(keyword);
      
      // Check if content already exists in registry
      const existingIndex = this.contentRegistry.findIndex(item => item.slug === slug);
      
      // Extract keywords and phrases from content
      const keyPhrases = this.extractKeyPhrases(contentData);
      
      // Create registry entry
      const registryEntry = {
        keyword,
        slug,
        title: contentData.title || `${keyword} Guide`,
        description: contentData.description || contentData.summary || '',
        topics: this.extractTopics(contentData),
        keyPhrases,
        dateAdded: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      // Update or add to registry
      if (existingIndex >= 0) {
        // Preserve the original dateAdded
        registryEntry.dateAdded = this.contentRegistry[existingIndex].dateAdded;
        this.contentRegistry[existingIndex] = registryEntry;
      } else {
        this.contentRegistry.push(registryEntry);
      }
      
      // Save registry
      await this.saveContentRegistry();
      
      return registryEntry;
    } catch (error) {
      console.error(`[LINKING] Error registering content for "${keyword}":`, error);
      throw error;
    }
  }

  /**
   * Find internal linking opportunities for a specific keyword
   * @param {string} keyword - The keyword to find link opportunities for
   * @param {object} contentData - The current content data
   * @returns {object} - Linking opportunities
   */
  async findLinkingOpportunities(keyword, contentData) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LINKING] Finding linking opportunities for "${keyword}"`);
    
    try {
      const currentSlug = slugify(keyword);
      
      // Filter out the current content
      const otherContent = this.contentRegistry.filter(item => item.slug !== currentSlug);
      
      if (otherContent.length === 0) {
        console.log(`[LINKING] No other content available for linking with "${keyword}"`);
        return {
          linksTo: [],
          linksFrom: []
        };
      }
      
      // Extract topics and phrases from current content
      const currentTopics = this.extractTopics(contentData);
      const currentPhrases = this.extractKeyPhrases(contentData);
      
      // Find content to link TO from this content
      const linksTo = otherContent
        .map(item => {
          // Calculate relevance score
          const topicOverlap = this.calculateOverlap(currentTopics, item.topics);
          const phraseMatch = this.findPhraseMatches(currentPhrases, [item.keyword, ...item.keyPhrases]);
          
          const relevanceScore = (topicOverlap * 0.7) + (phraseMatch * 0.3);
          
          return {
            keyword: item.keyword,
            slug: item.slug,
            title: item.title,
            relevanceScore,
            matchedPhrases: phraseMatch > 0 ? this.getMatchingPhrases(currentPhrases, [item.keyword, ...item.keyPhrases]) : []
          };
        })
        .filter(item => item.relevanceScore > 0.2) // Only keep items above relevance threshold
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5); // Top 5 most relevant
      
      // Find content that should link FROM those pages TO this page
      const linksFrom = otherContent
        .map(item => {
          // Calculate relevance score (reversed direction)
          const topicOverlap = this.calculateOverlap(item.topics, currentTopics);
          const phraseMatch = this.findPhraseMatches([keyword, ...currentPhrases], item.keyPhrases);
          
          const relevanceScore = (topicOverlap * 0.7) + (phraseMatch * 0.3);
          
          return {
            keyword: item.keyword,
            slug: item.slug,
            title: item.title,
            relevanceScore,
            matchedPhrases: phraseMatch > 0 ? this.getMatchingPhrases([keyword, ...currentPhrases], item.keyPhrases) : []
          };
        })
        .filter(item => item.relevanceScore > 0.2) // Only keep items above relevance threshold
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5); // Top 5 most relevant
      
      return {
        linksTo,
        linksFrom
      };
    } catch (error) {
      console.error(`[LINKING] Error finding linking opportunities for "${keyword}":`, error);
      return {
        linksTo: [],
        linksFrom: []
      };
    }
  }

  /**
   * Add internal links to markdown content
   * @param {string} markdown - Markdown content
   * @param {string} keyword - Current keyword
   * @param {Array} linkOpportunities - Link opportunities to add
   * @returns {string} - Markdown with internal links
   */
  async addInternalLinks(markdown, keyword, linkOpportunities) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`[LINKING] Adding internal links to "${keyword}" content`);
    
    if (!linkOpportunities || !linkOpportunities.linksTo || linkOpportunities.linksTo.length === 0) {
      console.log(`[LINKING] No linking opportunities for "${keyword}"`);
      return markdown;
    }
    
    try {
      let enhancedMarkdown = markdown;
      const currentSlug = slugify(keyword);
      
      // Process each link opportunity
      for (const link of linkOpportunities.linksTo) {
        // For each matching phrase, try to add a link
        for (const phrase of link.matchedPhrases) {
          // Don't link phrases that are too short
          if (phrase.length < 4) continue;
          
          // Create regex to find the phrase (not already in a link)
          const regex = new RegExp(`(?<!\\[.*?)\\b${this.escapeRegExp(phrase)}\\b(?!.*?\\])`, 'i');
          
          // Check if phrase exists in the content
          if (regex.test(enhancedMarkdown)) {
            // Create Hugo-style internal link
            const hugoLink = `[${phrase}]({{< ref "/${link.slug}.md" >}})`;
            
            // Replace first occurrence only (to avoid too many links)
            enhancedMarkdown = enhancedMarkdown.replace(regex, hugoLink);
            
            console.log(`[LINKING] Added link to "${link.keyword}" from phrase "${phrase}"`);
            break; // Only add one link per target content
          }
        }
      }
      
      return enhancedMarkdown;
    } catch (error) {
      console.error(`[LINKING] Error adding internal links to "${keyword}":`, error);
      return markdown; // Return original markdown if error
    }
  }

  /**
   * Generate recommended links section for markdown
   * @param {Array} linkOpportunities - Link opportunities
   * @returns {string} - Markdown section with related links
   */
  generateRelatedLinksSection(linkOpportunities) {
    if (!linkOpportunities || !linkOpportunities.linksTo || linkOpportunities.linksTo.length === 0) {
      return '';
    }
    
    let markdown = '\n\n## Related Articles\n\n';
    
    for (const link of linkOpportunities.linksTo) {
      markdown += `- [${link.title}]({{< ref "/${link.slug}.md" >}})\n`;
    }
    
    return markdown;
  }

  /**
   * Extract key topics from content data
   * @param {object} contentData - Content data
   * @returns {Array} - Array of topics
   */
  extractTopics(contentData) {
    const topics = new Set();
    
    // Extract from keywords
    if (contentData.keywords && Array.isArray(contentData.keywords)) {
      contentData.keywords.forEach(kw => topics.add(kw.toLowerCase()));
    }
    
    // Extract from related keywords
    if (contentData.relatedKeywords && Array.isArray(contentData.relatedKeywords)) {
      contentData.relatedKeywords.forEach(kw => topics.add(kw.toLowerCase()));
    }
    
    // Extract from sections
    if (contentData.structure && contentData.structure.sections) {
      contentData.structure.sections.forEach(section => {
        if (section.title) {
          // Add section title as a topic
          topics.add(section.title.toLowerCase());
          
          // Extract key terms from title
          const words = section.title.split(/\s+/);
          if (words.length > 1) {
            topics.add(words.join(' ').toLowerCase());
          }
        }
      });
    }
    
    return Array.from(topics);
  }

  /**
   * Extract key phrases from content data
   * @param {object} contentData - Content data
   * @returns {Array} - Array of key phrases
   */
  extractKeyPhrases(contentData) {
    const phrases = new Set();
    
    // Extract main keyword
    if (contentData.keyword) {
      phrases.add(contentData.keyword.toLowerCase());
    }
    
    // Extract from keywords
    if (contentData.keywords && Array.isArray(contentData.keywords)) {
      contentData.keywords.forEach(kw => phrases.add(kw.toLowerCase()));
    }
    
    // Extract from section titles
    if (contentData.structure && contentData.structure.sections) {
      contentData.structure.sections.forEach(section => {
        if (section.title) {
          phrases.add(section.title.toLowerCase());
          
          // Extract noun phrases from section titles
          const nounPhrases = this.extractNounPhrases(section.title);
          nounPhrases.forEach(phrase => phrases.add(phrase.toLowerCase()));
        }
      });
    }
    
    return Array.from(phrases);
  }

  /**
   * Extract potential noun phrases from text
   * @param {string} text - Text to extract from
   * @returns {Array} - Array of extracted noun phrases
   */
  extractNounPhrases(text) {
    // Simple heuristic extraction of 2+ word phrases
    const phrases = [];
    
    // Split into words and remove punctuation
    const words = text.split(/\s+/).map(word => word.replace(/[^\w\s]/g, ''));
    
    // Extract 2-word phrases
    for (let i = 0; i < words.length - 1; i++) {
      if (words[i].length > 2 && words[i+1].length > 2) {
        phrases.push(`${words[i]} ${words[i+1]}`);
      }
    }
    
    // Extract 3-word phrases
    for (let i = 0; i < words.length - 2; i++) {
      if (words[i].length > 2 && words[i+1].length > 2 && words[i+2].length > 2) {
        phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
      }
    }
    
    return phrases;
  }

  /**
   * Calculate overlap between two arrays
   * @param {Array} arr1 - First array
   * @param {Array} arr2 - Second array
   * @returns {number} - Overlap score (0-1)
   */
  calculateOverlap(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return 0;
    }
    
    const set1 = new Set(arr1.map(item => item.toLowerCase()));
    const set2 = new Set(arr2.map(item => item.toLowerCase()));
    
    let intersectionCount = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersectionCount++;
      }
    }
    
    // Calculate Jaccard similarity (intersection / union)
    const unionCount = set1.size + set2.size - intersectionCount;
    return intersectionCount / unionCount;
  }

  /**
   * Find matches between phrases in two arrays
   * @param {Array} arr1 - First array of phrases
   * @param {Array} arr2 - Second array of phrases
   * @returns {number} - Match score (0-1)
   */
  findPhraseMatches(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return 0;
    }
    
    const phrases1 = arr1.map(phrase => phrase.toLowerCase());
    const phrases2 = arr2.map(phrase => phrase.toLowerCase());
    
    let matchCount = 0;
    const totalPhrases = phrases1.length;
    
    for (const phrase1 of phrases1) {
      for (const phrase2 of phrases2) {
        if (phrase1.includes(phrase2) || phrase2.includes(phrase1)) {
          matchCount++;
          break; // Only count one match per phrase1
        }
      }
    }
    
    return matchCount / totalPhrases;
  }

  /**
   * Get matching phrases between two arrays
   * @param {Array} arr1 - First array of phrases
   * @param {Array} arr2 - Second array of phrases 
   * @returns {Array} - Array of matching phrases
   */
  getMatchingPhrases(arr1, arr2) {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return [];
    }
    
    const phrases1 = arr1.map(phrase => phrase.toLowerCase());
    const phrases2 = arr2.map(phrase => phrase.toLowerCase());
    
    const matches = [];
    
    for (const phrase1 of phrases1) {
      for (const phrase2 of phrases2) {
        if (phrase1.includes(phrase2) || phrase2.includes(phrase1)) {
          // Use the longer phrase as the match
          matches.push(phrase1.length >= phrase2.length ? phrase1 : phrase2);
          break;
        }
      }
    }
    
    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Escape regex special characters
   * @param {string} string - String to escape
   * @returns {string} - Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = new InternalLinkingService(); 