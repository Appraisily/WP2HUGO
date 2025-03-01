const path = require('path');

module.exports = {
  // Server configuration
  port: process.env.PORT || 3000,
  
  // File paths
  paths: {
    keywords: path.resolve(process.cwd(), 'keywords.txt'),
    output: path.resolve(process.cwd(), 'output'),
    research: path.resolve(process.cwd(), 'output', 'research'),
    content: path.resolve(process.cwd(), 'output', 'content'),
    hugoContent: path.resolve(process.cwd(), 'content'),
  },
  
  // API keys - these should be set as environment variables
  api: {
    kwrds: process.env.KWRDS_API_KEY,
    perplexity: process.env.PERPLEXITY_API_KEY,
    googleAi: process.env.GOOGLE_AI_API_KEY,
  },
  
  // Google AI API settings
  googleAi: {
    model: 'gemini-1.5-pro',
    maxOutputTokens: 4000,
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  },
  
  // Local storage settings
  storage: {
    useLocal: true,
  }
}; 