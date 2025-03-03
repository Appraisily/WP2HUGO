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
  `;
  
  fs.writeFileSync('restore-storage.js', restoreScript);
  console.log('Created restore-storage.js script to restore original implementation');
};

// Apply mock storage implementation and create restore script
mockStorage();
createRestoreScript();

// Log the development mode
console.log('Starting WP2HUGO in DEVELOPMENT mode');
console.log('Mock data is ENABLED');
console.log('Local storage implementation is ACTIVE');

// Start the server
require('./src/server.js'); 