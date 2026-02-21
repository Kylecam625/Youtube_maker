const { app, BrowserWindow, ipcMain, desktopCapturer } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");

let mainWindow;
let flaskProcess;

function startFlask() {
  const isProd = app.isPackaged;
  const pythonPath = isProd
    ? path.join(process.resourcesPath, "backend", "venv", "bin", "python")
    : "python3";
  const scriptPath = isProd
    ? path.join(process.resourcesPath, "backend", "run.py")
    : path.join(__dirname, "..", "backend", "run.py");

  flaskProcess = spawn(pythonPath, [scriptPath], {
    env: { ...process.env, FLASK_ENV: isProd ? "production" : "development" },
  });

  flaskProcess.stdout.on("data", (data) => {
    console.log(`Flask: ${data}`);
  });

  flaskProcess.stderr.on("data", (data) => {
    console.error(`Flask: ${data}`);
  });
}

function waitForFlask(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      const req = http.get("http://localhost:5000/api/health", (res) => {
        if (res.statusCode === 200) return resolve();
        if (attempt < retries) setTimeout(() => check(attempt + 1), 500);
        else reject(new Error("Flask failed to start"));
      });
      req.on("error", () => {
        if (attempt < retries) setTimeout(() => check(attempt + 1), 500);
        else reject(new Error("Flask failed to start"));
      });
    };
    check(0);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: "YoutubeMaker Studio",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(
      path.join(__dirname, "..", "frontend", "dist", "index.html")
    );
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

ipcMain.handle("get-desktop-sources", async () => {
  const sources = await desktopCapturer.getSources({
    types: ["window", "screen"],
    thumbnailSize: { width: 320, height: 180 },
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    thumbnail: s.thumbnail.toDataURL(),
  }));
});

app.whenReady().then(async () => {
  startFlask();
  try {
    await waitForFlask();
  } catch {
    console.error("Flask did not start in time, opening window anyway");
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (flaskProcess) flaskProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (flaskProcess) flaskProcess.kill();
});
