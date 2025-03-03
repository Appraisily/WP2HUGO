
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
  