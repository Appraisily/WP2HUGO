# WP2HUGO - WordPress to Hugo Converter (Local Version)

An advanced tool for generating SEO-optimized Hugo-compatible markdown content from keywords, with integrated image generation, content optimization, and freshness monitoring.

## Features

- **AI-Powered Content Generation**: Generate high-quality, SEO-optimized content for any keyword
- **Image Generation**: Create professional images using AI with the integrated image service
- **Content Optimization**: Tools for analyzing and improving content quality
- **SEO Enhancements**: Schema markup, competitor analysis, and internal linking
- **Content Monitoring**: Track content freshness and get update recommendations
- **Hugo Integration**: Export generated markdown directly to Hugo sites
- **Content Planning**: Plan and schedule content creation
- **Bulk Processing**: Process multiple keywords in batch mode

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
│   │   ├── content-optimization.service.js
│   │   ├── schema-markup.service.js
│   │   ├── competitor-analysis.service.js
│   │   ├── internal-linking.service.js
│   │   └── content-monitor.service.js
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

## NEW: Content Optimization

The new content optimization system:

- Calculates readability using Flesch-Kincaid Reading Ease
- Analyzes SEO factors like keyword density and placement
- Checks structural elements like headings, images, and links
- Provides AI-powered improvement suggestions
- Can regenerate content with optimization hints
- Produces detailed reports on content performance

## NEW: Content Templates

Templates provide structure for different content types:

- Each template includes recommended frontmatter fields
- Pre-defined content sections based on content type
- Formatting guidance for consistent presentation
- Instructions for content creation
- SEO recommendations specific to the content type

## NEW: Content Planning and Scheduling

Interactive content planning tool that helps you create a publishing schedule and optimize content.

Options:
- `npm run plan:bulk` - Process all keywords in bulk mode
- `npm run plan:schedule` - Enable scheduling mode for content planning

Advanced usage:
```bash
node create-content-plan.js --from-file=keywords.txt --template=how-to --schedule --export-path=/path/to/hugo/content
```

## NEW: Bulk Processing and Performance Reporting

Launches an interactive tool to analyze and optimize your content for readability, SEO, and engagement.

Options:
- `npm run optimize "keyword"` - Optimize a specific keyword
- `npm run optimize --all` - Optimize all content
- `npm run optimize --min-score=70` - Set a minimum readability score

## Troubleshooting

See the SETUP.md file for detailed troubleshooting tips, including:
- API connection issues
- File permission problems
- Environment variable setup

## Development

See DEVELOPMENT.md for information on extending the application with new services or modifying existing functionality.

## Image Generation

See IMAGE-GENERATION-SETUP.md for details on the image generation service integration.

## Content Monitoring and Updates

Generate a content freshness report:
```
npm run monitoring:report
```

Generate a comprehensive report with all content:
```
npm run monitoring:report:all
```

Update content interactively:
```
npm run update:content
```

Update content for a specific keyword:
```
npm run update:content:keyword "your keyword"
```

Update all critically outdated content:
```
npm run update:content:all
```

Fully automated content updates:
```
npm run update:content:auto
```

## Content Monitoring System

The content monitoring system helps you maintain fresh, up-to-date content by:

1. **Tracking Content Age**: Monitors how old each piece of content is
2. **Freshness Analysis**: Evaluates content that needs updating based on age and other factors
3. **Update Recommendations**: Provides specific suggestions for updating outdated content
4. **Automated Updates**: Offers tools to automatically refresh content

### Monitoring Reports

The monitoring report includes:
- Content age statistics
- List of content needing critical updates
- List of content needing recommended updates
- Update suggestions for each piece of content

Reports are available in both JSON and HTML formats for easy viewing.

### Content Update Workflow

1. Generate a monitoring report using `npm run monitoring:report`
2. Review the report to identify content needing updates
3. Use `npm run update:content` to update content interactively
4. Select which content to update and how (AI-assisted or regenerate)
5. Review and publish the updated content

## API Keys

Store API keys in your `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
BFAI_API_KEY=your_blackforest_ai_key
```

## Integration with Hugo

The markdown files generated by WP2HUGO are compatible with most Hugo themes. They include:

1. Hugo frontmatter with title, date, tags, and SEO metadata
2. Properly formatted markdown content
3. Image references that work with Hugo's image processing

You can use the `npm run export:hugo` command to automatically export generated markdown files to your Hugo site's content directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.