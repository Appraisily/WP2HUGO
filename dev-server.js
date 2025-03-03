// Development server script for WP2HUGO
// This script sets up the environment for local development and testing
const fs = require('fs');
const path = require('path');

// Set environment variables for development
process.env.NODE_ENV = 'development';
process.env.USE_MOCK_DATA = 'true';  // Enable mock data
process.env.PORT = '3000';  // Use port 3000 instead of 8080
process.env.PROJECT_ID = 'local-dev-project'; // Mock project ID
process.env.GOOGLE_CLOUD_PROJECT = 'local-dev-project'; // Mock GCP project

// Create output directories if they don't exist
const outputDir = path.join(__dirname, 'output');
const researchDir = path.join(outputDir, 'research');
const contentDir = path.join(outputDir, 'content');
const imagesDir = path.join(outputDir, 'images');

const createDirIfNotExists = (dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating directory: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
};

createDirIfNotExists(outputDir);
createDirIfNotExists(researchDir);
createDirIfNotExists(contentDir);
createDirIfNotExists(imagesDir);

// Mock the storage implementation
const mockStorage = () => {
  const contentStoragePath = path.resolve(__dirname, 'src/utils/storage.js');
  
  // Check if original file exists
  if (!fs.existsSync(`${contentStoragePath}.original`)) {
    // Backup the original file
    fs.copyFileSync(contentStoragePath, `${contentStoragePath}.original`);
    console.log(`Backed up original storage implementation to ${contentStoragePath}.original`);
  }
  
  // Create mock implementation
  const mockImplementation = `
// MOCK STORAGE IMPLEMENTATION FOR LOCAL DEVELOPMENT
const fs = require('fs');
const path = require('path');

class ContentStorage {
  constructor() {
    this.outputDir = path.join(__dirname, '../../output');
    this.isInitialized = false;
    console.log('[STORAGE] Initializing mock storage service with directory:', this.outputDir);
  }

  async initialize() {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      this.isInitialized = true;
      console.log('[STORAGE] Successfully initialized mock storage with directory:', this.outputDir);
      return true;
    } catch (error) {
      console.error('[STORAGE] Mock storage initialization failed:', error);
      throw error;
    }
  }

  async storeContent(filePath, content, metadata = {}) {
    console.log('[STORAGE] Starting mock content storage process:', {
      filePath,
      contentSize: JSON.stringify(content).length,
      metadata
    });

    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    // Create full path
    const fullPath = path.join(this.outputDir, filePath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    try {
      // If content is a string and not JSON, write it directly
      if (typeof content === 'string' && !this.isValidJson(content)) {
        fs.writeFileSync(fullPath, content);
      } else {
        // Otherwise stringify the content object
        fs.writeFileSync(fullPath, JSON.stringify(content, null, 2));
      }
      
      // Also save metadata in a sidecar file
      const metadataPath = fullPath + '.metadata.json';
      fs.writeFileSync(metadataPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        contentLength: JSON.stringify(content).length,
        storagePath: filePath,
        ...metadata
      }, null, 2));
      
      console.log('[STORAGE] Successfully stored mock content:', {
        filePath,
        fullPath,
        timestamp: new Date().toISOString()
      });

      return filePath;
    } catch (error) {
      console.error('[STORAGE] Failed to store mock content:', {
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  async getContent(filePath) {
    console.log('[STORAGE] Attempting to retrieve mock content:', filePath);
    
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    try {
      const fullPath = path.join(this.outputDir, filePath);
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new Error(\`File not found: \${filePath}\`);
      }

      // Read content
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Read metadata if it exists
      const metadataPath = fullPath + '.metadata.json';
      let metadata = {};
      if (fs.existsSync(metadataPath)) {
        metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      }
      
      console.log('[STORAGE] Mock content retrieved successfully:', {
        filePath,
        fullPath,
        contentSize: content.length,
        isJson: this.isValidJson(content)
      });

      // Try to parse as JSON, if it's valid JSON
      let data;
      if (this.isValidJson(content)) {
        data = JSON.parse(content);
      } else {
        data = content;
      }

      return {
        data,
        metadata
      };
    } catch (error) {
      console.error('[STORAGE] Error retrieving mock content:', {
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  isValidJson(str) {
    try {
      JSON.parse(str);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = new ContentStorage();
  `;
  
  // Write the mock implementation
  fs.writeFileSync(contentStoragePath, mockImplementation);
  console.log('Replaced storage implementation with mock version for local development');
};

// Create a mock PAA service that returns mock data
const createMockPaaService = () => {
  const paaServicePath = path.resolve(__dirname, 'src/services/paa.service.js');
  
  // Check if original file exists
  if (!fs.existsSync(`${paaServicePath}.original`) && fs.existsSync(paaServicePath)) {
    // Backup the original file
    fs.copyFileSync(paaServicePath, `${paaServicePath}.original`);
    console.log(`Backed up original PAA service to ${paaServicePath}.original`);
  }
  
  const mockPaaService = `
// MOCK PAA SERVICE FOR LOCAL DEVELOPMENT
class PeopleAlsoAskService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('[PAA] Initializing mock PAA service');
    this.initialized = true;
    return true;
  }

  async getQuestions(keyword) {
    console.log('[PAA] Getting mock questions for:', keyword);
    
    return {
      keyword,
      results: [
        {
          question: \`What is the value of \${keyword}?\`,
          answer: \`The value of \${keyword} depends on factors like condition, rarity, and provenance. Prices typically range from $100 to $5,000 for common items, with rare pieces commanding much higher prices.\`
        },
        {
          question: \`How can I identify authentic \${keyword}?\`,
          answer: \`To identify authentic \${keyword}, look for maker's marks, examine materials and craftsmanship, research the design period, and consider getting an appraisal from a reputable antiques dealer.\`
        },
        {
          question: \`Where can I buy \${keyword}?\`,
          answer: \`You can purchase \${keyword} from antique shops, specialty dealers, auction houses, online marketplaces like eBay or Etsy, estate sales, and antique fairs or shows.\`
        },
        {
          question: \`How do I care for \${keyword}?\`,
          answer: \`To care for \${keyword}, keep it away from direct sunlight and extreme temperature changes, clean gently with appropriate methods for the material, handle with clean hands, and store properly to prevent damage.\`
        },
        {
          question: \`Are \${keyword} a good investment?\`,
          answer: \`\${keyword} can be a good investment if you focus on quality pieces with historical significance or from renowned makers. The market can fluctuate, so it's best to buy pieces you also enjoy for their aesthetic and historical value.\`
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new PeopleAlsoAskService();
  `;

  fs.writeFileSync(paaServicePath, mockPaaService);
  console.log('Created mock PAA service for local development');
};

