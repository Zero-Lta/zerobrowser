const { contextBridge, ipcRenderer } = require('electron');

// Helper: subscribe to an IPC channel returning an unsubscribe function
// Evita acumulacao de listeners quando o renderer re-subscreve
function subscribe(channel, callback) {
  const wrapped = (_e, ...args) => callback(...args);
  ipcRenderer.on(channel, wrapped);
  return () => ipcRenderer.removeListener(channel, wrapped);
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Bookmarks
  getBookmarks: () => ipcRenderer.invoke('get-bookmarks'),
  saveBookmark: (bookmark) => ipcRenderer.invoke('save-bookmark', bookmark),
  deleteBookmark: (bookmarkId) => ipcRenderer.invoke('delete-bookmark', bookmarkId),

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (historyItem) => ipcRenderer.invoke('add-history', historyItem),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Window management
  createNewWindow: () => ipcRenderer.invoke('create-new-window'),

  // Logo
  getLogo: () => ipcRenderer.invoke('get-logo'),

  // Optimize
  optimizeBrowser: (options) => ipcRenderer.invoke('optimize-browser', options),

  // Window controls
  windowMinimize: () => ipcRenderer.invoke('window-minimize'),
  windowMaximize: () => ipcRenderer.invoke('window-maximize'),
  windowClose: () => ipcRenderer.invoke('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback) => subscribe('window-maximized', callback),

  // Incognito
  createIncognitoWindow: () => ipcRenderer.invoke('create-incognito-window'),
  isIncognito: () => ipcRenderer.invoke('is-incognito'),

  // Tracker Radar
  getTrackerCount: () => ipcRenderer.invoke('get-tracker-count'),
  resetTrackerCount: () => ipcRenderer.invoke('reset-tracker-count'),
  onTrackerBlocked: (callback) => subscribe('tracker-blocked', callback),

  // Extensions
  pickExtensionFolder: () => ipcRenderer.invoke('pick-extension-folder'),
  loadExtension: (path) => ipcRenderer.invoke('load-extension', path),
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  removeExtension: (path) => ipcRenderer.invoke('remove-extension', path),

  // Site Permissions
  getSitePermissions: () => ipcRenderer.invoke('get-site-permissions'),
  setSitePermission: (host, permission, value) => ipcRenderer.invoke('set-site-permission', host, permission, value),
  clearSitePermissions: (host) => ipcRenderer.invoke('clear-site-permissions', host),
  onPermissionRequest: (callback) => subscribe('permission-request', callback),
  respondToPermission: (id, decision) => ipcRenderer.send(id, decision),

  // Download Manager
  downloadsList: () => ipcRenderer.invoke('downloads-list'),
  downloadPause: (id) => ipcRenderer.invoke('download-pause', id),
  downloadResume: (id) => ipcRenderer.invoke('download-resume', id),
  downloadCancel: (id) => ipcRenderer.invoke('download-cancel', id),
  downloadShowInFolder: (savePath) => ipcRenderer.invoke('download-show-in-folder', savePath),
  downloadOpenFile: (savePath) => ipcRenderer.invoke('download-open-file', savePath),
  downloadRemoveFromHistory: (id) => ipcRenderer.invoke('download-remove-from-history', id),
  downloadClearHistory: () => ipcRenderer.invoke('download-clear-history'),
  onDownloadUpdate: (callback) => subscribe('download-update', callback),

  // Webview DevTools (detached)
  openWebviewDevtools: (webContentsId) => ipcRenderer.invoke('open-webview-devtools', webContentsId),

  // Auto-Updater
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  updaterCheck: () => ipcRenderer.invoke('updater-check'),
  updaterDownload: () => ipcRenderer.invoke('updater-download'),
  updaterInstall: () => ipcRenderer.invoke('updater-install'),
  onUpdaterStatus: (callback) => subscribe('updater-status', callback)
});
