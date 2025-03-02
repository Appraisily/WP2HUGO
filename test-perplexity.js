require('dotenv').config();
const axios = require('axios');

async function testPerplexityApi() {
  try {
    console.log('Testing Perplexity API...');
    
    const apiKey = process.env.PERPLEXITY_API_KEY;
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'Not found');
    
    if (!apiKey) {
      console.error('Perplexity API key not found in environment variables');
      return;
    }
    
    console.log('API Key found, making request...');
    
    const keyword = 'antique value guide';
    const prompt = `I need comprehensive information about "${keyword}" for creating an SEO-optimized blog post. Please provide:
1. A thorough explanation of what "${keyword}" means and its significance
2. Key aspects or components to cover when discussing "${keyword}"
3. Common questions people have about "${keyword}"
4. Expert insights or advice related to "${keyword}"
5. Current trends or developments related to "${keyword}"
6. Relevant statistics, if applicable
7. Best practices or recommendations related to "${keyword}"

Please provide detailed, accurate, and up-to-date information that would be valuable for readers interested in this topic.`;
    
    const response = await axios.post(
      'https://api.perplexity.ai/chat/completions',
      {
        model: "sonar-medium-online",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant that provides comprehensive, accurate information for creating SEO-optimized blog content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error testing Perplexity API:', error.response?.data || error.message);
  }
}

testPerplexityApi(); 