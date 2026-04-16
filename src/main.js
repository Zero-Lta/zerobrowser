const { app, BrowserWindow, ipcMain, session, Menu, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

// Set app/process name (shown in Task Manager for packaged builds)
app.setName('ZeroBrowser');
app.setAppUserModelId('com.zerobrowser.app');
try { process.title = 'ZeroBrowser'; } catch (e) {}

// Tracker blocked counter (per window webContents id)
const trackerCounts = new Map();
// Loaded extensions list
const loadedExtensions = new Map(); // path -> { id, name, version }
const extensionsConfigPath = path.join(app.getPath('userData'), 'extensions.json');

// Site permissions: { "host": { "camera": "allow"|"deny"|"ask", "microphone": ..., "geolocation": ..., "notifications": ... } }
const permissionsPath = path.join(app.getPath('userData'), 'site-permissions.json');
let sitePermissions = {};

function loadSitePermissions() {
  try {
    if (fs.existsSync(permissionsPath)) {
      sitePermissions = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
    }
  } catch (e) { sitePermissions = {}; }
}
function saveSitePermissions() {
  try { fs.writeFileSync(permissionsPath, JSON.stringify(sitePermissions, null, 2)); } catch (e) {}
}
function getHostFromUrl(url) {
  try { return new URL(url).hostname; } catch (e) { return ''; }
}

// ==========================================
// Performance optimizations
// ==========================================
// Enable GPU hardware acceleration (was incorrectly disabled before)
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('enable-accelerated-video-decode');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Smooth scrolling & compositing
app.commandLine.appendSwitch('enable-smooth-scrolling');
app.commandLine.appendSwitch('enable-features', 'CalculateNativeWinOcclusion,UseSkiaRenderer,NetworkServiceInProcess2');

// Networking & caching
app.commandLine.appendSwitch('disk-cache-size', String(512 * 1024 * 1024)); // 512 MB cache

// Memory / V8
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096 --expose-gc');

// Disable unused features that consume resources
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints,MediaRouter,DialMediaRouteProvider');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

// Data storage paths
const userDataPath = app.getPath('userData');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const historyPath = path.join(userDataPath, 'history.json');

// Ensure data directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

// Initialize data files
if (!fs.existsSync(bookmarksPath)) {
  fs.writeFileSync(bookmarksPath, JSON.stringify([], null, 2));
}
if (!fs.existsSync(historyPath)) {
  fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
}

// Ad blocker filter list (basic)
const adBlockFilters = [
  '*://*.doubleclick.net/*',
  '*://*.googleadservices.com/*',
  '*://*.googlesyndication.com/*',
  '*://*.facebook.com/tr*',
  '*://*.amazon-adsystem.com/*',
  '*://*.ads.twitter.com/*',
  '*://*.advertising.com/*',
  '*://*.adsystem.com/*',
  '*://*.adnxs.com/*',
  '*://*.outbrain.com/*',
  '*://*.taboola.com/*'
];

// Tracking blocker filter list
const trackingBlockFilters = [
  '*://*.google-analytics.com/*',
  '*://*.googletagmanager.com/*',
  '*://*.googletagservices.com/*',
  '*://*.facebook.com/tr/*',
  '*://*.connect.facebook.net/*',
  '*://*.stats.g.doubleclick.net/*',
  '*://*.analytics.twitter.com/*',
  '*://*.pixel.wp.com/*',
  '*://*.stats.wp.com/*',
  '*://*.hotjar.com/*',
  '*://*.static.hotjar.com/*',
  '*://*. Segment.io/*',
  '*://*.cdn.segment.com/*',
  '*://*.mixpanel.com/*',
  '*://*.amplitude.com/*',
  '*://*.fullstory.com/*',
  '*://*.cloudinary.com/*',
  '*://*.newrelic.com/*',
  '*://*.nr-data.net/*',
  '*://*.bugsnag.com/*',
  '*://*.sentry.io/*',
  '*://*.trackjs.com/*',
  '*://*.logrocket.com/*',
  '*://*.heap.io/*',
  '*://*.heapanalytics.com/*',
  '*://*.mouseflow.com/*',
  '*://*.userzoom.com/*',
  '*://*.qualtrics.com/*',
  '*://*.surveygizmo.com/*',
  '*://*.typeform.com/*',
  '*://*.optimizely.com/*',
  '*://*.vwo.com/*',
  '*://*.crazyegg.com/*',
  '*://*.clicktale.com/*',
  '*://*.inspectlet.com/*',
  '*://*.luckyorange.com/*',
  '*://*.smartlook.com/*',
  '*://*.clarity.ms/*',
  '*://*.bat.bing.com/*',
  '*://*.c.bing.com/*',
  '*://*.analytics.yahoo.com/*',
  '*://*.adobe.com/*',
  '*://*.omtrdc.net/*',
  '*://*.demdex.net/*',
  '*://*.adobe.io/*',
  '*://*.tealiumiq.com/*',
  '*://*.tiqcdn.com/*',
  '*://*.tags.tiqcdn.com/*',
  '*://*.monetate.net/*',
  '*://*.tracking.monetate.net/*',
  '*://*.bounceexchange.com/*',
  '*://*.tagcommander.com/*',
  '*://*.commander1.com/*',
  '*://*.ensighten.com/*',
  '*://*.ensighten.com/*',
  '*://*.privacymanager.io/*',
  '*://*.consentmanager.net/*',
  '*://*.didomi.io/*',
  '*://*.cookiebot.com/*',
  '*://*.onetrust.com/*',
  '*://*.trustarc.com/*',
  '*://*.civic.com/*',
  '*://*.quantserve.com/*',
  '*://*.scorecardresearch.com/*',
  '*://*.comscore.com/*',
  '*://*.nielsen.com/*',
  '*://*.livestats.com/*',
  '*://*.chartbeat.com/*',
  '*://*.ping.chartbeat.net/*',
  '*://*.pixel.quantserve.com/*'
];

// Store all windows
let windows = [];

// App icon (high-res for taskbar)
const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/logo.png'));

// Setup blocking + tracker counting on a given session
const configuredSessions = new WeakSet();
function setupSessionBlocking(ses, windowId) {
  if (configuredSessions.has(ses)) return;
  configuredSessions.add(ses);
  
  const allFilters = [...adBlockFilters, ...trackingBlockFilters];
  ses.webRequest.onBeforeRequest({ urls: allFilters }, (details, callback) => {
    // Increment tracker counter for window
    if (windowId != null) {
      const c = trackerCounts.get(windowId) || 0;
      trackerCounts.set(windowId, c + 1);
      const win = BrowserWindow.fromId(windowId);
      if (win && !win.isDestroyed()) {
        win.webContents.send('tracker-blocked', { count: c + 1, url: details.url });
      }
    }
    callback({ cancel: true });
  });

  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ['default-src * \'unsafe-inline\' \'unsafe-eval\' data: blob:']
      }
    });
  });
  
  // Permission request handler (camera, mic, geolocation, notifications)
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const url = (details && details.requestingUrl) || webContents.getURL();
    const host = getHostFromUrl(url);
    const stored = (sitePermissions[host] && sitePermissions[host][permission]) || 'ask';
    
    if (stored === 'allow') return callback(true);
    if (stored === 'deny') return callback(false);
    
    // Ask: ask the user via renderer
    const win = BrowserWindow.fromWebContents(webContents) || BrowserWindow.fromWebContents(webContents.hostWebContents || webContents);
    const targetWin = windows.find(w => !w.isDestroyed()) || win;
    if (!targetWin) return callback(false);
    
    const reqId = `perm_${Date.now()}_${Math.random()}`;
    targetWin.webContents.send('permission-request', { id: reqId, host, permission, url });
    
    const timeout = setTimeout(() => {
      ipcMain.removeAllListeners(reqId);
      callback(false);
    }, 60000);
    
    ipcMain.once(reqId, (_e, decision) => {
      clearTimeout(timeout);
      const allow = decision.allow === true;
      if (decision.remember) {
        if (!sitePermissions[host]) sitePermissions[host] = {};
        sitePermissions[host][permission] = allow ? 'allow' : 'deny';
        saveSitePermissions();
      }
      callback(allow);
    });
  });
  
  // Permission check handler (synchronous lookups)
  ses.setPermissionCheckHandler((webContents, permission, requestingOrigin) => {
    const host = getHostFromUrl(requestingOrigin || (webContents && webContents.getURL()) || '');
    const stored = sitePermissions[host] && sitePermissions[host][permission];
    if (stored === 'allow') return true;
    if (stored === 'deny') return false;
    return false; // default deny for sync checks
  });
}

