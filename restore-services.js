
// Script to restore original storage implementation
const fs = require('fs');
const path = require('path');

const contentStoragePath = path.resolve(__dirname, 'src/utils/storage.js');
const originalPath = `${contentStoragePath}.original`;

if (fs.existsSync(originalPath)) {
  fs.copyFileSync(originalPath, contentStoragePath);
  console.log('Restored original storage implementation');
} else {
  console.error('Original storage implementation backup not found');
}

// Restore PAA service
const paaServicePath = path.resolve(__dirname, 'src/services/paa.service.js');
const originalPaaPath = `${paaServicePath}.original`;

if (fs.existsSync(originalPaaPath)) {
  fs.copyFileSync(originalPaaPath, paaServicePath);
  console.log('Restored original PAA service');
} else {
  console.log('Original PAA service backup not found');
}

// Restore SERP service
const serpServicePath = path.resolve(__dirname, 'src/services/serp.service.js');
const originalSerpPath = `${serpServicePath}.original`;

if (fs.existsSync(originalSerpPath)) {
  fs.copyFileSync(originalSerpPath, serpServicePath);
  console.log('Restored original SERP service');
} else {
  console.log('Original SERP service backup not found');
}
  