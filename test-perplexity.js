require('dotenv').config();
const axios = require('axios');

async function testPerplexityApi() {
  try {
    console.log('Testing Perplexity API...');
    
    // Use the API key directly
    const apiKey = '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';
    console.log(`Using API key: ${apiKey.substring(0, 5)}...`);
    
    console.log('Making request to Perplexity API...');
    
    const prompt = `Please provide comprehensive information about "antique value guide" for creating an SEO-optimized blog post. Include:
    1. Significance and importance
    2. Key components and elements
    3. Common questions and answers
    4. Expert insights and recommendations
    5. Current trends and developments
    6. Relevant statistics and data
    7. Best practices and tips`;
    
    const response = await axios.post('https://api.perplexity.ai/chat/completions', {
      model: "sonar",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing Perplexity API:', error.response?.data || error.message);
  }
}

testPerplexityApi(); 