// Load extensions into a session
async function loadExtensionsIntoSession(ses) {
  for (const [extPath, info] of loadedExtensions.entries()) {
    try {
      if (fs.existsSync(extPath)) {
        await ses.loadExtension(extPath, { allowFileAccess: true });
      }
    } catch (e) {
      console.error('Failed to load extension', extPath, e);
    }
  }
}

function createWindow(options = {}) {
  const { incognito = false } = options;
  
  // Incognito uses an in-memory session partition
  const partition = incognito ? `inmemory:${Date.now()}` : undefined;
  
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: incognito ? '#1a0f1f' : '#0a0a0f',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      partition: partition,
      backgroundThrottling: false,
      spellcheck: false,
      enableWebSQL: false,
      v8CacheOptions: 'bypassHeatCheck'
    },
    show: false,
    icon: appIcon
  });

  // Mark window as incognito for renderer
  win.isIncognito = incognito;

  // Set taskbar icon explicitly (Windows)
  if (process.platform === 'win32') {
    win.setIcon(appIcon);
    app.setAppUserModelId('com.zerobrowser.app');
  }

  // Load the index.html
  win.loadFile(path.join(__dirname, 'renderer/index.html'), {
    query: incognito ? { incognito: '1' } : {}
  });

  // Show only when ready to avoid white flash and perceived delay
  win.once('ready-to-show', () => { win.show(); });

  // Set up ad blocker and tracking blocker on this session
  const ses = incognito ? session.fromPartition(partition) : session.defaultSession;
  setupSessionBlocking(ses, win.id);
  setupDownloadHandler(ses);
  
  // Load extensions (not in incognito)
  if (!incognito) {
    loadExtensionsIntoSession(ses);
  }
  
  // Setup session for webviews (they use the same session by default)
  // Initialize tracker count
  trackerCounts.set(win.id, 0);

  // Add to windows array
  windows.push(win);

  // Remove from array when closed
  win.on('closed', () => {
    trackerCounts.delete(win.id);
    const index = windows.indexOf(win);
    if (index > -1) {
      windows.splice(index, 1);
    }
  });

  return win;
}

