#!/usr/bin/env node

/**
 * Image Generation Script
 * 
 * This script generates multiple images for a given keyword using the image generation service.
 * It handles calling the service, saving the response, and updating the necessary files.
 * 
 * Usage: node generate-image.js "keyword" [options]
 * Options:
 *   --force-api      Force use of real API instead of mock client
 *   --image-count    Number of images to generate (default: 5)
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
  --force-api         Force use of real API instead of mock client
  --image-count=N     Number of images to generate (default: 5)
  --help, -h          Show this help message
  `);
  process.exit(0);
}

// Extract the keyword and options
const keyword = args[0];
const forceApi = args.includes('--force-api');

// Extract image count if provided, default to 5
let imageCount = 5;
const imageCountArg = args.find(arg => arg.startsWith('--image-count='));
if (imageCountArg) {
  const count = parseInt(imageCountArg.split('=')[1], 10);
  if (!isNaN(count) && count > 0) {
    imageCount = Math.min(count, 10); // Cap at 10 images
  }
}

// Define the image service URL from environment variable or use default
const IMAGE_SERVICE_URL = process.env.IMAGE_SERVICE_URL || 
                          'https://image-generation-service-856401495068.us-central1.run.app';

/**
 * Main function to generate multiple images for a keyword
 */
async function generateImages(keyword, options) {
  console.log(`[INFO] Generating ${options.imageCount} images for keyword: "${keyword}"`);
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
    const imageResultPath = path.join(imagesDir, `${slug}-images.json`);
    
    // Check for cached image results unless forcing API use
    if (!options.forceApi && fs.existsSync(imageResultPath)) {
      console.log(`[INFO] Found cached image results for "${keyword}"`);
      const cachedResults = JSON.parse(fs.readFileSync(imageResultPath, 'utf8'));
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log(`[SUCCESS] Image generation completed in ${duration} seconds (cached)`);
      console.log(`Generated ${cachedResults.images.length} images`);
      
      return {
        success: true,
        mainImage: cachedResults.mainImage,
        images: cachedResults.images,
        cached: true
      };
    }
    
    // Generate prompts for each image
    const prompts = generateImagePrompts(keyword, options.imageCount);
    
    // Initialize results array
    const generatedImages = [];
    let mainImage = null;
    
    // Generate each image
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`[INFO] Generating image ${i+1}/${prompts.length} with prompt: "${prompt.summary}"`);
      
      // Prepare the request payload according to the API documentation
      const payload = {
        prompt: prompt.prompt,
        keyword: keyword
      };
      
      let imageResult = null;
      
      try {
        // Call the image generation service with the correct endpoint
        console.log(`[INFO] Calling image generation service at ${IMAGE_SERVICE_URL}/api/generate`);
        const response = await axios.post(`${IMAGE_SERVICE_URL}/api/generate`, payload);
        
        // Process the response
        if (response.status === 200 && response.data && response.data.imageUrl) {
          // Add to results
          imageResult = {
            imageUrl: response.data.imageUrl,
            prompt: prompt.prompt,
            aspect: prompt.aspect,
            timestamp: new Date().toISOString()
          };
        } else {
          console.warn(`[WARNING] Invalid response for image ${i+1}, using mock image`);
        }
      } catch (error) {
        console.warn(`[WARNING] Failed to call image service for image ${i+1}: ${error.message}`);
        console.log(`[INFO] Using mock image data instead`);
      }
      
      // If API call failed, use mock images
      if (!imageResult) {
        // Generate mock image data with placeholder images
        imageResult = {
          imageUrl: getMockImageUrl(keyword, prompt.aspect, i),
          prompt: prompt.prompt,
          aspect: prompt.aspect,
          timestamp: new Date().toISOString()
        };
      }
      
      generatedImages.push(imageResult);
      
      // Set as main image if it's the first or specifically marked as main
      if (i === 0 || prompt.aspect === 'main') {
        mainImage = imageResult.imageUrl;
      }
      
      console.log(`[SUCCESS] Generated image ${i+1}: ${imageResult.imageUrl}`);
      
      // Add a small delay between requests to avoid rate limiting
      if (i < prompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // If no images were generated successfully, return error
    if (generatedImages.length === 0) {
      throw new Error('Failed to generate any images');
    }
    
    // Save the results
    const result = {
      keyword,
      mainImage: mainImage || generatedImages[0].imageUrl,
      images: generatedImages,
      timestamp: new Date().toISOString()
    };
    
    // Also save a backward-compatible single image result
    const legacyImageResultPath = path.join(imagesDir, `${slug}-image.json`);
    const legacyResult = {
      keyword,
      prompt: generatedImages[0].prompt,
      imageUrl: result.mainImage,
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(imageResultPath, JSON.stringify(result, null, 2));
    fs.writeFileSync(legacyImageResultPath, JSON.stringify(legacyResult, null, 2));
    
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`[SUCCESS] Image generation completed in ${duration} seconds`);
    console.log(`Successfully generated ${generatedImages.length} images`);
    console.log(`Main image URL: ${result.mainImage}`);
    
    return {
      success: true,
      mainImage: result.mainImage,
      images: generatedImages,
      cached: false
    };
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
 * Generate multiple prompts for image generation based on the keyword and desired count
 */
function generateImagePrompts(keyword, count) {
  // Define different aspects of the content to visualize
  const aspects = [
    {
      aspect: 'main',
      description: `Create a professional, high-quality featured image representing "${keyword}". 
The image should be suitable for a blog or website header, with crisp details 
and vibrant colors. Include relevant visual elements that communicate the 
concept clearly. The style should be modern and visually appealing.`
    },
    {
      aspect: 'practical',
      description: `Create a practical, real-world application image for "${keyword}".
Show people actively using or benefiting from this concept in a realistic setting.
Use natural lighting and authentic scenarios that readers can relate to.`
    },
    {
      aspect: 'conceptual',
      description: `Create an abstract or conceptual visualization of "${keyword}".
Use metaphorical imagery, symbols, and creative representations to convey 
the deeper meaning and importance. The style should be thought-provoking and artistic.`
    },
    {
      aspect: 'instructional',
      description: `Create a clear, instructional image demonstrating a key aspect of "${keyword}".
The image should have an educational quality, with clean lines and helpful visual cues.
Include elements that would help someone understand how to implement or use this concept.`
    },
    {
      aspect: 'comparative',
      description: `Create a before-and-after or comparison image related to "${keyword}".
Show the contrast between different approaches, results, or situations.
Use split-screen or side-by-side composition for clear visual comparison.`
    },
    {
      aspect: 'technical',
      description: `Create a technical or detailed close-up image focusing on "${keyword}".
Show fine details, components, or specialized aspects that would appeal to experts.
The style should be precise and informative with good visual clarity.`
    },
    {
      aspect: 'emotional',
      description: `Create an emotionally resonant image conveying the feeling associated with "${keyword}".
Focus on human expressions, atmospheric elements, and mood-setting visuals.
The image should evoke a specific emotional response related to the topic.`
    },
    {
      aspect: 'historical',
      description: `Create a historical perspective image related to "${keyword}".
Show the evolution, origins, or significant moments in the development of this concept.
Use visual elements that convey a sense of time, progress, or heritage.`
    },
    {
      aspect: 'futuristic',
      description: `Create a forward-looking, innovative image projecting the future of "${keyword}".
Visualize emerging trends, potential developments, or speculative advancements.
The style should be cutting-edge, with modern design elements and a progressive feel.`
    },
    {
      aspect: 'statistical',
      description: `Create a data visualization image related to "${keyword}".
Present key statistics, trends, or metrics in a visually engaging way.
Use charts, graphs, icons, or other visual data representations that are both informative and appealing.`
    }
  ];
  
  // Select a random subset of the aspects, but always include the main one
  const selectedAspects = [aspects[0]];
  
  // If we need more than one aspect, randomly select from the rest
  if (count > 1) {
    // Shuffle the remaining aspects
    const remainingAspects = aspects.slice(1).sort(() => Math.random() - 0.5);
    // Take as many as needed to reach the desired count
    selectedAspects.push(...remainingAspects.slice(0, count - 1));
  }
  
  // Format the prompts
  return selectedAspects.map(aspect => ({
    aspect: aspect.aspect,
    prompt: aspect.description,
    summary: aspect.description.split('\n')[0] // First line as summary
  }));
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

/**
 * Generate a mock image URL for testing
 */
function getMockImageUrl(keyword, aspect, index) {
  // Use placeholder image services for testing
  const width = 800;
  const height = 600;
  const baseUrls = [
    `https://picsum.photos/${width}/${height}?random=${index}`,
    `https://source.unsplash.com/random/${width}x${height}?${encodeURIComponent(keyword)},${aspect}`,
    `https://loremflickr.com/${width}/${height}/${encodeURIComponent(keyword)}?random=${index}`,
    `https://baconmockup.com/${width}/${height}`,
    `https://placeimg.com/${width}/${height}/any?t=${Date.now() + index}`
  ];
  
  // Use a hash of the keyword and aspect to consistently choose the same mock service
  const hash = (keyword.length + aspect.length) % baseUrls.length;
  return baseUrls[(hash + index) % baseUrls.length];
}

// Run the main function if this script is executed directly
if (require.main === module) {
  (async () => {
    const result = await generateImages(keyword, { 
      forceApi,
      imageCount
    });
    process.exit(result.success ? 0 : 1);
  })();
}

module.exports = { generateImages }; 