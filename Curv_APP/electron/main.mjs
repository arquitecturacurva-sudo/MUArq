import { app, BrowserWindow, ipcMain, shell } from "electron";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEV_SERVER_URL = process.env.CURV_DESKTOP_DEV_SERVER_URL || "";
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};
const LOOPBACK_HOST = "127.0.0.1";
const LOOPBACK_PUBLIC_HOST = "localhost";

const GOOGLE_AUTH_HOSTS = new Set([
  "accounts.google.com",
  "apis.google.com",
  "oauth2.googleapis.com",
]);
let localServer;
let localServerUrl = "";

const isSafeExternalUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const openExternalSafely = async (rawUrl) => {
  if (!isSafeExternalUrl(rawUrl)) return false;
  await shell.openExternal(rawUrl);
  return true;
};

const isInAppUrl = (rawUrl) => {
  if (!rawUrl) return false;
  if (DEV_SERVER_URL && rawUrl.startsWith(DEV_SERVER_URL)) return true;
  if (localServerUrl && rawUrl.startsWith(localServerUrl)) return true;
  return rawUrl.startsWith("file://");
};

const isFirebaseAuthPopupUrl = (rawUrl) => {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    const pathName = parsed.pathname || "";
    if (
      (host.endsWith(".firebaseapp.com") || host.endsWith(".web.app")) &&
      pathName.startsWith("/__/auth/")
    ) {
      return true;
    }
    return GOOGLE_AUTH_HOSTS.has(host);
  } catch {
    return false;
  }
};

const resolveFilePathFromRequest = (distDir, requestPathname) => {
  const cleanPath = decodeURIComponent(requestPathname).replace(/^\/+/, "");
  const relativePath = cleanPath || "index.html";
  const resolvedPath = path.resolve(distDir, relativePath);
  const normalizedDistDir = `${path.resolve(distDir)}${path.sep}`;
  if (!resolvedPath.startsWith(normalizedDistDir) && resolvedPath !== path.resolve(distDir)) {
    return null;
  }
  return resolvedPath;
};

const startLocalStaticServer = async () => {
  if (localServerUrl) return localServerUrl;
  const distDir = path.join(__dirname, "..", "dist");
  localServer = createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url || "/", `http://${LOOPBACK_PUBLIC_HOST}`);
      let filePath = resolveFilePathFromRequest(distDir, reqUrl.pathname);
      if (!filePath) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Forbidden");
        return;
      }

      let body;
      let ext = path.extname(filePath).toLowerCase();
      try {
        body = await readFile(filePath);
      } catch {
        const isAssetRequest = path.extname(filePath).length > 0;
        if (isAssetRequest) {
          res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Not found");
          return;
        }
        filePath = path.join(distDir, "index.html");
        ext = ".html";
        body = await readFile(filePath);
      }

      const contentType = MIME_TYPES[ext] || "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    } catch {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Internal server error");
    }
  });

  await new Promise((resolve, reject) => {
    localServer.once("error", reject);
    localServer.listen(0, LOOPBACK_HOST, () => resolve());
  });

  const address = localServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to obtain local server port.");
  }
  localServerUrl = `http://${LOOPBACK_PUBLIC_HOST}:${address.port}`;
  return localServerUrl;
};

const createMainWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (DEV_SERVER_URL) {
    void mainWindow.loadURL(DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    const appUrl = await startLocalStaticServer();
    void mainWindow.loadURL(appUrl);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isFirebaseAuthPopupUrl(url)) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 520,
          height: 700,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
          },
        },
      };
    }
    void openExternalSafely(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isInAppUrl(url)) return;
    event.preventDefault();
    void openExternalSafely(url);
  });
};

ipcMain.handle("desktop:openExternal", async (_event, url) => openExternalSafely(url));

app.whenReady().then(() => {
  void createMainWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) void createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (localServer) {
    localServer.close();
    localServer = undefined;
    localServerUrl = "";
  }
});
