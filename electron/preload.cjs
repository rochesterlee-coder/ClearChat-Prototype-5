const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('clearchatDesktop', {
  isDesktop: true,
  onAuthCallback: (callback) => {
    const listener = (_event, url) => callback(url);
    ipcRenderer.on('clearchat:auth-callback', listener);
    return () => ipcRenderer.removeListener('clearchat:auth-callback', listener);
  }
});
