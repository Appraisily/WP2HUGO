# WP2HUGO Content Generation System

A comprehensive system for generating high-quality markdown content from keywords with built-in SEO optimization and image generation.

## Features

- **Systematic Content Generation**: Transform keywords into structured, SEO-optimized content
- **Image Generation**: Automatically generate relevant images for content
- **Content Optimization**: Enhance content quality with AI-powered optimization
- **Batch Processing**: Process multiple keywords from a file
- **Hugo Export**: Export generated content to Hugo-compatible format

## Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GOOGLEAI_API_KEY=your_googleai_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   ```

## Usage

### Generate Content for a Single Keyword

```bash
node systematic-content-generator.js "your keyword" [options]
```

Options:
- `--force-api`: Force use of real APIs instead of mock clients
- `--skip-image`: Skip image generation step
- `--min-score=N`: Set minimum SEO score threshold (default: 85)

### Process Multiple Keywords from a File

```bash
node process-batch.js keywords.txt [options]
```

Options:
- `--force-api`: Force use of real APIs instead of mock clients
- `--skip-image`: Skip image generation step
- `--min-score=N`: Set minimum SEO score threshold (default: 85)
- `--delay=N`: Delay in seconds between processing keywords (default: 5)

## Content Generation Process

The system follows a systematic process for each keyword:

1. **Research**: Collect initial data and related keywords
2. **Content Structure**: Generate a structural outline with headings
3. **Content Enhancement**: Add detailed content and improve quality
4. **Content Optimization**: Optimize for SEO factors and readability
5. **Image Generation**: Create a relevant feature image
6. **Markdown Generation**: Compile all data into a markdown file
7. **Hugo Export**: Format and export for Hugo static site generator

## Image Generation Service

The system integrates with an image generation service available at:
- https://image-generation-service-856401495068.us-central1.run.app

## Memory Management

Due to the intensive nature of content generation, the system includes several memory management features:
- Each step runs as a separate process
- Garbage collection is triggered after major steps
- Memory limits are set for Node.js processes

## Output Files

Generated files are stored in the following locations:
- Research data: `output/research/`
- Markdown files: `output/markdown/`
- Images: `output/images/`
- Hugo exports: `content/`
- Batch results: `batch-results.json`

## Troubleshooting

If you encounter errors:
1. Check API keys in your `.env` file
2. Ensure all services are running
3. Check log files for detailed error messages
4. Try running individual steps manually to isolate issues
5. Increase memory with `NODE_OPTIONS=--max-old-space-size=8192`

## License

This project is licensed under the MIT License - see the LICENSE file for details.