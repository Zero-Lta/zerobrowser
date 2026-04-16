const { contextBridge, ipcRenderer } = require('electron');

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

  // Incognito
  createIncognitoWindow: () => ipcRenderer.invoke('create-incognito-window'),
  isIncognito: () => ipcRenderer.invoke('is-incognito'),

  // Tracker Radar
  getTrackerCount: () => ipcRenderer.invoke('get-tracker-count'),
  resetTrackerCount: () => ipcRenderer.invoke('reset-tracker-count'),
  onTrackerBlocked: (callback) => {
    ipcRenderer.on('tracker-blocked', (_e, data) => callback(data));
  },

  // Extensions
  pickExtensionFolder: () => ipcRenderer.invoke('pick-extension-folder'),
  loadExtension: (path) => ipcRenderer.invoke('load-extension', path),
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  removeExtension: (path) => ipcRenderer.invoke('remove-extension', path),

  // Site Permissions
  getSitePermissions: () => ipcRenderer.invoke('get-site-permissions'),
  setSitePermission: (host, permission, value) => ipcRenderer.invoke('set-site-permission', host, permission, value),
  clearSitePermissions: (host) => ipcRenderer.invoke('clear-site-permissions', host),
  onPermissionRequest: (callback) => {
    ipcRenderer.on('permission-request', (_e, data) => callback(data));
  },
  respondToPermission: (id, decision) => ipcRenderer.send(id, decision),

  // Auto-Updater
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  updaterCheck: () => ipcRenderer.invoke('updater-check'),
  updaterDownload: () => ipcRenderer.invoke('updater-download'),
  updaterInstall: () => ipcRenderer.invoke('updater-install'),
  onUpdaterStatus: (callback) => {
    ipcRenderer.on('updater-status', (_e, data) => callback(data));
  }
});