// Load persisted extensions config
function loadPersistedExtensions() {
  try {
    if (fs.existsSync(extensionsConfigPath)) {
      const list = JSON.parse(fs.readFileSync(extensionsConfigPath, 'utf8'));
      list.forEach(p => loadedExtensions.set(p, { path: p }));
    }
  } catch (e) {
    console.error('Failed to load extensions config:', e);
  }
}

function saveExtensionsConfig() {
  try {
    fs.writeFileSync(extensionsConfigPath, JSON.stringify([...loadedExtensions.keys()], null, 2));
  } catch (e) {
    console.error('Failed to save extensions config:', e);
  }
}

// ==========================================
// Download Manager
// ==========================================
const downloadsHistoryPath = path.join(userDataPath, 'downloads.json');
const activeDownloads = new Map(); // id -> DownloadItem
let downloadHistory = []; // completed/cancelled entries persisted

function loadDownloadHistory() {
  try {
    if (fs.existsSync(downloadsHistoryPath)) {
      downloadHistory = JSON.parse(fs.readFileSync(downloadsHistoryPath, 'utf8'));
    }
  } catch (e) { downloadHistory = []; }
}

function saveDownloadHistory() {
  try {
    // Keep only last 200
    const toSave = downloadHistory.slice(0, 200);
    fs.writeFileSync(downloadsHistoryPath, JSON.stringify(toSave, null, 2));
  } catch (e) {}
}

function broadcastDownload(payload) {
  BrowserWindow.getAllWindows().forEach(w => {
    if (!w.isDestroyed()) w.webContents.send('download-update', payload);
  });
}

