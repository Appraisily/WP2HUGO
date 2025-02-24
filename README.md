# AI-Powered Hugo Content Generator

## Overview
This service generates SEO-optimized Hugo pages from keywords. It reads keywords from a Google Sheet, performs comprehensive research and analysis using multiple AI services, and generates high-quality, optimized content with proper front matter and schema markup.

## Core Features

### 1. Google Sheets Integration
- Reads keywords from specified Google Sheet
- Tracks content generation status
- Uses Google Cloud's workload identity for secure authentication

### 2. AI-Powered Content Generation
- OpenAI GPT-4 for content creation
- DALL-E 3 for image generation
- Perplexity AI for research insights
- Automated content structure analysis
- SEO optimization

### 3. Research & Analysis
- Keyword research and analysis
- SERP data collection
- "People Also Ask" question analysis
- Competitive content analysis
- Topic clustering and semantic relevance

### 4. Hugo Content Generation
- SEO-optimized front matter
- Schema.org markup
- Automated image generation and optimization
- Clean, semantic HTML structure
- Proper content hierarchy

### 5. Content Enhancement
- Value proposition analysis
- User intent matching
- Conversion optimization
- Trust signal integration
- Featured snippet optimization

## Architecture

### Project Structure
```
src/
├── controllers/           # Request handlers
│   ├── content.controller.js
│   └── worker.controller.js
├── services/             # Core business logic
│   ├── content/          # Content processing
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
# Generate Hugo content from keywords
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

## Development

### Prerequisites
- Node.js 18+
- Google Cloud SDK
- Access to:
  - Google Cloud Storage
  - Secret Manager
  - Cloud Run
  - Workload Identity
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

## Content Generation Process

1. Keyword Analysis
   - Extract keyword from Google Sheet
   - Perform keyword research
   - Analyze search intent
   - Collect SERP data
   - Gather "People Also Ask" questions

2. Content Research
   - Generate topic clusters
   - Analyze competition
   - Identify content gaps
   - Determine value propositions
   - Plan content structure

3. Content Creation
   - Generate optimized title and meta description
   - Create comprehensive content
   - Generate and optimize images
   - Add schema markup
   - Implement proper heading hierarchy

4. Quality Assurance
   - Verify SEO optimization
   - Check content accuracy
   - Validate schema markup
   - Ensure proper formatting
   - Test internal links

## Storage Structure
Content and data are stored in Google Cloud Storage:
```
hugo-posts-content/
├── {keyword-slug}/       # One folder per keyword
│   ├── research/        # Research data
│   │   ├── keyword-data.json
│   │   ├── paa-data.json
│   │   ├── serp-data.json
│   │   └── perplexity-data.json
│   ├── prompts/        # OpenAI prompts
│   │   └── YYYY-MM-DD/
│   ├── responses/      # OpenAI responses
│   │   └── YYYY-MM-DD/
│   └── content/        # Generated content
│       ├── images/
│       └── index.md
└── logs/              # System logs
    └── YYYY-MM-DD/
```

## Hugo Content Structure
```
content/
├── _index.md
└── blog/
    ├── _index.md
    └── {keyword-slug}/
        ├── index.md
        └── images/
```

## Limitations
- API Rate Limits:
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
  - Image generation quotas
  - Concurrent request limits