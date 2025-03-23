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
    if (fs.statSync(srcFile).isDirectory()) {
      // Skip node_modules within directories
      if (file === 'node_modules') return;
      
      // Recursively copy subdirectories
      const subDirName = path.join(dirName, file);
      copyDirectory(subDirName, srcRoot, distRoot);
    } else {
      copyFile(srcFile, destFile);
    }
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
  
  assets.forEach(({ package, file, destName, workspace }) => {
    let src;
    
    if (workspace) {
      // Use the file from the workspace
      src = path.resolve(__dirname, workspace, 'node_modules', package, file);
    } else if (package.endsWith('.js')) {
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
  distRoot: path.resolve(__dirname, '.webpack'),
  createDirectories: [
    '.webpack/renderer',
    '.webpack/assets',
    '.webpack/templates',
    '.webpack/styles'
  ],
  directoriesToCopy: [
    'assets',
    'templates'
  ],
  nodeModulesAssets: [
    {
      package: '@babel/standalone',
      file: 'babel.min.js',
      workspace: 'src/templates'
    },
    {
      package: 'react/umd',
      file: 'react.development.js',
      workspace: 'src/templates'
    },
    {
      package: 'react-dom/umd',
      file: 'react-dom.development.js',
      workspace: 'src/templates'
    },
    {
      package: 'postcss/lib',
      file: 'postcss.js',
      workspace: 'src/templates'
    },
    {
      package: 'twind',
      file: 'twind.umd.js',
      workspace: 'src/templates'
    },
    {
      package: 'lucide/dist/umd',
      file: 'lucide.js',
      workspace: 'src/templates'
    }
  ]
};

// Execute the build
build(config);