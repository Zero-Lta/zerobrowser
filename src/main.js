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
let sitePermissions = Object.create(null);

const ALLOWED_PERMISSION_VALUES = new Set(['allow', 'deny', 'ask']);
const ALLOWED_PERMISSION_KEYS = new Set([
  'media', 'camera', 'microphone', 'geolocation', 'notifications',
  'fullscreen', 'pointerLock', 'midi', 'midiSysex',
  'clipboard-read', 'clipboard-sanitized-write'
]);

function loadSitePermissions() {
  try {
    if (fs.existsSync(permissionsPath)) {
      const raw = JSON.parse(fs.readFileSync(permissionsPath, 'utf8'));
      sitePermissions = sanitizeSitePermissions(raw);
    }
  } catch (e) { sitePermissions = Object.create(null); }
}
function saveSitePermissions() {
  try { fs.writeFileSync(permissionsPath, JSON.stringify(sitePermissions, null, 2)); } catch (e) {}
}
function getHostFromUrl(url) {
  try { return new URL(url).hostname; } catch (e) { return ''; }
}

function normalizeHost(hostLike) {
  if (!hostLike || typeof hostLike !== 'string') return '';
  const trimmed = hostLike.trim().toLowerCase();
  if (!trimmed) return '';

  let host = trimmed;
  try {
    if (trimmed.includes('://')) host = new URL(trimmed).hostname;
  } catch (e) {
    return '';
  }

  host = host.replace(/\.$/, '');
  if (!host || /\s/.test(host)) return '';
  if (host === '__proto__' || host === 'prototype' || host === 'constructor') return '';
  return host;
}

function sanitizeSitePermissions(raw) {
  const safeStore = Object.create(null);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return safeStore;

  for (const [rawHost, rawPermissions] of Object.entries(raw)) {
    const host = normalizeHost(rawHost);
    if (!host || !rawPermissions || typeof rawPermissions !== 'object' || Array.isArray(rawPermissions)) continue;

    const cleanPermissions = Object.create(null);
    for (const [permission, value] of Object.entries(rawPermissions)) {
      if (!ALLOWED_PERMISSION_KEYS.has(permission)) continue;
      if (!ALLOWED_PERMISSION_VALUES.has(value)) continue;
      if (value === 'ask') continue;
      cleanPermissions[permission] = value;
    }

    if (Object.keys(cleanPermissions).length > 0) {
      safeStore[host] = cleanPermissions;
    }
  }

  return safeStore;
}

function isSafeExternalHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (e) {
    return false;
  }
}

function registerAsDefaultBrowser() {
  try {
    if (process.defaultApp) {
      const appPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
      const args = appPath ? [appPath] : [];
      const okHttp = app.setAsDefaultProtocolClient('http', process.execPath, args);
      const okHttps = app.setAsDefaultProtocolClient('https', process.execPath, args);
      return !!(okHttp && okHttps);
    }

    const okHttp = app.setAsDefaultProtocolClient('http');
    const okHttps = app.setAsDefaultProtocolClient('https');
    return !!(okHttp && okHttps);
  } catch (e) {
    return false;
  }
}

function isDefaultBrowserRegistered() {
  try {
    return app.isDefaultProtocolClient('http') && app.isDefaultProtocolClient('https');
  } catch (e) {
    return false;
  }
}

function isAllowedWebviewUrl(url) {
  if (!url || typeof url !== 'string') return true;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'data:') return true;
    if (parsed.protocol === 'about:' && parsed.href === 'about:blank') return true;
    return false;
  } catch (e) {
    return false;
  }
}

function isRendererUiUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'file:') return false;
    const normalizedPath = parsed.pathname.replace(/\\/g, '/').toLowerCase();
    return normalizedPath.endsWith('/renderer/index.html');
  } catch (e) {
    return false;
  }
}

// ==========================================
// Performance optimizations (safe set)
// ==========================================
// GPU hardware acceleration
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

// Smooth scrolling
app.commandLine.appendSwitch('enable-smooth-scrolling');

// Bigger disk cache for faster browsing
app.commandLine.appendSwitch('disk-cache-size', String(512 * 1024 * 1024));

