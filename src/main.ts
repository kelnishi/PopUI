import {app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, protocol, shell, Tray} from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import {SseServer, startMcp} from './server';
import {getInterfacesDir} from './utils/paths';
import {reloadClaude, sendToClaude} from './shell';
import * as os from "node:os";
import MenuItemConstructorOptions = Electron.MenuItemConstructorOptions;

import {runProxy} from 'mcp-remote/dist/proxy';
import * as process from "node:process";

import preferences from './preferences';

let mcpServer: SseServer | null;

let mainWindow: BrowserWindow | null = null;
const PORT = 3001;

let tray: Tray | null;
let dropdownWindow: BrowserWindow | null;

let windows = new Map<string, BrowserWindow>();

function createMainWindow() {
    if (mainWindow) {
        mainWindow.show();
        return;
    }
    
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, '../renderer/view/preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    // Load the index.html from the renderer folder
    mainWindow.loadFile(path.join(__dirname, '../renderer/view/index.html'));

    mainWindow.on('close', (event) => {
        event.preventDefault();
        mainWindow?.hide();
    });
    
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

        // console.error(url);
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
    tray = new Tray(trayIcon);

    // Update the tray menu with recent files
    function updateTrayMenu() {
        const files = listFiles();
        const recentFilesMenu: MenuItemConstructorOptions[] = files
            .filter(file => {
                return file.endsWith('.tsx');
            })
            .map(file => {
                const filenameWithoutExt = path.basename(file, path.extname(file));
                return {
                    label: filenameWithoutExt,
                    click: () => {
                        const filePath = path.join(getInterfacesDir(), file);
                        openFile(filePath);
                    }
                };
            });

        if (recentFilesMenu.length > 0) {
            recentFilesMenu.push({type: 'separator'});
        }

        recentFilesMenu.push(
            {
                label: 'Open Interfaces Folder',
                click: () => {
                    const uploadsDir = getInterfacesDir();
                    shell.openPath(uploadsDir);
                }
            },
        )

        // Create the context menu with proper types
        const contextMenu: MenuItemConstructorOptions[] = [
            {
                label: 'PopUI Settings...',
                click: () => {
                    if (!mainWindow) {
                        createMainWindow();
                    } else {
                        mainWindow.show();
                        mainWindow.focus();
                    }
                }
            },
            {type: 'separator'},
            {
                label: 'Recent Interfaces',
                submenu: recentFilesMenu
            },
            {type: 'separator'},
            {label: 'Quit', click: () => app.quit()}
        ];

        // Set the context menu
        tray?.setContextMenu(Menu.buildFromTemplate(contextMenu));
    }

    // Set initial menu
    updateTrayMenu();

    // Update menu when clicked (to refresh recent files)
    tray.on('click', () => {
        updateTrayMenu();
    });
}


function unpackScripts() {
    const scriptsDir = path.join(__dirname, 'scripts');
    const unpackedDir = path.join(app.getPath('userData'), 'scripts');
    if (!fs.existsSync(unpackedDir)) {
        fs.mkdirSync(unpackedDir, {recursive: true});
    }

    // Helper function to copy files and directories recursively
    function copyRecursively(src: string, dest: string) {
        const stats = fs.statSync(src);

        if (stats.isDirectory()) {
            // Create destination directory if it doesn't exist
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest, { recursive: true });
            }

            // Copy each item inside the directory
            const entries = fs.readdirSync(src);
            for (const entry of entries) {
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                copyRecursively(srcPath, destPath);
            }
        } else {
            // It's a file, copy it directly
            fs.copyFileSync(src, dest);
        }
    }

    // Start recursive copy from root scripts directory
    copyRecursively(scriptsDir, unpackedDir);
}

function detectClaudeDesktopMac(): boolean {
    const mdfind = `mdfind "kMDItemCFBundleIdentifier == 'com.anthropic.claudefordesktop'"`;
    try {
        const result = require('child_process').execSync(mdfind).toString();
        return result.trim() !== '';
    } catch (error) {
        console.error('Error checking if Claude is installed:', error);
        return false;
    }
}

function canonicalizeAppDataPath(filePath: string): string {
    if (process.platform === 'darwin') {
        // On macOS
        return path.join(os.homedir(), 'Library', 'Application Support', filePath);
    } else if (process.platform === 'win32') {
        // On Windows
        return path.join(process.env.APPDATA || '', 'Claude', filePath);
    } else {
        // On Linux
        return path.join(os.homedir(), '.config', filePath);
    }
}

