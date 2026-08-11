const { app, BrowserWindow, ipcMain, desktopCapturer, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

// Renderer asks main process for a temp path to write the recorded blob to.
ipcMain.handle('get-recording-path', () => {
  const dir = path.join(os.tmpdir(), 'meeting-minutes-tool');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `recording-${Date.now()}.webm`);
});

ipcMain.handle('save-recording', (_event, filePath, buffer) => {
  fs.writeFileSync(filePath, Buffer.from(buffer));
  return filePath;
});

app.whenReady().then(() => {
  // Chromium requires this handler to be set for desktopCapturer + system
  // audio loopback capture to work (Windows/Linux). On macOS, Chromium
  // cannot capture system audio this way — you need a virtual audio device
  // like BlackHole routed as a normal input, or ScreenCaptureKit (native,
  // not wired up in this scaffold).
  // Must be registered AFTER app is ready — session isn't available before that.
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
      callback({ video: sources[0], audio: 'loopback' });
    });
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});