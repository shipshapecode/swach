const { resolve, dirname } = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');

// Simulate the path resolution
const __dirname = dirname(__filename);
const htmlFilePath = resolve(__dirname, 'resources', 'magnifier-picker.html');

console.log('Looking for file at:', htmlFilePath);
console.log('File exists:', fs.existsSync(htmlFilePath));

if (!fs.existsSync(htmlFilePath)) {
  console.log('Current directory contents:', fs.readdirSync(__dirname));
  console.log(
    'Resources directory exists:',
    fs.existsSync(resolve(__dirname, 'resources'))
  );
  if (fs.existsSync(resolve(__dirname, 'resources'))) {
    console.log(
      'Resources contents:',
      fs.readdirSync(resolve(__dirname, 'resources'))
    );
  }
}
