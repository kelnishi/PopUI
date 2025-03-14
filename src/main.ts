import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { startServer } from './server';
import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {Server} from "http";
import { getUploadsDir } from './utils/paths';

let appServer: Server | null;

let mainWindow: BrowserWindow | null = null;
const PORT = 3000;

function createWindow() {
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


// When Electron has finished initialization, create window
app.whenReady().then(() => {
  console.log('Uploads directory:', getUploadsDir());
  appServer = startServer(PORT);
  
  createWindow();

  app.on('activate', function () {
    // On macOS it's common to re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
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

