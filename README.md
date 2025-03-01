# WP2HUGO - WordPress to Hugo Converter (Local Version)

## Overview
This tool helps you generate SEO-optimized Hugo content from keywords. It processes a list of keywords through various research stages and generates structured blog post outlines with featured images and markdown content ready for Hugo sites.

## Features
- Read keywords from a local file
- Research keywords using KWRDS API
- Get comprehensive information from Perplexity AI
- Generate blog post structures using Google AI (Gemini Pro)
- Generate featured images for each blog post using AI
- Create SEO-optimized markdown content for Hugo
- Export content directly to Hugo sites
- Store all results locally for easy access
- Comprehensive testing tools for development and debugging

## Project Structure
```
├── src/                  # Source code
│   ├── config/           # Configuration
│   ├── services/         # Core services
│   │   ├── keyword-research.service.js    # KWRDS API integration
│   │   ├── perplexity.service.js          # Perplexity API integration
│   │   ├── google-ai.service.js           # Google AI integration
│   │   ├── image-generation.service.js    # Image generation integration
│   │   ├── markdown-generator.service.js  # Markdown generation
│   │   └── workflow.service.js            # Main workflow coordination
│   └── utils/            # Utility functions
│       ├── local-storage.js     # Local file storage
│       ├── keyword-reader.js    # Keyword file reader
│       └── slugify.js           # String to slug converter
├── process-keywords.js   # Main CLI script
├── start-image-service.js # Script to start the image generation service
├── generate-markdown.js  # Script to generate markdown content
├── export-to-hugo.js     # Script to export content to Hugo sites
├── keywords.txt          # List of keywords to process
├── .env                  # Environment variables (API keys)
├── image-generation-service/  # Image generation submodule
├── full-process-test.js   # Test the entire workflow with one keyword
├── test.js               # Online testing script
├── test-offline.js       # Offline testing script
├── test-markdown.js      # Testing markdown generation
└── output/               # Generated output (created on run)
    ├── research/         # Raw research data
    ├── content/          # Final content structures
    ├── images/           # Generated images and metadata
    └── markdown/         # SEO-optimized markdown files
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- API keys for:
  - KWRDS AI
  - Perplexity AI
  - Google AI (Gemini Pro)
  - ImageKit (for image hosting, optional)
  - OpenAI (for enhanced image prompts, optional)

### Installation
1. Clone the repository with submodules
   ```
   git clone https://github.com/yourusername/WP2HUGO.git
   cd WP2HUGO
   git submodule update --init --recursive
   ```

2. Install dependencies
   ```
   npm install
   cd image-generation-service
   npm install
   cd ..
   ```

3. Set up environment variables
   ```
   cp .env.example .env
   ```
   Then edit `.env` and add your API keys

4. Prepare keywords
   The list of keywords is already in `keywords.txt`. You can edit this file to add or remove keywords as needed.

### Usage

#### Starting the Image Generation Service
The image generation service needs to be running for image generation to work:

```
npm run image-service
```

#### Running the Full Process
You can start both the image service and the main process with a single command:

```
npm run start:all
```

Or run just the main process (if you don't need images or have the service running separately):

```
npm start
```

#### Generating Markdown for Hugo
To generate SEO-optimized markdown files for all processed keywords:

```
npm run markdown
```

To generate markdown for a specific keyword:

```
npm run markdown:keyword "your keyword"
```

#### Exporting to Hugo
To export the generated markdown files to a Hugo site:

```
npm run export:hugo /path/to/hugo/content
```

To export a specific keyword's markdown to Hugo:

```
npm run export:hugo /path/to/hugo/content "your keyword"
```

#### Testing
For testing, you can use:

```
npm run test:all     # Runs both the image service and test process
npm test             # Runs just the test process
npm run test:offline # Runs offline testing without API calls
npm run test:image   # Tests just the image generation
npm run test:markdown # Tests markdown generation for a keyword
```

### Full Process Test

```bash
npm run test:full "your keyword"
```

Test the entire workflow from keyword research to markdown generation with a single keyword, and get an SEO analysis of the generated content.

### Workflow Process

The script follows this workflow:
1. Read the keywords from `keywords.txt`
2. For each keyword:
   - Research using KWRDS API
   - Get SERP data
   - Find related keywords
   - Query Perplexity for comprehensive information
   - Generate a blog post structure using Google AI
   - Generate a featured image for the blog post
   - Create SEO-optimized markdown for Hugo

All results will be saved in the `output` directory:
- `output/research/` - Raw research data
- `output/content/` - Final content structures
- `output/images/` - Generated images and metadata
- `output/markdown/` - SEO-optimized markdown files for Hugo

## API Keys

You'll need to obtain the following API keys:

1. **KWRDS API Key**: Register at [KWRDS.ai](https://kwrds.ai/)
2. **Perplexity API Key**: Get from [Perplexity.ai](https://perplexity.ai/)
3. **Google AI API Key**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. **ImageKit API Keys**: Get from [ImageKit.io](https://imagekit.io/) (optional, for image hosting)
5. **OpenAI API Key**: Get from [OpenAI](https://platform.openai.com/) (optional, for enhanced image prompts)

Set these keys in your `.env` file.

## Image Generation

The project includes an image generation service that creates high-quality featured images for each blog post. The service uses:

- AI-based image generation to create relevant images based on the blog post content
- OpenAI GPT-4o for crafting detailed image prompts (if API key is provided)
- ImageKit for image hosting and optimization (if API keys are provided)

When API keys are not available, the service falls back to using placeholder images from [Picsum Photos](https://picsum.photos).

## Markdown Generation

The markdown generator produces SEO-optimized content from your research data. Features include:

- Hugo-compatible frontmatter with SEO metadata
- Well-structured content with headings and sections
- Automatic table of contents for longer articles
- FAQ sections generated from research data
- Featured image integration
- Reference links from top search results
- Proper keyword density and placement for SEO

## Integration with Hugo

The generated markdown files are ready to use in a Hugo site. You can:

1. Use the export script to copy files directly to your Hugo site:
   ```
   npm run export:hugo /path/to/hugo/content
   ```

2. Manually copy files from the `output/markdown` directory to your Hugo site

3. For automated workflows, consider setting up a Git hook or CI/CD pipeline to trigger exports

The markdown files are compatible with most Hugo themes and include all the necessary frontmatter for SEO optimization.