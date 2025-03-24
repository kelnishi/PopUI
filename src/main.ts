import {app, BrowserWindow, ipcMain, nativeImage, protocol, shell, Tray} from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {SseServer, startMcp, startServer} from './server';
import {Server} from "http";
import {getUploadsDir} from './utils/paths';
import {sendToClaude} from './shell';

let appServer: Server | null;
let mcpServer: SseServer | null;

let mainWindow: BrowserWindow | null = null;
const PORT = 3001;
const MCP_PORT = 3002;

let tray: Tray | null;
let dropdownWindow: BrowserWindow | null;

let windows = new Map<string, BrowserWindow>();

function createMainWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, '../renderer/view/preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    // Load the index.html from the renderer folder
    mainWindow.loadFile(path.join(__dirname, '../renderer/view/index.html'));

    // Open DevTools in development mode
    if (process.env.NODE_ENV === 'development') {
        mainWindow.webContents.openDevTools();
    }
}

// In the createNewWindowWithTSX function, update the asset URLs to use the custom protocol:
function createNewWindowWithTSX(filenameWithoutExt: string, tsxFilePath: string): BrowserWindow {
    // Read the TSX file
    const tsxCode = fs.readFileSync(tsxFilePath, 'utf-8');

    const filename = path.basename(tsxFilePath);

    // Apply the local variables to the TsxWindow.html template file.
    // ${tsxCode} and ${filename} are placeholders in the template file.
    const htmlTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'TsxWindow.html'), 'utf-8');
    const htmlContent = htmlTemplate
        .replace('${tsxCode}', tsxCode)
        .replace('${filename}', filenameWithoutExt);

    const tempHtmlPath = path.join(app.getPath('temp'), filenameWithoutExt + '.html');
    fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

    const newWin = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, '../renderer/view/preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    newWin.webContents.on('did-finish-load', async () => {
        // Measure the maximum width and height of the document
        const {width, height} = await newWin.webContents.executeJavaScript(`
(() => {
    // Wait for the component to be rendered
    const rootElement = document.getElementById('dynamic-component-container').children[0] || document.getElementById('root') || document.body;
    
    // Get the actual rendered component's size
    const rect = rootElement.getBoundingClientRect();
    
    return {
        width: Math.ceil(rect.width),
        height: Math.ceil(rect.height)
    };
})()`
        );

        // Update the window's content size
        newWin.setContentSize(width, height);
    });

    newWin.loadFile(tempHtmlPath);

    return newWin;
}

