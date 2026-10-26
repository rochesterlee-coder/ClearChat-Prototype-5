const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 360,
    minHeight: 620,
    title: 'ClearChat',
    backgroundColor: '#f7f9f8',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const entry = path.join(__dirname, '..', 'dist', 'index.html');
  win.loadFile(entry);
  win.webContents.on('did-fail-load', (_event, code, description) => {
    console.error('ClearChat failed to load:', code, description, entry);
  });
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('ClearChat renderer exited:', details);
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
