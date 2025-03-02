# WP2HUGO Content Generation System

A comprehensive system for generating high-quality markdown content from keywords with built-in SEO optimization and image generation.

## Features

- **Systematic Content Generation**: Transform keywords into structured, SEO-optimized content
- **Search Intent Analysis**: Automatically detect and optimize for user search intent
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

### View Search Intent Analysis

To generate and view search intent analysis for a keyword:

```bash
node generate-intent.js "your keyword"
```

This will create a JSON file with intent data in the `output/research/` directory and display key insights in the console.

### Process Multiple Keywords from a File

```bash
node process-batch.js keywords.txt [options]
```

Options:
- `--force-api`: Force use of real APIs instead of mock clients
- `--skip-image`: Skip image generation step
- `--min-score=N`: Set minimum SEO score threshold (default: 85)
- `--delay=N`: Delay in seconds between processing keywords (default: 5)
- `--skip-intent`: Skip search intent analysis step
- `--intent-only`: Run only the search intent analysis step

## Content Generation Process

The system follows a systematic process for each keyword:

1. **Research**: Collect initial data and related keywords
2. **Search Intent Analysis**: Determine user intent and optimize content structure accordingly
3. **Content Structure**: Generate a structural outline with headings based on intent
4. **Content Enhancement**: Add detailed content and improve quality
5. **Content Optimization**: Optimize for SEO factors and readability
6. **Image Generation**: Create a relevant feature image
7. **Markdown Generation**: Compile all data into a markdown file
8. **Hugo Export**: Format and export for Hugo static site generator

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

## Advanced Content Optimization

### Search Intent Integration

The system integrates search intent analysis throughout the content generation workflow:

- **Structure Generation**: Content structure is automatically tailored based on detected search intent
- **Featured Snippet Optimization**: Content is formatted to target featured snippets (lists, tables, paragraphs)
- **User Journey Alignment**: Introduction and conclusion are optimized for the user's stage in the journey
- **FAQs**: Automatically generates relevant FAQs based on "People Also Ask" data
- **Content Format Selection**: Chooses between how-to, list post, comparison, or guide formats

### E-E-A-T Signal Enhancement

Content is automatically enhanced with Expertise, Experience, Authoritativeness, and Trustworthiness signals:

- **Expert Citations**: Integration of authoritative sources and expert quotes
- **Data Points**: Inclusion of statistics and verifiable data
- **Trustworthiness Markers**: Clear disclosure statements and fact verification

## Search Intent Analyzer

The Search Intent Analyzer is a core component that improves content relevance:

- **Intent Classification**: Categorizes queries as informational, commercial, transactional, or navigational
- **Format Detection**: Identifies ideal content formats (how-to, list post, comparison, etc.)
- **Featured Snippet Optimization**: Structures content to capture position zero in search results
- **User Journey Mapping**: Maps keywords to awareness, consideration, decision, or retention stages
- **Question Identification**: Extracts relevant questions for FAQ sections
- **Heading Structure**: Recommends optimal heading structure based on intent

## License

This project is licensed under the MIT License - see the LICENSE file for details.