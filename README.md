# WP2HUGO Repository Structure

This document provides a comprehensive overview of the WP2HUGO codebase, explaining the structure, purpose of each file, and how the different components work together.

## Overview

WP2HUGO is a content generation system designed to generate SEO-optimized Hugo-compatible markdown content from keywords. The system integrates with various AI services and APIs to research, structure, and enhance content before exporting it to a Hugo-compatible format.

## Directory Structure

```
WP2HUGO/
├── src/                # Main source code
│   ├── app.js          # Express application setup
│   ├── server.js       # Server initialization and API endpoints
│   ├── config/         # Configuration files
│   ├── controllers/    # Request handlers
│   ├── routes/         # API route definitions
│   ├── schemas/        # JSON schemas for data validation
│   ├── services/       # Core functionality services
│   └── utils/          # Utility functions and helpers
├── layouts/            # Hugo layout templates
│   ├── partials/       # Reusable template parts
│   ├── shortcodes/     # Hugo shortcode templates
│   └── _default/       # Default layout templates
├── .env.example        # Example environment variables
├── Dockerfile          # Container definition for deployment
├── cloudbuild.yaml     # Google Cloud Build configuration
├── package.json        # Node.js dependencies and scripts
└── README.md           # Project documentation
```

## Core Components

### Server and API

- **src/server.js**: The main entry point that initializes all services and sets up API endpoints. It handles service orchestration, ensuring each service is initialized properly before accepting API requests. The file implements a resilient initialization pattern where failures in one service don't prevent others from functioning.

- **src/routes/index.js**: Defines the API routes and connects them to controllers. Routes include endpoints for keyword processing, content generation, and workflow management.

