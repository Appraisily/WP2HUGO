# WP2HUGO Setup and Development Guide

This guide provides detailed instructions for setting up, testing, and developing the WP2HUGO application. This tool helps you generate SEO-optimized Hugo content from keywords through research and AI-powered blog post structure generation.

## Project Structure Overview

```
├── src/                  # Source code
│   ├── config/           # Configuration
│   ├── services/         # Core services
│   │   ├── keyword-research.service.js    # KWRDS API integration
│   │   ├── perplexity.service.js          # Perplexity API integration
│   │   ├── google-ai.service.js           # Google AI integration
│   │   └── workflow.service.js            # Main workflow coordination
│   └── utils/            # Utility functions
│       ├── local-storage.js     # Local file storage
│       ├── keyword-reader.js    # Keyword file reader
│       ├── mock-data.js         # Mock data for offline testing
│       └── slugify.js           # String to slug converter
├── process-keywords.js   # Main CLI script
├── test.js              # Online test script
├── test-offline.js      # Offline test script with mock data
├── keywords.txt          # List of keywords to process
├── test-keywords.txt     # Single keyword for testing
├── .env                  # Environment variables (API keys)
└── output/               # Generated output (created on run)
    ├── research/         # Raw research data
    └── content/          # Final content structures
```

## Prerequisites

Before you begin, ensure you have the following:

- Node.js 18+ installed
- API keys for:
  - KWRDS AI (for keyword research)
  - Perplexity AI (for detailed information)
  - Google AI (for blog post structure generation)

## Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/WP2HUGO.git
   cd WP2HUGO
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   
4. Edit the `.env` file and add your API keys:
   ```
   KWRDS_API_KEY=your_kwrds_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   GOOGLE_AI_API_KEY=your_googleai_api_key_here
   ```

## Running the Application

### Full Production Mode

To process all keywords in `keywords.txt` with actual API calls:

```
npm start
```

The application will process each keyword through the following steps:
1. Research using KWRDS API
2. Get SERP data using KWRDS API
3. Get related keywords using KWRDS API
4. Query Perplexity API for comprehensive information
5. Generate blog post structure using Google AI API

All results will be saved in the `output` directory:
- `output/research/` - Raw research data in JSON format
- `output/content/` - Final combined content in JSON format

### Test Mode (Online)

To test with a single keyword using actual API calls:

1. Edit `test-keywords.txt` to contain a single keyword
2. Run the test script:
   ```
   npm test
   ```

This will process only the keyword in `test-keywords.txt` through all APIs.

### Offline Testing Mode

To test without making actual API calls (using mock data):

1. Edit `test-keywords.txt` to contain a single keyword
2. Run the offline test script:
   ```
   npm run test:offline
   ```

This will use the mock data in `src/utils/mock-data.js` instead of making real API calls, which is useful for:
- Development without consuming API credits
- Testing when you don't have internet access
- Running tests in CI/CD pipelines

## Troubleshooting

### API Connection Issues

If you encounter errors connecting to any of the APIs:

1. Verify your API keys in the `.env` file
2. Check your internet connection
3. Verify the API endpoints in the respective service files
4. Check if you've exceeded API rate limits

You can use the offline testing mode to continue development while troubleshooting API issues.

### File Permission Issues

If you encounter issues with file operations:

1. Ensure the application has write permission to the output directories
2. Check if the directories exist (they should be created automatically)
3. Verify disk space is available

## Development Guide

### Adding a New API Service

1. Create a new service file in `src/services/`
2. Implement the standard interface methods:
   - `initialize()` - Set up the service
   - API-specific methods
3. Update the workflow service to use your new service

### Modifying the Content Structure

If you need to modify the Google AI prompt to generate different content:

1. Edit the `generateStructure()` method in `src/services/google-ai.service.js`
2. Update the prompt string to include your desired instructions
3. Update the mock data in `src/utils/mock-data.js` to match your new structure

### Working with Mock Data

To add or update mock data for offline testing:

1. Edit `src/utils/mock-data.js`
2. Update the relevant mock objects to match your expected data structure
3. Ensure the mock data has the same structure as the real API responses

## Contributing

1. Create a feature branch
2. Implement your changes
3. Test using both online and offline modes
4. Submit a pull request with a detailed description of your changes 