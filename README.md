# WP2HUGO: Enhanced SEO Content Generation System

A powerful system that automatically generates high-quality, SEO-optimized content by leveraging multiple AI services and SEO best practices.

## Features

- **Multi-Model AI Integration**: Combines the strengths of Google AI Gemini, Anthropic Claude, and Perplexity's Sonar for comprehensive content generation
- **Automated SEO Optimization**: Ensures content meets all SEO requirements with proper keyword density, structure, and metadata
- **Content Quality Assessment**: Automatically evaluates content against 20+ SEO factors and provides specific improvement recommendations
- **Schema Markup Generation**: Creates appropriate schema markup for better search engine understanding
- **Competitor Analysis**: Analyzes top-ranking content to identify winning strategies and content gaps
- **Internal Linking System**: Suggests relevant internal links to enhance site structure
- **Continuous Quality Improvement**: Automatically improves existing content based on SEO assessment with a minimum score threshold
- **WordPress to Hugo Migration**: Specialized tools for transforming WordPress content to Hugo-compatible markdown

## How It Works

1. **Keyword Research**: Analyzes the target keyword to understand search intent, competition, and related terms
2. **Perplexity Research**: Uses Perplexity AI (Sonar model) to gather comprehensive information about the topic
3. **Competitor Analysis**: Studies top-ranking content to identify content gaps and winning elements
4. **Structure Generation**: Uses Google AI Gemini to create an optimal content structure
5. **Content Enhancement**: Leverages Anthropic Claude to enhance the content with expert insights, semantic depth, and authority signals
6. **SEO Optimization**: Fine-tunes content for perfect keyword density, readability, and engagement
7. **Quality Assessment**: Evaluates the content against SEO factors and provides an overall score
8. **Markdown Generation**: Creates SEO-optimized markdown files with proper frontmatter for Hugo

## Getting Started

### Prerequisites

- Node.js (v14+)
- API keys for:
  - Perplexity AI
  - Google AI Gemini
  - Anthropic Claude
  - KWRDS API (for keyword research)

### Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Create a `.env` file with your API keys:

```
PERPLEXITY_API_KEY=your_perplexity_api_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
KWRDS_API_KEY=your_kwrds_api_key
```

### Usage

#### Process a single keyword

```bash
node process-keywords.js --keyword "your keyword"
```

#### Process a list of keywords from a file

```bash
node process-keywords.js --file keywords.txt
```

#### Force API usage (ignore cache)

```bash
node process-keywords.js --keyword "your keyword" --force-api
```

#### Improve existing content

```bash
node improve-content.js --keyword "your keyword"
```

#### Batch improve all content below a minimum SEO score

```bash
node improve-content.js --all
# OR with a custom minimum score
node improve-content.js --all --min-score=80
```

## Output

The system generates:

- **Research data**: Keyword research, competitor analysis, and topic information in `output/research`
- **Content structure**: Title, headings, and section outlines
- **Enhanced content**: Complete, SEO-optimized content
- **SEO assessment**: Content quality score and improvement recommendations
- **Markdown files**: Ready-to-publish content files in `output/markdown`
- **Schema markup**: Structured data for search engines

## Content Quality Assessment

The system evaluates content against multiple SEO factors including:

- Title quality and keyword usage
- Meta description optimization
- Headings structure and keyword inclusion
- Content length and comprehensiveness
- Keyword density and placement
- Introduction and conclusion quality
- Schema markup completeness
- Internal linking

Each assessment provides:
- An overall SEO score (0-100)
- High-priority issues that need immediate attention
- Medium-priority recommendations for improvement
- Strengths of the current content

## Advanced Configuration

You can customize the system behavior by modifying `src/config.js`:

- Adjust keyword density targets
- Configure content length goals
- Set quality thresholds
- Customize output paths
- Configure AI model parameters

## Services Architecture

The system is built on a modular service architecture:

- **WorkflowService**: Orchestrates the entire content generation and optimization process
- **KeywordResearchService**: Analyzes keywords for search intent and competition
- **PerplexityService**: Gathers comprehensive information about topics
- **GoogleAIService**: Generates optimal content structure
- **AnthropicService**: Enhances content quality and performs SEO optimization
- **SeoQualityService**: Assesses content quality and provides recommendations
- **MarkdownGeneratorService**: Creates Hugo-compatible markdown files
- **SchemaMarkupService**: Generates structured data for SEO
- **InternalLinkingService**: Manages content relationships for better site structure

## Troubleshooting

If you encounter any issues:

1. Check that your API keys are valid and properly set in the `.env` file
2. Ensure you have the latest version of Node.js
3. Check the console output for specific error messages
4. Try running with the `--force-api` flag to bypass cached data
5. If receiving memory errors, try processing fewer keywords at once

## License

MIT

## Acknowledgements

This system integrates multiple AI technologies:
- [Perplexity AI](https://perplexity.ai)
- [Google AI Gemini](https://ai.google.dev/)
- [Anthropic Claude](https://anthropic.com/claude)