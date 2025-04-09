import { contextBridge, ipcRenderer } from 'electron';

// Make sure context bridge is available
if (contextBridge && ipcRenderer) {
  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld('api', {
    // Express server communication
    // Updated to accept an optional data parameter
    serverRequest: (endpoint: string, data?: any) => {
      console.log(`Preload: serverRequest to ${endpoint}`, data ? 'with data' : 'without data');
      return ipcRenderer.invoke('server-request', endpoint, data);
    },

    linkExternal: (url: string) => {
      return ipcRenderer.invoke('link-external', url);  
    },
    
    listFiles: () => {
      return ipcRenderer.invoke('list-files');
    },
    
    openFile: (filename: string) => {
      console.log(`Preload: openFile ${filename}`);
      return ipcRenderer.invoke('open-file', filename);
    },
    
    showFile: (filename: string) => {
      console.log(`Preload: showFile ${filename}`);
      return ipcRenderer.invoke('show-file', filename);
    },
    
    deleteFile: (filename: string) => {
      console.log(`Preload: deleteFile ${filename}`);
      return ipcRenderer.invoke('delete-file', filename);
    },

    sendToHost: (message: string) => {
      return ipcRenderer.invoke('send-to-host', message);
    },
    
    getPreference: (key: string) => {
      return ipcRenderer.invoke('get-pref', key);
    },
    
    setPreference: (key: string, value: string) => {
      return ipcRenderer.invoke('set-pref', key, value);
    }
    
  });
} else {
  console.error('Electron APIs not available in preload script');
}