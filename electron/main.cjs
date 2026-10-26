const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const PROTOCOL = 'clearchat';
let mainWindow;
let pendingAuthUrl = null;

function sendAuthUrl(url) {
  if (!url || !url.startsWith(`${PROTOCOL}://auth/callback`)) return;
  pendingAuthUrl = url;
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.webContents.isLoading()) {
      mainWindow.webContents.once('did-finish-load', deliverPendingAuthUrl);
    } else deliverPendingAuthUrl();
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
}
function deliverPendingAuthUrl() {
  if (!pendingAuthUrl || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send('clearchat:auth-callback', pendingAuthUrl);
  pendingAuthUrl = null;
}

if (process.defaultApp && process.argv.length >= 2) {
  app.setAsDefaultProtocolClient(PROTOCOL, process.execPath, [path.resolve(process.argv[1])]);
} else {
  app.setAsDefaultProtocolClient(PROTOCOL);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) app.quit();
else {
  app.on('second-instance', (_event, argv) => {
    const deepLink = argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
    if (deepLink) sendAuthUrl(deepLink);
    if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
  });
}

app.on('open-url', (event, url) => { event.preventDefault(); sendAuthUrl(url); });

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 850, minWidth: 360, minHeight: 620,
    title: 'ClearChat', backgroundColor: '#f7f9f8', autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true, nodeIntegration: false, sandbox: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  const entry = path.join(__dirname, '..', 'dist', 'index.html');
  mainWindow.loadFile(entry);
  mainWindow.webContents.on('did-finish-load', deliverPendingAuthUrl);
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => console.error('ClearChat failed to load:', code, description, entry));
  mainWindow.webContents.on('render-process-gone', (_event, details) => console.error('ClearChat renderer exited:', details));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(() => {
  const initialLink = process.argv.find(arg => arg.startsWith(`${PROTOCOL}://`));
  if (initialLink) pendingAuthUrl = initialLink;
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

ipcMain.handle('clearchat:is-desktop', () => true);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
