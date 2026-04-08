'use strict';
const { app, BrowserWindow, ipcMain, shell, nativeTheme, Menu } = require('electron');
const path   = require('path');
const http   = require('http');
const https  = require('https');
const { fork } = require('child_process');
const Store  = require('electron-store');
const fs     = require('fs');

const store = new Store({
  name: 'printflow-lite-config',
  schema: {
    theme:         { type: 'string', default: 'dark', enum: ['dark','light','system'] },
    windowBounds:  { type: 'object', default: { width: 1280, height: 800 } },
    setupComplete: { type: 'boolean', default: false },
    eulaAccepted:  { type: 'boolean', default: false },
  },
});

const isDev     = !!process.env.ELECTRON_START_URL || !app.isPackaged;
const START_URL = process.env.ELECTRON_START_URL || `file://${path.join(__dirname,'../../build/index.html')}`;
const LOCAL_SERVER = 'http://127.0.0.1:3001';

let serverProcess = null;
let serverReady   = false;
let mainWindow    = null;

function getServerPath() {
  if (isDev) return path.join(__dirname, '../server/index.js');
  return path.join(process.resourcesPath, 'server', 'index.js');
}
function getDataPath() { return path.join(app.getPath('userData'), 'data'); }
function getLogsPath() { return path.join(app.getPath('userData'), 'logs'); }
function generateSecret() {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length:64}, () => c[Math.floor(Math.random()*c.length)]).join('');
}

function httpGet(url, ms = 5000) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { timeout: ms }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, data: d }); }
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
  });
}

function startServer() {
  return new Promise(resolve => {
    const serverPath = getServerPath();
    fs.mkdirSync(getDataPath(), { recursive: true });
    fs.mkdirSync(getLogsPath(), { recursive: true });

    if (!fs.existsSync(serverPath)) {
      console.error('Server not found:', serverPath);
      return resolve(false);
    }
    if (!store.get('jwtSecret')) store.set('jwtSecret', generateSecret());

    const env = {
      ...process.env,
      NODE_ENV: 'production', PORT: '3001', HOST: '127.0.0.1',
      DB_PATH: path.join(getDataPath(), 'printflow.db'),
      LOG_DIR: getLogsPath(), LOG_LEVEL: 'info',
      LITE_MODE: 'true',
      JWT_SECRET: store.get('jwtSecret'),
      JWT_EXPIRES_IN: '8h',
      ALLOWED_ORIGINS: 'file://',
      TRUST_PROXY: '0',
      BCRYPT_ROUNDS: '12',
    };

    serverProcess = fork(serverPath, [], { env, silent: true, cwd: path.dirname(serverPath) });
    serverProcess.stdout?.on('data', d => { if (isDev) process.stdout.write('[srv] ' + d); });
    serverProcess.stderr?.on('data', d => { if (isDev) process.stderr.write('[srv!] ' + d); });
    serverProcess.on('exit', () => { serverReady = false; });

    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      const pct = Math.min(88, Math.round((attempts / 30) * 88));
      mainWindow?.webContents.send('server:progress', { progress: pct, ready: false });
      try {
        const r = await httpGet(`${LOCAL_SERVER}/health`, 900);
        if (r.status === 200) {
          clearInterval(poll);
          serverReady = true;
          mainWindow?.webContents.send('server:progress', { progress: 100, ready: true });
          resolve(true);
        }
      } catch {
        if (attempts >= 40) { clearInterval(poll); resolve(false); }
      }
    }, 200);
  });
}

function stopServer() {
  if (serverProcess) { serverProcess.kill('SIGTERM'); serverProcess = null; serverReady = false; }
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i]||0) > (pb[i]||0)) return 1;
    if ((pa[i]||0) < (pb[i]||0)) return -1;
  }
  return 0;
}