// Create a mock SERP service that returns mock data
const createMockSerpService = () => {
  const serpServicePath = path.resolve(__dirname, 'src/services/serp.service.js');
  
  // Check if original file exists
  if (!fs.existsSync(`${serpServicePath}.original`) && fs.existsSync(serpServicePath)) {
    // Backup the original file
    fs.copyFileSync(serpServicePath, `${serpServicePath}.original`);
    console.log(`Backed up original SERP service to ${serpServicePath}.original`);
  }
  
  const mockSerpService = `
// MOCK SERP SERVICE FOR LOCAL DEVELOPMENT
class SerpService {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    console.log('[SERP] Initializing mock SERP service');
    this.initialized = true;
    return true;
  }

  async getSearchResults(keyword, volume = 0) {
    console.log('[SERP] Getting mock search results for:', keyword);
    
    return {
      keyword,
      volume,
      serp: [
        {
          title: \`Complete Guide to \${keyword}: Value, History, and Market Trends\`,
          url: \`https://www.example.com/antiques/\${keyword.replace(/\\s+/g, '-').toLowerCase()}\`,
          snippet: \`Comprehensive information about \${keyword} including value ranges, historical context, and current market trends. Learn what makes these items collectible and valuable.\`
        },
        {
          title: \`How to Identify Authentic \${keyword} - Collector's Guide\`,
          url: \`https://www.collectorsweekly.com/guides/\${keyword.replace(/\\s+/g, '-').toLowerCase()}\`,
          snippet: \`Expert tips for identifying authentic \${keyword}. Learn about maker's marks, materials, craftsmanship, and how to spot reproductions and fakes.\`
        },
        {
          title: \`\${keyword} for Sale | Top Rated Dealer | Authentic Pieces\`,
          url: \`https://www.antiquestore.com/shop/\${keyword.replace(/\\s+/g, '-').toLowerCase()}\`,
          snippet: \`Browse our selection of authentic \${keyword} with certificate of authenticity. We ship worldwide. Prices ranging from $200-$5000 based on condition and rarity.\`
        },
        {
          title: \`The History of \${keyword} - Museum Collection\`,
          url: \`https://www.museum.org/collections/\${keyword.replace(/\\s+/g, '-').toLowerCase()}\`,
          snippet: \`Explore the fascinating history of \${keyword} through our museum's digital collection. View rare examples from the 18th to early 20th century with detailed historical context.\`
        },
        {
          title: \`Recent Auction Results for \${keyword} - Price Guide\`,
          url: \`https://www.auctionhouse.com/results/\${keyword.replace(/\\s+/g, '-').toLowerCase()}\`,
          snippet: \`View recent auction results for \${keyword} from major auction houses. Price trends, notable sales, and market analysis updated monthly.\`
        }
      ],
      features: [
        "knowledge_panel",
        "related_questions",
        "images",
        "shopping_results"
      ],
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new SerpService();
  `;

  fs.writeFileSync(serpServicePath, mockSerpService);
  console.log('Created mock SERP service for local development');
};

// Create a script to restore the original storage implementation
const createRestoreScript = () => {
  const restoreScript = `
// Script to restore original storage implementation
const fs = require('fs');
const path = require('path');

const contentStoragePath = path.resolve(__dirname, 'src/utils/storage.js');
const originalPath = \`\${contentStoragePath}.original\`;

if (fs.existsSync(originalPath)) {
  fs.copyFileSync(originalPath, contentStoragePath);
  console.log('Restored original storage implementation');
} else {
  console.error('Original storage implementation backup not found');
}

// Restore PAA service
const paaServicePath = path.resolve(__dirname, 'src/services/paa.service.js');
const originalPaaPath = \`\${paaServicePath}.original\`;

if (fs.existsSync(originalPaaPath)) {
  fs.copyFileSync(originalPaaPath, paaServicePath);
  console.log('Restored original PAA service');
} else {
  console.log('Original PAA service backup not found');
}

// Restore SERP service
const serpServicePath = path.resolve(__dirname, 'src/services/serp.service.js');
const originalSerpPath = \`\${serpServicePath}.original\`;

if (fs.existsSync(originalSerpPath)) {
  fs.copyFileSync(originalSerpPath, serpServicePath);
  console.log('Restored original SERP service');
} else {
  console.log('Original SERP service backup not found');
}
  `;
  
  fs.writeFileSync('restore-services.js', restoreScript);
  console.log('Created restore-services.js script to restore original implementations');
};

// Apply mock implementations and create restore script
mockStorage();
createMockPaaService();
createMockSerpService();
createRestoreScript();

// Log the development mode
console.log('Starting WP2HUGO in DEVELOPMENT mode');
console.log('Mock data is ENABLED');
console.log('Local storage implementation is ACTIVE');

// Start the server
require('./src/server.js'); 