function tryInstallClaudeDesktop(): boolean {
    //Read the preferences file to see if the user has enabled the Claude Desktop integration
    const jsonPath = canonicalizeAppDataPath(path.join('Claude', 'claude_desktop_config.json'));

    // Load the json file
    const json = fs.readFileSync(jsonPath, 'utf-8');
    let claudePreferences;
    try {
        claudePreferences = JSON.parse(json);
    } catch (error) {
        claudePreferences = {};
    }

    //Add PopUI to the "mcpServers" object
    claudePreferences.mcpServers = claudePreferences.mcpServers || {};

    //$(mdfind "kMDItemCFBundleIdentifier == 'com.kelnishi.popui'")"/Contents/MacOS/PopUI"
    claudePreferences.mcpServers.PopUI = {
        command: 'sh',
        args: [
            "-c",
            "$(mdfind \"kMDItemCFBundleIdentifier == 'com.kelnishi.popui'\")\"/Contents/MacOS/PopUI\" --sse"
        ]
    };

    // Write the updated preferences back to the file
    fs.writeFileSync(jsonPath, JSON.stringify(claudePreferences, null, 2), 'utf-8');
    reloadClaude().then(() => {
        console.error("PopUI installed in Claude Desktop");
    });

    return false;
}

function detectClaudeInstallation() {
    if (process.platform === 'darwin') {
        const claudeDetected = detectClaudeDesktopMac();

        if (!claudeDetected) {
            dialog.showMessageBox({
                type: 'warning',
                title: 'PopUI Error',
                message: 'Claude Desktop Not Found',
                detail: 'PopUI works with Claude Desktop. Please install Claude Desktop from https://claude.ai/download to use PopUI.',
                buttons: ['Quit', 'Download'],
                defaultId: 1
            }).then(result => {
                // If user clicked "Download" (button index 0)
                if (result.response === 1) {
                    shell.openExternal('https://claude.ai/download');
                } else {
                    app.quit();
                }
            }).catch(err => {
                console.error('Dialog error:', err);
            });
        } else {
            //Check the preferences to see if the user has enabled the Claude Desktop integration
            const jsonPath = canonicalizeAppDataPath(path.join('Claude', 'claude_desktop_config.json'));
            // Load the json file
            const json = fs.readFileSync(jsonPath, 'utf-8');
            let claudePreferences;
            try {
                claudePreferences = JSON.parse(json);
            } catch (error) {
                claudePreferences = {};
            }
            //Look for "PopUI" key in the "mcpServers" object
            const popuiConfig = claudePreferences.mcpServers?.PopUI;
            if (!popuiConfig) {
                // If the key is not found, show a warning
                dialog.showMessageBox({
                    type: 'warning',
                    title: 'Install PopUI',
                    message: 'Install the PopUI tool in Claude Desktop',
                    detail: 'Click to install the PopUI tool in Claude Desktop as an MCP Server.',
                    buttons: ['Dismiss', 'Install'],
                    defaultId: 1
                }).then(result => {
                    if (result.response === 1) {
                        tryInstallClaudeDesktop();
                    }
                }).catch(err => {
                    console.error('Dialog error:', err);
                });
            }
        }
    }

}


app.whenReady().then(() => {

    let mode = 'proxy';

    const net = require('net');
    const server = net.createServer();
    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            mode = 'proxy';
        }
    });
    server.listen(PORT, () => {
        server.close();
        mcpServer = startMcp(PORT);
        mode = 'host';

        setupProtocolHandlers();
        installMenuTrayIcon();
        unpackScripts();
        detectClaudeInstallation();

        console.error('Interfaces directory:', getInterfacesDir());

        app.on('activate', function () {
            // On macOS it's common to re-create a window when the dock icon is clicked
            if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
        });
        app.on('will-quit', () => {
            if (mcpServer) {
                mcpServer.server.close();
            }

            //Display a modal alert
            dialog.showMessageBox({
                type: 'info',
                title: 'PopUI',
                message: 'PopUI is closing',
                detail: 'Any active chat sessions will be disconnected.\nRestart your chat host to reconnect.',
                buttons: ['Bye'],
                defaultId: 0
            });

            //Kill all other PopUI processes
            require('child_process').execSync('pkill -f "PopUI"');
        });
    });

    const url = 'http://localhost:3001/sse';
    const callbackPort = 3334;
    const clean = false;

    //$(mdfind "kMDItemCFBundleIdentifier == 'com.kelnishi.popui'")"/Contents/MacOS/PopUI" --sse
    console.error(`Running proxy for ${url} with callback port ${callbackPort} with clean mode ${clean}`);
    runProxy(url, callbackPort, clean)
        .then(() => {
            return;
        })
        .catch(err => {
            console.error('Proxy error:', err);
            process.exit(1);
        });

});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    if (mcpServer) {
        mcpServer.server.close();
    }
});

