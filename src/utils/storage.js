const { Storage } = require('@google-cloud/storage');

class ContentStorage {
  constructor() {
    this.storage = new Storage();
    // Use the HUGO_BUCKET environment variable, fallback to a default if not provided
    this.bucketName = process.env.HUGO_BUCKET || 'hugo-posts-content';
    this.isInitialized = false;
    this.bucket = null;
    console.log('[STORAGE] Initializing storage service with bucket:', this.bucketName);
  }

  async initialize() {
    try {
      console.log('[STORAGE] Attempting to connect to bucket:', this.bucketName);
      const [bucket] = await this.storage.bucket(this.bucketName).get();
      await bucket.exists(); // Verify bucket access
      this.bucket = bucket;
      this.isInitialized = true;
      
      console.log('[STORAGE] Successfully initialized bucket:', this.bucketName);
      return true;
    } catch (error) {
      console.error('[STORAGE] Initialization failed for bucket:', this.bucketName, error);
      
      // Fall back to mock storage if bucket access fails
      console.log('[STORAGE] Falling back to mock storage');
      return this.initializeMockStorage();
    }
  }

  async initializeMockStorage() {
    try {
      const fs = require('fs');
      const path = require('path');
      this.outputDir = path.join(__dirname, '../../output');
      
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      this.isInitialized = true;
      this.isMockStorage = true;
      console.log('[STORAGE] Successfully initialized mock storage with directory:', this.outputDir);
      return true;
    } catch (error) {
      console.error('[STORAGE] Mock storage initialization failed:', error);
      throw error;
    }
  }

  async storeContent(filePath, content, metadata = {}) {
    console.log('[STORAGE] Starting content storage process:', {
      filePath,
      contentSize: typeof content === 'string' ? content.length : JSON.stringify(content).length,
      metadata,
      isInitialized: this.isInitialized
    });

    if (!this.isInitialized) {
      throw new Error('Storage not initialized');
    }

    // If using mock storage, handle differently
    if (this.isMockStorage) {
      return this.storeContentMock(filePath, content, metadata);
    }

    // Ensure parent directory exists for batch processing
    await this.ensureDirectoryExists(filePath);

    const file = this.bucket.file(filePath);
    
    // Convert content to string if it's not already
    const contentString = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    
    const fileMetadata = {
      contentType: typeof content === 'string' && !this.isValidJson(content) ? 'text/plain' : 'application/json',
      metadata: {
        timestamp: new Date().toISOString(),
        contentLength: contentString.length,
        storagePath: filePath,
        ...metadata
      }
    };

    try {
      console.log('[STORAGE] Attempting to save file with metadata:', fileMetadata);
      await file.save(contentString, {
        metadata: fileMetadata,
        resumable: false
      });
      
      console.log('[STORAGE] Successfully stored content:', {
        filePath,
        timestamp: fileMetadata.metadata.timestamp
      });

      return filePath;
    } catch (error) {
      console.error('[STORAGE] Failed to store content:', {
        filePath,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async storeContentMock(filePath, content, metadata = {}) {
    const fs = require('fs');
    const path = require('path');
    
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

  // Method to ensure directory exists for batch processing
  async ensureDirectoryExists(filePath) {
    if (!filePath.includes('/')) {
      return; // No directory to create
    }

    const dirPath = filePath.split('/').slice(0, -1).join('/') + '/';
    
    // Create a placeholder file to represent the directory
    const dirFile = this.bucket.file(dirPath + '.directory_placeholder');
    
    try {
      const [exists] = await dirFile.exists();
      if (!exists) {
        console.log('[STORAGE] Creating directory:', dirPath);
        await dirFile.save('', { resumable: false });
      }
    } catch (error) {
      // Ignore errors - GCS doesn't actually need directories
      console.log('[STORAGE] Note: GCS doesn\'t require actual directories');
    }
  }

  async getContent(filePath) {
    console.log('[STORAGE] Attempting to retrieve content:', filePath);
    
    if (!this.isInitialized) {
      throw new Error('Storage service not initialized');
    }

    // If using mock storage, handle differently
    if (this.isMockStorage) {
      return this.getContentMock(filePath);
    }

    try {
      const file = this.bucket.file(filePath);
      
      // Check if file exists before attempting download
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      console.log('[STORAGE] File found, retrieving content...');
      const [content] = await file.download();
      
      const contentString = content.toString();
      console.log('[STORAGE] Content retrieved successfully:', {
        filePath,
        contentSize: contentString.length,
        isJson: this.isValidJson(contentString)
      });

      // Try to parse as JSON, if it's valid JSON
      let data;
      if (this.isValidJson(contentString)) {
        data = JSON.parse(contentString);
      } else {
        data = contentString;
      }

      // Get file metadata
      const [metadata] = await file.getMetadata();

      return {
        data,
        metadata: metadata.metadata || {}
      };
    } catch (error) {
      console.error('[STORAGE] Error retrieving content:', {
        filePath,
        error: {
          message: error.message,
          code: error.code,
          stack: error.stack
        }
      });
      throw error;
    }
  }

  async getContentMock(filePath) {
    const fs = require('fs');
    const path = require('path');
    
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
  