function snapshotActive(id, item, extra = {}) {
  const received = item.getReceivedBytes();
  const total = item.getTotalBytes();
  return {
    id,
    filename: item.getFilename(),
    savePath: item.getSavePath(),
    url: item.getURL(),
    mime: item.getMimeType(),
    receivedBytes: received,
    totalBytes: total,
    percent: total > 0 ? Math.round((received / total) * 100) : 0,
    state: item.getState(), // 'progressing' | 'completed' | 'cancelled' | 'interrupted'
    isPaused: item.isPaused(),
    startTime: item.getStartTime(),
    ...extra
  };
}

function setupDownloadHandler(ses) {
  if (ses.__downloadsConfigured) return;
  ses.__downloadsConfigured = true;

  ses.on('will-download', (_event, item, _webContents) => {
    const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    activeDownloads.set(id, item);

    // Default save path (Downloads folder) — Electron handles this automatically,
    // but we respect user preference for "ask where to save"
    // (Renderer stores that via localStorage; main can't read it, so we check via flag)
    // For simplicity, Electron will use OS default Downloads unless a dialog is shown.

    // Track speed (bytes/sec)
    let lastBytes = 0;
    let lastTick = Date.now();
    let speed = 0;

    const sendUpdate = (extra = {}) => {
      try {
        const now = Date.now();
        const deltaTime = (now - lastTick) / 1000;
        const current = item.getReceivedBytes();
        if (deltaTime > 0.5) {
          speed = (current - lastBytes) / deltaTime;
          lastBytes = current;
          lastTick = now;
        }
        broadcastDownload({ type: 'update', item: snapshotActive(id, item, { speed, ...extra }) });
      } catch (e) { /* item may be disposed */ }
    };

    sendUpdate({ event: 'started' });

    item.on('updated', (_e, state) => {
      sendUpdate({ event: state });
    });

    item.once('done', (_e, state) => {
      try {
        const finalSnap = snapshotActive(id, item, { speed: 0, event: 'done', finalState: state });
        activeDownloads.delete(id);
        downloadHistory.unshift(finalSnap);
        saveDownloadHistory();
        broadcastDownload({ type: 'done', item: finalSnap });
      } catch (e) {
        activeDownloads.delete(id);
      }
    });
  });
}

ipcMain.handle('downloads-list', () => {
  const active = [];
  for (const [id, item] of activeDownloads.entries()) {
    try { active.push(snapshotActive(id, item)); } catch (e) {}
  }
  return { active, history: downloadHistory };
});

ipcMain.handle('download-pause', (_e, id) => {
  const item = activeDownloads.get(id);
  if (item && !item.isPaused()) {
    try { item.pause(); } catch (e) {}
  }
  return !!item;
});

ipcMain.handle('download-resume', (_e, id) => {
  const item = activeDownloads.get(id);
  if (item && item.canResume()) item.resume();
  return !!item;
});

ipcMain.handle('download-cancel', (_e, id) => {
  const item = activeDownloads.get(id);
  if (item) { try { item.cancel(); } catch (e) {} }
  return !!item;
});

ipcMain.handle('download-show-in-folder', (_e, savePath) => {
  if (savePath && fs.existsSync(savePath)) {
    shell.showItemInFolder(savePath);
    return true;
  }
  return false;
});

ipcMain.handle('download-open-file', (_e, savePath) => {
  if (savePath && fs.existsSync(savePath)) {
    shell.openPath(savePath);
    return true;
  }
  return false;
});

ipcMain.handle('download-remove-from-history', (_e, id) => {
  downloadHistory = downloadHistory.filter(d => d.id !== id);
  saveDownloadHistory();
  return true;
});

ipcMain.handle('download-clear-history', () => {
  downloadHistory = [];
  saveDownloadHistory();
  return true;
});

