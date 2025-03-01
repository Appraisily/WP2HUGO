const path = require('path');

// Set up paths
const ROOT_PATH = path.resolve(__dirname, '../..');
const OUTPUT_PATH = path.join(ROOT_PATH, 'output');

const config = {
  // Paths
  paths: {
    root: ROOT_PATH,
    output: OUTPUT_PATH,
    research: path.join(OUTPUT_PATH, 'research'),
    content: path.join(OUTPUT_PATH, 'content'),
    images: path.join(OUTPUT_PATH, 'images'),
  },
  
  // API configurations
  api: {
    kwrds: {
      baseUrl: 'https://app.kwrds.ai/api/v1',
      timeout: 30000, // 30 seconds
    },
    perplexity: {
      baseUrl: 'https://api.perplexity.ai',
      timeout: 60000, // 60 seconds
    },
    googleAi: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      model: 'gemini-pro',
      timeout: 60000, // 60 seconds
      maxOutputTokens: 4096,
    },
    imageGeneration: {
      baseUrl: 'http://localhost:3001',
      timeout: 120000, // 120 seconds (images take longer to generate)
    }
  }
};

module.exports = config;