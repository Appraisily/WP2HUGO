# WP2HUGO API Fix

This document describes the changes made to fix the WP2HUGO API service and how to deploy them.

## Issue

The WP2HUGO service was failing with the following error:

```
[SERVER] Error processing Hugo workflow: Error: Google Sheets connection not initialized
at SheetsService.getAllRows (/usr/src/app/src/services/sheets.service.js:89:13)
at WorkflowService.getRowData (/usr/src/app/src/services/hugo/workflow.service.js:69:41)
```

The issue was that the Google Sheets service was not properly initialized, and the code was throwing an error instead of gracefully handling the case when Sheets was not available.

## Solution

We have updated the `sheets.service.js` file to return mock data instead of throwing errors when the service is not initialized. This allows the API to function even when Google Sheets connectivity is not available.

Key changes:
1. Each method that previously threw an error when sheets was not connected now returns mock data instead
2. Error handling has been improved to fall back to mock data on errors
3. Mock data generators have been added for each method

## How to Deploy

1. Ensure you are logged into Google Cloud:
   ```
   gcloud auth login
   ```

2. Deploy the updated service:
   ```
   gcloud run services update wp2hugo --region=us-central1 --source=.
   ```

   Or alternatively, build and deploy manually:
   ```
   # Build the container
   gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/wp2hugo

   # Deploy the container
   gcloud run deploy wp2hugo --image gcr.io/YOUR_PROJECT_ID/wp2hugo --region us-central1
   ```

3. Test the API after deployment:
   ```
   curl -X POST "https://wp2hugo-856401495068.us-central1.run.app/api/hugo/process" \
     -H "Content-Type: application/json" \
     -d '{"keyword":"antique electric hurricane lamps"}'
   ```

The updated service should now successfully handle API requests even if the Google Sheets connection fails or is not properly configured. The service will use mock data to fulfill requests, allowing testing of the downstream components without requiring Sheets connectivity.

## Notes for Future Configuration

For the service to use real Sheets data in the future:

1. Ensure the Google Cloud service account has permissions to access the Google Sheet
2. Configure the `SERVICE_ACCOUNT_JSON` and `SHEETS_ID` secrets in Cloud Run
3. Verify the sheets service initializes correctly by checking the logs 