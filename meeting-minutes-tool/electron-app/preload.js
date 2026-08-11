const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getRecordingPath: () => ipcRenderer.invoke('get-recording-path'),
  saveRecording: (filePath, buffer) => ipcRenderer.invoke('save-recording', filePath, buffer),
});