- **src/controllers/**: Contains the request handlers that process API requests:
  - **worker.controller.js**: Manages background processing tasks for content generation
  - **content.controller.js**: Handles content retrieval and storage operations

### Service Layer

The application is structured around a collection of services that each handle a specific aspect of the content generation process:

#### Content Generation Services

- **src/services/keyword-research.service.js**: Performs keyword research and analysis using the KWRDS API. This service handles fetching related keywords, search volumes, keyword expansions, and SERP data. It implements caching mechanisms to avoid unnecessary API calls and includes robust error handling with retry logic.

- **src/services/paa.service.js**: Retrieves "People Also Ask" data related to keywords. This helps in generating comprehensive FAQs and addressing common user questions in the content.

- **src/services/serp.service.js**: Fetches search engine results for keywords, allowing the system to analyze competitor content and identify patterns in top-ranking pages.

- **src/services/perplexity.service.js**: Interfaces with Perplexity AI for in-depth research on topics. This service provides additional context and information that enhances the quality and depth of generated content.

#### Content Processing Services

- **src/services/hugo-processor.service.js**: Acts as the orchestration layer for the entire Hugo content generation workflow. It coordinates the different steps of the process, from keyword research to final Hugo export.

- **src/services/hugo/workflow.service.js**: Manages content generation workflows and their states. This service implements a state machine for tracking the progress of content generation through various stages (research, outline, draft, review, publish). It uses both Google Cloud Storage and local filesystem for persisting workflow state.

- **src/services/hugo/content-analyzer.service.js**: Analyzes content for SEO optimization opportunities. It evaluates content against SEO best practices and provides recommendations for improvement.

- **src/services/hugo/content-generator.service.js**: Generates content based on research and structure. This service leverages AI models to create high-quality, contextually relevant content.

- **src/services/hugo/data-collector.service.js**: Collects data needed for content generation, aggregating information from various sources and APIs.

#### AI Integration Services

- **src/services/anthropic.service.js**: Low-level integration with Anthropic's Claude AI API. Handles authentication, request formatting, and response parsing.

- **src/services/claude.service.js**: Higher-level wrapper for Claude AI integration. Provides domain-specific prompts and context for different content generation tasks.

- **src/services/openai/index.js**: Core integration with OpenAI API. Manages API key authentication and provides common utilities for OpenAI interactions.

- **src/services/google-ai.service.js**: Interfaces with Google's AI services, particularly Gemini. Facilitates access to Google's language models for content generation and enhancement.

#### SEO and Enhancement Services

- **src/services/search-intent.service.js**: Analyzes search intent for keywords. It categorizes queries (informational, transactional, etc.) and tailors content structure accordingly.

- **src/services/seo-quality.service.js**: Evaluates and improves SEO quality. It checks content against SEO best practices and recommends improvements.

- **src/services/enhanced-faq.service.js**: Generates comprehensive FAQ sections based on related questions and "People Also Ask" data.

- **src/services/internal-linking.service.js**: Manages internal linking strategy. It identifies opportunities for linking between content pieces.

- **src/services/schema-markup.service.js**: Generates structured data markup for content. It creates Schema.org markup to enhance SEO and search result presentation.

#### Image Services

- **src/services/image-generation.service.js**: Interfaces with an external image generation service to create relevant images for content. It handles the API communication with the image service hosted on Google Cloud Run.

- **src/services/openai/image.service.js**: Specialized service for OpenAI's DALL-E image generation. Provides prompts and formatting specific to DALL-E.

### Utility Layer

- **src/utils/storage.js**: Comprehensive utility for content storage, using Google Cloud Storage (GCS) as the primary storage with local filesystem fallback. Key features include:
  - Automatic path normalization to prevent path traversal issues
  - Content type detection based on file extensions
  - Parallel storage in GCS and local filesystem for redundancy
  - Automatic JSON parsing/stringifying when appropriate
  - Structured error handling with detailed logging

- **src/utils/secrets.js**: Centralizes access to secret values (API keys). It integrates with Google Cloud Secret Manager for secure secret storage in production environments, with fallback to environment variables for development.

- **src/utils/slugify.js**: Converts titles to URL-friendly slugs. Handles special characters, spaces, and ensures Hugo compatibility.

- **src/utils/local-storage.js**: Manages local storage for caching and development environments. It includes methods for file manipulation, JSON reading/writing, and directory management.

### Configuration

- **src/config/index.js**: Central configuration hub for the application. It defines paths, API settings, secret names, and environment-specific configurations. The configuration is structured to support different environments (development, production) with appropriate settings for each.

- **src/config/local.js**: Local development configuration overrides. It allows developers to customize settings without modifying the main configuration.

## Hugo Integration

### Layout Templates

- **layouts/_default/single.html**: Default template for single content pages. It defines the HTML structure for individual content pieces, including meta tags, header, and footer.

- **layouts/_default/baseof.html**: Base layout template that defines the HTML structure for all pages. It provides a consistent framework that other templates extend.

- **layouts/_default/list.json**: JSON template for content lists. Used for API-based content access and headless CMS functionality.

### Partial Templates

- **layouts/partials/head.html**: Contains the HTML head section with meta tags, CSS imports, and SEO-related elements. It ensures proper metadata for content pages.

- **layouts/partials/article-schema.html**: Schema.org markup for articles. It generates structured data to enhance SEO and provide rich results in search engines.

### Shortcodes

- **layouts/shortcodes/image-gallery.html**: Shortcode for displaying image galleries within content. It provides a consistent and visually appealing way to display multiple images.

## Key Workflows

### Content Generation Process

1. **Keyword Reception**: Receive a keyword via the API endpoint (`/api/hugo/process`).
2. **Workflow Initialization**: Create a workflow object with a unique ID to track the process (`workflow.service.js`).
3. **Keyword Research**: Use the `keyword-research.service.js` to gather related keywords, search volumes, and SERP data.
4. **Search Intent Analysis**: Determine user intent and optimize content structure accordingly using `search-intent.service.js`.
5. **Content Structure**: Generate a structural outline with headings based on intent using AI services.
6. **Content Enhancement**: Add detailed content and improve quality using multiple AI services (OpenAI, Claude, Google AI).
7. **SEO Optimization**: Optimize for SEO factors and readability using `seo-quality.service.js`.
8. **Image Generation**: Create a relevant feature image via the external image generation service.
9. **Markdown Generation**: Compile all data into a markdown file with front matter for Hugo.
10. **Storage**: Store the final content in Google Cloud Storage and locally, updating the workflow status to "completed".

### Storage Mechanism

The application implements a dual-storage approach for resilience and performance:

- **Google Cloud Storage (GCS)**: 
  - Primary storage for all content, workflows, and images
  - Accessible across different environments and deployment instances
  - Provides durable, scalable storage for production use
  - Configured via the `HUGO_BUCKET` environment variable

- **Local Filesystem**: 
  - Used as a cache and fallback when GCS is unavailable
  - Improves performance by reducing network calls for frequently accessed content
  - Provides offline capabilities for development environments
  - Configured in `config.storage.local.basePath`

The `storage.js` utility transparently manages this dual-storage approach, first attempting GCS operations and falling back to local filesystem when needed.

### Secret Management

The application uses a tiered approach to secret management:

1. **Google Cloud Secret Manager**: Primary method for production environments. Secret names are defined in `config.secretNames`.
2. **Environment Variables**: Fallback method for development or when Secret Manager is unavailable.
3. **Error Handling**: Clear error messages when required secrets are missing, preventing silent failures.

The `getSecret()` function in `secrets.js` encapsulates this logic, providing a consistent interface for accessing sensitive configuration.

## Deployment

The application is designed to be deployed as a containerized service on Google Cloud Run:

- **Dockerfile**: Defines the container image with Node.js runtime and application dependencies
- **cloudbuild.yaml**: Configuration for Google Cloud Build CI/CD pipeline
- **Secret Management**: Uses Google Cloud Secret Manager for securing API keys and other sensitive values

Key environment variables for deployment:
- `PORT`: Set to 8080 for Cloud Run compatibility
- `KWRDS_API_KEY`: API key for keyword research services
- `HUGO_BUCKET`: GCS bucket name for content storage
- Various AI service API keys (OpenAI, Anthropic, Google AI, Perplexity)

## External Integrations

### Image Generation Service

The system integrates with an external image generation service hosted at:
```
https://image-generation-service-856401495068.us-central1.run.app
```

This service provides:
- REST API for image generation based on keyword and prompt
- High-quality images optimized for content headers
- Integration through the `image-generation.service.js` module

### KWRDS API

The application leverages the KWRDS API for keyword research:
- Base URL: `https://keywordresearch.api.kwrds.ai`
- Authentication via API key stored in Secret Manager
- Multiple endpoints for different aspects of keyword research:
  - `/keywords-with-volumes`: Search volumes for keywords
  - `/keyword-expansion`: Related keyword ideas
  - `/keyword-suggestions`: Alternative keywords and phrases

## Error Handling Strategy

The application implements a comprehensive error handling strategy:
1. **Service Initialization**: Each service attempt to initialize independently, with failures logged but not preventing other services from functioning.
2. **API Error Handling**: Specialized error handling for external API calls, with retry logic for transient failures.
3. **Storage Resilience**: Dual-storage approach ensuring content availability even when cloud storage is temporarily inaccessible.
4. **Detailed Logging**: Consistent logging format with service tags, error details, and context information.
5. **User-Facing Errors**: Appropriate error responses from API endpoints with useful error messages.

## Scripts and Utilities

The package.json defines several scripts for different operations:
- **npm start**: Start the main server
- **npm run dev**: Start the server in development mode
- **npm run image-service**: Start the image generation service
- **npm run markdown**: Generate markdown from keywords
- **npm run export:hugo**: Export content to Hugo format
- **npm run test:full**: Run a full process test
- **npm run optimize**: Optimize existing content
- **npm run plan**: Create a content plan based on keywords
- **npm run enhanced**: Run the enhanced content generation process

## Conclusion

The WP2HUGO codebase is structured as a modular, service-oriented application that combines multiple AI services and APIs to generate high-quality, SEO-optimized content for Hugo static sites. The system employs a workflow-based approach to track the progress of content generation and provides APIs for integration with other systems.

The storage layer leverages Google Cloud Storage with local filesystem fallbacks, ensuring data persistence and availability. The configuration system supports different environments, and the service initialization pattern ensures that services are only initialized when needed and failures in one service don't prevent others from functioning.

The application demonstrates several software engineering best practices:
1. **Service-Oriented Architecture**: Clear separation of concerns with specialized services for different aspects of content generation
2. **Error Resilience**: Comprehensive error handling with appropriate fallbacks and retry mechanisms
3. **Caching Strategy**: Multi-level caching to improve performance and reduce API costs
4. **Cloud-Native Design**: Built for containerized deployment with stateless operation 
5. **Security First**: Proper management of secrets and sensitive configuration 