function showDropdownWindow() {
    if (!dropdownWindow) {
        dropdownWindow = new BrowserWindow({
            width: 600,
            height: 800,
            frame: false,
            resizable: true,
            show: false,
            transparent: false,
            webPreferences: {
                preload: path.join(__dirname, '../renderer/view/preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
            }
        });
        // Load your React app (e.g., a local HTML file that bootstraps React)
        dropdownWindow.loadFile(path.join(__dirname, '../renderer/view/index.html'));

        // Hide window when it loses focus
        dropdownWindow.on('blur', () => {
            if (dropdownWindow) dropdownWindow.hide();
        });
    }

    // Position the window based on the tray icon's location
    // (Positioning logic is platform-specific and may require additional code.)
    dropdownWindow.show();
}

function setupProtocolHandlers() {
    protocol.interceptFileProtocol('file', (request, callback) => {
        let url = request.url.substr(7); // remove 'file://'

        // Check if the request matches the problematic script path
        if (!url.includes('.webpack') && !url.includes('/var')) {
            // Map it to your actual file location
            url = path.join(__dirname, '..', 'renderer', url);
        }

        // console.log(url);
        callback({path: url});
    });

    // Register a custom protocol to serve assets from the local assets directory
    protocol.registerFileProtocol('assets', (request, callback) => {
        const assetPath = decodeURI(request.url.replace('assets://', ''));
        callback({path: path.join(__dirname, 'assets', assetPath)});
    });

    protocol.registerFileProtocol('styles', (request, callback) => {
        const assetPath = decodeURI(request.url.replace('styles://', ''));
        callback({path: path.join(__dirname, 'styles', assetPath)});
    });
}

function installMenuTrayIcon() {
    //Install a menubar icon
    const trayIcon = nativeImage.createEmpty();
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    const icon2xPath = path.join(__dirname, 'assets', 'icon@2x.png');

    trayIcon.addRepresentation({
        scaleFactor: 1,
        width: 22,
        height: 22,
        buffer: fs.readFileSync(iconPath)
    });
    trayIcon.addRepresentation({
        scaleFactor: 2,
        width: 44,
        height: 44,
        buffer: fs.readFileSync(icon2xPath)
    });
    trayIcon.setTemplateImage(true);

// Create the tray with the composite image
    const tray = new Tray(trayIcon);

    tray.on('click', () => {
        if (dropdownWindow && dropdownWindow.isVisible()) {
            console.log("Hiding dropdown window");
            dropdownWindow.hide();
        } else {
            console.log("Showing dropdown window");
            showDropdownWindow();
        }
    });
}

function unpackScripts() {
    //Unpack scripts
    const scriptsDir = path.join(__dirname, 'scripts');
    const unpackedDir = path.join(app.getPath('userData'), 'scripts');
    if (!fs.existsSync(unpackedDir)) {
        fs.mkdirSync(unpackedDir, {recursive: true});
    }
    fs.readdirSync(scriptsDir).forEach(file => {
        const src = path.join(scriptsDir, file);
        const dest = path.join(unpackedDir, file);
        fs.copyFileSync(src, dest);
    });
}

// When Electron has finished initialization, create window
app.whenReady().then(() => {
    setupProtocolHandlers();
    installMenuTrayIcon();
    unpackScripts();
    
    console.log('Uploads directory:', getUploadsDir());
    appServer = startServer(PORT);
    mcpServer = startMcp(MCP_PORT);

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

export async function injectWindow(name: string, json: string) {
    console.log(`Injecting window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        console.warn('Window not found:', name);
        return null;
    }

    console.log(`Found window: ${name}`);
    await win.webContents.executeJavaScript(`window.setState(${json})`);

    return JSON.stringify(json, null, 2);
}

export async function readWindow(name: string) {
    console.log(`Reading window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        const filename = path.join(getUploadsDir(), `${name}.tsx`);

        if (fs.existsSync(filename)) {
            console.log(`Found window file: ${name}`);
            const newWin = await openFile(filename);

            if (!newWin) {
                console.warn('Invalid window:', name);
                return null;
            }

            const state = await newWin.webContents.executeJavaScript('window.getState()');
            return JSON.stringify(state, null, 2);
        }

        console.warn('Window not found:', name);
        return null;
    }

    console.log(`Found window: ${name}`);
    // Execute the getState method on the component instance
    const state = await win.webContents.executeJavaScript('window.getState()');

    return JSON.stringify(state, null, 2);
}

export async function closeWindow(name: string) {
    const win = windows.get(name);
    if (win) {
        win.close();
        windows.delete(name);
    }

    console.log(`Window closed: ${name}`);
    return name;
}

export async function describeWindow(name: string) {
    console.log(`Describing window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        console.warn('Window not found:', name);
        return null;
    }

    console.log(`Found window: ${name}`);
    // Execute the describeState method on the component instance
    const state = await win.webContents.executeJavaScript('window.describeState()');

    return JSON.stringify(state, null, 2);
}

export function listWindows() {
    return Array.from(windows.keys());
}

export function listFiles() {
    const uploadsDir = getUploadsDir();
    return fs.readdirSync(uploadsDir);
}

// Reveal the file in the system's file manager
export function showFile(selectedFile: string) {
    const uploadsDir = getUploadsDir();
    if (!selectedFile.startsWith(uploadsDir)) {
        console.warn('Selected file is not in uploadsDir');
        return;
    }
    const filepath = path.resolve(selectedFile);
    console.log('Revealing file:', filepath);
    // Reveal the file in the system's file manager
    shell.showItemInFolder(filepath);
}

export function openFile(selectedFile: string): BrowserWindow | undefined {
    const uploadsDir = getUploadsDir();
    if (!selectedFile.startsWith(uploadsDir)) {
        console.warn('Selected file is not in uploadsDir');
        return;
    }
    //Get any existing window for the file
    const existingWin = windows.get(selectedFile);
    if (existingWin) {
        existingWin.focus();
        return;
    }

    //filename without ext
    const filenameWithoutExt = path.basename(selectedFile, path.extname(selectedFile));
    const newWin = createNewWindowWithTSX(filenameWithoutExt, selectedFile);

    //When the window is closed, remove it from the windows map
    newWin.on('closed', () => {
        windows.delete(filenameWithoutExt);
    });

    //Save the window to a global map
    windows.set(filenameWithoutExt, newWin);

    return newWin;
}

ipcMain.handle('open-file', async (_, selectedFile: string) => {
    openFile(selectedFile);
    return selectedFile;
});

ipcMain.handle('show-file', async (_, selectedFile: string) => {
    showFile(selectedFile);
    return selectedFile;
});

ipcMain.handle('send-to-host', async (_, message: string) => {
    console.log("Sending message to host:", message);
    return await sendToClaude(message);
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
