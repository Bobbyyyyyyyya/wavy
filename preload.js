const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openAudioFile: () => ipcRenderer.invoke("open-audio-file"),
  readAudioFile: (filePath) => ipcRenderer.invoke("read-audio-file", filePath),
  saveVideo: (defaultName, extensions) => ipcRenderer.invoke("save-video", defaultName, extensions),
  writeFile: (base64, filePath) => ipcRenderer.invoke("write-file", base64, filePath),
  logError: (msg) => ipcRenderer.invoke("log-error", msg),
  getFilePath: (file) => webUtils.getPathForFile(file),
});
