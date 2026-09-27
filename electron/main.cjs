const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const http = require("http");

let mainWindow;
let server;

const PORT = 4173;
const DIST_PATH = path.join(__dirname, "..", "dist");

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".wav": "audio/wav",
    ".mp3": "audio/mpeg",
    ".m4a": "audio/mp4",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
  };

  return types[ext] || "application/octet-stream";
}

function startLocalServer() {
  server = http.createServer((req, res) => {
    let requestPath = decodeURIComponent(req.url.split("?")[0]);

    if (requestPath === "/") {
      requestPath = "/index.html";
    }

    let filePath = path.join(DIST_PATH, requestPath);

    // Security: keep requests inside dist/
    if (!filePath.startsWith(DIST_PATH)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // React Router fallback
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_PATH, "index.html");
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(500);
        res.end("Failed to load application");
        return;
      }

      res.writeHead(200, {
        "Content-Type": getContentType(filePath),
        "Cache-Control": "no-cache"
      });

      res.end(data);
    });
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`Bingo desktop server running at http://127.0.0.1:${PORT}`);
    createWindow();
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1200,
    minHeight: 700,

    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}/`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startLocalServer();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (server) {
    server.close();
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (server) {
    server.close();
  }
});