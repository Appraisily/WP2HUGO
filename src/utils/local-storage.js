const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class LocalStorage {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    try {
      // Create output directories if they don't exist
      if (config.paths.output) await this.ensureDirectoryExists(config.paths.output);
      if (config.paths.research) await this.ensureDirectoryExists(config.paths.research);
      if (config.paths.content) await this.ensureDirectoryExists(config.paths.content);
      if (config.paths.hugoContent) await this.ensureDirectoryExists(config.paths.hugoContent);
      
      console.log('[LOCAL-STORAGE] Local storage initialized successfully');
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[LOCAL-STORAGE] Failed to initialize local storage:', error);
      throw error;
    }
  }

  async ensureDirectoryExists(dirPath) {
    try {
      if (!dirPath) {
        console.error('[LOCAL-STORAGE] Invalid directory path: undefined or null');
        return false;
      }
      await fs.mkdir(dirPath, { recursive: true });
      return true;
    } catch (error) {
      console.error(`[LOCAL-STORAGE] Error creating directory ${dirPath}:`, error);
      throw error;
    }
  }

  async saveFile(filePath, data) {
    try {
      // Ensure directory exists
      const dirPath = path.dirname(filePath);
      await this.ensureDirectoryExists(dirPath);
      
      // If data is an object, stringify it
      const fileData = typeof data === 'object' ? JSON.stringify(data, null, 2) : data;
      
      // Write file
      await fs.writeFile(filePath, fileData, 'utf8');
      console.log(`[LOCAL-STORAGE] File saved: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`[LOCAL-STORAGE] Error saving file ${filePath}:`, error);
      throw error;
    }
  }

  async readFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(data);
      } catch (e) {
        // If not JSON, return as is
        return data;
      }
    } catch (error) {
      console.error(`[LOCAL-STORAGE] Error reading file ${filePath}:`, error);
      throw error;
    }
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async listFiles(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      return files;
    } catch (error) {
      console.error(`[LOCAL-STORAGE] Error listing files in ${dirPath}:`, error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
      console.log(`[LOCAL-STORAGE] File deleted: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`[LOCAL-STORAGE] Error deleting file ${filePath}:`, error);
      throw error;
    }
  }
}

module.exports = new LocalStorage(); 