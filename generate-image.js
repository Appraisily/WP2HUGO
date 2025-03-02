#!/usr/bin/env node

/**
 * Image Generation Script
 * 
 * This script generates an image for a given keyword using the image generation service.
 * It handles calling the service, saving the response, and updating the necessary files.
 * 
 * Usage: node generate-image.js "keyword" [options]
 * Options:
 *   --force-api      Force use of real API instead of mock client
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { performance } = require('perf_hooks');

// Parse command-line arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Image Generation Script

Usage: node ${path.basename(__filename)} "keyword" [options]
Options:
  --force-api      Force use of real API instead of mock client
  --help, -h       Show this help message
  `);
  process.exit(0);
}

// Extract the keyword and options
const keyword = args[0];
const forceApi = args.includes('--force-api');

// Define the image service URL from environment variable or use default
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 
                          'https://image-generation-service-856401495068.us-central1.run.app';

/**
 * Main function to generate an image for a keyword
 */
async function generateImage(keyword, options) {
  console.log(`[INFO] Generating image for keyword: "${keyword}"`);
  const startTime = performance.now();
  
  try {
    // Create output directories if they don't exist
    const outputDir = path.join(process.cwd(), 'output');
    const imagesDir = path.join(outputDir, 'images');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }
    
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir);
    }
    
    // Create a slug from the keyword
    const slug = getSlug(keyword);
    const imageResultPath = path.join(imagesDir, `${slug}-image.json`);
    
    // Check for cached image result unless forcing API use
    if (!options.forceApi && fs.existsSync(imageResultPath)) {
      console.log(`[INFO] Found cached image result for "${keyword}"`);
      const cachedResult = JSON.parse(fs.readFileSync(imageResultPath, 'utf8'));
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`[SUCCESS] Image generation completed in ${duration} seconds (cached)`);
      console.log(`Image URL: ${cachedResult.imageUrl}`);
      
      return {
        success: true,
        imageUrl: cachedResult.imageUrl,
        cached: true
      };
    }
    
    // Generate prompt for image generation
    const prompt = generateImagePrompt(keyword);
    console.log(`[INFO] Generated prompt for image: "${prompt}"`);
    
    // Prepare the request payload according to the API documentation
    const payload = {
      appraiser: {
        id: slug,
        name: keyword,
        specialty: `Image for ${keyword}`,
        experience: "SEO content"
      },
      customPrompt: prompt
    };
    
    // Call the image generation service with the correct endpoint
    console.log(`[INFO] Calling image generation service at ${IMAGE_SERVICE_URL}/api/generate`);
    const response = await axios.post(`${IMAGE_SERVICE_URL}/api/generate`, payload);
    
    // Process the response
    if (response.status === 200 && response.data && response.data.data && response.data.data.imageUrl) {
      // Save the result
      const result = {
        keyword,
        prompt,
        imageUrl: response.data.data.imageUrl,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(imageResultPath, JSON.stringify(result, null, 2));
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`[SUCCESS] Image generation completed in ${duration} seconds`);
      console.log(`Image URL: ${result.imageUrl}`);
      
      return {
        success: true,
        imageUrl: result.imageUrl,
        cached: false
      };
    } else {
      throw new Error('Invalid response from image generation service');
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.error(`[ERROR] Image generation failed after ${duration} seconds: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Generate a prompt for image generation based on the keyword
 */
function generateImagePrompt(keyword) {
  return `Create a professional, high-quality image representing "${keyword}". 
The image should be suitable for a blog or website header, with crisp details 
and vibrant colors. Include relevant visual elements that communicate the 
concept clearly. The style should be modern and visually appealing.`;
}

/**
 * Convert a keyword to a slug for filenames
 */
function getSlug(keyword) {
  return keyword
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Run the main function if this script is executed directly
if (require.main === module) {
  (async () => {
    const result = await generateImage(keyword, { forceApi });
    process.exit(result.success ? 0 : 1);
  })();
}

module.exports = { generateImage }; 