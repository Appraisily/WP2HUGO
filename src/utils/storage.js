
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
        throw new Error(`File not found: ${filePath}`);
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
  