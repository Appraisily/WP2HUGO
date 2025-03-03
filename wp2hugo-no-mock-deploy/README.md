# WP2HUGO API: No Mock Data Deployment Guide

## Summary of Changes

This deployment removes the mock data fallback in production environments. The key modifications ensure that the WP2HUGO API will:

1. Use real data in production and properly report errors when external APIs fail
2. Continue to support development with mock data for local testing
3. Use the correct API endpoints and authentication methods for the KWRDS API

## Files Modified

The following files have been modified:

1. **src/services/keyword-research.service.js**
   - Updated API endpoint to `https://keywordresearch.api.kwrds.ai`
   - Changed authentication method to use `X-API-KEY` header
   - Added environment check to prevent mock data usage in production
   - Updated request payload format for the KWRDS API

2. **src/services/hugo/data-collector.service.js**
   - Updated error handling to propagate errors from external services
   - Removed allowance for mock data fallback
   - Added try-catch blocks for all external service calls

3. **src/services/paa.service.js**
   - Added environment-aware behavior
   - Prevents mock data usage in production
   - Properly initializes with API key or throws error in production

4. **src/services/serp.service.js**
   - Added environment-aware behavior
   - Prevents mock data usage in production
   - Properly initializes with API key or throws error in production

## Deployment Instructions

### Prerequisites

1. Ensure you have the Google Cloud SDK installed
2. Verify you have sufficient permissions to deploy to Cloud Run
3. Make sure you have the updated code files ready

### Deployment Steps

#### Option 1: Deploy via Google Cloud Console

1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to Cloud Run > Services > wp2hugo
4. Click "Edit and Deploy New Revision"
5. Under "Container", select "Build from source"
6. Connect to your source repository or upload the deployment package
7. Ensure the following environment variables are set:
   - `NODE_ENV=production`
   - `KWRDS_API_KEY=[your-api-key]`
   - `PAA_API_KEY=[your-api-key]` (if available)
   - `SERP_API_KEY=[your-api-key]` (if available)
8. Click "Deploy"

#### Option 2: Deploy via Command Line

1. Clone or update your local repository with the modified files
2. Navigate to the project directory
3. Login to Google Cloud:
   ```
   gcloud auth login
   ```
4. Set the correct project:
   ```
   gcloud config set project wp2hugo-856401495068
   ```
5. Deploy the updated service:
   ```
   gcloud run deploy wp2hugo --source=. --region=us-central1 --platform=managed --set-env-vars=NODE_ENV=production
   ```
   **Note**: If you're using a pre-built container rather than building from source:
   ```
   gcloud builds submit --tag gcr.io/wp2hugo-856401495068/wp2hugo
   gcloud run deploy wp2hugo --image gcr.io/wp2hugo-856401495068/wp2hugo --region=us-central1 --platform=managed --set-env-vars=NODE_ENV=production
   ```

6. Set or update the required secrets:
   ```
   gcloud run services update wp2hugo --set-secrets=KWRDS_API_KEY=kwrds-api-key:latest
   ```
   Add additional secrets for PAA and SERP services if available.

### Verification

After deployment, verify that the service is working correctly by making a test request:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"keyword":"test keyword"}' \
  https://wp2hugo-856401495068.us-central1.run.app/api/hugo/process
```

Expected behavior:
- If the external APIs are available and correctly configured, you should receive real data.
- If any external API fails, you should receive an error response rather than mock data.

## Rollback (If Needed)

If you need to roll back to the previous version:

```bash
gcloud run services update wp2hugo --region=us-central1 --to-revision=[previous-revision-name]
```

Replace `[previous-revision-name]` with the name of the previous working revision.

## API Key Setup

If you need to obtain or update API keys:

1. **KWRDS API Key**:
   - Sign up or log in at https://kwrds.ai
   - Navigate to your account settings to obtain the API key

2. **Store as Secret in Google Cloud**:
   ```bash
   echo -n "your-api-key" | gcloud secrets create kwrds-api-key --data-file=-
   gcloud secrets add-iam-policy-binding kwrds-api-key \
     --member=serviceAccount:wp2hugo-service-account@wp2hugo-856401495068.iam.gserviceaccount.com \
     --role=roles/secretmanager.secretAccessor
   ```

## Notes on Mock Data

After this deployment, mock data will only be used in development environments (`NODE_ENV=development`). In production, the service will:

1. Try to connect to external APIs
2. Retry on failure with exponential backoff
3. Return an error if the API calls fail
4. Never fall back to mock data

This ensures that users always receive accurate information about the service status and are not misled by fictional data. 