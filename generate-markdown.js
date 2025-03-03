#!/usr/bin/env node

/**
 * Markdown Generation Script
 * 
 * This script generates markdown content from optimized content data.
 * It combines all the data into a formatted markdown file ready for publishing.
 * It now supports multiple images throughout the content.
 * 
 * Usage: node generate-markdown.js "your keyword" [options]
 * Options:
 *   --force-api      Force use of real APIs instead of mock clients
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const slugify = require('./src/utils/slugify');
const imageGenerationService = require('./src/services/image-generation.service');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Markdown Generation Script

Usage: node ${path.basename(__filename)} "your keyword" [options]
Options:
  --force-api      Force use of real APIs instead of mock clients
  --help, -h       Show this help message
  `);
  process.exit(0);
}

// Extract the keyword and options
const keyword = args[0];
const forceApi = args.includes('--force-api');

/**
 * Main function to generate markdown
 */
async function generateMarkdown(keyword, forceApi = false) {
  console.log(`[INFO] Generating markdown for: "${keyword}"`);
  
  try {
    // Set force API flag if specified
    if (forceApi) {
      console.log('[INFO] Forcing to use API data even when cache exists');
      imageGenerationService.setForceApi(true);
    }
    
    // Create output directories if they don't exist
    const outputDir = path.join(process.cwd(), 'output');
    const optimizedDir = path.join(outputDir, 'optimized');
    const markdownDir = path.join(outputDir, 'markdown');
    
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(optimizedDir, { recursive: true });
    await fs.mkdir(markdownDir, { recursive: true });
    
    // Load optimized content
    const slug = slugify(keyword);
    const optimizedPath = path.join(optimizedDir, `${slug}.json`);
    
    console.log(`[INFO] Loading optimized content from: ${optimizedPath}`);
    const optimizedContent = JSON.parse(await fs.readFile(optimizedPath, 'utf8'));
    
    // Load image data if available
    let imageData = null;
    let multipleImages = null;
    
    // Check for multi-image data first
    const multiImagePath = path.join(outputDir, 'images', `${slug}-images.json`);
    const singleImagePath = path.join(outputDir, 'images', `${slug}-image.json`);
    
    try {
      // Try to load multiple images first
      const multiImageFileExists = await fs.access(multiImagePath).then(() => true).catch(() => false);
      if (multiImageFileExists) {
        console.log(`[INFO] Loading multiple image data from: ${multiImagePath}`);
        multipleImages = JSON.parse(await fs.readFile(multiImagePath, 'utf8'));
        
        // Still set imageData for backward compatibility
        imageData = {
          imageUrl: multipleImages.mainImage,
          timestamp: multipleImages.timestamp
        };
      } else {
        // Fall back to single image if multiple image file doesn't exist
        const singleImageFileExists = await fs.access(singleImagePath).then(() => true).catch(() => false);
        if (singleImageFileExists) {
          console.log(`[INFO] Loading single image data from: ${singleImagePath}`);
          imageData = JSON.parse(await fs.readFile(singleImagePath, 'utf8'));
          
          // Create a compatible structure
          multipleImages = {
            mainImage: imageData.imageUrl,
            images: [{ imageUrl: imageData.imageUrl, aspect: 'main' }],
            timestamp: imageData.timestamp
          };
        }
      }
    } catch (error) {
      console.warn(`[WARNING] Error loading image data: ${error.message}`);
    }
    
    // Generate markdown content
    const markdown = await generateMarkdownContent(keyword, optimizedContent, imageData, multipleImages);
    
    // Save to file
    const markdownPath = path.join(markdownDir, `${slug}.md`);
    console.log(`[INFO] Saving markdown to: ${markdownPath}`);
    await fs.writeFile(markdownPath, markdown, 'utf8');
    
    console.log(`[SUCCESS] Markdown generated successfully for "${keyword}"`);
    return markdownPath;
  } catch (error) {
    console.error(`[ERROR] Failed to generate markdown: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Generate markdown content from data
 */
async function generateMarkdownContent(keyword, content, imageData, multipleImages) {
  console.log(`[INFO] Formatting markdown content for "${keyword}"`);
  
  // Generate frontmatter
  const frontmatter = generateFrontmatter(keyword, content, imageData);
  
  // Handle either direct body property or content array
  let body = '';
  
  if (content.body) {
    // Direct body property - need to inject images into the content
    body = injectImagesIntoContent(content.body, multipleImages);
  } else if (content.content && Array.isArray(content.content)) {
    // Content array structure - need to inject images at appropriate sections
    body = processContentArrayWithImages(content.content, multipleImages);
  } else {
    // Fallback content with image if available
    body = `# ${content.title || content.seoTitle || `Complete Guide to ${keyword}`}\n\n`;
    if (multipleImages && multipleImages.images && multipleImages.images.length > 0) {
      body += `![${keyword}](${multipleImages.mainImage})\n\n`;
    }
    body += `This is a comprehensive guide about ${keyword}. More content will be added soon.`;
  }
  
  // If body doesn't start with a title, add one
  if (!body.startsWith('# ')) {
    body = `# ${content.title || content.seoTitle || keyword}\n\n${body}`;
  }
  
  // Add an image gallery at the end if we have multiple images
  if (multipleImages && multipleImages.images && multipleImages.images.length > 1) {
    body += `\n\n## Image Gallery\n\n`;
    body += `Explore our visual guide to ${keyword} with these carefully selected images.\n\n`;
    
    // Add the gallery shortcode
    const imageUrls = multipleImages.images.map(img => img.imageUrl).join(',');
    body += `{{< image-gallery images="${imageUrls}" alt="${keyword}" >}}\n\n`;
  }
  
  // Combine frontmatter and body
  return `${frontmatter}\n${body}`;
}

/**
 * Inject images into content text at appropriate locations
 */
function injectImagesIntoContent(contentText, multipleImages) {
  if (!multipleImages || !multipleImages.images || multipleImages.images.length <= 1) {
    return contentText; // No additional images to inject
  }
  
  // Skip the main image (index 0) as it's already in the frontmatter
  const additionalImages = multipleImages.images.slice(1);
  if (additionalImages.length === 0) {
    return contentText;
  }
  
  // Split the content by paragraphs
  const paragraphs = contentText.split('\n\n');
  
  // Determine good insertion points - after headings or every ~5-7 paragraphs
  const insertionPoints = [];
  
  // Find all heading positions
  paragraphs.forEach((para, index) => {
    if (para.startsWith('#') && index > 1) { // Skip inserting after the title
      insertionPoints.push(index);
    }
  });
  
  // If we don't have enough heading positions, add more insertion points
  if (insertionPoints.length < additionalImages.length) {
    // Find how many paragraphs to skip between images
    const parasPerImage = Math.max(5, Math.floor(paragraphs.length / (additionalImages.length + 1)));
    
    // Add additional insertion points
    for (let i = parasPerImage; i < paragraphs.length; i += parasPerImage) {
      if (!insertionPoints.includes(i)) {
        insertionPoints.push(i);
        if (insertionPoints.length >= additionalImages.length) break;
      }
    }
  }
  
  // Sort insertion points in ascending order
  insertionPoints.sort((a, b) => a - b);
  
  // Take only as many insertion points as we have images
  const finalInsertionPoints = insertionPoints.slice(0, additionalImages.length);
  
  // Insert images at the determined points
  finalInsertionPoints.forEach((point, index) => {
    const image = additionalImages[index];
    const imageMarkdown = `\n\n![${image.aspect || 'Image'} related to ${multipleImages.keyword}](${image.imageUrl})\n\n`;
    paragraphs.splice(point + index, 0, imageMarkdown);
  });
  
  // Join paragraphs back together
  return paragraphs.join('\n\n');
}

/**
 * Process content array into markdown with images
 */
function processContentArrayWithImages(contentArray, multipleImages) {
  let markdown = '';
  let imageIndex = 1; // Start with the second image, as the first is in the frontmatter
  
  // Get additional images if available
  const additionalImages = multipleImages && multipleImages.images && multipleImages.images.length > 1 
    ? multipleImages.images.slice(1) 
    : [];
  
  // Determine where to put images - roughly estimate how many sections we have
  let sectionCount = contentArray.filter(item => 
    item.type === 'section' || item.type === 'introduction' || item.type === 'conclusion'
  ).length;
  
  // Calculate interval for image insertion
  const imageInterval = additionalImages.length > 0 
    ? Math.max(1, Math.floor(sectionCount / (additionalImages.length + 1)))
    : 0;
  
  let sectionCounter = 0;
  
  for (const item of contentArray) {
    switch (item.type) {
      case 'introduction':
        markdown += `${item.text}\n\n`;
        
        // Add an image after the introduction if we have one
        if (additionalImages.length > 0 && imageIndex < additionalImages.length) {
          const image = additionalImages[imageIndex - 1];
          markdown += `![${image.aspect || 'Image'} related to ${multipleImages.keyword}](${image.imageUrl})\n\n`;
          imageIndex++;
        }
        break;
        
      case 'section':
        sectionCounter++;
        
        // Add section heading
        const headingLevel = '#'.repeat(item.level || 2);
        markdown += `${headingLevel} ${item.heading}\n\n`;
        
        // Add paragraphs
        if (item.paragraphs && Array.isArray(item.paragraphs)) {
          for (const paragraph of item.paragraphs) {
            markdown += `${paragraph}\n\n`;
          }
        }
        
        // Add FAQs if present
        if (item.faq && Array.isArray(item.faq)) {
          for (const faqItem of item.faq) {
            markdown += `**${faqItem.question}**\n\n${faqItem.answer}\n\n`;
          }
        }
        
        // Add an image after this section if it's the right interval
        if (additionalImages.length > 0 && imageIndex <= additionalImages.length && sectionCounter % imageInterval === 0) {
          const image = additionalImages[imageIndex - 1];
          markdown += `![${image.aspect || 'Image'} related to ${multipleImages.keyword}](${image.imageUrl})\n\n`;
          imageIndex++;
        }
        break;
        
      case 'conclusion':
        markdown += `## Conclusion\n\n${item.text}\n\n`;
        
        // Add final image if we still have one
        if (additionalImages.length > 0 && imageIndex <= additionalImages.length) {
          const image = additionalImages[imageIndex - 1];
          markdown += `![${image.aspect || 'Image'} related to ${multipleImages.keyword}](${image.imageUrl})\n\n`;
          imageIndex++;
        }
        break;
        
      default:
        // For any other type, just add the text if available
        if (item.text) {
          markdown += `${item.text}\n\n`;
        }
    }
  }
  
  return markdown;
}

/**
 * Generate frontmatter
 */
function generateFrontmatter(keyword, content, imageData) {
  const date = new Date().toISOString();
  const title = content.title || content.seoTitle || keyword;
  const description = content.description || content.metaDescription || '';
  const imageUrl = imageData?.imageUrl || '';
  
  // Extract tags from content
  let tags = [keyword];
  if (content.tags && Array.isArray(content.tags)) {
    tags = [...new Set([...tags, ...content.tags])];
  }
  
  // Format frontmatter
  return `---
title: "${title}"
date: ${date}
description: "${description}"
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
image: "${imageUrl}"
---`;
}

// Run the main function if this script is executed directly
if (require.main === module) {
  generateMarkdown(keyword, forceApi)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { generateMarkdown }; 