export async function injectWindow(name: string, json: string) {
    console.error(`Injecting window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        console.warn('Window not found:', name);
        return null;
    }

    console.error(`Found window: ${name}`);
    await win.webContents.executeJavaScript(`window.dynamicComponent.setState(${json})`);

    return JSON.stringify(json, null, 2);
}

export async function readWindow(name: string) {
    console.error(`Reading window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        const filename = path.join(getInterfacesDir(), `${name}.tsx`);

        if (fs.existsSync(filename)) {
            console.error(`Found window file: ${name}`);
            const newWin = await openFile(filename);

            if (!newWin) {
                console.warn('Invalid window:', name);
                return null;
            }

            const state = await newWin.webContents.executeJavaScript('window.dynamicComponent.getState()');
            return JSON.stringify(state, null, 2);
        }

        console.warn('Window not found:', name);
        return null;
    }

    console.error(`Found window: ${name}`);
    // Execute the getState method on the component instance
    const state = await win.webContents.executeJavaScript('window.dynamicComponent.getState()');

    return JSON.stringify(state, null, 2);
}

export async function closeWindow(name: string) {
    const win = windows.get(name);
    if (win) {
        win.close();
        windows.delete(name);
    }

    console.error(`Window closed: ${name}`);
    return name;
}

export async function describeWindow(name: string) {
    console.error(`Describing window: ${name}`);

    const win = windows.get(name);
    if (!win) {
        console.warn('Window not found:', name);
        return null;
    }

    console.error(`Found window: ${name}`);
    // Execute the describeState method on the component instance
    const state = await win.webContents.executeJavaScript('window.describeState()');

    return JSON.stringify(state, null, 2);
}

export function listWindows() {
    return Array.from(windows.keys());
}

export function listFiles() {
    const uploadsDir = getInterfacesDir();
    return fs.readdirSync(uploadsDir);
}

// Reveal the file in the system's file manager
export function showFile(selectedFile: string) {
    const uploadsDir = getInterfacesDir();
    if (!selectedFile.startsWith(uploadsDir)) {
        console.warn('Selected file is not in uploadsDir');
        return;
    }
    const filepath = path.resolve(selectedFile);
    console.error('Revealing file:', filepath);
    // Reveal the file in the system's file manager
    shell.showItemInFolder(filepath);
}

export function openFile(selectedFile: string): BrowserWindow | undefined {
    const uploadsDir = getInterfacesDir();
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

ipcMain.handle('link-external', async (_, url) => {
    if (typeof url === 'string') {
        await shell.openExternal(url);
        return true;
    }
    return false;
});

ipcMain.handle('list-files', async () => {
    const files = listFiles();
    return files.filter(file => file.endsWith('.tsx')).map(file => {
        return {
            name: file.replace('.tsx', ''),
            path: path.join(getInterfacesDir(), file),
            schema: {}
        };
    });
});

ipcMain.handle('open-file', async (_, selectedFile: string) => {
    openFile(selectedFile);
    return selectedFile;
});

ipcMain.handle('show-file', async (_, selectedFile: string) => {
    showFile(selectedFile);
    return selectedFile;
});

ipcMain.handle('delete-file', async (_, selectedFile: string) => {
    const uploadsDir = getInterfacesDir();
    if (!selectedFile.startsWith(uploadsDir)) {
        console.warn('Selected file is not in uploadsDir');
        return;
    }
    const filepath = path.resolve(selectedFile);
    console.error('Deleting file:', filepath);
    fs.unlinkSync(filepath);
    return selectedFile;
});

ipcMain.handle('send-to-host', async (_, message: string) => {
    console.error("Sending message to host:", message);
    return await sendToClaude(message);
});

ipcMain.handle('get-pref', async (_, key: string) => {
    return preferences.get(key) as string;
});

ipcMain.handle('set-pref', async (_, key: string, value: string) => {
    const bool = value === 'true';
    preferences.set(key, bool);
    return bool;
});

// Handle IPC requests from renderer to server
ipcMain.handle('server-request', async (_, endpoint, data) => {
    try {
        // Base URL for server requests
        const baseUrl = `http://localhost:${PORT}`;

        console.error(`Making request to ${baseUrl}${endpoint}`, data ? 'with data' : 'without data');

        // Handle different HTTP methods
        if (data && endpoint === '/upload') {
            console.error('Handling file upload request');

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
            console.error('Upload response:', result);
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
            // console.error('API response:', result);
            return result;
        }
    } catch (error) {
        console.error('Error in server request:', error);
        throw error;
    }
});
