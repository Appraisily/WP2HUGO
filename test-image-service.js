/**
 * Test the image generation service
 */
require('dotenv').config();
const imageGenerationService = require('./src/services/image-generation.service');
const fs = require('fs').promises;
const path = require('path');

// Mock structure data for testing
const mockStructureData = {
  seoTitle: 'Test Article About AI Image Generation',
  metaDescription: 'A comprehensive guide to AI image generation techniques and tools for content creators.',
  sections: [
    {
      heading: 'Introduction to AI Image Generation',
      content: 'This section introduces the concept of AI-generated images.'
    },
    {
      heading: 'Popular AI Image Generation Tools',
      content: 'An overview of the most widely used AI image generation tools.'
    },
    {
      heading: 'Best Practices for Prompt Engineering',
      content: 'Tips and tricks for creating effective prompts for AI image generation.'
    }
  ]
};

/**
 * Run the image generation test
 */
async function runTest() {
  try {
    console.log('Starting image generation test...');
    
    // Initialize the service
    await imageGenerationService.initialize();
    
    // Generate an image with a test keyword
    const keyword = 'ai image generation';
    console.log(`Generating image for keyword: "${keyword}"`);
    
    // Test image generation
    const result = await imageGenerationService.generateImage(keyword, mockStructureData);
    
    // Display the results
    console.log('\nImage Generation Results:');
    console.log('-------------------------');
    console.log(`Keyword: ${result.keyword}`);
    console.log(`Image URL: ${result.imageUrl}`);
    console.log(`Source: ${result.source}`);
    
    // Save the result to a file for reference
    const outputPath = path.join(__dirname, 'output', 'test-image-result.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    
    console.log(`\nResults saved to: ${outputPath}`);
    console.log('\nTest completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest(); 