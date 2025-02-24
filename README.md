# WordPress to Hugo Content Migration Service

## Overview
This service automates the process of migrating WordPress posts to Hugo markdown files, with a focus on SEO optimization and content enhancement. It reads WordPress post IDs from a Google Sheets document, retrieves content via the WordPress REST API, enhances it using AI, and converts it to Hugo-compatible markdown files with proper front matter.

## Core Features

### 1. AI-Powered Content Enhancement
- OpenAI GPT-4 integration for content optimization
- DALL-E 3 for image generation
- Perplexity AI for research insights
- Structured prompt management
- Response tracking and analysis

### 2. Research & Analysis
- Keyword research with volume metrics
- "People Also Ask" question analysis
- SERP data collection and analysis
- Content structure recommendations
- User intent analysis

### 3. Content Pipeline
- Modular processing stages
- Event-driven architecture
- Error recovery mechanisms
- Progress tracking
- Data versioning

### 4. Storage & Caching
- Google Cloud Storage integration
- Multi-layer caching strategy
- Data versioning
- Structured storage hierarchy
- Automatic cleanup

### 5. Monitoring & Logging
- Structured logging
- Error tracking
- Performance metrics
- Request tracing
- Health monitoring

## Architecture

### Project Structure
```
src/
├── services/
│   ├── ai/                    # AI services
│   │   ├── base.js
│   │   ├── content/
│   │   │   ├── analyzer.js
│   │   │   ├── enhancer.js
│   │   │   └── generator.js
│   │   ├── image/
│   │   │   └── generator.js
│   │   └── prompts/
│   │       ├── content.js
│   │       ├── image.js
│   │       └── analysis.js
│   ├── storage/              # Storage services
│   │   ├── base.js
│   │   ├── content/
│   │   ├── research/
│   │   └── ai/
│   ├── research/            # Research services
│   │   ├── base.js
│   │   ├── keyword/
│   │   ├── paa/
│   │   ├── serp/
│   │   └── perplexity/
│   └── content/             # Content pipeline
│       └── pipeline/
│           ├── collector.js
│           ├── analyzer.js
│           ├── enhancer.js
│           └── publisher.js
├── utils/                   # Utilities
│   ├── errors/
│   ├── logging/
│   └── monitoring/
└── middleware/             # Express middleware
    ├── error-handler.js
    └── request-logger.js
```

## API Endpoints

### Content Processing
```bash
# Process content with AI enhancement
POST /api/content/process

# Health check endpoint
GET /health
```

## Deployment

### Cloud Run Configuration
- Memory: 1GB per instance
- CPU: 1 core per instance
- Auto-scaling: 1-10 instances
- Region: us-central1
- Platform: managed
- Authentication: public access

### CI/CD Pipeline
- GitHub Actions with Workload Identity Federation
- Cloud Build configuration
- Zero-downtime deployments
- Automated security scanning

## Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | Google Cloud project ID | Yes |
| `PORT` | Server port (default: 8080) | No |

### Required Secrets
| Secret Name | Description |
|-------------|-------------|
| `SHEETS_ID_SEO` | Google Sheets document ID |
| `OPEN_AI_API_SEO` | OpenAI API key |
| `KWRDS_API_KEY` | Keywords API key |
| `PERPLEXITY_API_KEY` | Perplexity API key |
| `WORDPRESS_API_URL` | WordPress API endpoint |
| `wp_username` | WordPress API username |
| `wp_app_password` | WordPress API password |

## Development

### Prerequisites
- Node.js 18+
- Google Cloud SDK
- Access to:
  - Google Cloud Storage
  - Secret Manager
  - Cloud Run
  - Workload Identity
- WordPress site with REST API
- OpenAI API access
- Keywords API access
- Perplexity API access

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run locally: `npm start`

### Health Check
```bash
GET /health
```
Returns:
```json
{
  "status": "ok",
  "services": {
    "storage": "connected",
    "ai": "connected",
    "research": "connected",
    "pipeline": "connected"
  }
}
```

## Error Handling
- Centralized error handling
- Custom error classes
- Automatic error reporting
- Structured error logging
- Error recovery mechanisms

## Storage Structure
```
hugo-posts-content/
├── content/              # Processed content
│   └── [keyword]/
│       ├── research/
│       ├── analysis/
│       └── final/
├── ai/                  # AI data
│   ├── prompts/
│   └── responses/
├── research/           # Research data
│   ├── keyword/
│   ├── paa/
│   ├── serp/
│   └── perplexity/
└── logs/              # System logs
    ├── errors/
    ├── requests/
    └── metrics/
```

## Limitations
- API Rate Limits:
  - OpenAI API
  - Keywords API
  - Perplexity API
  - WordPress API
- Resource Constraints:
  - Memory usage (1GB)
  - Processing time
  - Storage quotas
- Content Limitations:
  - Maximum content length
  - Image generation limits
  - Concurrent requests