async function checkForUpdates() {
  try {
    const r = await httpGet('https://api.github.com/repos/rbd992/printflow-lite/releases/latest', 8000);
    if (r.status !== 200 || !r.data?.tag_name) return { updateAvailable: false };
    const latest = r.data.tag_name.replace(/^v/, '');
    const current = app.getVersion();
    const assets = r.data.assets || [];
    return {
      updateAvailable: compareVersions(latest, current) > 0,
      currentVersion: current, latestVersion: latest,
      releaseNotes: r.data.body || '',
      macUrl:   assets.find(a => a.name.endsWith('.dmg'))?.browser_download_url || null,
      winUrl:   assets.find(a => a.name.endsWith('.exe'))?.browser_download_url || null,
      linuxUrl: assets.find(a => a.name.endsWith('.AppImage'))?.browser_download_url || null,
      publishedAt: r.data.published_at || null,
    };
  } catch { return { updateAvailable: false, currentVersion: app.getVersion() }; }
}

function createWindow() {
  const { width, height } = store.get('windowBounds');
  mainWindow = new BrowserWindow({
    width, height, minWidth: 1024, minHeight: 680,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
    frame: false, backgroundColor: '#060612', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: false,
    },
  });
  const theme = store.get('theme');
  if (theme !== 'system') nativeTheme.themeSource = theme;
  mainWindow.loadURL(START_URL);
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });
    // Run both tasks in parallel — server starts AND update check happen simultaneously
    // This way the update check doesn't add any extra wait time
    const serverTask = startServer().then(ok => {
      if (!ok) mainWindow?.webContents.send('server:error', 'Failed to start local server');
    });

    // Signal renderer that we're checking for updates
    mainWindow?.webContents.send('update:checking', true);
    const updateTask = checkForUpdates().then(result => {
      mainWindow?.webContents.send('update:checking', false);
      if (result.updateAvailable) mainWindow?.webContents.send('update:available', result);
    }).catch(() => {
      mainWindow?.webContents.send('update:checking', false);
    });

    Promise.all([serverTask, updateTask]).catch(() => {});
  });
  mainWindow.on('resize', () => {
    const [w, h] = mainWindow.getSize();
    store.set('windowBounds', { width: w, height: h });
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url); return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

ipcMain.handle('config:getServerUrl',     () => LOCAL_SERVER);
ipcMain.handle('config:setServerUrl',     () => true);
ipcMain.handle('config:getTheme',         () => store.get('theme'));
ipcMain.handle('config:setTheme', (_, t) => {
  store.set('theme', t);
  nativeTheme.themeSource = t === 'system' ? 'system' : t;
  return true;
});
ipcMain.handle('config:getEulaAccepted',  () => store.get('eulaAccepted', false));
ipcMain.handle('config:setEulaAccepted',  () => { store.set('eulaAccepted', true); return true; });
ipcMain.handle('config:getSetupComplete', () => store.get('setupComplete', false));
ipcMain.handle('config:setSetupComplete', () => { store.set('setupComplete', true); return true; });
ipcMain.handle('server:isReady',    () => serverReady);
ipcMain.handle('server:localUrl',   () => LOCAL_SERVER);
ipcMain.handle('app:getVersion',    () => app.getVersion());
ipcMain.handle('app:isLite',        () => true);
ipcMain.handle('updates:check',     checkForUpdates);
ipcMain.handle('updates:download',  (_, url) => { shell.openExternal(url); return { ok: true }; });
ipcMain.handle('config:getDataPath',() => getDataPath());
ipcMain.handle('token:get', () => {
  const enc = store.get('authToken', null);
  if (!enc) return null;
  try {
    return require('electron').safeStorage.isEncryptionAvailable()
      ? require('electron').safeStorage.decryptString(Buffer.from(enc, 'base64'))
      : enc;
  } catch { return null; }
});
ipcMain.handle('token:set', (_, token) => {
  if (!token) { store.delete('authToken'); return; }
  const val = require('electron').safeStorage.isEncryptionAvailable()
    ? require('electron').safeStorage.encryptString(token).toString('base64')
    : token;
  store.set('authToken', val);
});
ipcMain.handle('token:clear', () => store.delete('authToken'));
ipcMain.on('window:minimize',  () => mainWindow?.minimize());
ipcMain.on('window:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window:close',     () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
ipcMain.on('shell:openExternal', (_, url) => shell.openExternal(url));

app.whenReady().then(() => {
  if (!isDev) Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { stopServer(); if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', stopServer);