// V8 memory
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=4096');

// Disable unused features
app.commandLine.appendSwitch('disable-features', 'Translate,OptimizationHints');

// Keep background tabs responsive
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling');

// Data storage paths
const userDataPath = app.getPath('userData');
const bookmarksPath = path.join(userDataPath, 'bookmarks.json');
const historyPath = path.join(userDataPath, 'history.json');
const statsPath = path.join(userDataPath, 'stats.json');

// ==========================================
// Discord Telemetry (install + daily + near real-time presence)
// ==========================================
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1495260284162408498/LA1gP4zfwJwdyDx4ApXnnHJ27M9eMtIwtI7l1N_nMcvoO-yh6RHNXvrN9AGAbi2uBgy2';
const GITHUB_REPO = 'Zero-Lta/zerobrowser';
const PRESENCE_INTERVAL_MS = 60 * 1000; // 60s

function loadStats() {
  try {
    if (fs.existsSync(statsPath)) {
      return JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }
  } catch (e) {}
  return {};
}

function saveStats(stats) {
  try {
    if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  } catch (e) {}
}

function randomId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

async function fetchGithubDownloads() {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`);
    if (!res.ok) return null;
    const releases = await res.json();
    let total = 0;
    releases.forEach(r => (r.assets || []).forEach(a => { total += a.download_count || 0; }));
    return { total, releases: releases.length };
  } catch (e) { return null; }
}

// ------------------------------------------------------------------
// Contador externo (abacus.jasoncameron.dev) — sem registo, sem API key
//   hit  → incrementa e devolve o valor atual
//   get  → apenas lê (não incrementa)
// Usamos:
//   zerobrowser/installs              → total de instalações únicas
//   zerobrowser/active-<bucket5min>   → um counter por janela de 5 min
// O "ativos agora" = valor do bucket atual (users que fizeram ping nos últimos 5 min)
// ------------------------------------------------------------------
const ABACUS_NS = 'zerobrowser';
function currentActiveBucket() {
  const d = new Date();
  d.setUTCSeconds(0, 0);
  const minutes = Math.floor(d.getUTCMinutes() / 5) * 5;
  d.setUTCMinutes(minutes);
  // e.g. active-202604191145
  return `active-${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

async function abacusHit(key) {
  try {
    const res = await fetch(`https://abacus.jasoncameron.dev/hit/${ABACUS_NS}/${encodeURIComponent(key)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.value === 'number' ? data.value : null;
  } catch (e) { return null; }
}

async function abacusGet(key) {
  try {
    const res = await fetch(`https://abacus.jasoncameron.dev/get/${ABACUS_NS}/${encodeURIComponent(key)}`);
    if (!res.ok) return 0;
    const data = await res.json();
    return typeof data.value === 'number' ? data.value : 0;
  } catch (e) { return 0; }
}

async function sendDiscordWebhook(event, installId) {
  try {
    const gh = await fetchGithubDownloads();

    // --- Counters externos ---
    let totalInstalls = null;
    let activeNow = null;
    if (event === 'install') {
      // Incrementa instalações únicas e lê ativos
      totalInstalls = await abacusHit('installs');
      activeNow = await abacusGet(currentActiveBucket());
    } else if (event === 'presence') {
      // Incrementa bucket de atividade 5-min
      activeNow = await abacusHit(currentActiveBucket());
      totalInstalls = await abacusGet('installs');
    } else {
      totalInstalls = await abacusGet('installs');
      activeNow = await abacusGet(currentActiveBucket());
    }

    const color = event === 'install' ? 0x10b981 : event === 'presence' ? 0xf59e0b : 0x6366f1;
    const title = event === 'install'
      ? '🎉 Nova Instalação'
      : event === 'presence'
        ? '🟢 Utilizador Online (Tempo Real)'
        : '👋 Utilizador Ativo';

    const fields = [
      { name: '🟢 Ativos Agora (5 min)', value: activeNow != null ? String(activeNow) : '—', inline: true },
      { name: '👥 Total Instalações', value: totalInstalls != null ? String(totalInstalls) : '—', inline: true },
      { name: 'Versão', value: `v${app.getVersion()}`, inline: true },
      { name: 'Plataforma', value: `${process.platform} · ${process.arch}`, inline: true },
      { name: 'Install ID', value: `\`${installId.slice(0, 8)}\``, inline: true },
      { name: 'Evento', value: event, inline: true }
    ];
    if (gh) {
      fields.push({ name: '📊 Downloads GitHub', value: String(gh.total), inline: true });
      fields.push({ name: '🏷 Releases', value: String(gh.releases), inline: true });
    }

    const payload = {
      username: 'Zero Browser Status',
      embeds: [{
        title,
        color,
        fields,
        timestamp: new Date().toISOString(),
        footer: { text: 'Zero Browser · Telemetria anónima' }
      }]
    };

    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (e) { /* silently fail */ }
}

async function runTelemetry() {
  try {
    const stats = loadStats();
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();

    if (!stats.installId) {
      stats.installId = randomId();
      stats.firstRun = new Date().toISOString();
      stats.lastHeartbeat = today;
      stats.lastPresenceAt = 0;
      saveStats(stats);
      await sendDiscordWebhook('install', stats.installId);
    }

    if (!stats.lastPresenceAt || (now - Number(stats.lastPresenceAt)) >= PRESENCE_INTERVAL_MS) {
      stats.lastPresenceAt = now;
      saveStats(stats);
      await sendDiscordWebhook('presence', stats.installId);
    }

    if (stats.lastHeartbeat !== today) {
      stats.lastHeartbeat = today;
      saveStats(stats);
      await sendDiscordWebhook('heartbeat', stats.installId);
    }
  } catch (e) { /* silently fail */ }
}

function startRealtimePresenceTelemetry() {
  // First send quickly after startup
  setTimeout(() => { runTelemetry(); }, 3000);
  // Then keep reporting every minute
  setInterval(() => { runTelemetry(); }, PRESENCE_INTERVAL_MS);
}

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

// ==========================================
// Privacy Engine (categorized blocking)
// ==========================================
const privacySettingsPath = path.join(userDataPath, 'privacy-settings.json');

const DEFAULT_PRIVACY_SETTINGS = {
  blockAds: true,
  blockTrackers: true,
  blockAnalytics: true,
  blockSocial: true,
  blockCryptoMining: true,
  blockFingerprinting: true,
  blockMalware: true,
  blockThirdPartyCookies: false,
  stripTrackingParams: true,
  upgradeToHttps: true,
  sendDNT: true,
  sendGPC: true,
  strictReferrer: false
};

let privacySettings = { ...DEFAULT_PRIVACY_SETTINGS };

// Per-category blocked counters (global, across all tabs)
const blockedStats = {
  ads: 0, trackers: 0, analytics: 0, social: 0,
  crypto: 0, fingerprint: 0, malware: 0, cookies: 0,
  httpsUpgraded: 0, paramsStripped: 0
};

function loadPrivacySettings() {
  try {
    if (fs.existsSync(privacySettingsPath)) {
      privacySettings = { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(fs.readFileSync(privacySettingsPath, 'utf8')) };
    }
  } catch (e) { privacySettings = { ...DEFAULT_PRIVACY_SETTINGS }; }
}
function savePrivacySettings() {
  try { fs.writeFileSync(privacySettingsPath, JSON.stringify(privacySettings, null, 2)); } catch (e) {}
}

// ---- Hostname blocklists (suffix match) ----
// Each Set contains hostnames; a request is blocked if its hostname equals
// any entry or ends with ".entry".
const BLOCKLIST = {
  ads: new Set([
    'doubleclick.net', 'googleadservices.com', 'googlesyndication.com',
    'amazon-adsystem.com', 'advertising.com', 'adsystem.amazon.com',
    'adnxs.com', 'outbrain.com', 'taboola.com', 'criteo.com', 'criteo.net',
    'rubiconproject.com', 'pubmatic.com', 'openx.net', 'adform.net',
    'adroll.com', 'mediavine.com', 'ezoic.com', 'ads.yahoo.com',
    'ads.twitter.com', 'ads.linkedin.com', 'ads.pinterest.com',
    'ads.tiktok.com', 'ads.reddit.com', 'moatads.com', 'contextweb.com',
    'smartadserver.com', 'casalemedia.com', 'adsrvr.org', 'bidswitch.net',
    'yieldmo.com', 'indexexchange.com', 'sharethrough.com'
  ]),
  trackers: new Set([
    'scorecardresearch.com', 'quantserve.com', 'quantcount.com',
    'comscore.com', 'nielsen.com', 'chartbeat.com', 'chartbeat.net',
    'bounceexchange.com', 'crazyegg.com', 'inspectlet.com',
    'luckyorange.com', 'mouseflow.com', 'smartlook.com',
    'clicktale.com', 'userzoom.com', 'qualtrics.com',
    'demdex.net', 'everesttech.net', 'omtrdc.net', 'tubemogul.com',
    'adobedtm.com', 'tealiumiq.com', 'tiqcdn.com', 'ensighten.com',
    'krxd.net', 'rlcdn.com', 'liadm.com', 'agkn.com',
    'monetate.net', 'bluekai.com'
  ]),
  analytics: new Set([
    'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
    'stats.g.doubleclick.net', 'analytics.twitter.com',
    'bat.bing.com', 'c.bing.com', 'analytics.yahoo.com',
    'mixpanel.com', 'amplitude.com', 'segment.io', 'cdn.segment.com',
    'api.segment.io', 'heap.io', 'heapanalytics.com',
    'hotjar.com', 'static.hotjar.com', 'clarity.ms',
    'optimizely.com', 'vwo.com', 'fullstory.com', 'logrocket.com',
    'pendo.io', 'matomo.cloud', 'plausible.io',
    'pixel.wp.com', 'stats.wp.com', 'sentry.io', 'bugsnag.com',
    'newrelic.com', 'nr-data.net', 'trackjs.com'
  ]),
  social: new Set([
    'connect.facebook.net', 'platform.twitter.com', 'syndication.twitter.com',
    'platform.linkedin.com', 'snap.licdn.com', 'px.ads.linkedin.com',
    'assets.pinterest.com', 'ct.pinterest.com', 's.pinimg.com',
    'widgets.pinterest.com', 'platform.instagram.com',
    'analytics.tiktok.com', 'business-api.tiktok.com',
    'widget.disqus.com', 'referrer.disqus.com',
    'platform-api.sharethis.com', 'buttons-config.sharethis.com',
    'w.sharethis.com', 'addthis.com', 's7.addthis.com'
  ]),
  crypto: new Set([
    'coinhive.com', 'coin-hive.com', 'authedmine.com', 'jsecoin.com',
    'crypto-loot.com', 'cryptaloot.pro', 'webminerpool.com',
    'coinimp.com', 'monerominer.rocks', 'coinpot.co',
    'deepminer.com', 'minero.cc', 'minero.pw', 'minero-proxy.sh',
    'cryptonight.wasm', 'load.jsecoin.com', 'reasedoper.pw'
  ]),
  fingerprint: new Set([
    'fingerprintjs.com', 'fpjs.io', 'fpjs.sh',
    'fingerprint.com', 'api.fpjs.io',
    'iovation.com', 'mpsnare.iesnare.com',
    'threatmetrix.com', 'online-metrix.net',
    'maxmind.com', 'js.maxmind.com',
    'augur.io', 'client.augur.io',
    'perimeterx.com', 'perimeterx.net',
    'distilnetworks.com', 'd1lq13fjc4tnw6.cloudfront.net'
  ]),
  malware: new Set([
    'malwarebytes-.com', 'phishing-examples.xyz',
    'cdn.taboola.com.phish', 'tracking-virus.net'
  ])
};

// Flattened lookup: host (without www) → array of categories it belongs to
function matchCategory(host) {
  const h = host.replace(/^www\./, '').toLowerCase();
  for (const cat of Object.keys(BLOCKLIST)) {
    const set = BLOCKLIST[cat];
    // Walk up subdomain chain: foo.bar.example.com → bar.example.com → example.com
    let cur = h;
    while (cur) {
      if (set.has(cur)) return cat;
      const dot = cur.indexOf('.');
      if (dot === -1) break;
      cur = cur.slice(dot + 1);
    }
  }
  return null;
}

// URL tracking params to strip (before request)
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_name', 'utm_id', 'utm_source_platform', 'utm_creative_format',
  'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid', 'yclid',
  'igshid', 'mc_cid', 'mc_eid', '_hsenc', '_hsmi', 'hsCtaTracking',
  'oly_anon_id', 'oly_enc_id', 'wickedid', 'wt_mc', 'mkt_tok',
  'ga_source', 'ga_medium', 'ga_campaign', 'ref', 'referrer',
  's_cid', 'vero_conv', 'vero_id', 'pk_campaign', 'pk_kwd',
  '_openstat', 'action_object_map', 'action_type_map', 'action_ref_map',
  'fb_action_ids', 'fb_action_types', 'fb_source', 'fb_ref',
  'trk_contact', 'trk_msg', 'trk_module', 'trk_sid'
]);

function stripTrackingParams(urlStr) {
  try {
    const u = new URL(urlStr);
    let changed = false;
    const keysToDelete = [];
    u.searchParams.forEach((_, key) => {
      if (TRACKING_PARAMS.has(key) || /^utm_/i.test(key)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(k => { u.searchParams.delete(k); changed = true; });
    return changed ? u.toString() : null;
  } catch (e) { return null; }
}

// Hosts where HTTPS upgrade MUST be skipped (local / IP literals)
function isLocalHost(host) {
  return host === 'localhost' || host === '127.0.0.1' || host === '::1'
    || /^192\.168\./.test(host) || /^10\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)
    || /^\[/.test(host);
}

function getHostSafe(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch (e) { return ''; }
}

function getETLDPlus1(host) {
  // Simplified eTLD+1: take last two labels (sufficient for 3rd-party cookie detection in most cases)
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  return parts.slice(-2).join('.');
}

// Legacy arrays kept only for backward compatibility (no longer used)
const adBlockFilters = [];
const trackingBlockFilters = []; const _LEGACY_TRACKING_UNUSED = [
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

// Map category → privacySettings flag
const CATEGORY_TO_FLAG = {
  ads: 'blockAds',
  trackers: 'blockTrackers',
  analytics: 'blockTrackers', // analytics também conta como tracker
  social: 'blockSocial',
  crypto: 'blockCryptoMining',
  fingerprint: 'blockFingerprinting',
  malware: 'blockMalware'
};

function setupSessionBlocking(ses, windowId) {
  if (configuredSessions.has(ses)) return;
  configuredSessions.add(ses);

  // ---------- 1. onBeforeRequest: block, upgrade http→https, strip URL params ----------
  ses.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, (details, callback) => {
    const url = details.url;
    const host = getHostSafe(url);
    if (!host) return callback({});

    // HTTPS upgrade (only top-level navigations & subframes; skip local hosts)
    if (privacySettings.upgradeToHttps && url.startsWith('http://') && !isLocalHost(host)) {
      blockedStats.httpsUpgraded++;
      return callback({ redirectURL: 'https://' + url.slice(7) });
    }

    // Strip tracking params from top-level navigations
    if (privacySettings.stripTrackingParams && details.resourceType === 'mainFrame' && details.method === 'GET') {
      const cleaned = stripTrackingParams(url);
      if (cleaned && cleaned !== url) {
        blockedStats.paramsStripped++;
        return callback({ redirectURL: cleaned });
      }
    }

    // Categorized blocking
    const category = matchCategory(host);
    if (category) {
      const flag = CATEGORY_TO_FLAG[category];
      if (flag && privacySettings[flag]) {
        blockedStats[category] = (blockedStats[category] || 0) + 1;
        // Global counter (legacy) + per-window UI feedback
        if (windowId != null) {
          const c = (trackerCounts.get(windowId) || 0) + 1;
          trackerCounts.set(windowId, c);
          const win = BrowserWindow.fromId(windowId);
          if (win && !win.isDestroyed()) {
            win.webContents.send('tracker-blocked', { count: c, url, category });
          }
        }
        return callback({ cancel: true });
      }
    }

    callback({});
  });

  // ---------- 2. onBeforeSendHeaders: DNT, GPC, 3rd-party cookies, referrer ----------
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders };

    if (privacySettings.sendDNT) headers['DNT'] = '1';
    if (privacySettings.sendGPC) headers['Sec-GPC'] = '1';

    // Strip third-party cookies (compare request's eTLD+1 vs initiator origin)
    if (privacySettings.blockThirdPartyCookies && (headers['Cookie'] || headers['cookie'])) {
      try {
        const reqHost = getHostSafe(details.url);
        const reqBase = getETLDPlus1(reqHost);
        let initiatorHost = '';
        if (details.webContentsId != null) {
          const wc = require('electron').webContents.fromId(details.webContentsId);
          if (wc && !wc.isDestroyed()) {
            initiatorHost = getHostSafe(wc.getURL());
          }
        }
        if (initiatorHost) {
          const initiatorBase = getETLDPlus1(initiatorHost);
          if (initiatorBase && reqBase && initiatorBase !== reqBase) {
            delete headers['Cookie'];
            delete headers['cookie'];
            blockedStats.cookies++;
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Strict referrer: only send origin, not full path
    if (privacySettings.strictReferrer) {
      const ref = headers['Referer'] || headers['referer'];
      if (ref) {
        try {
          const u = new URL(ref);
          const originOnly = u.origin + '/';
          headers['Referer'] = originOnly;
          if (headers['referer']) headers['referer'] = originOnly;
        } catch (e) { /* ignore */ }
      }
    }

    callback({ requestHeaders: headers });
  });

  // ---------- 3. onHeadersReceived: strip Set-Cookie on 3rd-party, permissive CSP for chrome UI ----------
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    if (privacySettings.blockThirdPartyCookies) {
      try {
        const reqHost = getHostSafe(details.url);
        const reqBase = getETLDPlus1(reqHost);
        let initiatorHost = '';
        if (details.webContentsId != null) {
          const wc = require('electron').webContents.fromId(details.webContentsId);
          if (wc && !wc.isDestroyed()) {
            initiatorHost = getHostSafe(wc.getURL());
          }
        }
        if (initiatorHost) {
          const initiatorBase = getETLDPlus1(initiatorHost);
          if (initiatorBase && reqBase && initiatorBase !== reqBase) {
            delete responseHeaders['set-cookie'];
            delete responseHeaders['Set-Cookie'];
          }
        }
      } catch (e) { /* ignore */ }
    }

    callback({ responseHeaders });
  });
  
  // Permission request handler (camera, mic, geolocation, notifications)
  ses.setPermissionRequestHandler((webContents, permission, callback, details) => {
    if (!ALLOWED_PERMISSION_KEYS.has(permission)) return callback(false);

    const url = (details && details.requestingUrl) || webContents.getURL();
    const host = normalizeHost(getHostFromUrl(url));
    if (!host) return callback(false);

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
    if (!ALLOWED_PERMISSION_KEYS.has(permission)) return false;

    const host = normalizeHost(getHostFromUrl(requestingOrigin || (webContents && webContents.getURL()) || ''));
    if (!host) return false;

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
    backgroundColor: incognito ? '#1a0f1f' : '#0d0d10',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      // SECURITY: webSecurity on, no insecure content (chrome UI only)
      sandbox: false, // preload precisa de require
      webSecurity: true,
      allowRunningInsecureContent: false,
      partition: partition,
      backgroundThrottling: false,
      spellcheck: false,
      enableWebSQL: false,
      v8CacheOptions: 'bypassHeatCheck'
    },
    icon: appIcon
  });

  // Mark window as incognito for renderer
  win.isIncognito = incognito;

  // Notify renderer on maximize/unmaximize (to adjust CSS for frameless on Windows)
  win.on('maximize', () => {
    try { win.webContents.send('window-maximized', true); } catch (e) {}
  });
  win.on('unmaximize', () => {
    try { win.webContents.send('window-maximized', false); } catch (e) {}
  });

  // Cleanup: evitar acumulacao de entradas em trackerCounts
  win.on('closed', () => {
    trackerCounts.delete(win.id);
  });

  // Set taskbar icon explicitly (Windows)
  if (process.platform === 'win32') {
    win.setIcon(appIcon);
    app.setAppUserModelId('com.zerobrowser.app');
  }

  // Load the index.html
  win.loadFile(path.join(__dirname, 'renderer/index.html'), {
    query: incognito ? { incognito: '1' } : {}
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeExternalHttpUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (isRendererUiUrl(url)) return;
    event.preventDefault();
    if (isSafeExternalHttpUrl(url)) {
      shell.openExternal(url).catch(() => {});
    }
  });

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
  try {
    autoUpdater.quitAndInstall();
    return true;
  } catch (e) {
    console.error('quitAndInstall error:', e);
    return false;
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());

// Abre DevTools de um webview (por webContentsId) numa janela separada
ipcMain.handle('open-webview-devtools', (event, webContentsId) => {
  try {
    const { webContents } = require('electron');
    const wc = webContents.fromId(webContentsId);
    if (!wc) return false;
    if (wc.isDevToolsOpened()) {
      wc.closeDevTools();
    } else {
      wc.openDevTools({ mode: 'detach' });
    }
    return true;
  } catch (e) {
    console.error('open-webview-devtools error:', e);
    return false;
  }
});

// App ready
app.whenReady().then(async () => {
  loadPrivacySettings();
  loadSitePermissions();
  loadPersistedExtensions();
  loadDownloadHistory();
  setupDownloadHandler(session.defaultSession);
  setupAutoUpdater();

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-attach-webview', (event, webPreferences, params) => {
      delete webPreferences.preload;
      delete webPreferences.preloadURL;
      webPreferences.nodeIntegration = false;
      webPreferences.nodeIntegrationInSubFrames = false;
      webPreferences.nodeIntegrationInWorker = false;
      webPreferences.contextIsolation = true;
      webPreferences.sandbox = true;
      webPreferences.enableRemoteModule = false;
      webPreferences.webSecurity = true;
      webPreferences.allowRunningInsecureContent = false;

      if (!isAllowedWebviewUrl(params && params.src)) {
        event.preventDefault();
      }
    });

    if (contents.getType() === 'webview') {
      contents.setWindowOpenHandler(({ url, disposition }) => {
        if (!isSafeExternalHttpUrl(url)) return { action: 'deny' };

        const host = contents.hostWebContents;
        if (host && !host.isDestroyed()) {
          host.send('open-url-in-new-tab', {
            url,
            background: disposition === 'background-tab'
          });
          return { action: 'deny' };
        }

        shell.openExternal(url).catch(() => {});
        return { action: 'deny' };
      });
    }
  });

  // Telemetria Discord (install/heartbeat — anónimo)
  runTelemetry();
  startRealtimePresenceTelemetry();

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

// ==========================================
// Backup / Restore (exporta e importa todos os dados locais)
// ==========================================
function readJsonSafe(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return fallback; }
}

ipcMain.handle('export-user-data', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: 'Exportar dados do Zero Browser',
      defaultPath: `zerobrowser-backup-${new Date().toISOString().slice(0, 10)}.json`,
      filters: [{ name: 'Zero Browser Backup', extensions: ['json'] }]
    });
    if (canceled || !filePath) return { ok: false, canceled: true };

    const payload = {
      app: 'ZeroBrowser',
      version: app.getVersion(),
      exportedAt: new Date().toISOString(),
      data: {
        bookmarks: readJsonSafe(bookmarksPath, []),
        history: readJsonSafe(historyPath, []),
        sitePermissions: readJsonSafe(permissionsPath, {}),
        extensions: readJsonSafe(extensionsConfigPath, []),
        downloads: readJsonSafe(downloadsHistoryPath, []),
        stats: readJsonSafe(statsPath, {})
      }
    };

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    return { ok: true, filePath };
  } catch (e) {
    console.error('export-user-data error:', e);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('import-user-data', async (event) => {
  try {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Importar dados do Zero Browser',
      filters: [{ name: 'Zero Browser Backup', extensions: ['json'] }],
      properties: ['openFile']
    });
    if (canceled || !filePaths || !filePaths[0]) return { ok: false, canceled: true };

    const raw = fs.readFileSync(filePaths[0], 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.app !== 'ZeroBrowser' || !parsed.data) {
      return { ok: false, error: 'Ficheiro inválido' };
    }
    const d = parsed.data;

    if (Array.isArray(d.bookmarks))  fs.writeFileSync(bookmarksPath, JSON.stringify(d.bookmarks, null, 2));
    if (Array.isArray(d.history))    fs.writeFileSync(historyPath, JSON.stringify(d.history, null, 2));
    if (d.sitePermissions && typeof d.sitePermissions === 'object') {
      fs.writeFileSync(permissionsPath, JSON.stringify(d.sitePermissions, null, 2));
      sitePermissions = d.sitePermissions;
    }
    if (Array.isArray(d.extensions)) fs.writeFileSync(extensionsConfigPath, JSON.stringify(d.extensions, null, 2));
    if (Array.isArray(d.downloads)) {
      downloadHistory = d.downloads;
      saveDownloadHistory();
    }
    if (d.stats && typeof d.stats === 'object') {
      fs.writeFileSync(statsPath, JSON.stringify(d.stats, null, 2));
    }

    return { ok: true, filePath: filePaths[0] };
  } catch (e) {
    console.error('import-user-data error:', e);
    return { ok: false, error: e.message };
  }
});

