/**
 * Export to Hugo Script
 * 
 * This script exports the generated markdown files to a Hugo site.
 * 
 * Usage:
 * - Export all files:         node export-to-hugo.js /path/to/hugo/content
 * - Export a specific keyword: node export-to-hugo.js /path/to/hugo/content "your keyword"
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const config = require('./src/config');
const slugify = require('./src/utils/slugify');

// Main function
async function main() {
  try {
    // Get Hugo content path from command line or use default
    const hugoContentPath = process.argv[2];
    const keyword = process.argv[3];
    
    if (!hugoContentPath) {
      console.error('Error: Hugo content path not provided');
      console.error('Usage: node export-to-hugo.js /path/to/hugo/content [keyword]');
      process.exit(1);
    }
    
    // Check if the Hugo content path exists
    try {
      await fs.access(hugoContentPath);
    } catch (error) {
      console.error(`Error: Hugo content path "${hugoContentPath}" does not exist`);
      process.exit(1);
    }
    
    // Check if the path is a directory
    const stats = await fs.stat(hugoContentPath);
    if (!stats.isDirectory()) {
      console.error(`Error: "${hugoContentPath}" is not a directory`);
      process.exit(1);
    }
    
    // Create posts directory in Hugo content if it doesn't exist
    const hugoPostsPath = path.join(hugoContentPath, 'posts');
    await fs.mkdir(hugoPostsPath, { recursive: true });
    
    console.log(`Exporting markdown files to Hugo site at "${hugoPostsPath}"`);
    
    // Get markdown files
    const markdownDir = config.paths.markdown;
    const files = await fs.readdir(markdownDir);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    if (markdownFiles.length === 0) {
      console.log('No markdown files found. Run the markdown generation script first.');
      return;
    }
    
    // Filter files if a specific keyword is provided
    let filesToExport = markdownFiles;
    if (keyword) {
      const slug = slugify(keyword);
      filesToExport = markdownFiles.filter(file => file === `${slug}.md`);
      
      if (filesToExport.length === 0) {
        console.error(`No markdown file found for keyword "${keyword}"`);
        process.exit(1);
      }
    }
    
    console.log(`Found ${filesToExport.length} markdown files to export`);
    
    // Copy each file to Hugo posts directory
    let exportedCount = 0;
    for (const file of filesToExport) {
      const sourcePath = path.join(markdownDir, file);
      const destPath = path.join(hugoPostsPath, file);
      
      try {
        // Read the source file
        const content = await fs.readFile(sourcePath, 'utf-8');
        
        // Write to destination
        await fs.writeFile(destPath, content, 'utf-8');
        
        console.log(`Exported: ${file}`);
        exportedCount++;
      } catch (error) {
        console.error(`Error exporting file ${file}:`, error);
      }
    }
    
    console.log(`\nExport completed successfully. Exported ${exportedCount} files.`);
    console.log(`Files are available in: ${hugoPostsPath}`);
    
  } catch (error) {
    console.error('Error exporting to Hugo:', error);
    process.exit(1);
  }
}

// Run the script
main(); 