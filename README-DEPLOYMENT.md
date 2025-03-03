# WP2HUGO API Cloud Run Deployment

This document provides step-by-step instructions for deploying the fixed version of the WP2HUGO API to Google Cloud Run.

## Overview of Fixes

We've addressed several issues with the WP2HUGO API:

1. **Sheets Connection Handling**: Added mock data and error resilience when Sheets is not connected
2. **API Endpoint Processing**: Updated the `/api/hugo/process` endpoint to properly handle keywords
3. **Missing Method**: Added the missing `getKeywordData` method to the keyword research service

## Deployment Steps

### 1. Build and Deploy via Cloud Console (Recommended)

The simplest approach is to use the Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to Cloud Run > Services > wp2hugo
3. Click "Edit & Deploy New Revision"
4. Choose "Source" as the deployment option
5. Set Region to "us-central1"
6. Review and click "Deploy"

### 2. Build and Deploy via gcloud CLI

If you have the Google Cloud SDK installed locally:

```bash
# Authenticate with Google Cloud
gcloud auth login

# Deploy the service from source
gcloud run deploy wp2hugo --source=. --region=us-central1
```

## Verification Steps

After deployment, verify that the service is working correctly:

1. Check the health endpoint:
```
curl https://wp2hugo-856401495068.us-central1.run.app/health
```

2. Test the Hugo process endpoint with a keyword:
```
curl -X POST "https://wp2hugo-856401495068.us-central1.run.app/api/hugo/process" \
  -H "Content-Type: application/json" \
  -d '{"keyword":"antique electric hurricane lamps"}'
```

3. Check the Cloud Run logs for any errors

## Troubleshooting

If issues persist after deployment:

1. **Check Logs**: Review the Cloud Run logs for detailed error messages
2. **Service Dependencies**: Ensure all required services are initialized properly
3. **Secret Management**: Verify that all necessary secrets are properly configured

## Required Cloud Secrets

For full functionality, ensure these secrets are configured in Secret Manager:

- `service-account-json`: Service account credentials (case sensitive)
- `sheets-id`: Google Sheets ID (case sensitive)
- `api-key`: API key for external services

## Additional Configuration

To use real data instead of mock data, configure these environment variables:

- `KWRDS_API_KEY`: Keyword research API key
- `PERPLEXITY_API_KEY`: Perplexity API key 