// ==========================================
// Auto-Updater (electron-updater + GitHub)
// ==========================================
function setupAutoUpdater() {
  // Disable auto-download so we can prompt the user
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  const broadcast = (channel, data) => {
    BrowserWindow.getAllWindows().forEach(w => {
      if (!w.isDestroyed()) w.webContents.send(channel, data);
    });
  };

  autoUpdater.on('checking-for-update', () => {
    broadcast('updater-status', { state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    broadcast('updater-status', { state: 'available', version: info.version, notes: info.releaseNotes });
  });

  autoUpdater.on('update-not-available', () => {
    broadcast('updater-status', { state: 'none' });
  });

  autoUpdater.on('download-progress', (progress) => {
    broadcast('updater-status', {
      state: 'downloading',
      percent: Math.round(progress.percent),
      speed: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    broadcast('updater-status', { state: 'ready', version: info.version });
  });

  autoUpdater.on('error', (err) => {
    broadcast('updater-status', { state: 'error', message: err.message });
  });

  // Only check when packaged (not in dev)
  if (app.isPackaged) {
    // Initial check after 5s
    setTimeout(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 5000);
    // Re-check every 4 hours
    setInterval(() => { autoUpdater.checkForUpdates().catch(() => {}); }, 4 * 60 * 60 * 1000);
  }
}

ipcMain.handle('updater-check', async () => {
  if (!app.isPackaged) return { ok: false, reason: 'dev' };
  try {
    const r = await autoUpdater.checkForUpdates();
    return { ok: true, version: r?.updateInfo?.version };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
});

ipcMain.handle('updater-download', async () => {
  try { await autoUpdater.downloadUpdate(); return true; } catch (e) { return false; }
});

ipcMain.handle('updater-install', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.handle('get-app-version', () => app.getVersion());

// App ready
app.whenReady().then(async () => {
  loadSitePermissions();
  loadPersistedExtensions();
  loadDownloadHistory();
  setupDownloadHandler(session.defaultSession);
  setupAutoUpdater();
  
  // Load all persisted extensions into default session
  for (const extPath of [...loadedExtensions.keys()]) {
    try {
      if (fs.existsSync(extPath)) {
        const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
        loadedExtensions.set(extPath, { id: ext.id, name: ext.name, version: ext.version, path: extPath });
      } else {
        loadedExtensions.delete(extPath);
      }
    } catch (e) {
      console.error('Failed loading extension at start:', extPath, e);
    }
  }
  saveExtensionsConfig();
  
  createWindow();

  // Create menu
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CmdOrCtrl+N',
          click: () => createWindow()
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  Menu.setApplicationMenu(null);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers
ipcMain.handle('get-bookmarks', async () => {
  try {
    const data = fs.readFileSync(bookmarksPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('save-bookmark', async (event, bookmark) => {
  try {
    const bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
    bookmarks.push(bookmark);
    fs.writeFileSync(bookmarksPath, JSON.stringify(bookmarks, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving bookmark:', error);
    return false;
  }
});

ipcMain.handle('delete-bookmark', async (event, bookmarkId) => {
  try {
    const bookmarks = JSON.parse(fs.readFileSync(bookmarksPath, 'utf8'));
    const filtered = bookmarks.filter(b => b.id !== bookmarkId);
    fs.writeFileSync(bookmarksPath, JSON.stringify(filtered, null, 2));
    return true;
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    return false;
  }
});

ipcMain.handle('get-history', async () => {
  try {
    const data = fs.readFileSync(historyPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
});

ipcMain.handle('add-history', async (event, historyItem) => {
  try {
    const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    history.unshift(historyItem);
    // Keep only last 1000 items
    if (history.length > 1000) {
      history.pop();
    }
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error('Error adding history:', error);
    return false;
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2));
    return true;
  } catch (error) {
    console.error('Error clearing history:', error);
    return false;
  }
});

ipcMain.handle('create-new-window', async (event, options = {}) => {
  const win = createWindow(options);
  return win.id;
});

ipcMain.handle('create-incognito-window', async () => {
  const win = createWindow({ incognito: true });
  return win.id;
});

ipcMain.handle('is-incognito', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? !!win.isIncognito : false;
});

// Tracker Radar
ipcMain.handle('get-tracker-count', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? (trackerCounts.get(win.id) || 0) : 0;
});

ipcMain.handle('reset-tracker-count', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) trackerCounts.set(win.id, 0);
  return 0;
});

// Extensions
ipcMain.handle('pick-extension-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    title: 'Selecionar pasta da extensão (unpacked)',
    properties: ['openDirectory']
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('load-extension', async (event, extPath) => {
  try {
    if (!extPath || !fs.existsSync(extPath)) {
      return { success: false, error: 'Pasta não existe' };
    }
    const manifestPath = path.join(extPath, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return { success: false, error: 'manifest.json não encontrado' };
    }
    const ext = await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
    loadedExtensions.set(extPath, { id: ext.id, name: ext.name, version: ext.version, path: extPath });
    saveExtensionsConfig();
    return { success: true, name: ext.name, version: ext.version, id: ext.id };
  } catch (e) {
    console.error('Load extension error:', e);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-extensions', () => {
  return [...loadedExtensions.values()];
});

// Site Permissions
ipcMain.handle('get-site-permissions', () => {
  return sitePermissions;
});

ipcMain.handle('set-site-permission', (event, host, permission, value) => {
  if (!host) return false;
  if (!sitePermissions[host]) sitePermissions[host] = {};
  if (value === 'ask' || !value) {
    delete sitePermissions[host][permission];
    if (Object.keys(sitePermissions[host]).length === 0) delete sitePermissions[host];
  } else {
    sitePermissions[host][permission] = value;
  }
  saveSitePermissions();
  return true;
});

ipcMain.handle('clear-site-permissions', (event, host) => {
  if (host) delete sitePermissions[host];
  else sitePermissions = {};
  saveSitePermissions();
  return true;
});

ipcMain.handle('remove-extension', async (event, extPath) => {
  try {
    const info = loadedExtensions.get(extPath);
    if (info && info.id) {
      try { session.defaultSession.removeExtension(info.id); } catch (e) {}
    }
    loadedExtensions.delete(extPath);
    saveExtensionsConfig();
    return true;
  } catch (e) {
    return false;
  }
});

// Window controls
ipcMain.handle('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.handle('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;
  if (win.isMaximized()) {
    win.unmaximize();
    return false;
  } else {
    win.maximize();
    return true;
  }
});

ipcMain.handle('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle('window-is-maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isMaximized() : false;
});

// Optimize browser: clear cache, cookies, DNS, service workers, old history
ipcMain.handle('optimize-browser', async (event, options = {}) => {
  const result = { cacheCleared: 0, historyTrimmed: 0, success: true };
  try {
    const ses = session.defaultSession;
    
    // Get cache size before
    try {
      result.cacheCleared = await ses.getCacheSize();
    } catch (e) {}
    
    // Clear HTTP cache
    await ses.clearCache();
    
    // Clear DNS cache
    await ses.clearHostResolverCache();
    
    // Clear auth cache
    await ses.clearAuthCache();
    
    // Clear storage data (selective - keep cookies/localStorage by default)
    const storages = ['shadercache', 'serviceworkers', 'cachestorage'];
    if (options.deepClean) {
      storages.push('filesystem', 'indexdb', 'websql');
    }
    await ses.clearStorageData({ storages });
    
    // Trim history to last 200 items
    try {
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      if (history.length > 200) {
        result.historyTrimmed = history.length - 200;
        fs.writeFileSync(historyPath, JSON.stringify(history.slice(0, 200), null, 2));
      }
    } catch (e) {}
    
    // Trigger garbage collection in all windows
    BrowserWindow.getAllWindows().forEach(win => {
      try {
        win.webContents.session.flushStorageData();
      } catch (e) {}
    });
    
    return result;
  } catch (error) {
    console.error('Optimize error:', error);
    return { success: false, error: error.message };
  }
});

// Logo as base64 data URL
let cachedLogoDataUrl = null;
ipcMain.handle('get-logo', async () => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  try {
    const logoPath = path.join(__dirname, '../assets/logo.png');
    const buffer = fs.readFileSync(logoPath);
    cachedLogoDataUrl = 'data:image/png;base64,' + buffer.toString('base64');
    return cachedLogoDataUrl;
  } catch (error) {
    console.error('Error loading logo:', error);
    return null;
  }
});
