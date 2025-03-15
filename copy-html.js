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

// Source and destination paths for assets directory
const srcAssetsDir = path.resolve(__dirname, 'src/assets');
const destAssetsDir = path.resolve(__dirname, 'dist/assets');

//Iterate over srcAssetsDir directory and copy files to destAssetsDir
fs.readdirSync(srcAssetsDir).forEach(file => {
  const srcFile = path.join(srcAssetsDir, file);
  const destFile = path.join(destAssetsDir, file);
  fs.copyFileSync(srcFile, destFile);
  console.log(`Copied ${srcFile} to ${destFile}`);
});
