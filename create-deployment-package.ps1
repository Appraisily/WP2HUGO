# PowerShell script to create a deployment package for WP2HUGO API Fix
Write-Output "Creating deployment package for WP2HUGO API Fix..."

# Create deployment directory
$deployDir = "wp2hugo-api-fix"
if (Test-Path $deployDir) {
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -Path $deployDir -ItemType Directory

# Copy necessary files
Write-Output "Copying server.js..."
Copy-Item -Path "src/server.js" -Destination "$deployDir/server.js"

# Create directory structure
New-Item -Path "$deployDir/src" -ItemType Directory
New-Item -Path "$deployDir/src/services" -ItemType Directory
New-Item -Path "$deployDir/src/services/hugo" -ItemType Directory
New-Item -Path "$deployDir/src/utils" -ItemType Directory
New-Item -Path "$deployDir/src/config" -ItemType Directory

# Copy modified files
Write-Output "Copying sheets.service.js..."
Copy-Item -Path "src/services/sheets.service.js" -Destination "$deployDir/src/services/sheets.service.js"

Write-Output "Copying hugo-processor.service.js..."
Copy-Item -Path "src/services/hugo-processor.service.js" -Destination "$deployDir/src/services/hugo-processor.service.js"

Write-Output "Copying workflow.service.js..."
Copy-Item -Path "src/services/hugo/workflow.service.js" -Destination "$deployDir/src/services/hugo/workflow.service.js"

Write-Output "Copying keyword-research.service.js..."
Copy-Item -Path "src/services/keyword-research.service.js" -Destination "$deployDir/src/services/keyword-research.service.js"

Write-Output "Copying data-collector.service.js..."
Copy-Item -Path "src/services/hugo/data-collector.service.js" -Destination "$deployDir/src/services/hugo/data-collector.service.js"

# Copy documentation
Write-Output "Copying documentation..."
Copy-Item -Path "WP2HUGO-API-FIX.md" -Destination "$deployDir/WP2HUGO-API-FIX.md"
Copy-Item -Path "README-DEPLOYMENT.md" -Destination "$deployDir/README.md"

# Create a zip file
Write-Output "Creating zip file..."
Compress-Archive -Path "$deployDir/*" -DestinationPath "wp2hugo-api-fix.zip" -Force

Write-Output "Deployment package created successfully: wp2hugo-api-fix.zip"
Write-Output "You can now upload this zip file to your deployment environment." 