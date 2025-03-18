const fs = require('fs');
const path = require('path');

/**
 * Ensures a directory exists, creating it if necessary
 * @param {string} dirPath - Path to the directory
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

/**
 * Copies a single file from source to destination
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 */
function copyFile(src, dest) {
  ensureDirectoryExists(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${src} → ${dest}`);
}

/**
 * Copies a directory from src to dist, maintaining the same structure
 * @param {string} dirName - Directory name relative to src and dist
 * @param {string} srcRoot - Source root directory
 * @param {string} distRoot - Destination root directory
 */
function copyDirectory(dirName, srcRoot, distRoot) {
  const srcDir = path.join(srcRoot, dirName);
  const destDir = path.join(distRoot, dirName);
  
  ensureDirectoryExists(destDir);
  
  fs.readdirSync(srcDir).forEach(file => {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    copyFile(srcFile, destFile);
  });
  
  console.log(`Copied all files from ${srcDir} to ${destDir}`);
}

/**
 * Copies node_modules assets to the destination directory
 * @param {string} destDir - Destination directory path
 * @param {Array<Object>} assets - Array of assets with package, file, and destName properties
 */
function copyNodeModulesAssets(destDir, assets) {
  ensureDirectoryExists(destDir);
  
  assets.forEach(({ package, file, destName }) => {
    let src;
    if (package.endsWith('.js')) {
      // If package ends with .js, use it directly as the source file
      src = path.resolve(__dirname, 'node_modules', package);
    } else {
      // Otherwise, append the file to the package path
      src = path.resolve(__dirname, 'node_modules', package, file);
    }
    
    const dest = path.join(destDir, destName || path.basename(file || package));
    copyFile(src, dest);
  });
}

/**
 * Main build function to orchestrate the build process
 * @param {Object} config - Configuration object
 */
function build(config) {
  const { srcRoot, distRoot, createDirectories, directoriesToCopy, nodeModulesAssets } = config;
  
  // Copy HTML file
  const htmlSrc = path.join(srcRoot, 'renderer/index.html');
  const htmlDest = path.join(distRoot, 'renderer/index.html');
  copyFile(htmlSrc, htmlDest);
  
  // Create directories
    createDirectories.forEach(ensureDirectoryExists);
  
  // Copy project directories
  directoriesToCopy.forEach(dir => {
    copyDirectory(dir, srcRoot, distRoot);
  });
  
  // Copy node_modules assets
  copyNodeModulesAssets(path.join(distRoot, 'assets'), nodeModulesAssets);
  
  console.log('Build completed successfully!');
}

// Configuration
const config = {
  srcRoot: path.resolve(__dirname, 'src'),
  distRoot: path.resolve(__dirname, 'dist'),
  createDirectories: [
    'dist',
    'dist/renderer',
    'dist/assets',
    'dist/templates',
    'dist/styles'
  ],
  directoriesToCopy: [
    'assets',
    'templates'
  ],
  nodeModulesAssets: [
    {
      package: '@babel/standalone',
      file: 'babel.min.js'
    },
    {
      package: 'react/umd',
      file: 'react.development.js'
    },
    {
      package: 'react-dom/umd',
      file: 'react-dom.development.js'
    },
    {
      package: 'postcss/lib',
      file: 'postcss.js'
    },
    {
      package: 'twind',
      file: 'twind.umd.js'
    },
    {
      package: 'lucide/dist/umd',
      file: 'lucide.js'
    }
  ]
};

// Execute the build
build(config);