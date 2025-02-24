const { Storage } = require('@google-cloud/storage');

class BaseStorageService {
  constructor(bucketName) {
    this.storage = new Storage();
    this.bucketName = bucketName;
    this.isInitialized = false;
    this.bucket = null;
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
      console.error('[STORAGE] Initialization failed for bucket:', this.bucketName);
      throw error;
    }
  }

  async store(filePath, content, metadata = {}) {
    if (!this.isInitialized || !this.bucket) {
      throw new Error('Storage not initialized');
    }

    const file = this.bucket.file(filePath);
    
    const fileMetadata = {
      contentType: 'application/json',
      metadata: {
        timestamp: new Date().toISOString(),
        contentLength: JSON.stringify(content).length,
        storagePath: filePath,
        ...metadata
      }
    };

    try {
      await file.save(JSON.stringify(content, null, 2), {
        metadata: fileMetadata,
        resumable: false
      });

      // Verify the file was saved
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('File verification failed after save');
      }

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

  async get(filePath) {
    if (!this.bucket) {
      throw new Error('Storage service not initialized');
    }

    try {
      const file = this.bucket.file(filePath);
      
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error(`File not found: ${filePath}`);
      }

      const [content] = await file.download();
      return JSON.parse(content.toString());
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

  async delete(filePath) {
    if (!this.bucket) {
      throw new Error('Storage service not initialized');
    }

    try {
      const file = this.bucket.file(filePath);
      await file.delete();
      return true;
    } catch (error) {
      console.error('[STORAGE] Error deleting file:', {
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  async list(prefix) {
    if (!this.bucket) {
      throw new Error('Storage service not initialized');
    }

    try {
      const [files] = await this.bucket.getFiles({ prefix });
      return files.map(file => ({
        name: file.name,
        metadata: file.metadata
      }));
    } catch (error) {
      console.error('[STORAGE] Error listing files:', {
        prefix,
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = BaseStorageService;