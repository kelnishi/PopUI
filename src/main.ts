import {app, BrowserWindow, ipcMain, protocol, Tray, nativeImage} from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {SseServer, startMcp, startServer} from './server';
import {Server} from "http";
import {getUploadsDir} from './utils/paths';

let appServer: Server | null;
let mcpServer: SseServer | null;

let mainWindow: BrowserWindow | null = null;
const PORT = 3001;
const MCP_PORT = 3002;

let tray : Tray | null;
let dropdownWindow : BrowserWindow | null;

function createMainWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the index.html from the renderer folder
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// In the createNewWindowWithTSX function, update the asset URLs to use the custom protocol:
function createNewWindowWithTSX(tsxFilePath: string) {
    // Read the TSX file
    const tsxCode = fs.readFileSync(tsxFilePath, 'utf-8');

    const filename = path.basename(tsxFilePath);

    // Reference local assets via the custom protocol
    // Create an HTML template that loads local React, Babel, and then compiles our TSX code.
    const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${filename}</title>
      <!-- Load local React and ReactDOM -->
      <script src="app-assets://react.development.js"></script>
      <script src="app-assets://react-dom.development.js"></script>
      <!-- Load local Babel Standalone -->
      <script src="app-assets://babel.min.js"></script>
    </head>
    <body>
      <div id="root"></div>
      <!-- Embed the TSX code in a script that Babel will compile -->
      <script id="module-code" type="text/plain">
      ${tsxCode}
      </script>
      
      <script>
      // Get the inline TSX code
      const sourceCode = document.getElementById('module-code').textContent;

      // Transform the code using Babel. We use the presets for React and TypeScript.
      const { code } = Babel.transform(sourceCode, {
          filename: '${filename}', // Provide a filename for Babel to resolve parsing correctly.
          presets: [
            ['env', { modules: 'commonjs' }], // Transforms ES modules to CommonJS.
            'react',
            'typescript'
          ]
        });

        // Create a require function that returns React when asked for it.
        const requireFn = (moduleName) => {
          if (moduleName === 'react') return React;
          throw new Error("Module not found: " + moduleName);
        };
        
        const module = { exports: {} };
        const exports = module.exports;
        
        new Function("require", "module", "exports", code)(requireFn, module, exports);

      // If there is a default export, use it; otherwise, pick the first export.
      const Component =
        module.exports.default ||
        Object.values(module.exports)[0];

      if (!Component) {
        console.error("No component was found in the module exports.");
      } else {
        // Render the component into the #root element.
        ReactDOM.render(
          React.createElement(Component),
          document.getElementById("root")
        );
      }
    </script>
    </body>
  </html>
  `;

    //filename without ext
    const filenameWithoutExt = path.basename(tsxFilePath, path.extname(tsxFilePath));
    
    const tempHtmlPath = path.join(app.getPath('temp'), filenameWithoutExt+'.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    const newWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    newWin.webContents.on('did-finish-load', async () => {
        // Measure the maximum width and height of the document
        const { width, height } = await newWin.webContents.executeJavaScript(`
    ({
      width: Math.max(
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.body ? document.body.scrollWidth : 0
      ),
      height: Math.max(
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      )
    })
  `);
        // Update the window's content size
        newWin.setContentSize(width, height);
    });

    newWin.loadFile(tempHtmlPath);
}

function showDropdownWindow() {
    if (!dropdownWindow) {
        dropdownWindow = new BrowserWindow({
            width: 600,
            height: 800,
            frame: false,
            resizable: false,
            show: false,
            transparent: false,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            }
        });
        // Load your React app (e.g., a local HTML file that bootstraps React)
        dropdownWindow.loadFile(path.join(__dirname, 'renderer/index.html'));

        // Hide window when it loses focus
        dropdownWindow.on('blur', () => {
            if (dropdownWindow) dropdownWindow.hide();
        });
    }

    // Position the window based on the tray icon's location
    // (Positioning logic is platform-specific and may require additional code.)
    dropdownWindow.show();
}

// When Electron has finished initialization, create window
app.whenReady().then(() => {
    // Register a custom protocol to serve assets from the local assets directory
    protocol.registerFileProtocol('app-assets', (request, callback) => {
        const assetPath = decodeURI(request.url.replace('app-assets://', ''));
        callback({path: path.join(__dirname, 'assets', assetPath)});
    });
    
    //Install a menubar icon
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    console.log(`Loading tray icon from ${iconPath}`);
    const trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon.setTemplateImage(true);
    tray = new Tray(trayIcon);
    
    tray.on('click', () => {
        if (dropdownWindow && dropdownWindow.isVisible()) {
            console.log("Hiding dropdown window");
            dropdownWindow.hide();
        } else {
            console.log("Showing dropdown window");
            showDropdownWindow();
        }
    });

    console.log('Uploads directory:', getUploadsDir());
    appServer = startServer(PORT);
    
    mcpServer = startMcp(MCP_PORT);

    // createMainWindow();

    app.on('activate', function () {
        // On macOS it's common to re-create a window when the dock icon is clicked
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    if (appServer) {
        appServer.close();
    }
});

export function openFile(selectedFile: string) {
    const uploadsDir = getUploadsDir();
    if (!selectedFile.startsWith(uploadsDir)) {
        console.warn('Selected file is not in uploadsDir');
        return;
    }
    createNewWindowWithTSX(selectedFile);
}

ipcMain.handle('open-file', async (_, selectedFile: string) => {
    console.log('Selected file:', selectedFile);
    openFile(selectedFile);
    return selectedFile;
});

// Handle IPC requests from renderer to server
ipcMain.handle('server-request', async (_, endpoint, data) => {
    try {
        // Base URL for server requests
        const baseUrl = `http://localhost:${PORT}`;

        console.log(`Making request to ${baseUrl}${endpoint}`, data ? 'with data' : 'without data');

        // Handle different HTTP methods
        if (data && endpoint === '/upload') {
            console.log('Handling file upload request');

            // For file uploads, make a POST request with the data
            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Server responded with ${response.status}:`, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            console.log('Upload response:', result);
            return result;
        } else {
            // For other endpoints, make a GET request
            const response = await fetch(`${baseUrl}${endpoint}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Server responded with ${response.status}:`, errorText);
                throw new Error(`Server error: ${response.status}`);
            }

            const result = await response.json();
            // console.log('API response:', result);
            return result;
        }
    } catch (error) {
        console.error('Error in server request:', error);
        throw error;
    }
});
