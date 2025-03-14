import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import * as path from 'path';
import {startServer} from './server';
import {Server} from "http";
import {getUploadsDir} from './utils/paths';

let appServer: Server | null;

let mainWindow: BrowserWindow | null = null;
const PORT = 3000;

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

function createNewWindow(filePath: string) {
  const newWin = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Assuming filePath points to an HTML file that bootstraps the React UI
  newWin.loadFile(filePath);
}

// When Electron has finished initialization, create window
app.whenReady().then(() => {
  console.log('Uploads directory:', getUploadsDir());
  appServer = startServer(PORT);
  
  createMainWindow();

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

ipcMain.handle('open-file', async (_, selectedFile: string) => {
  const uploadsDir = getUploadsDir();
  console.log('Selected file:', selectedFile);
  if (!selectedFile.startsWith(uploadsDir)) {
    console.warn('Selected file is not in uploadsDir');
    return null;
  }
  createNewWindow(selectedFile);
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
      console.log('API response:', result);
      return result;
    }
  } catch (error) {
    console.error('Error in server request:', error);
    throw error;
  }
});
