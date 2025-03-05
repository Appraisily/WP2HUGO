const path = require('path');

// Set up paths
const ROOT_PATH = path.resolve(__dirname, '../..');
const OUTPUT_PATH = path.join(ROOT_PATH, 'output');

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  environment: process.env.NODE_ENV || 'development',
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  
  // Storage configuration
  storage: {
    gcs: {
      bucketName: process.env.HUGO_BUCKET || 'wp2hugo-local-development'
    },
    local: {
      basePath: process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'data')
    }
  },
  
  // Paths
  paths: {
    root: ROOT_PATH,
    output: OUTPUT_PATH,
    research: process.env.RESEARCH_PATH || './data/research',
    workflows: process.env.WORKFLOWS_PATH || './data/workflows',
    content: path.join(OUTPUT_PATH, 'content'),
    images: path.join(OUTPUT_PATH, 'images'),
    markdown: path.join(OUTPUT_PATH, 'markdown'),
    hugoContent: path.join(ROOT_PATH, 'content'),
    keywords: path.join(ROOT_PATH, 'keywords.txt'),
  },
  
  // Secret names for Google Cloud Secret Manager
  secretNames: {
    perplexityApiKey: 'PERPLEXITY_API_KEY',
    kwrdsApiKey: 'KWRDS_API_KEY'
  },
  
  // API configurations
  apis: {
    valuer: {
      baseUrl: process.env.VALUER_API_URL || 'https://valuer-agent-856401495068.us-central1.run.app/api'
    },
    perplexity: {
      baseUrl: 'https://api.perplexity.ai'
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