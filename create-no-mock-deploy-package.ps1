# PowerShell script to create a deployment package for WP2HUGO API with no mock data in production

# Create deployment directory
$deployDir = ".\wp2hugo-no-mock-deploy"
$srcDir = "$deployDir\src"
$servicesDir = "$srcDir\services"
$hugoServicesDir = "$servicesDir\hugo"
$utilsDir = "$srcDir\utils"

# Create directories if they don't exist
if (!(Test-Path $deployDir)) {
    New-Item -ItemType Directory -Path $deployDir
    Write-Host "Created directory: $deployDir"
}
if (!(Test-Path $srcDir)) {
    New-Item -ItemType Directory -Path $srcDir
    Write-Host "Created directory: $srcDir"
}
if (!(Test-Path $servicesDir)) {
    New-Item -ItemType Directory -Path $servicesDir
    Write-Host "Created directory: $servicesDir"
}
if (!(Test-Path $hugoServicesDir)) {
    New-Item -ItemType Directory -Path $hugoServicesDir
    Write-Host "Created directory: $hugoServicesDir"
}
if (!(Test-Path $utilsDir)) {
    New-Item -ItemType Directory -Path $utilsDir
    Write-Host "Created directory: $utilsDir"
}

# Copy modified files
try {
    # 1. Copy keyword research service
    Copy-Item -Path ".\src\services\keyword-research.service.js" -Destination "$servicesDir\keyword-research.service.js"
    Write-Host "Copied keyword-research.service.js to deployment package"

    # 2. Copy PAA service
    Copy-Item -Path ".\src\services\paa.service.js" -Destination "$servicesDir\paa.service.js"
    Write-Host "Copied paa.service.js to deployment package"

    # 3. Copy SERP service
    Copy-Item -Path ".\src\services\serp.service.js" -Destination "$servicesDir\serp.service.js"
    Write-Host "Copied serp.service.js to deployment package"

    # 4. Copy data collector service
    Copy-Item -Path ".\src\services\hugo\data-collector.service.js" -Destination "$hugoServicesDir\data-collector.service.js"
    Write-Host "Copied data-collector.service.js to deployment package"

    # 5. Copy documentation files
    Copy-Item -Path ".\WP2HUGO-Debug-Report.md" -Destination "$deployDir\WP2HUGO-Debug-Report.md"
    Write-Host "Copied debug report to deployment package"
    
    Copy-Item -Path ".\WP2HUGO-No-Mock-Data-Deployment.md" -Destination "$deployDir\README.md"
    Write-Host "Copied deployment guide as README.md to deployment package"

    # Create a minimal package.json in the deployment directory
    $packageJson = @"
{
  "name": "wp2hugo-api",
  "version": "1.0.0",
  "description": "WP2HUGO API with fix for mock data in production",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js"
  },
  "engines": {
    "node": ">=16.0.0"
  },
  "dependencies": {
    "axios": "^1.6.0",
    "express": "^4.18.2"
  }
}
"@
    Set-Content -Path "$deployDir\package.json" -Value $packageJson
    Write-Host "Created package.json in deployment package"

    # Create a .gcloudignore file
    $gcloudIgnore = @"
# Node.js dependencies
node_modules/
npm-debug.log

# Environment files
.env
.env.local
.env.*.local

# Git related
.git/
.gitignore

# Other files
*.md
!README.md
deploy-*
*.ps1
*.zip
"@
    Set-Content -Path "$deployDir\.gcloudignore" -Value $gcloudIgnore
    Write-Host "Created .gcloudignore in deployment package"

    # Create a deployment script
    $deployScript = @"
# Deploy to Google Cloud Run

# Login to gcloud (if not already logged in)
gcloud auth login

# Set the project
gcloud config set project wp2hugo-856401495068

# Deploy the service
gcloud run deploy wp2hugo --source=. --region=us-central1 --platform=managed --set-env-vars=NODE_ENV=production

echo "Deployment complete! Verify the service is working with:"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"keyword\":\"test keyword\"}' https://wp2hugo-856401495068.us-central1.run.app/api/hugo/process"
"@
    Set-Content -Path "$deployDir\deploy.sh" -Value $deployScript
    Write-Host "Created deploy.sh script in deployment package"

    # Create a ZIP file of the deployment package
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $zipPath = ".\wp2hugo-no-mock-deploy-$timestamp.zip"
    Compress-Archive -Path "$deployDir\*" -DestinationPath $zipPath
    Write-Host "Created deployment ZIP package at $zipPath"

    Write-Host "Deployment package creation completed successfully!" -ForegroundColor Green
    Write-Host "You can now deploy the package using the instructions in the README.md file." -ForegroundColor Green
}
catch {
    Write-Host "Error creating deployment package: $_" -ForegroundColor Red
} 