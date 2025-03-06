/**
 * Test script for the SERP service
 */

// Load environment variables
require('dotenv').config();

// Import the SERP service
const { serpService } = require('./src/services/kwrds');

// Test keyword
const testKeyword = 'vintage watch valuation guide';

/**
 * Run the test
 */
async function runTest() {
  try {
    console.log(`Testing SERP service with keyword: "${testKeyword}"`);
    
    // Initialize the service
    await serpService.initialize();
    
    // Fetch SERP data
    console.log('Fetching SERP data...');
    const serpData = await serpService.getSerpData(testKeyword);
    
    // Display the results
    console.log('\nSERP Data results:');
    console.log('==================');
    
    if (serpData.serp && serpData.serp.length > 0) {
      console.log(`Top ${serpData.serp.length} organic results:`);
      serpData.serp.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.title}`);
        console.log(`   URL: ${result.url}`);
        console.log(`   Est. Traffic: ${result.est_monthly_traffic || 'N/A'}`);
      });
    } else {
      console.log('No organic results found');
    }
    
    if (serpData.pasf && serpData.pasf.length > 0) {
      console.log('\nPeople Also Search For:');
      serpData.pasf.forEach((question, index) => {
        console.log(`- ${question}`);
      });
    }
    
    if (serpData.pasf_trending && serpData.pasf_trending.length > 0) {
      console.log('\nTrending Searches:');
      serpData.pasf_trending.forEach((trending, index) => {
        console.log(`- ${trending}`);
      });
    }
    
    console.log('\nTest completed successfully!');
    console.log('Check the data/research directory for the raw JSON response.');
    
  } catch (error) {
    console.error('Error during SERP test:', error.message);
    if (error.originalError) {
      console.error('Original error:', error.originalError.message);
    }
  }
}

// Run the test
runTest();