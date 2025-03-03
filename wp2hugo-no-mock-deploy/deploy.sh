# Deploy to Google Cloud Run

# Login to gcloud (if not already logged in)
gcloud auth login

# Set the project
gcloud config set project wp2hugo-856401495068

# Deploy the service
gcloud run deploy wp2hugo --source=. --region=us-central1 --platform=managed --set-env-vars=NODE_ENV=production

echo "Deployment complete! Verify the service is working with:"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"keyword\":\"test keyword\"}' https://wp2hugo-856401495068.us-central1.run.app/api/hugo/process"
