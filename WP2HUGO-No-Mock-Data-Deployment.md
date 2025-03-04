# WP2HUGO API: No Mock Data Deployment Guide

## Overview

This document outlines the deployment process for updating the WP2HUGO API service to ensure that:

1. The service does not fall back to mock data in production environments
2. Proper error handling and propagation is implemented
3. All API integrations are properly configured to use the correct endpoints

## Changes Made

We've made several improvements to the WP2HUGO API that ensure the service properly handles errors and doesn't silently fall back to mock data in production:

1. **Updated API Endpoints**: Fixed the endpoints for Keyword Research, PAA, and SERP services to use the correct kwrds.ai API endpoints.
2. **Improved Error Handling**: Added retry logic with exponential backoff for all external API calls.
3. **Environment-Aware Behavior**: Explicitly differentiated between development and production behavior.
4. **More Descriptive Error Messages**: Errors now provide useful information for debugging.
5. **Secure API Authentication**: Updated headers to use X-API-KEY authentication for all kwrds.ai services.

## Files Modified

1. `src/services/keyword-research.service.js`
   - Updated to use the correct API endpoints
   - Added retry logic for API calls
   - Removed mock data fallback in production environments
   - Improved error handling and propagation

2. `src/services/hugo/data-collector.service.js`
   - Improved error handling when interacting with the keyword research service
   - Removed fallback to mock data in case of errors
   - Added more descriptive logging

3. `src/services/paa.service.js`
   - Updated to use the correct PAA API endpoint (`https://paa.api.kwrds.ai/people-also-ask`)
   - Fixed the request structure to match the API documentation
   - Added retry logic for better resilience
   - Configured to use the X-API-KEY header for authentication

4. `src/services/serp.service.js`
   - Updated to use the correct SERP API endpoint (`https://keywordresearch.api.kwrds.ai/serp`)
   - Changed from GET to POST method as per API documentation
   - Corrected the request body structure to include search_question, search_country, and volume
   - Added retry logic for network resilience
   - Ensured no mock data is used in production

## Deployment Instructions

### Prerequisites

1. Valid API keys for kwrds.ai services (KWRDS_API_KEY, PAA_API_KEY, SERP_API_KEY)
2. Access to Google Cloud Run or similar hosting platform
3. Node.js environment for local testing

### Deployment Steps

1. **Set up API Keys**:
   - Ensure all required API keys are set in your environment
   - For Google Cloud Run, update the environment variables in the service configuration

   ```bash
   # Example: Setting environment variables in Google Cloud Run
   gcloud run services update wp2hugo-api \
     --set-env-vars="KWRDS_API_KEY=your-api-key,PAA_API_KEY=your-api-key,SERP_API_KEY=your-api-key"
   ```

2. **Deploy Updated Code**:
   - Upload all modified files to your deployment environment
   - If using Google Cloud Run, you can deploy using:

   ```bash
   # Navigate to the directory containing the code
   cd wp2hugo-deploy

   # Deploy to Google Cloud Run
   gcloud run deploy wp2hugo-api --source .
   ```

3. **Verify Deployment**:
   - Test that the service is running correctly
   - Verify that API calls are successful
   - Check that errors are properly propagated and no mock data is returned in production

   ```bash
   # Example: Test the keyword research API endpoint
   curl -X POST https://your-service-url/api/research \
     -H "Content-Type: application/json" \
     -d '{"keyword": "test keyword"}'
   ```

## Verification Steps

After deployment, perform these tests to ensure everything is working as expected:

1. **Test Successful API Path**:
   - Submit a request with a valid keyword
   - Verify that real data is returned from the kwrds.ai APIs

2. **Test Error Handling**:
   - Temporarily use an invalid API key
   - Verify that the service returns an appropriate error message rather than mock data

3. **Test Network Resilience**:
   - Monitor the logs during periods of network instability
   - Verify that the retry logic is working as expected

## Rollback Instructions

If issues arise after deployment:

1. Revert to the previous version of the service using your deployment platform's rollback feature
2. For Google Cloud Run:

   ```bash
   gcloud run services update-traffic wp2hugo-api --to-revisions=REVISION_NAME=100
   ```

## API Key Setup

For security and proper operation, follow these best practices for API key management:

1. Never hardcode API keys in the source code
2. Always use environment variables for API keys
3. Rotate API keys periodically
4. Use different API keys for development and production environments

## Notes on Mock Data

- Mock data will only be used in development environments (when `NODE_ENV` is set to `development`)
- In production, any API failure will result in an error being propagated to the client
- This ensures that users always receive accurate information or an appropriate error message

## Monitoring

After deployment, monitor these aspects of the service:

1. API call success rates
2. Error rates and types
3. Response times
4. API quota usage

## Support

For any issues with the deployment, please contact the development team.

For API-specific issues, you can contact kwrds.ai support at hello@kwrds.ai.

---

*Last Updated: March 4, 2025* 