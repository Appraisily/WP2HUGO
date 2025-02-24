# WordPress to Hugo Content Migration Service

## Overview
This service automates the process of migrating WordPress posts to Hugo markdown files, with a focus on SEO optimization and content enhancement. It reads WordPress post IDs from a Google Sheets document, retrieves content via the WordPress REST API, enhances it using AI, and converts it to Hugo-compatible markdown files with proper front matter.

## Core Features

### 1. Google Sheets Integration
- Reads WordPress post IDs from a specified Google Sheet
- Tracks processing status
- Uses Google Cloud's workload identity for secure authentication

### 2. WordPress Integration
- Fetches post content using WordPress REST API
- Retrieves post metadata and featured images
- Preserves SEO settings and taxonomies

### 3. Hugo Content Generation
- AI-enhanced content optimization using OpenAI
- Intelligent content structure analysis
- SEO-optimized front matter generation
- Automated image handling and optimization
- Preserves taxonomies and metadata
- Implements schema.org markup

### 4. AI Enhancement
- OpenAI integration for content improvement
- Prompt and response tracking in GCS
- Automated content structure analysis
- SEO optimization suggestions
- Keyword research integration

### 5. Content Analysis
- Keyword research and analysis
- SERP data collection
- "People Also Ask" question analysis
- Perplexity AI insights
- Content structure recommendations

## Architecture

### Project Structure
```
src/
├── controllers/           # Request handlers
│   ├── content.controller.js
│   └── worker.controller.js
├── services/             # Core business logic
│   ├── content/          # Content processing
│   │   ├── content.service.js
│   │   ├── generator.service.js
│   │   ├── image.service.js
│   │   └── structure.service.js
│   ├── hugo/             # Hugo processing
│   │   ├── content-analyzer.service.js
│   │   ├── content-generator.service.js
│   │   ├── data-collector.service.js
│   │   └── workflow.service.js
│   ├── openai.service.js # OpenAI integration
│   ├── keyword-research.service.js
│   ├── paa.service.js
│   ├── perplexity.service.js
│   └── serp.service.js
├── utils/               # Utility functions
│   ├── secrets.js
│   ├── storage.js
│   ├── sheets.js
│   └── slug.js
└── config/             # Configuration
    └── index.js
```

## API Endpoints

### Content Processing
```bash
# Process WordPress posts with AI enhancement
POST /api/hugo/process

# Health check endpoint
GET /health
```

## Deployment

### Cloud Run Configuration
- Memory: 1GB per instance
- CPU: 1 core per instance
- Auto-scaling: 1-10 instances based on load
- Region: us-central1
- Platform: managed
- Authentication: public access

### CI/CD Pipeline
- GitHub Actions with Workload Identity Federation
- Cloud Build for manual deployments
- Zero-downtime rolling updates
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
    "sheets": "connected",
    "hugo": "connected",
    "analyzer": "connected",
    "keyword": "connected",
    "paa": "connected",
    "serp": "connected",
    "perplexity": "connected"
  }
}
```

## Error Handling
- Comprehensive error logging
- Automatic retry mechanisms
- Detailed error reporting
- Error tracking in GCS
- Service health monitoring

## Storage
Content and logs are stored in Google Cloud Storage:
```
hugo-posts-content/
├── research/           # Research data
│   ├── keyword-data/
│   ├── paa-data/
│   ├── serp-data/
│   └── perplexity-data/
├── prompts/           # OpenAI prompts
│   └── YYYY-MM-DD/
├── responses/         # OpenAI responses
│   └── YYYY-MM-DD/
└── logs/             # System logs
    └── YYYY-MM-DD/
```

## Hugo Content Structure
```
content/
├── _index.md
└── blog/
    ├── _index.md
    └── [slug].md
```

## Limitations
- API Rate Limits:
  - WordPress REST API
  - OpenAI API
  - Keywords API
  - Perplexity API
  - Google Sheets API
- Resource Constraints:
  - Cloud Run memory (1GB)
  - Cloud Run CPU (1 core)
  - Storage quotas
- Content Limitations:
  - Maximum content length for AI processing
  - Image size restrictions
  - Concurrent request limits