ipcMain.handle('open-user-data-folder', () => {
  try { shell.openPath(userDataPath); return true; } catch (e) { return false; }
});

ipcMain.handle('create-incognito-window', async () => {
  const win = createWindow({ incognito: true });
  return win.id;
});

ipcMain.handle('is-incognito', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? !!win.isIncognito : false;
});

// ==========================================
// Privacy settings IPC
// ==========================================
ipcMain.handle('privacy-get-settings', () => {
  return { ...privacySettings };
});

ipcMain.handle('privacy-set-settings', (_event, updates) => {
  if (!updates || typeof updates !== 'object') return { ok: false };
  // Only accept known keys
  for (const k of Object.keys(updates)) {
    if (k in DEFAULT_PRIVACY_SETTINGS) {
      privacySettings[k] = !!updates[k];
    }
  }
  savePrivacySettings();
  return { ok: true, settings: { ...privacySettings } };
});

ipcMain.handle('privacy-reset-settings', () => {
  privacySettings = { ...DEFAULT_PRIVACY_SETTINGS };
  savePrivacySettings();
  return { ...privacySettings };
});

ipcMain.handle('privacy-get-stats', () => {
  return { ...blockedStats };
});

ipcMain.handle('privacy-reset-stats', () => {
  for (const k of Object.keys(blockedStats)) blockedStats[k] = 0;
  return { ...blockedStats };
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
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return false;
  if (!ALLOWED_PERMISSION_KEYS.has(permission)) return false;
  if (!ALLOWED_PERMISSION_VALUES.has(value || 'ask')) return false;

  if (!sitePermissions[normalizedHost]) sitePermissions[normalizedHost] = {};
  if (value === 'ask' || !value) {
    delete sitePermissions[normalizedHost][permission];
    if (Object.keys(sitePermissions[normalizedHost]).length === 0) delete sitePermissions[normalizedHost];
  } else {
    sitePermissions[normalizedHost][permission] = value;
  }
  saveSitePermissions();
  return true;
});

ipcMain.handle('clear-site-permissions', (event, host) => {
  if (host) {
    const normalizedHost = normalizeHost(host);
    if (!normalizedHost) return false;
    delete sitePermissions[normalizedHost];
  } else sitePermissions = Object.create(null);
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

ipcMain.handle('set-default-browser', async () => {
  const didRegister = registerAsDefaultBrowser();
  if (!didRegister) return false;
  return isDefaultBrowserRegistered();
});

ipcMain.handle('is-default-browser', async () => {
  return isDefaultBrowserRegistered();
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
