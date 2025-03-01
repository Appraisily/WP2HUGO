/**
 * Start Image Generation Service
 * This script starts the image generation service as a separate process
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the port from environment or use default
const PORT = process.env.IMAGE_GEN_PORT || 3001;

// Set the correct path to the image generation service
const servicePath = path.join(__dirname, 'image-generation-service', 'src', 'index.js');

// Check if the service exists
if (!fs.existsSync(servicePath)) {
  console.error(`[ERROR] Image generation service not found at ${servicePath}`);
  console.error('Make sure you have initialized the submodule with: git submodule update --init --recursive');
  process.exit(1);
}

console.log(`[INFO] Starting image generation service on port ${PORT}...`);

// Start the service
const serviceProcess = spawn('node', [servicePath], {
  env: {
    ...process.env,
    PORT,
    // Forward necessary environment variables
    IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY || '',
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_API_KEY || '',
    OPEN_AI_API_SEO: process.env.OPEN_AI_API_SEO || '',
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  stdio: 'inherit'
});

// Handle process events
serviceProcess.on('error', (error) => {
  console.error(`[ERROR] Failed to start image generation service: ${error.message}`);
});

serviceProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`[ERROR] Image generation service exited with code ${code}`);
  } else {
    console.log('[INFO] Image generation service stopped');
  }
});

// Handle application termination
process.on('SIGINT', () => {
  console.log('[INFO] Stopping image generation service...');
  serviceProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[INFO] Stopping image generation service...');
  serviceProcess.kill('SIGTERM');
  process.exit(0);
});

console.log(`[INFO] Image generation service running on port ${PORT}`);
console.log('[INFO] Press Ctrl+C to stop'); 