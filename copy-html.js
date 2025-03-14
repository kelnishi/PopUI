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

// Create dist/assets directory if it doesn't exist
const assetsDir = path.resolve(__dirname, 'dist/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Define assets to copy from node_modules
const assetsToCopy = [
  {
    src: path.resolve(__dirname, 'node_modules', '@babel', 'standalone', 'babel.min.js'),
    dest: path.join(assetsDir, 'babel.min.js')
  },
  {
    src: path.resolve(__dirname, 'node_modules', 'react', 'umd', 'react.development.js'),
    dest: path.join(assetsDir, 'react.development.js')
  },
  {
    src: path.resolve(__dirname, 'node_modules', 'react-dom', 'umd', 'react-dom.development.js'),
    dest: path.join(assetsDir, 'react-dom.development.js')
  }
];

assetsToCopy.forEach(({ src, dest }) => {
  fs.copyFileSync(src, dest);
  console.log(`Copied ${src} to ${dest}`);
});

console.log('Assets copied to dist/assets directory');