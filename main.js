const { app, BrowserWindow, ipcMain, dialog, session } = require("electron");
const path = require("path");
const fs = require("fs");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    title: "Wavy",
    backgroundColor: "#0a0a0f",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      navigateOnDragDrop: false,
    },
  });

  mainWindow.loadFile("index.html");
  const isDev = !app.isPackaged && process.env.NODE_ENV !== "production";
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: "right" });
  }

  mainWindow.webContents.on("render-process-gone", (_e, details) => {
    console.error("RENDERER CRASHED:", details.reason, details.exitCode);
    mainWindow.loadFile("index.html");
  });

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: "deny" };
  });
}

app.on("open-file", (e) => {
  e.preventDefault();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("log-error", (_event, msg) => {
  console.error("RENDERER:", msg);
});

ipcMain.handle("open-audio-file", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [
      {
        name: "Audio Files",
        extensions: ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"],
      },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) return null;

  const filePath = result.filePaths[0];
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  return {
    fileName,
    filePath,
    buffer: buffer.toString("base64"),
  };
});

ipcMain.handle("read-audio-file", async (_event, filePath) => {
  const buffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  return {
    fileName,
    filePath,
    buffer: buffer.toString("base64"),
  };
});

ipcMain.handle("save-video", async (_event, defaultName, extensions) => {
  const ext = extensions || ["webm"];
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || "waveform.webm",
    filters: [
      { name: "Video Files", extensions: ext },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (result.canceled) return null;
  return result.filePath;
});

ipcMain.handle("write-file", async (_event, base64, filePath) => {
  const buffer = Buffer.from(base64, "base64");
  fs.writeFileSync(filePath, buffer);
  return true;
});
