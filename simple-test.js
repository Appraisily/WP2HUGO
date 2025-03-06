/**
 * Simple test script to generate content structure for a keyword
 */

// Load environment variables
require('dotenv').config();

// Import required services
const contentStorage = require('./src/utils/storage');
const contentGenerator = require('./src/services/hugo/content-generator.service');
const { createSlug } = require('./src/utils/slug');

// The keyword to test with
const testKeyword = 'art appraisal of antique lamps';

/**
 * Main test function to run the content generation process
 */
async function runTest() {
  console.log(`Starting test for keyword: "${testKeyword}"`);
  
  try {
    // Initialize storage first
    console.log('Initializing storage...');
    await contentStorage.initialize();
    console.log('Storage initialized successfully');
    
    // Create a mock research structure
    console.log('Creating mock data...');
    const keywordData = {
      keyword: testKeyword,
      volume: 720,
      difficulty: 45,
      intent: 'informational',
    };
    
    const serpData = {
      organic_results: [
        {
          position: 1,
          title: `The Complete Guide to ${testKeyword}`,
          url: "https://www.example.com/guide",
          description: `Learn everything about ${testKeyword}, from basics to advanced techniques. Expert advice and tips.`
        },
        {
          position: 2,
          title: `How to Get Started with ${testKeyword}`,
          url: "https://www.example.com/getting-started",
          description: `Beginner's guide to ${testKeyword}. Learn the essential steps and avoid common mistakes.`
        }
      ],
      related_searches: [
        `${testKeyword} for beginners`,
        `professional ${testKeyword} services`,
        `${testKeyword} cost`,
        `${testKeyword} certification`
      ]
    };
    
    const paaData = {
      questions: [
        `What is the average cost of ${testKeyword}?`,
        `How do I find a reputable ${testKeyword} service?`,
        `Can I do ${testKeyword} myself?`,
        `What factors affect the value in ${testKeyword}?`
      ]
    };

    // Generate content structure
    console.log('Generating content structure...');
    const structure = await contentGenerator.generateStructure(
      testKeyword,
      keywordData,
      paaData,
      serpData
    );
    
    console.log('\nStructure generated:');
    console.log(JSON.stringify(structure, null, 2));
    
    // Generate content from structure
    console.log('\nGenerating content from structure...');
    const content = await contentGenerator.generateContent(structure);
    
    // Save the markdown content locally
    console.log('\nSaving content...');
    const slug = createSlug(testKeyword);
    await contentStorage.storeContent(
      `${slug}/markdown-content.md`,
      content.content,
      { type: 'markdown_content', keyword: testKeyword }
    );
    
    console.log('\nContent preview:');
    console.log(content.content.substring(0, 500) + '...');
    
    console.log(`\nComplete content saved to: ${slug}/markdown-content.md`);
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();