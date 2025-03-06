/**
 * Simple test script to generate markdown content locally using mock data
 */

// Load environment variables
require('dotenv').config();

// Import required services
const contentStorage = require('./src/utils/storage');
const hugoProcessor = require('./src/services/hugo-processor.service');
const mockData = require('./src/utils/mock-data');

// The keyword to test with
const testKeyword = 'art appraisal of antique lamps';

/**
 * Main test function to run the content generation process
 */
async function runTest() {
  console.log(`Starting local markdown generation test for keyword: "${testKeyword}"`);
  
  try {
    // Initialize storage first
    console.log('Initializing storage...');
    await contentStorage.initialize();
    console.log('Storage initialized successfully');
    
    // Create a mock research object using our mock data
    // Normally this would come from API calls, but we'll construct it manually
    const mockResearch = {
      keyword: testKeyword,
      volume: mockData.keywordResearchMock.volume,
      difficulty: mockData.keywordResearchMock.difficulty,
      intent: 'informational',
      serp: {
        organic_results: mockData.serpDataMock.organic_results.map(result => ({
          ...result,
          title: result.title.replace('what is value art', testKeyword)
        })),
        related_searches: [
          `${testKeyword} definition`,
          `types of ${testKeyword}`,
          `${testKeyword} examples`,
          `importance of ${testKeyword}`,
          `how to ${testKeyword}`
        ]
      },
      related_keywords: mockData.relatedKeywordsMock.related_keywords.map(kw => ({
        ...kw,
        keyword: kw.keyword.replace('value in art', testKeyword)
      })),
      outline: {
        title: `Complete Guide to ${testKeyword}`,
        description: `Learn everything about ${testKeyword}, including definition, types, examples, and importance.`,
        sections: [
          {
            heading: `What is ${testKeyword}?`,
            subheadings: [
              'Definition and Basics',
              'Historical Context',
              'Why It Matters Today'
            ]
          },
          {
            heading: `Types of ${testKeyword}`,
            subheadings: [
              'Traditional Methods',
              'Modern Approaches',
              'Professional vs. DIY Options'
            ]
          },
          {
            heading: `How to Get Started with ${testKeyword}`,
            subheadings: [
              'Essential Tools and Resources',
              'Step-by-Step Process',
              'Common Mistakes to Avoid'
            ]
          },
          {
            heading: `Expert Tips for ${testKeyword}`,
            subheadings: [
              'Industry Best Practices',
              'Advanced Techniques',
              'When to Seek Professional Help'
            ]
          },
          {
            heading: `Frequently Asked Questions About ${testKeyword}`,
            subheadings: []
          }
        ]
      },
      perplexity_data: {
        response: mockData.perplexityMock.response.choices[0].message.content
          .replace(/Value in Art/g, testKeyword)
          .replace(/value in art/g, testKeyword)
      },
      google_data: {
        response: mockData.googleAiMock.response.candidates[0].content.parts[0].text
          .replace(/Value in Art/g, testKeyword)
          .replace(/value in art/g, testKeyword)
      }
    };

    // Generate the markdown using our processor
    console.log('Generating markdown content...');
    const result = await hugoProcessor.generateMarkdown(testKeyword);
    
    if (result.success) {
      console.log('✅ Markdown generation successful!');
      console.log(`Content stored at: ${result.filePath}`);
      
      // Read and display the generated content
      const content = await contentStorage.readFile(result.filePath);
      console.log('\n--- Generated Markdown Content ---\n');
      console.log(content.substring(0, 500) + '...');
      console.log('\n--- End of Preview ---\n');
    } else {
      console.error('❌ Markdown generation failed:', result.error);
    }
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runTest();