const fs = require('fs');
const path = require('path');

// Define source and destination paths for optimized content
const sourcePath1 = path.join(process.cwd(), 'output', 'research', 'antique-electric-hurricane-lamps-anthropic-seo-optimized.json');
const destPath1 = path.join(process.cwd(), 'output', 'optimized', 'antique-electric-hurricane-lamps.json');

// Define source and destination paths for enhanced content
const sourcePath2 = path.join(process.cwd(), 'output', 'research', 'antique-electric-hurricane-lamps-anthropic-enhanced.json');
const destPath2 = path.join(process.cwd(), 'output', 'enhanced', 'antique-electric-hurricane-lamps.json');

// Ensure the destination directories exist
const destDir1 = path.dirname(destPath1);
if (!fs.existsSync(destDir1)) {
  fs.mkdirSync(destDir1, { recursive: true });
  console.log(`Created directory: ${destDir1}`);
}

const destDir2 = path.dirname(destPath2);
if (!fs.existsSync(destDir2)) {
  fs.mkdirSync(destDir2, { recursive: true });
  console.log(`Created directory: ${destDir2}`);
}

// Copy the optimized content file
try {
  const fileContent1 = fs.readFileSync(sourcePath1, 'utf8');
  fs.writeFileSync(destPath1, fileContent1, 'utf8');
  console.log(`Successfully copied optimized content from:\n${sourcePath1}\nto:\n${destPath1}`);
} catch (error) {
  console.error(`Error copying optimized content: ${error.message}`);
}

// Copy the enhanced content file
try {
  const fileContent2 = fs.readFileSync(sourcePath2, 'utf8');
  fs.writeFileSync(destPath2, fileContent2, 'utf8');
  console.log(`Successfully copied enhanced content from:\n${sourcePath2}\nto:\n${destPath2}`);
} catch (error) {
  console.error(`Error copying enhanced content: ${error.message}`);
} 