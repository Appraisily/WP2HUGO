const path = require('path');

// Set up paths
const ROOT_PATH = path.resolve(__dirname, '../..');
const OUTPUT_PATH = path.join(ROOT_PATH, 'output');

const config = {
  // Server configuration
  port: process.env.PORT || 8080,
  
  // Paths
  paths: {
    root: ROOT_PATH,
    output: OUTPUT_PATH,
    research: path.join(OUTPUT_PATH, 'research'),
    content: path.join(OUTPUT_PATH, 'content'),
    images: path.join(OUTPUT_PATH, 'images'),
    markdown: path.join(OUTPUT_PATH, 'markdown'),
    hugoContent: path.join(ROOT_PATH, 'content'),
    keywords: path.join(ROOT_PATH, 'keywords.txt'),
  },
  
  // Secret names for Google Cloud Secret Manager
  secretNames: {
    serviceAccountJson: 'service-account-json',
    sheetsId: 'SHEETS_ID',
    openaiApiKey: 'OPENAI_API_KEY',
    anthropicApiKey: 'ANTHROPIC_API_KEY',
    googleAiApiKey: 'GOOGLE_AI_API_KEY',
    perplexityApiKey: 'PERPLEXITY_API_KEY',
    kwrdsApiKey: 'KWRDS_API_KEY'
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
      baseUrl: 'https://image-generation-service-856401495068.us-central1.run.app',
      timeout: 120000, // 120 seconds (images take longer to generate)
    }
  }
};

module.exports = config;