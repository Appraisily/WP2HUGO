/**
 * File Utility Functions
 * 
 * Provides helper functions for file operations used throughout the application.
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Get all markdown files from a directory
 * @param {string} directory - Directory to search
 * @returns {Promise<Array>} - Array of markdown filenames
 */
async function getMarkdownFiles(directory) {
  try {
    // Make sure the directory exists
    await fs.mkdir(directory, { recursive: true });
    
    // Get all files in directory
    const files = await fs.readdir(directory);
    
    // Filter to only include markdown files
    return files.filter(file => 
      file.endsWith('.md') || file.endsWith('.markdown')
    );
  } catch (error) {
    console.error(`Error getting markdown files from ${directory}:`, error);
    return [];
  }
}

/**
 * Read content from a markdown file
 * @param {string} filePath - Path to markdown file
 * @returns {Promise<string>} - File content
 */
async function readMarkdownFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    console.error(`Error reading markdown file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Extract frontmatter from markdown content
 * @param {string} content - Markdown content
 * @returns {object|null} - Frontmatter as object or null if not found
 */
function extractFrontmatter(content) {
  try {
    // Check if content has frontmatter
    if (!content.startsWith('---')) {
      return null;
    }
    
    // Extract frontmatter section
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    
    if (!frontmatterMatch) {
      return null;
    }
    
    const frontmatterText = frontmatterMatch[1];
    const frontmatter = {};
    
    // Parse frontmatter lines
    frontmatterText.split('\n').forEach(line => {
      const colonIndex = line.indexOf(':');
      
      if (colonIndex > 0) {
        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();
        
        // Handle quoted values
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        // Handle array values
        if (value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // If parsing fails, keep as string
            value = value.slice(1, -1).split(',').map(item => item.trim());
          }
        }
        
        // Handle boolean values
        if (value === 'true') value = true;
        if (value === 'false') value = false;
        
        // Handle numeric values
        if (!isNaN(value) && value !== '') {
          value = Number(value);
        }
        
        frontmatter[key] = value;
      }
    });
    
    return frontmatter;
  } catch (error) {
    console.error('Error extracting frontmatter:', error);
    return null;
  }
}

/**
 * Save content to markdown file with frontmatter
 * @param {string} filePath - Path to markdown file
 * @param {object} frontmatter - Frontmatter data
 * @param {string} content - Markdown content
 * @returns {Promise<void>}
 */
async function saveMarkdownFile(filePath, frontmatter, content) {
  try {
    // Convert frontmatter to YAML format
    let frontmatterText = '---\n';
    
    for (const [key, value] of Object.entries(frontmatter)) {
      if (typeof value === 'string' && (value.includes(':') || value.includes('"'))) {
        // Quote strings containing colons or quotes
        frontmatterText += `${key}: "${value.replace(/"/g, '\\"')}"\n`;
      } else if (Array.isArray(value)) {
        // Handle arrays
        frontmatterText += `${key}: [${value.join(', ')}]\n`;
      } else {
        // Handle regular values
        frontmatterText += `${key}: ${value}\n`;
      }
    }
    
    frontmatterText += '---\n\n';
    
    // Combine frontmatter and content
    const fileContent = frontmatterText + content;
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    
    // Write to file
    await fs.writeFile(filePath, fileContent, 'utf8');
  } catch (error) {
    console.error(`Error saving markdown file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Path to directory
 * @returns {Promise<boolean>} - True if directory exists or was created
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    return false;
  }
}

module.exports = {
  getMarkdownFiles,
  readMarkdownFile,
  extractFrontmatter,
  saveMarkdownFile,
  fileExists,
  ensureDirectoryExists
}; 