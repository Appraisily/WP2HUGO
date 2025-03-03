# Cloud Run Deployment Guide for WP2HUGO

This guide provides detailed instructions for deploying the WP2HUGO Content Generation System to Google Cloud Run.

## Prerequisites

1. Google Cloud account with billing enabled
2. Google Cloud SDK installed locally
3. Docker installed locally (for testing)
4. All API keys for external services
5. Access to Google Cloud Secret Manager

## Step 1: Configure Secrets

Create secrets for all API keys and sensitive configuration:

```bash
# Create secrets for API keys
gcloud secrets create kwrds-api-key --data-file=./kwrds-api-key.txt
gcloud secrets create openai-api-key --data-file=./openai-api-key.txt
gcloud secrets create anthropic-api-key --data-file=./anthropic-api-key.txt
gcloud secrets create perplexity-api-key --data-file=./perplexity-api-key.txt
gcloud secrets create google-ai-api-key --data-file=./googleai-api-key.txt

# For Google Sheets integration (if using)
gcloud secrets create service-account-json --data-file=./service-account.json
gcloud secrets create sheets-id --data-file=./sheets-id.txt
```

> **⚠️ Important Note on Secret Names:**
> 
> Google Cloud Secret Manager is **case-sensitive** and treats hyphens and underscores as different characters. The WP2HUGO application expects secret names to follow the naming convention in the code.
> 
> For example:
> - In the config file: `serviceAccountJson: 'service-account-json'`
> - Secret name format: `service-account-json` (lowercase with hyphens)
> 
> If you encounter "Secret not found" errors, verify that your actual secret names in Secret Manager match exactly what's expected in the application's config.

## Step 2: Create a Dockerfile

Create a `Dockerfile` in your project root:

```dockerfile
FROM node:16

WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Create necessary directories
RUN mkdir -p output/research output/content output/images output/markdown content

# Command to run the application
CMD ["node", "src/server.js"]
```

## Step 3: Update Cloud Build Configuration

Create or update your `cloudbuild.yaml` file:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/wp2hugo', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/wp2hugo']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk:slim'
    entrypoint: 'gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'wp2hugo'
      - '--image'
      - 'gcr.io/$PROJECT_ID/wp2hugo'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--timeout=10m'
      - '--memory=2Gi'
      - '--cpu=2'
      - '--set-env-vars=PORT=8080'
      - '--set-secrets=KWRDS_API_KEY=kwrds-api-key:latest,OPENAI_API_KEY=openai-api-key:latest,ANTHROPIC_API_KEY=anthropic-api-key:latest,PERPLEXITY_API_KEY=perplexity-api-key:latest,GOOGLE_AI_API_KEY=google-ai-api-key:latest,SERVICE_ACCOUNT_JSON=service-account-json:latest,SHEETS_ID=sheets-id:latest'

images:
  - 'gcr.io/$PROJECT_ID/wp2hugo'
```

> **Note:** Make sure the `--set-secrets` parameter maps environment variable names (e.g., `KWRDS_API_KEY`) to the corresponding secret names in Google Cloud Secret Manager (e.g., `kwrds-api-key`).

## Step 4: Test Locally with Docker

Before deploying to Cloud Run, test locally:

```bash
# Build the Docker image
docker build -t wp2hugo-local .

# Run the container with environment variables
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e KWRDS_API_KEY=your_kwrds_api_key \
  -e OPENAI_API_KEY=your_openai_api_key \
  -e ANTHROPIC_API_KEY=your_anthropic_api_key \
  -e PERPLEXITY_API_KEY=your_perplexity_api_key \
  -e GOOGLE_AI_API_KEY=your_googleai_api_key \
  wp2hugo-local
```

## Step 5: Deploy to Cloud Run

Deploy using Cloud Build:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

## Troubleshooting Cloud Run Deployment Issues

### Container Failed to Start

If you see the error: "The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable within the allocated timeout."

**Solution:**
1. Ensure your server is properly configured to listen on the PORT environment variable:

```javascript
// src/config/index.js
const config = {
  // Server configuration
  port: process.env.PORT || 8080,
  // ...
}
```

2. Make sure your server code is listening on this port:

```javascript
// src/server.js
app.listen(port, () => {
  console.log(`[SERVER] Server listening on port ${port}`);
});
```

### Sheets Service Initialization Error

If you see the error: "Cannot read properties of undefined (reading 'serviceAccountJson')"

**Solution:**
1. Make sure the secretNames object is properly defined in your config:

```javascript
// src/config/index.js
secretNames: {
  serviceAccountJson: 'SERVICE_ACCOUNT_JSON',
  sheetsId: 'SHEETS_ID',
  // other secret names...
}
```

2. If you're not using Google Sheets, consider making this service optional:

```javascript
// in src/server.js
try {
  if (process.env.SERVICE_ACCOUNT_JSON && process.env.SHEETS_ID) {
    await sheetsService.initialize();
  } else {
    console.log('[SERVER] Sheets service disabled (credentials not provided)');
  }
} catch (error) {
  console.warn('[SERVER] Sheets service initialization failed, continuing without it');
}
```

### Service Initialization Failures

For services like Perplexity that may be missing initialization methods:

**Solution:**
1. Add initialize() methods to all service classes:

```javascript
class SomeService {
  async initialize() {
    console.log('[SERVICE] Initialized successfully');
    return true;
  }
}
```

### Environment Variable Access

For services that need environment variables:

**Solution:**
1. When deploying to Cloud Run, use Secret Manager and set secrets:

```bash
gcloud run services update wp2hugo \
  --set-secrets=KWRDS_API_KEY=KWRDS_API_KEY:latest
```

2. In your code, check for environment variables and have fallback options:

```javascript
if (!process.env.KWRDS_API_KEY) {
  console.warn('[SERVICE] API key not found, using mock data');
}
```

## Best Practices for Cloud Run

1. **Set Container Memory and CPU**: Allocate enough resources for your application
   ```
   --memory=2Gi --cpu=2
   ```

2. **Set Appropriate Timeouts**: Increase timeout for long-running operations
   ```
   --timeout=10m
   ```

3. **Use Secret Manager**: Never hardcode API keys or sensitive credentials
   ```
   --set-secrets=KEY=SECRET:VERSION
   ```

4. **Enable CloudSQL**: If using a database
   ```
   --set-cloudsql-instances=INSTANCE_CONNECTION_NAME
   ```

5. **Configure VPC Connector**: If accessing private resources
   ```
   --vpc-connector=CONNECTOR_NAME
   ```

6. **Set Concurrency**: Control the number of requests per container
   ```
   --concurrency=50
   ```

7. **Enable Health Checks**: For improved reliability
   ```
   --health-check-path=/health
   ```

## Monitoring and Logging

After deployment, monitor your service:

1. **View Logs**:
   ```
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wp2hugo"
   ```

2. **Stream Logs**:
   ```
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wp2hugo" --stream
   ```

3. **Check Service Status**:
   ```
   gcloud run services describe wp2hugo
   ```

## Security Considerations

1. **IAM Permissions**: Grant minimal permissions to your service account
2. **Authentication**: Consider requiring authentication for production services
3. **Secrets Rotation**: Regularly rotate API keys and secrets
4. **VPC Isolation**: For enhanced security, use VPC for your services

## Conclusion

Following this guide should help you deploy the WP2HUGO system to Cloud Run successfully. If you continue to experience issues, check the Cloud Run logs for specific error messages and ensure all environment variables and secrets are properly configured. 