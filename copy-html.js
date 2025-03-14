const fs = require('fs');
const path = require('path');

// Create dist/renderer directory if it doesn't exist
const rendererDir = path.resolve(__dirname, 'dist/renderer');
if (!fs.existsSync(rendererDir)) {
  fs.mkdirSync(rendererDir, { recursive: true });
}

// Copy index.html to dist/renderer
const srcHtmlPath = path.resolve(__dirname, 'src/renderer/index.html');
const destHtmlPath = path.resolve(__dirname, 'dist/renderer/index.html');
fs.copyFileSync(srcHtmlPath, destHtmlPath);

console.log('HTML file copied to dist/renderer directory');