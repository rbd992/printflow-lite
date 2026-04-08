const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('printflow', {
  // Server (Lite — always local)
  getServerUrl:     ()      => ipcRenderer.invoke('config:getServerUrl'),
  setServerUrl:     (url)   => ipcRenderer.invoke('config:setServerUrl', url),
  serverIsReady:    ()      => ipcRenderer.invoke('server:isReady'),
  serverLocalUrl:   ()      => ipcRenderer.invoke('server:localUrl'),
  onServerProgress: (cb)    => ipcRenderer.on('server:progress', (_, d) => cb(d)),
  onServerError:    (cb)    => ipcRenderer.on('server:error', (_, msg) => cb(msg)),
  onUpdateAvailable:(cb)    => ipcRenderer.on('update:available', (_, d) => cb(d)),

  // Config
  getTheme:         ()      => ipcRenderer.invoke('config:getTheme'),
  setTheme:         (t)     => ipcRenderer.invoke('config:setTheme', t),
  getEulaAccepted:  ()      => ipcRenderer.invoke('config:getEulaAccepted'),
  setEulaAccepted:  ()      => ipcRenderer.invoke('config:setEulaAccepted'),
  getSetupComplete: ()      => ipcRenderer.invoke('config:getSetupComplete'),
  setSetupComplete: ()      => ipcRenderer.invoke('config:setSetupComplete'),
  getDataPath:      ()      => ipcRenderer.invoke('config:getDataPath'),

  // Auth tokens
  getToken:   ()      => ipcRenderer.invoke('token:get'),
  setToken:   (token) => ipcRenderer.invoke('token:set', token),
  clearToken: ()      => ipcRenderer.invoke('token:clear'),

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  isMaximized:    () => ipcRenderer.invoke('window:isMaximized'),

  // Shell
  openExternal: (url) => ipcRenderer.send('shell:openExternal', url),

  // App info
  platform:   process.platform,
  appVersion: require('../../package.json').version,
  isLite:     true,

  // Updates (via GitHub Releases)
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate:  (url) => ipcRenderer.invoke('updates:download', url),
  getVersion:      ()    => ipcRenderer.invoke('app:getVersion'),
});
