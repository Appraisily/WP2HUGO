const { Storage } = require('@google-cloud/storage');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config');
const slugify = require('./slugify');

class ContentStorage {
  constructor() {
    this.initialized = false;
    this.storage = null;
    this.bucket = null;
    this.bucketName = null;
    this.outputDir = null;
  }

  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Initialize Google Cloud Storage
      this.bucketName = config.storage.gcs.bucketName;
      
      console.log('[STORAGE] Initializing Google Cloud Storage with bucket:', this.bucketName);
      
      this.storage = new Storage();
      this.bucket = this.storage.bucket(this.bucketName);
      
      // Check if bucket exists and is accessible
      try {
        await this.bucket.exists();
        console.log('[STORAGE] Successfully connected to GCS bucket:', this.bucketName);
      } catch (bucketError) {
        console.error('[STORAGE] Could not access GCS bucket:', bucketError.message);
        throw new Error(`Failed to access GCS bucket ${this.bucketName}: ${bucketError.message}`);
      }
      
      // Setup local storage directory as well for fallback or caching
      this.outputDir = config.storage.local.basePath || path.join(process.cwd(), 'data');
      await fs.ensureDir(this.outputDir);
      console.log('[STORAGE] Local storage directory:', this.outputDir);
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[STORAGE] Storage initialization failed:', error);
      throw error;
    }
  }

  async storeContent(filePath, content, metadata = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Normalize file path to prevent path traversal issues
      const normalizedPath = this.normalizePath(filePath);
      console.log(`[STORAGE] Storing content at path: ${normalizedPath}`);
      
      // Store content as is if it's a Buffer, otherwise stringify if it's an object
      let contentToStore = content;
      if (!Buffer.isBuffer(content) && typeof content === 'object') {
        contentToStore = JSON.stringify(content, null, 2);
      }
      
      // Store in Cloud Storage
      const file = this.bucket.file(normalizedPath);
      const options = {
        metadata: {
          contentType: this.getContentType(normalizedPath, metadata),
          metadata: { ...metadata }
        }
      };
      
      // Save to GCS
      await file.save(contentToStore, options);
      console.log(`[STORAGE] Content successfully stored in GCS at: ${normalizedPath}`);
      
      // Also save to local filesystem for caching purposes
      const localPath = path.join(this.outputDir, normalizedPath);
      await fs.ensureDir(path.dirname(localPath));
      
      if (Buffer.isBuffer(contentToStore)) {
        await fs.writeFile(localPath, contentToStore);
      } else {
        await fs.writeFile(localPath, contentToStore, 'utf8');
      }
      
      console.log(`[STORAGE] Content also cached locally at: ${localPath}`);
      
      return {
        path: normalizedPath,
        url: `https://storage.googleapis.com/${this.bucketName}/${normalizedPath}`,
        metadata: options.metadata
      };
    } catch (error) {
      console.error('[STORAGE] Failed to store content:', error.message);
      throw error;
    }
  }

  async getContent(filePath) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Normalize the path
      const normalizedPath = this.normalizePath(filePath);
      console.log(`[STORAGE] Retrieving content from path: ${normalizedPath}`);
      
      // Try to get from GCS
      let content = null;
      let metadata = null;
      
      try {
        const file = this.bucket.file(normalizedPath);
        const [exists] = await file.exists();
        
        if (exists) {
          const [fileContent] = await file.download();
          const [fileMetadata] = await file.getMetadata();
          content = fileContent;
          metadata = fileMetadata;
          console.log(`[STORAGE] Retrieved content from GCS: ${normalizedPath}`);
        } else {
          console.log(`[STORAGE] File not found in GCS: ${normalizedPath}`);
          
          // Try local filesystem as fallback
          const localPath = path.join(this.outputDir, normalizedPath);
          if (await fs.pathExists(localPath)) {
            content = await fs.readFile(localPath);
            console.log(`[STORAGE] Retrieved content from local filesystem: ${localPath}`);
          } else {
            throw new Error(`Content not found at path: ${normalizedPath}`);
          }
        }
      } catch (gcsError) {
        console.warn(`[STORAGE] Error retrieving from GCS: ${gcsError.message}`);
        
        // Try local filesystem as fallback
        const localPath = path.join(this.outputDir, normalizedPath);
        if (await fs.pathExists(localPath)) {
          content = await fs.readFile(localPath);
          console.log(`[STORAGE] Retrieved content from local filesystem: ${localPath}`);
        } else {
          throw new Error(`Content not found at path: ${normalizedPath}`);
        }
      }
      
      // Parse JSON content if the content appears to be JSON
      if (content && !Buffer.isBuffer(content)) {
        const contentString = content.toString('utf8');
        if (contentString.trim().startsWith('{') || contentString.trim().startsWith('[')) {
          try {
            content = JSON.parse(contentString);
          } catch (parseError) {
            console.warn(`[STORAGE] Content appears to be JSON but could not be parsed:`, parseError.message);
            // Keep as string if parsing fails
          }
        }
      }
      
      return {
        data: content,
        metadata: metadata,
        path: normalizedPath
      };
    } catch (error) {
      console.error('[STORAGE] Error retrieving content:', error.message);
      throw error;
    }
  }

  async deleteContent(filePath) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Normalize the path
      const normalizedPath = this.normalizePath(filePath);
      console.log(`[STORAGE] Deleting content at path: ${normalizedPath}`);
      
      // Delete from GCS
      const file = this.bucket.file(normalizedPath);
      try {
        await file.delete();
        console.log(`[STORAGE] Successfully deleted from GCS: ${normalizedPath}`);
      } catch (gcsError) {
        console.warn(`[STORAGE] Error deleting from GCS: ${gcsError.message}`);
      }
      
      // Delete from local filesystem if it exists
      const localPath = path.join(this.outputDir, normalizedPath);
      if (await fs.pathExists(localPath)) {
        await fs.remove(localPath);
        console.log(`[STORAGE] Successfully deleted from local filesystem: ${localPath}`);
      }
      
      return true;
    } catch (error) {
      console.error('[STORAGE] Error deleting content:', error.message);
      throw error;
    }
  }

  async listContent(prefix = '') {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      console.log(`[STORAGE] Listing content with prefix: ${prefix}`);
      
      // List files from GCS
      const [files] = await this.bucket.getFiles({ prefix });
      
      const fileList = files.map(file => ({
        name: file.name,
        size: parseInt(file.metadata.size),
        updated: file.metadata.updated,
        contentType: file.metadata.contentType
      }));
      
      console.log(`[STORAGE] Successfully listed ${fileList.length} files from GCS with prefix: ${prefix}`);
      
      return fileList;
    } catch (error) {
      console.error('[STORAGE] Error listing content:', error.message);
      throw error;
    }
  }

  // Helper function to normalize file paths
  normalizePath(filePath) {
    // Ensure path starts without leading slash
    let normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
    
    // Replace any Windows-style backslashes with forward slashes
    normalizedPath = normalizedPath.replace(/\\/g, '/');
    
    // Replace any double slashes with single slashes
    normalizedPath = normalizedPath.replace(/\/+/g, '/');
    
    return normalizedPath;
  }

  // Helper function to determine content type
  getContentType(filePath, metadata = {}) {
    if (metadata.contentType) {
      return metadata.contentType;
    }
    
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.json':
        return 'application/json';
      case '.txt':
        return 'text/plain';
      case '.html':
        return 'text/html';
      case '.htm':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
        return 'application/javascript';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.gif':
        return 'image/gif';
      case '.webp':
        return 'image/webp';
      case '.svg':
        return 'image/svg+xml';
      case '.md':
        return 'text/markdown';
      case '.pdf':
        return 'application/pdf';
      case '.xml':
        return 'application/xml';
      case '.zip':
        return 'application/zip';
      default:
        return 'application/octet-stream';
    }
  }
}

module.exports = new ContentStorage();
  