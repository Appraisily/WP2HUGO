/**
 * Verify Secret Names for Cloud Run Deployment
 * 
 * This script checks that the secret names in your config match
 * the expected pattern for Google Cloud Secret Manager.
 */

const { execSync } = require('child_process');
const { secretNames } = require('./src/config');

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}=== WP2HUGO Secret Name Verification ===${colors.reset}\n`);
console.log(`This script helps verify that your secret names match the expected format for Cloud Run.`);
console.log(`Secret names in Google Cloud Secret Manager are case-sensitive and format-sensitive.\n`);

// Display the secret names from the config
console.log(`${colors.magenta}Secret Names in Config:${colors.reset}`);
for (const [key, value] of Object.entries(secretNames)) {
  console.log(`- ${colors.blue}${key}${colors.reset}: ${value}`);
}

console.log(`\n${colors.magenta}Expected Secret Names for Cloud Run:${colors.reset}`);
for (const [key, value] of Object.entries(secretNames)) {
  console.log(`- ${colors.green}${value}${colors.reset}`);
}

console.log(`\n${colors.magenta}Commands to Create Secrets:${colors.reset}`);
for (const [key, value] of Object.entries(secretNames)) {
  console.log(`gcloud secrets create ${value} --replication-policy="automatic"`);
}

console.log(`\n${colors.magenta}Cloud Run Secret Configuration:${colors.reset}`);
let secretsArg = '--set-secrets=';
const secretMappings = Object.entries(secretNames).map(([key, value]) => {
  // Convert camelCase to UPPER_CASE for environment variable names
  const envName = key.replace(/([A-Z])/g, '_$1').toUpperCase();
  return `${envName}=${value}:latest`;
});
secretsArg += secretMappings.join(',');

console.log(secretsArg);

console.log(`\n${colors.cyan}=== Deployment Command ===${colors.reset}`);
console.log(`gcloud run deploy wp2hugo \\
  --image=gcr.io/YOUR_PROJECT_ID/wp2hugo \\
  --region=us-central1 \\
  --platform=managed \\
  --allow-unauthenticated \\
  --memory=2Gi \\
  --cpu=2 \\
  --timeout=10m \\
  --set-env-vars=PORT=8080 \\
  ${secretsArg}`);

console.log(`\n${colors.cyan}=== Verification Complete ===${colors.reset}`);
console.log(`If you're updating an existing deployment, use:\n`);
console.log(`gcloud run services update wp2hugo \\
  --region=us-central1 \\
  ${secretsArg}`); 