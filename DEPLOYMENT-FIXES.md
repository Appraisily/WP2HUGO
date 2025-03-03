# WP2HUGO Cloud Run Deployment Fixes

This document summarizes the changes made to fix deployment issues with the WP2HUGO Content Generation System on Google Cloud Run.

## Issue Summary

The deployment was failing with the following errors:

1. **PORT Configuration Issue**:
   ```
   [SERVER] Server listening on port undefined
   ```
   The server was trying to listen on an undefined port, causing Cloud Run to terminate the container.

2. **Secret Manager Issues**:
   ```
   Error: 5 NOT_FOUND: Secret [projects/856401495068/secrets/SERVICE_ACCOUNT_JSON] not found or has no versions.
   ```
   The code was looking for a secret named `SERVICE_ACCOUNT_JSON`, but the actual secret was named `service-account-json`.

3. **Service Initialization Failures**:
   Several services were failing to initialize properly, including the Perplexity service and Sheets service.

## Changes Made

### 1. PORT Configuration Fix

Updated `src/config/index.js` to properly set the port:

```javascript
const config = {
  // Server configuration
  port: process.env.PORT || 8080,
  
  // ... rest of config
};
```

### 2. Secret Name Case Sensitivity Fix

Updated secret names in the configuration to match actual Google Cloud Secret Manager secret names:

```javascript
// Secret names for Google Cloud Secret Manager
secretNames: {
  serviceAccountJson: 'service-account-json', // Updated to match actual secret name
  sheetsId: 'SHEETS_ID',
  // ... other secrets
}
```

### 3. Improved Error Handling in Services

#### Sheets Service (`src/services/sheets.service.js`)

Made the Sheets service more resilient by gracefully handling missing credentials:

```javascript
async initialize() {
  try {
    let credentials;
    try {
      credentials = JSON.parse(await getSecret(secretNames.serviceAccountJson));
    } catch (error) {
      console.warn('[SHEETS] Service account credentials not available:', error.message);
      console.warn('[SHEETS] Sheets integration will be disabled');
      return false;
    }
    
    // ... rest of initialization
  } catch (error) {
    console.error('[SHEETS] Initialization failed:', error);
    this.isConnected = false;
    return false; // Return false instead of throwing
  }
}
```

#### Perplexity Service (`src/services/perplexity.service.js`)

Added an initialize method to the Perplexity service:

```javascript
async initialize() {
  try {
    if (process.env.PERPLEXITY_API_KEY) {
      console.log('[PERPLEXITY] API key found, service initialized with API access');
    } else {
      console.warn('[PERPLEXITY] API key not found. Using mock data for testing.');
    }
    
    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), 'output', 'research');
    await fs.mkdir(outputDir, { recursive: true });
    
    this.isInitialized = true;
    return true;
  } catch (error) {
    console.error(`[PERPLEXITY] Initialization failed: ${error.message}`);
    throw error;
  }
}
```

### 4. Server Initialization Improvements

Updated the server initialization to handle service failures more gracefully:

```javascript
// Initialize services individually to ensure one failure doesn't prevent others
serviceStatus.sheets = await initializeService(sheetsService, 'Sheets');
serviceStatus.hugo = await initializeService(hugoService, 'Hugo');
// ... other services
```

### 5. Enhanced Secret Management

Updated the secrets utility to better handle missing secrets and provide environment variable fallbacks:

```javascript
async function getSecret(name) {
  // Try to get from environment first 
  const envName = name.replace(/-/g, '_').toUpperCase();
  if (process.env[envName]) {
    console.log(`[SECRETS] Using ${envName} from environment variables`);
    return process.env[envName];
  }

  // If no environment variable, try Secret Manager
  try {
    // ... Secret Manager access
  } catch (error) {
    // Fallback to environment variables if Secret Manager fails
    if (process.env[envName]) {
      console.warn(`[SECRETS] Falling back to ${envName} environment variable`);
      return process.env[envName];
    }
    throw error;
  }
}
```

### 6. New Utility Scripts

Created a new utility script to verify secret names before deployment:

- `verify-secrets.js`: Outputs the expected secret names and generates deployment commands with the correct secret mappings.

### 7. Documentation Updates

1. Updated the README.md with more information about environment variables and Cloud Run deployment.
2. Created a comprehensive CLOUD-RUN-DEPLOYMENT.md guide with step-by-step instructions.
3. Added specific note about the case sensitivity of secret names in Google Cloud Secret Manager.

## Deployment Instructions

1. Run the verification script to check your secret names:
   ```
   node verify-secrets.js
   ```

2. Create the required secrets in Google Cloud Secret Manager:
   ```
   gcloud secrets create service-account-json --data-file=./service-account.json
   gcloud secrets create sheets-id --data-file=./sheets-id.txt
   # ... other secrets
   ```

3. Deploy the application to Cloud Run:
   ```
   gcloud run deploy wp2hugo \
     --image=gcr.io/YOUR_PROJECT_ID/wp2hugo \
     --region=us-central1 \
     --platform=managed \
     --memory=2Gi \
     --timeout=10m \
     --set-env-vars=PORT=8080 \
     --set-secrets=SERVICE_ACCOUNT_JSON=service-account-json:latest,SHEETS_ID=sheets-id:latest
   ```

## Testing the Deployment

After deploying, verify that the application is running correctly:

1. Check the health endpoint:
   ```
   curl https://wp2hugo-856401495068.us-central1.run.app/health
   ```

2. Check the application logs for any remaining errors:
   ```
   gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=wp2hugo" --limit=50
   ```

These changes should resolve the deployment issues and allow the WP2HUGO Content Generation System to run correctly on Google Cloud Run. 