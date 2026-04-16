// Tab Management
let tabs = [];
let activeTabId = null;
let closedTabs = []; // Store closed tabs for reopening
let zoomLevel = 1.0;

// DOM Elements
const tabsContainer = document.getElementById('tabsContainer');
const newTabBtn = document.getElementById('newTabBtn');
const webviewContainer = document.getElementById('webviewContainer');
const urlBar = document.getElementById('urlBar');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const homeBtn = document.getElementById('homeBtn');
const bookmarkBtn = document.getElementById('bookmarkBtn');
const bookmarksBtn = document.getElementById('bookmarksBtn');
const historyBtn = document.getElementById('historyBtn');
const menuBtn = document.getElementById('menuBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const downloadsBtn = document.getElementById('downloadsBtn');
const notesBtn = document.getElementById('notesBtn');
const todoBtn = document.getElementById('todoBtn');
const bookmarksBar = document.getElementById('bookmarksBar');
const bookmarksBarContent = document.getElementById('bookmarksBarContent');

// Modals
const bookmarksModal = document.getElementById('bookmarksModal');
const historyModal = document.getElementById('historyModal');
const downloadsModal = document.getElementById('downloadsModal');
const notesModal = document.getElementById('notesModal');
const todoModal = document.getElementById('todoModal');
const closeBookmarksModal = document.getElementById('closeBookmarksModal');
const closeHistoryModal = document.getElementById('closeHistoryModal');
const closeDownloadsModal = document.getElementById('closeDownloadsModal');
const closeNotesModal = document.getElementById('closeNotesModal');
const closeTodoModal = document.getElementById('closeTodoModal');
const bookmarksList = document.getElementById('bookmarksList');
const historyList = document.getElementById('historyList');
const downloadsList = document.getElementById('downloadsList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const notesTextarea = document.getElementById('notesTextarea');
const saveNotesBtn = document.getElementById('saveNotesBtn');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');

// Context menu
const contextMenu = document.getElementById('contextMenu');
const ctxDuplicate = document.getElementById('ctxDuplicate');
const ctxClose = document.getElementById('ctxClose');
const ctxCloseOthers = document.getElementById('ctxCloseOthers');
const ctxCloseAll = document.getElementById('ctxCloseAll');
const ctxReload = document.getElementById('ctxReload');
const ctxMute = document.getElementById('ctxMute');
const ctxCopyUrl = document.getElementById('ctxCopyUrl');

// Find bar
const findBar = document.getElementById('findBar');
const findInput = document.getElementById('findInput');
const findCounter = document.getElementById('findCounter');
const findPrev = document.getElementById('findPrev');
const findNext = document.getElementById('findNext');
const findClose = document.getElementById('findClose');

// Password manager
const passwordsBtn = document.getElementById('passwordsBtn');
const passwordsModal = document.getElementById('passwordsModal');
const closePasswordsModal = document.getElementById('closePasswordsModal');
const passwordsList = document.getElementById('passwordsList');
const pwSite = document.getElementById('pwSite');
const pwUser = document.getElementById('pwUser');
const pwPass = document.getElementById('pwPass');
const pwAddBtn = document.getElementById('pwAddBtn');

// Security indicator
const securityIndicator = document.getElementById('securityIndicator');
const securityText = document.getElementById('securityText');

// Fullscreen
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Loading bar
const loadingBar = document.getElementById('loadingBar');

// Settings
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const bookmarksBarEl = document.getElementById('bookmarksBar');

// Default settings
const defaultSettings = {
  theme: 'dark',
  showBookmarksBar: true,
  animations: true,
  searchEngine: 'google',
  suggestions: true,
  adblock: true,
  trackers: true,
  dnt: true,
  clearOnExit: false,
  homepage: 'default',
  restoreTabs: false,
  askDownload: false
};

let settings = { ...defaultSettings };

// Search engines
const searchEngines = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  brave: 'https://search.brave.com/search?q=',
  startpage: 'https://www.startpage.com/do/search?q='
};

// Context menu target
let contextMenuTabId = null;

// Homepage HTML
const homepageHTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zero Browser</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #ffffff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      position: relative;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    
    /* Animated gradient background */
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: 
        radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(139, 92, 246, 0.12) 0%, transparent 40%),
        radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%);
      z-index: 0;
      animation: gradientShift 15s ease-in-out infinite;
    }
    
    @keyframes gradientShift {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      50% { transform: translate(5%, -5%) rotate(3deg); }
    }
    
    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 720px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .logo-wrapper {
      margin-bottom: 48px;
      text-align: center;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .logo-img {
      width: 180px;
      height: 180px;
      margin-bottom: 20px;
      filter: drop-shadow(0 12px 32px rgba(99, 102, 241, 0.3));
      animation: logoFloat 4s ease-in-out infinite;
    }
    
    @keyframes logoFloat {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }
    
    .logo {
      font-size: 44px;
      font-weight: 700;
      background: linear-gradient(135deg, #ffffff 0%, #b4b4c7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 8px;
      letter-spacing: -1.2px;
      line-height: 1;
    }
    
    .logo-subtitle {
      font-size: 14px;
      color: #7a7a8c;
      font-weight: 500;
      letter-spacing: 0.02em;
    }
    
    .search-container {
      width: 100%;
      max-width: 600px;
      position: relative;
      margin-bottom: 48px;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s backwards;
    }
    
    .search-icon {
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      color: #7a7a8c;
      pointer-events: none;
    }
    
    .search-input {
      width: 100%;
      padding: 18px 24px 18px 52px;
      font-size: 15px;
      background: rgba(26, 26, 36, 0.6);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      color: #ffffff;
      outline: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
    }
    
    .search-input:hover {
      background: rgba(34, 34, 46, 0.7);
      border-color: rgba(255, 255, 255, 0.12);
    }
    
    .search-input:focus {
      border-color: #6366f1;
      background: rgba(34, 34, 46, 0.8);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
    }
    
    .search-input::placeholder {
      color: #4a4a5c;
    }
    
    .quick-links {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 12px;
      width: 100%;
      margin-bottom: 56px;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s backwards;
    }
    
    .quick-link {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 18px 12px;
      background: rgba(26, 26, 36, 0.5);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      text-decoration: none;
    }
    
    .quick-link:hover {
      background: rgba(34, 34, 46, 0.8);
      border-color: rgba(255, 255, 255, 0.12);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
    
    .quick-link-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 10px;
      font-size: 17px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.5px;
    }
    
    .ql-google { background: linear-gradient(135deg, #4285f4, #34a853); }
    .ql-youtube { background: linear-gradient(135deg, #ff0000, #cc0000); }
    .ql-github { background: linear-gradient(135deg, #333333, #000000); border: 1px solid rgba(255,255,255,0.2); }
    .ql-twitter { background: linear-gradient(135deg, #1da1f2, #0d8bd9); }
    .ql-reddit { background: linear-gradient(135deg, #ff4500, #ff6314); }
    .ql-linkedin { background: linear-gradient(135deg, #0077b5, #00669c); }
    
    .quick-link-title {
      font-size: 11.5px;
      font-weight: 500;
      color: #b4b4c7;
    }
    
    .stats {
      display: flex;
      gap: 48px;
      padding: 20px 32px;
      background: rgba(26, 26, 36, 0.4);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s backwards;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-value {
      font-size: 22px;
      font-weight: 700;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 4px;
    }
    
    .stat-label {
      font-size: 11px;
      color: #7a7a8c;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .stat-divider {
      width: 1px;
      background: rgba(255, 255, 255, 0.08);
    }
    
    @media (max-width: 640px) {
      .quick-links { grid-template-columns: repeat(3, 1fr); }
      .logo { font-size: 44px; }
      .stats { gap: 24px; padding: 16px 20px; flex-wrap: wrap; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-wrapper">
      <img class="logo-img" src="{{LOGO}}" alt="Zero Browser">
      <div class="logo">Zero Browser</div>
      <div class="logo-subtitle">Rápido · Privado · Sem rastreadores</div>
    </div>
    
    <div class="search-container">
      <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" class="search-input" placeholder="Pesquisar na web ou digitar URL" id="searchInput" autofocus>
    </div>
    
    <div class="quick-links">
      <div class="quick-link" data-url="https://www.google.com">
        <div class="quick-link-icon ql-google">G</div>
        <div class="quick-link-title">Google</div>
      </div>
      <div class="quick-link" data-url="https://www.youtube.com">
        <div class="quick-link-icon ql-youtube">▶</div>
        <div class="quick-link-title">YouTube</div>
      </div>
      <div class="quick-link" data-url="https://github.com">
        <div class="quick-link-icon ql-github">GH</div>
        <div class="quick-link-title">GitHub</div>
      </div>
      <div class="quick-link" data-url="https://twitter.com">
        <div class="quick-link-icon ql-twitter">𝕏</div>
        <div class="quick-link-title">Twitter</div>
      </div>
      <div class="quick-link" data-url="https://www.reddit.com">
        <div class="quick-link-icon ql-reddit">R</div>
        <div class="quick-link-title">Reddit</div>
      </div>
      <div class="quick-link" data-url="https://www.linkedin.com">
        <div class="quick-link-icon ql-linkedin">in</div>
        <div class="quick-link-title">LinkedIn</div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-value">70+</div>
        <div class="stat-label">Trackers Bloqueados</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">100%</div>
        <div class="stat-label">Privado</div>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-value">0</div>
        <div class="stat-label">Telemetria</div>
      </div>
    </div>
  </div>

  <script>
    const searchInput = document.getElementById('searchInput');
    const quickLinks = document.querySelectorAll('.quick-link');

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          let url = query;
          if (!query.startsWith('http://') && !query.startsWith('https://')) {
            if (query.includes('.') && !query.includes(' ')) {
              url = 'https://' + query;
            } else {
              url = 'https://www.google.com/search?q=' + encodeURIComponent(query);
            }
          }
          window.location.href = url;
        }
      }
    });

    quickLinks.forEach(link => {
      link.addEventListener('click', () => {
        window.location.href = link.dataset.url;
      });
    });

    searchInput.focus();
  </script>
</body>
</html>
`;

// Logo data URL (loaded async from main process)
let logoDataUrl = '';

function getHomepageUrl() {
  const html = homepageHTML.replace(/{{LOGO}}/g, logoDataUrl || '');
  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
}

// Initialize
async function init() {
  // Load logo first
  try {
    if (window.electronAPI && window.electronAPI.getLogo) {
      logoDataUrl = await window.electronAPI.getLogo() || '';
    }
  } catch (e) {
    console.error('Failed to load logo:', e);
  }
  // Apply logo to about modal
  const aboutLogoImg = document.getElementById('aboutLogoImg');
  if (aboutLogoImg && logoDataUrl) aboutLogoImg.src = logoDataUrl;
  
  loadSettings();
  createNewTab();
  setupEventListeners();
  setupKeyboardShortcuts();
  setupSettingsListeners();
  setupFeatureListeners();
  loadBookmarksBar();
}

// Create new tab
function createNewTab(url = null) {
  const tabId = Date.now();
  const webview = document.createElement('webview');
  webview.setAttribute('allowpopups', 'true');
  webview.setAttribute('webpreferences', 'contextIsolation=no, nodeIntegration=yes');
  
  const tab = {
    id: tabId,
    title: 'Nova Aba',
    url: url || getHomepageUrl(),
    isLoading: false,
    webview: webview,
    muted: false,
    audible: false
  };
  
  // Add webview event listeners
  setupWebviewEvents(webview, tab);
  
  webviewContainer.appendChild(webview);
  tabs.push(tab);
  renderTabs();
  switchToTab(tabId);
  
  if (url) {
    navigateTo(url);
  }
}

// Render tabs
function renderTabs() {
  tabsContainer.innerHTML = '';

  tabs.forEach(tab => {
    const tabElement = document.createElement('div');
    tabElement.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
    tabElement.dataset.tabId = tab.id;

    const audioIcon = tab.muted
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';

    const audioIndicator = (tab.audible || tab.muted)
      ? `<span class="tab-audio ${tab.muted ? 'muted' : ''}" data-tab-id="${tab.id}" title="${tab.muted ? 'Reativar som' : 'Silenciar aba'}">${audioIcon}</span>`
      : '';

    tabElement.innerHTML = `
      ${tab.isLoading ? '<div class="tab-loading"></div>' : ''}
      ${audioIndicator}
      <span class="tab-title">${tab.title}</span>
      <button class="tab-close" title="Fechar aba">&times;</button>
    `;

    tabElement.addEventListener('click', (e) => {
      if (e.target.closest('.tab-audio')) {
        e.stopPropagation();
        toggleMuteTab(tab.id);
        return;
      }
      if (!e.target.classList.contains('tab-close')) {
        switchToTab(tab.id);
      }
    });

    // Middle click (scroll wheel) closes the tab
    tabElement.addEventListener('mousedown', (e) => {
      if (e.button === 1) {
        e.preventDefault();
        closeTab(tab.id);
      }
    });

    // Prevent default middle-click autoscroll
    tabElement.addEventListener('auxclick', (e) => {
      if (e.button === 1) e.preventDefault();
    });

    // Add context menu
    tabElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showContextMenu(e, tab.id);
    });

    const closeBtn = tabElement.querySelector('.tab-close');
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id);
    });

    tabsContainer.appendChild(tabElement);
  });
}

// Setup webview events
function setupWebviewEvents(webview, tab) {
  webview.addEventListener('did-start-loading', () => {
    if (tab.id === activeTabId) {
      tab.isLoading = true;
      renderTabs();
      showLoadingBar();
    }
  });

  webview.addEventListener('did-stop-loading', () => {
    if (tab.id === activeTabId) {
      tab.isLoading = false;
      tab.url = webview.src;
      tab.lastActive = Date.now();
      urlBar.value = webview.src;
      updateBookmarkButton(webview.src);
      updateSecurityIndicator(webview.src);
      renderTabs();
      hideLoadingBar();

      // Add to history (not in incognito)
      if (!webview.src.startsWith('data:') && !isIncognitoWindow()) {
        addToHistory(webview.src, tab.title);
      }
      
      // Auto-detect language for translate
      if (typeof detectAndPromptTranslate === 'function') {
        setTimeout(() => detectAndPromptTranslate(tab), 500);
      }
    }
  });

  webview.addEventListener('did-navigate', (e) => {
    if (tab.id === activeTabId) {
      tab.url = e.url;
      urlBar.value = e.url;
      updateBookmarkButton(e.url);
      updateSecurityIndicator(e.url);
    }
  });

  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title;
    if (tab.id === activeTabId) {
      renderTabs();
    }
  });

  webview.addEventListener('did-fail-load', (e) => {
    console.error('Failed to load:', e.errorDescription, e.errorCode, e.validatedURL);
  });

  // Audio state change
  webview.addEventListener('media-started-playing', () => {
    tab.audible = true;
    renderTabs();
  });

  webview.addEventListener('media-paused', () => {
    tab.audible = false;
    renderTabs();
  });

  // Inject scripts on dom-ready (auto-scroll, scroll-to-top, auto-fill)
  webview.addEventListener('dom-ready', () => {
    try {
      injectWebviewScripts(webview);
    } catch (e) { console.error('inject error', e); }
  });
  
  // Listen for ipc messages from injected scripts (auto-fill requests)
  webview.addEventListener('ipc-message', (e) => {
    if (e.channel === 'autofill-request') {
      handleAutofillRequest(webview, e.args[0]);
    }
  });

  // Found in page
  webview.addEventListener('found-in-page', (e) => {
    if (tab.id === activeTabId && findCounter) {
      findCounter.textContent = `${e.result.activeMatchOrdinal || 0}/${e.result.matches || 0}`;
    }
  });

  // Set initial URL
  webview.src = tab.url;
}

// Switch to tab
function switchToTab(tabId) {
  activeTabId = tabId;
  const tab = tabs.find(t => t.id === tabId);
  
  if (tab) {
    tab.lastActive = Date.now();
    // Wake up if sleeping
    if (tab.sleeping && typeof wakeTab === 'function') {
      wakeTab(tab);
    }
    // Hide all webviews
    tabs.forEach(t => {
      if (t.webview) {
        t.webview.classList.remove('active');
      }
    });
    
    // Show current webview
    if (tab.webview) {
      tab.webview.classList.add('active');
    }
    
    urlBar.value = tab.url === getHomepageUrl() || tab.url.startsWith('data:text/html') ? '' : tab.url;
    updateBookmarkButton(tab.url);
    updateSecurityIndicator(tab.url);
    renderTabs();
  }
}

// Close tab
function closeTab(tabId) {
  if (tabs.length === 1) {
    // Don't close the last tab, just reset it
    const tab = tabs[0];
    tab.url = getHomepageUrl();
    tab.title = 'Nova Aba';
    if (tab.webview) {
      tab.webview.src = tab.url;
    }
    urlBar.value = '';
    renderTabs();
    return;
  }

  const index = tabs.findIndex(t => t.id === tabId);
  if (index > -1) {
    const closedTab = tabs[index];
    // Store closed tab for reopening (max 10)
    closedTabs.unshift({ ...closedTab });
    if (closedTabs.length > 10) {
      closedTabs.pop();
    }
    
    // Remove webview from DOM
    if (closedTab.webview) {
      webviewContainer.removeChild(closedTab.webview);
    }
    
    tabs.splice(index, 1);
    
    if (activeTabId === tabId) {
      const newIndex = Math.max(0, index - 1);
      switchToTab(tabs[newIndex].id);
    } else {
      renderTabs();
    }
  }
}

// Reopen closed tab
function reopenClosedTab() {
  if (closedTabs.length === 0) return;
  
  const lastClosed = closedTabs.shift();
  createNewTab(lastClosed.url);
}

// Duplicate tab
function duplicateTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (tab) {
    createNewTab(tab.url);
  }
}

// Close other tabs
function closeOtherTabs(tabId) {
  const tabToKeep = tabs.find(t => t.id === tabId);
  if (!tabToKeep) return;

  tabs.forEach(tab => {
    if (tab.id !== tabId) {
      closeTab(tab.id);
    }
  });
}

// Close all tabs
function closeAllTabs() {
  while (tabs.length > 1) {
    closeTab(tabs[tabs.length - 1].id);
  }
}

// Show context menu
function showContextMenu(e, tabId) {
  contextMenuTabId = tabId;
  contextMenu.style.left = `${e.clientX}px`;
  contextMenu.style.top = `${e.clientY}px`;
  contextMenu.classList.add('active');
}

// Hide context menu
function hideContextMenu() {
  contextMenu.classList.remove('active');
  contextMenuTabId = null;
}

// Update security indicator
function updateSecurityIndicator(url) {
  if (!url || url.startsWith('data:')) {
    securityIndicator.className = 'security-indicator';
    securityText.textContent = '-';
    return;
  }

  if (url.startsWith('https://')) {
    securityIndicator.className = 'security-indicator secure';
    securityText.textContent = 'Seguro';
  } else {
    securityIndicator.className = 'security-indicator insecure';
    securityText.textContent = 'Não seguro';
  }
}

// Toggle fullscreen
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// Show/hide loading bar
function showLoadingBar() {
  loadingBar.classList.add('active');
}

function hideLoadingBar() {
  loadingBar.classList.remove('active');
}

// Zoom functions
function zoomIn() {
  zoomLevel = Math.min(zoomLevel + 0.1, 3.0);
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    tab.webview.setZoomFactor(zoomLevel);
  }
}

function zoomOut() {
  zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    tab.webview.setZoomFactor(zoomLevel);
  }
}

function resetZoom() {
  zoomLevel = 1.0;
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    tab.webview.setZoomFactor(zoomLevel);
  }
}

// Navigate to URL
function navigateTo(url) {
  if (!url) return;

  // Check if it's a URL or search query
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      const engineUrl = searchEngines[settings.searchEngine] || searchEngines.google;
      url = engineUrl + encodeURIComponent(url);
    }
  }

  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    tab.url = url;
    tab.isLoading = true;
    tab.webview.src = url;
    urlBar.value = url;
    renderTabs();
  }
}

// Update tab title
function updateTabTitle(title) {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.title = title || 'Nova Aba';
    renderTabs();
  }
}

// Setup event listeners
function setupEventListeners() {
  // New tab button
  newTabBtn.addEventListener('click', () => createNewTab());
  
  // URL bar
  urlBar.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      navigateTo(urlBar.value);
    }
  });
  
  // Navigation buttons
  backBtn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.webview) {
      tab.webview.goBack();
    }
  });
  
  forwardBtn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.webview) {
      tab.webview.goForward();
    }
  });
  
  reloadBtn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.webview) {
      tab.webview.reload();
    }
  });
  
  homeBtn.addEventListener('click', () => {
    const homepageUrl = getHomepageUrl();
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.webview) {
      tab.url = homepageUrl;
      tab.title = 'Zero Browser';
      tab.webview.src = homepageUrl;
      urlBar.value = '';
      renderTabs();
    }
  });
  
  // Bookmark button
  bookmarkBtn.addEventListener('click', async () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab || !tab.webview) return;

    const currentUrl = tab.webview.src;
    const currentTitle = tab.title || 'Sem título';

    if (currentUrl && !currentUrl.startsWith('data:')) {
      const bookmark = {
        id: Date.now(),
        title: currentTitle,
        url: currentUrl,
        date: new Date().toISOString()
      };

      await window.electronAPI.saveBookmark(bookmark);
      bookmarkBtn.classList.add('bookmarked');
      loadBookmarksBar();
    }
  });
  
  // Bookmarks modal
  bookmarksBtn.addEventListener('click', () => {
    loadBookmarks();
    bookmarksModal.classList.add('active');
  });
  
  closeBookmarksModal.addEventListener('click', () => {
    bookmarksModal.classList.remove('active');
  });
  
  bookmarksModal.addEventListener('click', (e) => {
    if (e.target === bookmarksModal) {
      bookmarksModal.classList.remove('active');
    }
  });
  
  // History modal
  historyBtn.addEventListener('click', () => {
    loadHistory();
    historyModal.classList.add('active');
  });
  
  closeHistoryModal.addEventListener('click', () => {
    historyModal.classList.remove('active');
  });
  
  historyModal.addEventListener('click', (e) => {
    if (e.target === historyModal) {
      historyModal.classList.remove('active');
    }
  });
  
  clearHistoryBtn.addEventListener('click', async () => {
    await window.electronAPI.clearHistory();
    loadHistory();
  });
  
  
  // Zoom buttons
  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);

  // Fullscreen button
  fullscreenBtn.addEventListener('click', toggleFullscreen);

  // Context menu items
  ctxDuplicate.addEventListener('click', () => {
    if (contextMenuTabId) {
      duplicateTab(contextMenuTabId);
    }
    hideContextMenu();
  });

  ctxClose.addEventListener('click', () => {
    if (contextMenuTabId) {
      closeTab(contextMenuTabId);
    }
    hideContextMenu();
  });

  ctxCloseOthers.addEventListener('click', () => {
    if (contextMenuTabId) {
      closeOtherTabs(contextMenuTabId);
    }
    hideContextMenu();
  });

  ctxCloseAll.addEventListener('click', () => {
    closeAllTabs();
    hideContextMenu();
  });

  ctxReload.addEventListener('click', () => {
    if (contextMenuTabId === activeTabId) {
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab && tab.webview) {
        tab.webview.reload();
      }
    }
    hideContextMenu();
  });

  // Hide context menu on click outside
  document.addEventListener('click', (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // Downloads button
  downloadsBtn.addEventListener('click', () => {
    downloadsModal.classList.add('active');
    loadDownloads();
  });

  closeDownloadsModal.addEventListener('click', () => {
    downloadsModal.classList.remove('active');
  });

  downloadsModal.addEventListener('click', (e) => {
    if (e.target === downloadsModal) {
      downloadsModal.classList.remove('active');
    }
  });

  // Notes button
  notesBtn.addEventListener('click', () => {
    loadNotes();
    notesModal.classList.add('active');
  });

  closeNotesModal.addEventListener('click', () => {
    notesModal.classList.remove('active');
  });

  notesModal.addEventListener('click', (e) => {
    if (e.target === notesModal) {
      notesModal.classList.remove('active');
    }
  });

  saveNotesBtn.addEventListener('click', saveNotes);

  // Todo button
  todoBtn.addEventListener('click', () => {
    loadTodos();
    todoModal.classList.add('active');
  });

  closeTodoModal.addEventListener('click', () => {
    todoModal.classList.remove('active');
  });

  todoModal.addEventListener('click', (e) => {
    if (e.target === todoModal) {
      todoModal.classList.remove('active');
    }
  });

  addTodoBtn.addEventListener('click', addTodo);
  todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  });

}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+T - New tab
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      createNewTab();
    }

    // Ctrl+W - Close tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      closeTab(activeTabId);
    }

    // Ctrl+Shift+T - Reopen closed tab
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      reopenClosedTab();
    }

    // Ctrl+L - Focus URL bar
    if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      urlBar.focus();
      urlBar.select();
    }

    // Ctrl+D - Duplicate tab
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      duplicateTab(activeTabId);
    }

    // Ctrl++ or Ctrl+= - Zoom in
    if (e.ctrlKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      zoomIn();
    }

    // Ctrl+- - Zoom out
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomOut();
    }

    // Ctrl+0 - Reset zoom
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      resetZoom();
    }

    // F11 - Fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }

    // F12 - DevTools
    if (e.key === 'F12') {
      e.preventDefault();
      toggleDevTools();
    }

    // Ctrl+F - Find in page
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      openFindBar();
    }

    // Ctrl+U - View source
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      viewSource();
    }

    // Ctrl+P - Print
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      printPage();
    }

    // Ctrl+Shift+C - Copy URL
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyCurrentUrl();
    }

    // Escape - Exit fullscreen, close find bar or close modals
    if (e.key === 'Escape') {
      if (findActive) {
        closeFindBar();
        return;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      bookmarksModal.classList.remove('active');
      historyModal.classList.remove('active');
      downloadsModal.classList.remove('active');
      notesModal.classList.remove('active');
      todoModal.classList.remove('active');
      if (settingsModal) settingsModal.classList.remove('active');
      if (passwordsModal) passwordsModal.classList.remove('active');
      hideContextMenu();
    }
  });
}

// Update bookmark button state
async function updateBookmarkButton(url) {
  if (!url || url.startsWith('data:')) {
    bookmarkBtn.classList.remove('bookmarked');
    return;
  }
  
  const bookmarks = await window.electronAPI.getBookmarks();
  const isBookmarked = bookmarks.some(b => b.url === url);
  
  if (isBookmarked) {
    bookmarkBtn.classList.add('bookmarked');
  } else {
    bookmarkBtn.classList.remove('bookmarked');
  }
}

// Load bookmarks
async function loadBookmarks() {
  const bookmarks = await window.electronAPI.getBookmarks();

  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
        </svg>
        <p>Nenhum favorito salvo</p>
      </div>
    `;
    loadBookmarksBar();
    return;
  }

  bookmarksList.innerHTML = bookmarks.map(bookmark => `
    <div class="bookmark-item" data-url="${bookmark.url}">
      <div class="item-icon">${bookmark.title.charAt(0).toUpperCase()}</div>
      <div class="item-content">
        <div class="item-title">${bookmark.title}</div>
        <div class="item-url">${bookmark.url}</div>
      </div>
      <button class="item-delete" data-id="${bookmark.id}">&times;</button>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.bookmark-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('item-delete')) {
        navigateTo(item.dataset.url);
        bookmarksModal.classList.remove('active');
      }
    });
  });

  document.querySelectorAll('.item-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const bookmarkId = parseInt(btn.dataset.id);
      await window.electronAPI.deleteBookmark(bookmarkId);
      loadBookmarks();
    });
  });

  loadBookmarksBar();
}

// Load history
async function loadHistory() {
  const history = await window.electronAPI.getHistory();
  
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <p>Nenhum histórico disponível</p>
      </div>
    `;
    return;
  }
  
  historyList.innerHTML = history.slice(0, 50).map(item => `
    <div class="history-item" data-url="${item.url}">
      <div class="item-icon">${item.title.charAt(0).toUpperCase()}</div>
      <div class="item-content">
        <div class="item-title">${item.title}</div>
        <div class="item-url">${item.url}</div>
        <div class="item-date">${new Date(item.date).toLocaleString('pt-BR')}</div>
      </div>
    </div>
  `).join('');
  
  // Add click handlers
  document.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.url);
      historyModal.classList.remove('active');
    });
  });
}

// Add to history
async function addToHistory(url, title) {
  const historyItem = {
    url: url,
    title: title || 'Sem título',
    date: new Date().toISOString()
  };

  await window.electronAPI.addHistory(historyItem);
}

// Load bookmarks bar
async function loadBookmarksBar() {
  const bookmarks = await window.electronAPI.getBookmarks();
  
  if (bookmarks.length === 0) {
    bookmarksBarContent.innerHTML = '<span style="color: #666666; font-size: 12px; padding: 4px 10px;">Nenhum favorito</span>';
    return;
  }

  bookmarksBarContent.innerHTML = bookmarks.slice(0, 10).map(bookmark => `
    <div class="bookmark-bar-item" data-url="${bookmark.url}">
      ${bookmark.title}
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.bookmark-bar-item').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.dataset.url);
    });
  });
}

// Notes functions
async function loadNotes() {
  const notes = localStorage.getItem('zero-browser-notes') || '';
  notesTextarea.value = notes;
}

async function saveNotes() {
  const notes = notesTextarea.value;
  localStorage.setItem('zero-browser-notes', notes);
  alert('Notas salvas com sucesso!');
}

// Todo functions
async function loadTodos() {
  const todos = JSON.parse(localStorage.getItem('zero-browser-todos') || '[]');
  renderTodos(todos);
}

function renderTodos(todos) {
  if (todos.length === 0) {
    todoList.innerHTML = '<p style="color: #666666; text-align: center; padding: 20px;">Nenhuma tarefa</p>';
    return;
  }

  todoList.innerHTML = todos.map(todo => `
    <div class="todo-item" data-id="${todo.id}">
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
      <button class="todo-delete">&times;</button>
    </div>
  `).join('');

  // Add event handlers
  document.querySelectorAll('.todo-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const todoItem = e.target.closest('.todo-item');
      toggleTodo(parseInt(todoItem.dataset.id));
    });
  });

  document.querySelectorAll('.todo-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const todoItem = e.target.closest('.todo-item');
      deleteTodo(parseInt(todoItem.dataset.id));
    });
  });
}

async function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;

  const todos = JSON.parse(localStorage.getItem('zero-browser-todos') || '[]');
  todos.push({
    id: Date.now(),
    text: text,
    completed: false
  });

  localStorage.setItem('zero-browser-todos', JSON.stringify(todos));
  todoInput.value = '';
  loadTodos();
}

async function toggleTodo(id) {
  const todos = JSON.parse(localStorage.getItem('zero-browser-todos') || '[]');
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    localStorage.setItem('zero-browser-todos', JSON.stringify(todos));
    loadTodos();
  }
}

async function deleteTodo(id) {
  const todos = JSON.parse(localStorage.getItem('zero-browser-todos') || '[]');
  const filtered = todos.filter(t => t.id !== id);
  localStorage.setItem('zero-browser-todos', JSON.stringify(filtered));
  loadTodos();
}

// ========================================
// Download Manager
// ========================================
let downloadsState = { active: [], history: [] };
let downloadsSearchQuery = '';
let downloadsFilterValue = 'all';

function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

function formatSpeed(bps) {
  if (!bps || bps <= 0) return '';
  return formatBytes(bps) + '/s';
}

function formatETA(received, total, bps) {
  if (!bps || bps <= 0 || !total || total <= received) return '';
  const remaining = (total - received) / bps;
  if (remaining < 60) return Math.round(remaining) + 's';
  if (remaining < 3600) return Math.round(remaining / 60) + 'm';
  return Math.round(remaining / 3600) + 'h';
}

function getFileCategory(filename, mime) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (/^(mp4|mkv|webm|avi|mov|flv|wmv|m4v)$/.test(ext) || (mime || '').startsWith('video/')) return { cat: 'video', icon: '🎬' };
  if (/^(mp3|wav|flac|ogg|m4a|aac|wma)$/.test(ext) || (mime || '').startsWith('audio/')) return { cat: 'audio', icon: '🎵' };
  if (/^(jpg|jpeg|png|gif|webp|svg|bmp|ico|heic|tiff)$/.test(ext) || (mime || '').startsWith('image/')) return { cat: 'image', icon: '🖼️' };
  if (/^(zip|rar|7z|tar|gz|bz2|xz|iso)$/.test(ext)) return { cat: 'archive', icon: '📦' };
  if (/^(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|md|odt|ods|odp|csv)$/.test(ext)) return { cat: 'doc', icon: '📄' };
  if (/^(exe|msi|dmg|deb|rpm|appimage|app|apk)$/.test(ext)) return { cat: 'exe', icon: '⚙️' };
  return { cat: 'generic', icon: '📎' };
}

function getRelativeTime(ts) {
  if (!ts) return '';
  const now = Date.now();
  const then = ts < 1e12 ? ts * 1000 : ts; // handle seconds vs ms
  const diff = Math.max(0, now - then) / 1000;
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) return Math.round(diff / 60) + ' min';
  if (diff < 86400) return Math.round(diff / 3600) + 'h';
  if (diff < 86400 * 7) return Math.round(diff / 86400) + 'd';
  return new Date(then).toLocaleDateString();
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderDownloadItem(d, isActive) {
  const { cat, icon } = getFileCategory(d.filename || '', d.mime || '');
  const safeFilename = escapeHtml(d.filename || '');
  const percent = d.percent || 0;
  const state = d.finalState || d.state;
  const isPaused = d.isPaused;
  const isDone = state === 'completed';
  const isFailed = state === 'cancelled' || state === 'interrupted' || state === 'failed';
  
  let statusText = '';
  let statusClass = '';
  let barClass = '';
  
  if (isActive) {
    if (isPaused) {
      statusText = 'Pausado';
      statusClass = 'status-paused';
      barClass = 'paused';
    } else {
      statusText = 'A descarregar';
      statusClass = 'status-active';
    }
  } else if (isDone) {
    statusText = '✓ Concluído';
    statusClass = 'status-done';
    barClass = 'done';
  } else if (isFailed) {
    statusText = state === 'cancelled' ? '✕ Cancelado' : '⚠ Falhou';
    statusClass = 'status-failed';
    barClass = 'failed';
  }
  
  const sizeText = d.totalBytes > 0 
    ? `${formatBytes(d.receivedBytes)} / ${formatBytes(d.totalBytes)}`
    : formatBytes(d.receivedBytes);
  
  const speedText = isActive && !isPaused && d.speed ? formatSpeed(d.speed) : '';
  const etaText = isActive && !isPaused ? formatETA(d.receivedBytes, d.totalBytes, d.speed) : '';
  const timeText = !isActive ? getRelativeTime(d.startTime) : '';
  
  const metaParts = [
    `<span class="${statusClass}">${statusText}</span>`,
    sizeText,
    speedText,
    etaText,
    timeText
  ].filter(Boolean);
  
  const metaHtml = metaParts.map((p, i) => 
    i === 0 ? p : `<span class="sep">·</span>${p}`
  ).join('');
  
  const showProgress = isActive || (!isDone && !isFailed);
  const progressHtml = showProgress ? `
    <div class="download-progress-wrap">
      <div class="download-progress-bar ${barClass}" style="width:${percent}%"></div>
    </div>` : '';
  
  // Actions
  let actionsHtml = '';
  if (isActive) {
    if (isPaused) {
      actionsHtml += `<button class="download-action-btn primary" data-action="resume" data-id="${d.id}" title="Retomar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></button>`;
    } else {
      actionsHtml += `<button class="download-action-btn" data-action="pause" data-id="${d.id}" title="Pausar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg></button>`;
    }
    actionsHtml += `<button class="download-action-btn danger" data-action="cancel" data-id="${d.id}" title="Cancelar">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
  } else if (isDone) {
    actionsHtml += `<button class="download-action-btn primary" data-action="open" data-path="${encodeURIComponent(d.savePath)}" title="Abrir">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></button>`;
    actionsHtml += `<button class="download-action-btn" data-action="folder" data-path="${encodeURIComponent(d.savePath)}" title="Mostrar na pasta">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></button>`;
  } else if (isFailed) {
    // Retry: we can just open the URL so user can retry manually
    actionsHtml += `<button class="download-action-btn primary" data-action="retry" data-url="${encodeURIComponent(d.url)}" title="Tentar novamente">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg></button>`;
  }
  
  if (!isActive) {
    actionsHtml += `<button class="download-action-btn danger" data-action="remove" data-id="${d.id}" title="Remover do histórico">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>`;
  }
  
  return `
    <div class="download-item" data-id="${escapeHtml(d.id)}">
      <div class="download-icon icon-${cat}">${icon}</div>
      <div class="download-info">
        <div class="download-filename" title="${safeFilename}">${safeFilename}</div>
        <div class="download-meta">${metaHtml}</div>
        ${progressHtml}
      </div>
      <div class="download-actions">${actionsHtml}</div>
    </div>
  `;
}

function renderDownloads() {
  const list = downloadsList;
  if (!list) return;
  
  const q = (downloadsSearchQuery || '').toLowerCase();
  const filter = downloadsFilterValue;
  
  let items = [];
  
  // Active always first
  if (filter === 'all' || filter === 'active') {
    downloadsState.active.forEach(d => items.push({ d, isActive: true }));
  }
  
  if (filter === 'all' || filter === 'completed' || filter === 'cancelled') {
    downloadsState.history.forEach(d => {
      const state = d.finalState || d.state;
      const isDone = state === 'completed';
      const isFailed = state === 'cancelled' || state === 'interrupted' || state === 'failed';
      if (filter === 'completed' && !isDone) return;
      if (filter === 'cancelled' && !isFailed) return;
      items.push({ d, isActive: false });
    });
  }
  
  if (q) {
    items = items.filter(({ d }) => 
      (d.filename || '').toLowerCase().includes(q) ||
      (d.url || '').toLowerCase().includes(q)
    );
  }
  
  if (items.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        <p>${q ? 'Sem resultados' : 'Nenhum download ainda'}</p>
      </div>
    `;
    return;
  }
  
  list.innerHTML = items.map(({ d, isActive }) => renderDownloadItem(d, isActive)).join('');
}

async function loadDownloads() {
  if (!window.electronAPI?.downloadsList) return;
  try {
    downloadsState = await window.electronAPI.downloadsList();
    renderDownloads();
  } catch (e) {
    console.error('Failed to load downloads', e);
  }
}

function setupDownloadManager() {
  if (!window.electronAPI?.onDownloadUpdate) return;
  
  // Live updates from main
  window.electronAPI.onDownloadUpdate((payload) => {
    if (!payload || !payload.item) return;
    const { type, item } = payload;
    
    if (type === 'update') {
      const idx = downloadsState.active.findIndex(d => d.id === item.id);
      if (idx >= 0) downloadsState.active[idx] = item;
      else downloadsState.active.push(item);
    } else if (type === 'done') {
      downloadsState.active = downloadsState.active.filter(d => d.id !== item.id);
      downloadsState.history.unshift(item);
    }
    
    // Only re-render if modal open
    if (downloadsModal && downloadsModal.classList.contains('active')) {
      renderDownloads();
    }
    
    // Show toast for completed downloads
    if (type === 'done') {
      const state = item.finalState || item.state;
      if (state === 'completed') {
        if (typeof showToast === 'function') showToast(`✓ ${item.filename} descarregado`);
      }
    }
  });
  
  // Toolbar handlers
  const search = document.getElementById('downloadsSearch');
  const filter = document.getElementById('downloadsFilter');
  const clearBtn = document.getElementById('clearDownloadsBtn');
  
  if (search) {
    search.addEventListener('input', (e) => {
      downloadsSearchQuery = e.target.value;
      renderDownloads();
    });
  }
  
  if (filter) {
    filter.addEventListener('change', (e) => {
      downloadsFilterValue = e.target.value;
      renderDownloads();
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('Limpar todo o histórico de downloads?')) return;
      await window.electronAPI.downloadClearHistory();
      downloadsState.history = [];
      renderDownloads();
    });
  }
  
  // Action button delegation
  if (downloadsList) {
    downloadsList.addEventListener('click', async (e) => {
      const btn = e.target.closest('.download-action-btn');
      if (!btn) return;
      const action = btn.dataset.action;
      const id = btn.dataset.id;
      const p = btn.dataset.path ? decodeURIComponent(btn.dataset.path) : null;
      const u = btn.dataset.url ? decodeURIComponent(btn.dataset.url) : null;
      
      try {
        if (action === 'pause') await window.electronAPI.downloadPause(id);
        else if (action === 'resume') await window.electronAPI.downloadResume(id);
        else if (action === 'cancel') await window.electronAPI.downloadCancel(id);
        else if (action === 'open') await window.electronAPI.downloadOpenFile(p);
        else if (action === 'folder') await window.electronAPI.downloadShowInFolder(p);
        else if (action === 'retry') {
          if (u) {
            const tab = tabs.find(t => t.id === activeTabId);
            if (tab && tab.webview) tab.webview.loadURL(u);
          }
        } else if (action === 'remove') {
          await window.electronAPI.downloadRemoveFromHistory(id);
          downloadsState.history = downloadsState.history.filter(d => d.id !== id);
          renderDownloads();
        }
      } catch (err) {
        console.error('Download action failed:', action, err);
      }
    });
  }
  
  // Live speed refresh every second while downloading (in case no 'updated' event)
  setInterval(() => {
    if (downloadsState.active.length > 0 && downloadsModal?.classList.contains('active')) {
      renderDownloads();
    }
  }, 1000);
}

setTimeout(setupDownloadManager, 250);

// ========================================
// Settings Management
// ========================================
function loadSettings() {
  try {
    const stored = localStorage.getItem('zero-browser-settings');
    if (stored) {
      settings = { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    settings = { ...defaultSettings };
  }
  applySettings();
}

function saveSettings() {
  localStorage.setItem('zero-browser-settings', JSON.stringify(settings));
}

function applySettings() {
  // Apply theme
  if (settings.theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
  } else {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }
  
  // Bookmarks bar
  if (bookmarksBarEl) {
    bookmarksBarEl.style.display = settings.showBookmarksBar ? 'flex' : 'none';
  }
  
  // Animations
  document.documentElement.style.setProperty(
    '--transition',
    settings.animations ? '0.15s ease' : '0s'
  );
}

function updateSettingsUI() {
  // Theme
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === settings.theme);
  });
  
  // Toggles & selects
  const bindings = {
    'setting-bookmarks-bar': 'showBookmarksBar',
    'setting-animations': 'animations',
    'setting-suggestions': 'suggestions',
    'setting-adblock': 'adblock',
    'setting-trackers': 'trackers',
    'setting-dnt': 'dnt',
    'setting-clear-on-exit': 'clearOnExit',
    'setting-restore-tabs': 'restoreTabs',
    'setting-ask-download': 'askDownload',
    'setting-search-engine': 'searchEngine',
    'setting-homepage': 'homepage'
  };
  
  Object.entries(bindings).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = settings[key];
    } else {
      el.value = settings[key];
    }
  });
}

function setupSettingsListeners() {
  if (!settingsBtn) return;
  
  // Open modal
  settingsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    updateSettingsUI();
    settingsModal.classList.add('active');
  });
  
  // Close modal
  closeSettingsModal.addEventListener('click', () => {
    settingsModal.classList.remove('active');
  });
  
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove('active');
    }
  });
  
  // Sidebar navigation
  document.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      document.querySelectorAll('.settings-nav-item').forEach(n => n.classList.remove('active'));
      document.querySelectorAll('.settings-section').forEach(s => s.classList.remove('active'));
      item.classList.add('active');
      document.querySelector(`.settings-section[data-section="${section}"]`).classList.add('active');
    });
  });
  
  // Theme options
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', () => {
      settings.theme = opt.dataset.theme;
      document.querySelectorAll('.theme-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      applySettings();
      saveSettings();
    });
  });
  
  // Toggle bindings
  const toggleBindings = {
    'setting-bookmarks-bar': 'showBookmarksBar',
    'setting-animations': 'animations',
    'setting-suggestions': 'suggestions',
    'setting-adblock': 'adblock',
    'setting-trackers': 'trackers',
    'setting-dnt': 'dnt',
    'setting-clear-on-exit': 'clearOnExit',
    'setting-restore-tabs': 'restoreTabs',
    'setting-ask-download': 'askDownload'
  };
  
  Object.entries(toggleBindings).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      settings[key] = el.checked;
      applySettings();
      saveSettings();
    });
  });
  
  // Select bindings
  const selectBindings = {
    'setting-search-engine': 'searchEngine',
    'setting-homepage': 'homepage'
  };
  
  Object.entries(selectBindings).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', () => {
      settings[key] = el.value;
      saveSettings();
    });
  });
  
  // Clear all data
  const clearAllBtn = document.getElementById('clearAllDataBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      if (confirm('Tens a certeza que queres limpar todos os dados? Esta ação não pode ser desfeita.')) {
        localStorage.clear();
        if (window.electronAPI && window.electronAPI.clearHistory) {
          await window.electronAPI.clearHistory();
        }
        settings = { ...defaultSettings };
        applySettings();
        updateSettingsUI();
        alert('Todos os dados foram apagados.');
      }
    });
  }
}

// ========================================
// Mute Tab
// ========================================
function toggleMuteTab(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab || !tab.webview) return;
  tab.muted = !tab.muted;
  try {
    tab.webview.setAudioMuted(tab.muted);
  } catch (e) {
    console.error('Failed to mute tab:', e);
  }
  renderTabs();
}

// ========================================
// Copy URL
// ========================================
function copyCurrentUrl() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  const url = tab.webview.src;
  navigator.clipboard.writeText(url).then(() => {
    showToast('URL copiado!');
  }).catch(err => console.error('Copy failed:', err));
}

function copyTabUrl(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  navigator.clipboard.writeText(tab.url).then(() => {
    showToast('URL copiado!');
  });
}

// Simple toast notification
function showToast(message) {
  let toast = document.getElementById('zeroToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'zeroToast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);padding:10px 20px;border-radius:8px;font-size:13px;z-index:10000;box-shadow:0 4px 16px rgba(0,0,0,0.4);opacity:0;transition:opacity 0.2s;';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ========================================
// View Source
// ========================================
function viewSource() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  const url = tab.webview.src;
  if (url && !url.startsWith('data:') && !url.startsWith('view-source:')) {
    createNewTab('view-source:' + url);
  }
}

// ========================================
// DevTools
// ========================================
function toggleDevTools() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  try {
    if (tab.webview.isDevToolsOpened()) {
      tab.webview.closeDevTools();
    } else {
      tab.webview.openDevTools();
    }
  } catch (e) {
    console.error('DevTools error:', e);
  }
}

// ========================================
// Print
// ========================================
function printPage() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  try {
    tab.webview.print();
  } catch (e) {
    console.error('Print error:', e);
  }
}

// ========================================
// Translate
// ========================================
function translatePage() {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  const url = tab.webview.src;
  if (url && !url.startsWith('data:')) {
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=pt&u=${encodeURIComponent(url)}`;
    navigateTo(translateUrl);
  }
}

// ========================================
// Find in Page
// ========================================
let findActive = false;

function openFindBar() {
  if (!findBar) return;
  findBar.classList.add('active');
  findInput.focus();
  findInput.select();
  findActive = true;
}

function closeFindBar() {
  if (!findBar) return;
  findBar.classList.remove('active');
  findActive = false;
  findCounter.textContent = '0/0';
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    try {
      tab.webview.stopFindInPage('clearSelection');
    } catch (e) {}
  }
}

function findInPage(text, forward = true, findNextFlag = false) {
  const tab = tabs.find(t => t.id === activeTabId);
  if (!tab || !tab.webview) return;
  if (!text) {
    try { tab.webview.stopFindInPage('clearSelection'); } catch (e) {}
    findCounter.textContent = '0/0';
    return;
  }
  try {
    tab.webview.findInPage(text, { forward, findNext: findNextFlag });
  } catch (e) {
    console.error('Find error:', e);
  }
}

// ========================================
// Password Manager (with basic encryption)
// ========================================
const PW_KEY = 'zero-browser-passwords';
const PW_SECRET = 'zero-browser-secret-v1';

function encrypt(text) {
  // Simple XOR obfuscation (NOT cryptographically secure, but prevents casual reading)
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ PW_SECRET.charCodeAt(i % PW_SECRET.length));
  }
  return btoa(result);
}

function decrypt(encoded) {
  try {
    const text = atob(encoded);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(text.charCodeAt(i) ^ PW_SECRET.charCodeAt(i % PW_SECRET.length));
    }
    return result;
  } catch (e) {
    return '';
  }
}

function loadPasswords() {
  try {
    return JSON.parse(localStorage.getItem(PW_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function savePasswords(list) {
  localStorage.setItem(PW_KEY, JSON.stringify(list));
}

function renderPasswords() {
  const list = loadPasswords();
  if (list.length === 0) {
    passwordsList.innerHTML = '<div class="empty-state">Nenhuma palavra-passe guardada</div>';
    return;
  }
  passwordsList.innerHTML = list.map(p => `
    <div class="password-item" data-id="${p.id}">
      <span class="password-item-site" title="${p.site}">${p.site}</span>
      <span class="password-item-user" title="${p.user}">${p.user}</span>
      <span class="password-item-pass" data-encrypted="${p.pass}" data-revealed="false">••••••••</span>
      <button class="password-item-btn reveal" title="Mostrar/Esconder">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      </button>
      <button class="password-item-btn copy" title="Copiar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
      <button class="password-item-btn delete" title="Apagar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  `).join('');
  
  // Reveal/hide
  passwordsList.querySelectorAll('.reveal').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.password-item');
      const passEl = item.querySelector('.password-item-pass');
      const revealed = passEl.dataset.revealed === 'true';
      if (revealed) {
        passEl.textContent = '••••••••';
        passEl.dataset.revealed = 'false';
      } else {
        passEl.textContent = decrypt(passEl.dataset.encrypted);
        passEl.dataset.revealed = 'true';
      }
    });
  });
  
  // Copy
  passwordsList.querySelectorAll('.copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.password-item');
      const encrypted = item.querySelector('.password-item-pass').dataset.encrypted;
      navigator.clipboard.writeText(decrypt(encrypted));
      showToast('Palavra-passe copiada!');
    });
  });
  
  // Delete
  passwordsList.querySelectorAll('.delete').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.closest('.password-item').dataset.id);
      const list = loadPasswords().filter(p => p.id !== id);
      savePasswords(list);
      renderPasswords();
    });
  });
}

function addPassword() {
  const site = pwSite.value.trim();
  const user = pwUser.value.trim();
  const pass = pwPass.value;
  if (!site || !user || !pass) {
    showToast('Preenche todos os campos');
    return;
  }
  const list = loadPasswords();
  list.push({
    id: Date.now(),
    site,
    user,
    pass: encrypt(pass)
  });
  savePasswords(list);
  pwSite.value = '';
  pwUser.value = '';
  pwPass.value = '';
  renderPasswords();
  showToast('Palavra-passe guardada');
}

// ========================================
// Browser Optimization
// ========================================
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return bytes.toFixed(1) + ' ' + units[i];
}

async function optimizeBrowser(deepClean = false) {
  const optimizeBtn = document.getElementById('optimizeBtn');
  const deepCleanBtn = document.getElementById('deepCleanBtn');
  const optimizeStats = document.getElementById('optimizeStats');
  const statCache = document.getElementById('statCache');
  const statHistory = document.getElementById('statHistory');
  
  const btn = deepClean ? deepCleanBtn : optimizeBtn;
  const originalText = btn.textContent;
  
  // Disable buttons
  if (optimizeBtn) optimizeBtn.disabled = true;
  if (deepCleanBtn) deepCleanBtn.disabled = true;
  btn.textContent = 'A otimizar...';
  
  try {
    const result = await window.electronAPI.optimizeBrowser({ deepClean });
    
    if (result.success) {
      // Show stats
      if (optimizeStats) {
        optimizeStats.style.display = 'flex';
        statCache.textContent = formatBytes(result.cacheCleared);
        statHistory.textContent = result.historyTrimmed + ' entradas';
      }
      
      // Reload current tab to apply changes
      const tab = tabs.find(t => t.id === activeTabId);
      if (tab && tab.webview && !tab.url.startsWith('data:')) {
        try { tab.webview.reload(); } catch (e) {}
      }
      
      showToast(deepClean ? 'Limpeza total concluída!' : 'Browser otimizado!');
    } else {
      showToast('Erro na otimização');
    }
  } catch (e) {
    console.error('Optimize error:', e);
    showToast('Erro: ' + e.message);
  } finally {
    if (optimizeBtn) optimizeBtn.disabled = false;
    if (deepCleanBtn) deepCleanBtn.disabled = false;
    btn.textContent = originalText;
  }
}

// Apply tab throttling (suspend inactive tabs to save RAM)
function applyTabThrottling(enabled) {
  tabs.forEach(tab => {
    if (tab.webview && tab.id !== activeTabId) {
      try {
        if (enabled) {
          tab.webview.setBackgroundThrottling?.(true);
        } else {
          tab.webview.setBackgroundThrottling?.(false);
        }
      } catch (e) {}
    }
  });
}

function setupFeatureListeners() {
  // Find bar
  if (findInput) {
    findInput.addEventListener('input', (e) => findInPage(e.target.value, true, false));
    findInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        findInPage(findInput.value, !e.shiftKey, true);
      } else if (e.key === 'Escape') {
        closeFindBar();
      }
    });
    findPrev.addEventListener('click', () => findInPage(findInput.value, false, true));
    findNext.addEventListener('click', () => findInPage(findInput.value, true, true));
    findClose.addEventListener('click', closeFindBar);
  }
  
  // Password manager
  if (passwordsBtn) {
    passwordsBtn.addEventListener('click', () => {
      renderPasswords();
      passwordsModal.classList.add('active');
    });
    closePasswordsModal.addEventListener('click', () => {
      passwordsModal.classList.remove('active');
    });
    passwordsModal.addEventListener('click', (e) => {
      if (e.target === passwordsModal) passwordsModal.classList.remove('active');
    });
    pwAddBtn.addEventListener('click', addPassword);
    pwPass.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addPassword();
    });
  }
  
  // Context menu - mute
  if (ctxMute) {
    ctxMute.addEventListener('click', () => {
      if (contextMenuTabId) toggleMuteTab(contextMenuTabId);
      hideContextMenu();
    });
  }
  
  // Context menu - copy url
  if (ctxCopyUrl) {
    ctxCopyUrl.addEventListener('click', () => {
      if (contextMenuTabId) copyTabUrl(contextMenuTabId);
      hideContextMenu();
    });
  }
  
  // Optimize buttons
  const optimizeBtn = document.getElementById('optimizeBtn');
  const deepCleanBtn = document.getElementById('deepCleanBtn');
  if (optimizeBtn) {
    optimizeBtn.addEventListener('click', () => optimizeBrowser(false));
  }
  if (deepCleanBtn) {
    deepCleanBtn.addEventListener('click', () => {
      if (confirm('Isto vai apagar cookies, logins, IndexedDB e todos os dados de sites. Continuar?')) {
        optimizeBrowser(true);
      }
    });
  }
  
  // Tab throttling toggle
  const throttleToggle = document.getElementById('setting-throttle-tabs');
  if (throttleToggle) {
    throttleToggle.addEventListener('change', () => {
      applyTabThrottling(throttleToggle.checked);
      showToast(throttleToggle.checked ? 'Throttling ativado' : 'Throttling desativado');
    });
  }
  
  // Window controls
  const minimizeBtn = document.getElementById('minimizeBtn');
  const maximizeBtn = document.getElementById('maximizeBtn');
  const closeBtn = document.getElementById('closeBtn');
  
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => window.electronAPI.windowMinimize());
  }
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', async () => {
      const maxed = await window.electronAPI.windowMaximize();
      updateMaximizeIcon(maxed);
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => window.electronAPI.windowClose());
  }
  
  // Set initial state
  if (window.electronAPI && window.electronAPI.windowIsMaximized) {
    window.electronAPI.windowIsMaximized().then(updateMaximizeIcon);
  }
}

function updateMaximizeIcon(isMaximized) {
  const btn = document.getElementById('maximizeBtn');
  if (!btn) return;
  if (isMaximized) {
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="2.5" y="3.5" width="6" height="6"/>
        <path d="M4 3.5V2.5h6v6H8.5"/>
      </svg>
    `;
    btn.title = 'Restaurar';
  } else {
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1">
        <rect x="2.5" y="2.5" width="7" height="7"/>
      </svg>
    `;
    btn.title = 'Maximizar';
  }
}

// ========================================
// Incognito Mode
// ========================================
function isIncognitoWindow() {
  return new URLSearchParams(window.location.search).get('incognito') === '1';
}

async function openIncognitoWindow() {
  try {
    await window.electronAPI.createIncognitoWindow();
  } catch (e) {
    console.error('Failed to open incognito:', e);
  }
}

// ========================================
// Tracker Radar
// ========================================
let trackerCount = 0;

function updateTrackerBadge(count) {
  trackerCount = count;
  const badge = document.getElementById('trackerBadge');
  const shield = document.getElementById('trackerShield');
  if (!badge || !shield) return;
  if (count === 0) {
    badge.classList.add('zero');
    badge.textContent = '0';
  } else {
    badge.classList.remove('zero');
    badge.textContent = count > 999 ? '999+' : String(count);
  }
  shield.title = `${count} trackers bloqueados nesta sessão`;
}

function setupTrackerRadar() {
  if (!window.electronAPI || !window.electronAPI.onTrackerBlocked) return;
  
  window.electronAPI.onTrackerBlocked((data) => {
    updateTrackerBadge(data.count);
  });
  
  // Initial sync
  window.electronAPI.getTrackerCount().then(updateTrackerBadge);
  
  // Click handler
  const shield = document.getElementById('trackerShield');
  if (shield) {
    shield.addEventListener('click', () => {
      showToast(`🛡️ ${trackerCount} trackers bloqueados nesta sessão`);
    });
  }
}

// ========================================
// Custom Themes
// ========================================
const THEME_PRESETS = {
  default:  { accent: '#6366f1', bg: '#0a0a0f', bgEl: '#14141a' },
  dracula:  { accent: '#bd93f9', bg: '#282a36', bgEl: '#343746' },
  nord:     { accent: '#88c0d0', bg: '#2e3440', bgEl: '#3b4252' },
  gruvbox:  { accent: '#fe8019', bg: '#282828', bgEl: '#3c3836' },
  monokai:  { accent: '#a6e22e', bg: '#272822', bgEl: '#3e3d32' },
  sunset:   { accent: '#ff6b6b', bg: '#1a0e14', bgEl: '#2a1820' },
  ocean:    { accent: '#06b6d4', bg: '#0a1626', bgEl: '#142238' },
  forest:   { accent: '#10b981', bg: '#0a1f14', bgEl: '#142a1f' }
};

function applyCustomTheme(accent, bg, bgEl) {
  const root = document.documentElement;
  if (accent) root.style.setProperty('--accent', accent);
  if (bg) root.style.setProperty('--bg', bg);
  if (bgEl) root.style.setProperty('--bg-elevated', bgEl);
  localStorage.setItem('zero-custom-theme', JSON.stringify({ accent, bg, bgEl }));
}

function applyPreset(name) {
  const preset = THEME_PRESETS[name];
  if (!preset) return;
  applyCustomTheme(preset.accent, preset.bg, preset.bgEl);
  
  // Update color inputs
  const accentInput = document.getElementById('customAccent');
  const bgInput = document.getElementById('customBg');
  if (accentInput) accentInput.value = preset.accent;
  if (bgInput) bgInput.value = preset.bg;
  
  // Update active state
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === name);
  });
  
  localStorage.setItem('zero-theme-preset', name);
}

function loadSavedTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem('zero-custom-theme') || 'null');
    if (saved) {
      applyCustomTheme(saved.accent, saved.bg, saved.bgEl);
      const accentInput = document.getElementById('customAccent');
      const bgInput = document.getElementById('customBg');
      if (accentInput && saved.accent) accentInput.value = saved.accent;
      if (bgInput && saved.bg) bgInput.value = saved.bg;
    }
    const preset = localStorage.getItem('zero-theme-preset');
    if (preset) {
      document.querySelectorAll('.theme-preset').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
      });
    }
  } catch (e) {}
}

function setupThemeListeners() {
  document.querySelectorAll('.theme-preset').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
  });
  
  const accentInput = document.getElementById('customAccent');
  const bgInput = document.getElementById('customBg');
  
  if (accentInput) {
    accentInput.addEventListener('input', () => {
      document.documentElement.style.setProperty('--accent', accentInput.value);
      const current = JSON.parse(localStorage.getItem('zero-custom-theme') || '{}');
      current.accent = accentInput.value;
      localStorage.setItem('zero-custom-theme', JSON.stringify(current));
      // Clear preset active state
      document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));
    });
  }
  
  if (bgInput) {
    bgInput.addEventListener('input', () => {
      document.documentElement.style.setProperty('--bg', bgInput.value);
      const current = JSON.parse(localStorage.getItem('zero-custom-theme') || '{}');
      current.bg = bgInput.value;
      localStorage.setItem('zero-custom-theme', JSON.stringify(current));
      document.querySelectorAll('.theme-preset').forEach(b => b.classList.remove('active'));
    });
  }
}

// ========================================
// Tab Sleeping (suspend inactive tabs)
// ========================================
const TAB_SLEEP_MINUTES = 15; // Sleep after 15 min inactive
let tabSleepEnabled = true;
let tabSleepInterval = null;

function markTabActive(tabId) {
  const tab = tabs.find(t => t.id === tabId);
  if (!tab) return;
  tab.lastActive = Date.now();
  if (tab.sleeping) wakeTab(tab);
}

function sleepTab(tab) {
  if (!tab || tab.sleeping || tab.id === activeTabId) return;
  if (!tab.webview) return;
  try {
    // Save current URL and title
    tab.savedUrl = tab.webview.src;
    tab.sleeping = true;
    // Replace src with blank to free memory
    tab.webview.src = 'about:blank';
  } catch (e) {
    console.error('Sleep error:', e);
  }
  renderTabs();
}

function wakeTab(tab) {
  if (!tab || !tab.sleeping) return;
  try {
    if (tab.savedUrl) tab.webview.src = tab.savedUrl;
    tab.sleeping = false;
    tab.lastActive = Date.now();
  } catch (e) {}
  renderTabs();
}

function checkSleepingTabs() {
  if (!tabSleepEnabled) return;
  const threshold = TAB_SLEEP_MINUTES * 60 * 1000;
  const now = Date.now();
  tabs.forEach(tab => {
    if (tab.id === activeTabId) return;
    if (tab.sleeping) return;
    if (!tab.lastActive) tab.lastActive = now;
    if (now - tab.lastActive > threshold) {
      sleepTab(tab);
    }
  });
}

function startTabSleepMonitor() {
  if (tabSleepInterval) clearInterval(tabSleepInterval);
  tabSleepInterval = setInterval(checkSleepingTabs, 60 * 1000); // check every minute
}

// ========================================
// Auto-translate
// ========================================
const LANG_NAMES = {
  en: 'inglês', es: 'espanhol', fr: 'francês', de: 'alemão',
  it: 'italiano', ja: 'japonês', zh: 'chinês', ru: 'russo',
  ar: 'árabe', ko: 'coreano', nl: 'holandês', sv: 'sueco',
  pl: 'polaco', tr: 'turco', hi: 'hindi'
};

const translateDismissed = new Set(JSON.parse(localStorage.getItem('zero-translate-dismissed') || '[]'));

async function detectAndPromptTranslate(tab) {
  if (!tab || !tab.webview) return;
  if (tab.url.startsWith('data:') || tab.url.startsWith('view-source:')) return;
  
  try {
    const host = new URL(tab.url).hostname;
    if (translateDismissed.has(host)) return;
    
    const detectedLang = await tab.webview.executeJavaScript(`
      (function() {
        var lang = document.documentElement.lang || document.documentElement.getAttribute('xml:lang') || '';
        return lang.toLowerCase().split('-')[0];
      })()
    `);
    
    if (!detectedLang || detectedLang === 'pt' || detectedLang === '') return;
    if (!LANG_NAMES[detectedLang]) return;
    
    showTranslateBanner(detectedLang, host, tab);
  } catch (e) {
    // silent
  }
}

function showTranslateBanner(lang, host, tab) {
  const banner = document.getElementById('translateBanner');
  const langEl = document.getElementById('translateLang');
  const confirmBtn = document.getElementById('translateConfirm');
  const dismissBtn = document.getElementById('translateDismiss');
  const closeBtn = document.getElementById('translateClose');
  if (!banner) return;
  
  langEl.textContent = LANG_NAMES[lang] || lang;
  banner.classList.add('active');
  
  const hide = () => banner.classList.remove('active');
  
  confirmBtn.onclick = () => {
    hide();
    const url = tab.webview.src;
    const translateUrl = `https://translate.google.com/translate?sl=${lang}&tl=pt&u=${encodeURIComponent(url)}`;
    navigateTo(translateUrl);
  };
  
  dismissBtn.onclick = () => {
    hide();
    translateDismissed.add(host);
    localStorage.setItem('zero-translate-dismissed', JSON.stringify([...translateDismissed]));
  };
  
  closeBtn.onclick = hide;
  
  // Auto-hide after 10s
  clearTimeout(banner._timer);
  banner._timer = setTimeout(hide, 10000);
}

// ========================================
// Extensions UI
// ========================================
async function renderExtensions() {
  const list = document.getElementById('extensionsList');
  if (!list) return;
  try {
    const exts = await window.electronAPI.getExtensions();
    if (!exts || exts.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhuma extensão carregada</div>';
      return;
    }
    list.innerHTML = exts.map(ext => `
      <div class="extension-item" data-path="${ext.path}">
        <div class="extension-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          </svg>
        </div>
        <div class="extension-info">
          <div class="extension-name">${ext.name || 'Extensão'}</div>
          <div class="extension-meta">v${ext.version || '?'} · ${ext.path}</div>
        </div>
        <button class="extension-remove" data-path="${ext.path}">Remover</button>
      </div>
    `).join('');
    
    list.querySelectorAll('.extension-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        await window.electronAPI.removeExtension(btn.dataset.path);
        renderExtensions();
        showToast('Extensão removida. Reinicia para aplicar.');
      });
    });
  } catch (e) {
    console.error(e);
  }
}

async function addExtension() {
  try {
    const folder = await window.electronAPI.pickExtensionFolder();
    if (!folder) return;
    const result = await window.electronAPI.loadExtension(folder);
    if (result.success) {
      showToast(`✓ ${result.name} v${result.version}`);
      renderExtensions();
    } else {
      showToast('Erro: ' + (result.error || 'Falha ao carregar'));
    }
  } catch (e) {
    showToast('Erro: ' + e.message);
  }
}

function setupAppMenu() {
  const menuBtn = document.getElementById('menuBtn');
  const appMenu = document.getElementById('appMenu');
  if (!menuBtn || !appMenu) return;
  
  const closeMenu = () => appMenu.classList.remove('active');
  const openMenu = () => {
    appMenu.classList.add('active');
    // Update zoom value
    updateMenuZoomValue();
  };
  
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (appMenu.classList.contains('active')) closeMenu();
    else openMenu();
  });
  
  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!appMenu.contains(e.target) && e.target !== menuBtn && !menuBtn.contains(e.target)) {
      closeMenu();
    }
  });
  
  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && appMenu.classList.contains('active')) closeMenu();
  });
  
  // Close menu when clicking any menu item (except zoom buttons)
  appMenu.querySelectorAll('.app-menu-item').forEach(item => {
    item.addEventListener('click', () => closeMenu());
  });
  
  // Find bar from menu
  const menuFindBtn = document.getElementById('menuFindBtn');
  if (menuFindBtn) {
    menuFindBtn.addEventListener('click', () => {
      if (typeof openFindBar === 'function') openFindBar();
      else document.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', ctrlKey: true }));
    });
  }
}

function updateMenuZoomValue() {
  const zoomValue = document.getElementById('zoomValue');
  if (!zoomValue) return;
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab && tab.webview) {
    try {
      const factor = tab.webview.getZoomFactor();
      zoomValue.textContent = Math.round(factor * 100) + '%';
    } catch (e) {
      zoomValue.textContent = '100%';
    }
  }
}

function setupNewFeatureListeners() {
  setupAppMenu();
  
  // Incognito
  const incognitoBtn = document.getElementById('incognitoBtn');
  if (incognitoBtn) {
    incognitoBtn.addEventListener('click', openIncognitoWindow);
  }
  
  // Extensions
  const addExtBtn = document.getElementById('addExtensionBtn');
  if (addExtBtn) {
    addExtBtn.addEventListener('click', addExtension);
  }
  
  // Load extensions on settings open
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      setTimeout(() => renderExtensions(), 100);
    });
  }
  
  // Incognito keyboard shortcut Ctrl+Shift+N
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'N') {
      e.preventDefault();
      openIncognitoWindow();
    }
  });
  
  // Apply incognito class if window is incognito
  if (isIncognitoWindow()) {
    document.body.classList.add('incognito');
  }
  
  // Theme listeners
  setupThemeListeners();
  loadSavedTheme();
  
  // Tracker radar
  setupTrackerRadar();
  
  // Start tab sleep monitor
  startTabSleepMonitor();
}

// ========================================
// Webview Script Injection (Auto-Scroll + Scroll-to-Top + Auto-fill)
// ========================================
function getAutofillProfile() {
  try {
    return JSON.parse(localStorage.getItem('zero-autofill-profile') || '{}');
  } catch (e) { return {}; }
}

function saveAutofillProfile(profile) {
  localStorage.setItem('zero-autofill-profile', JSON.stringify(profile));
}

function injectWebviewScripts(webview) {
  const profile = getAutofillProfile();
  const autofillEnabled = localStorage.getItem('zero-autofill-enabled') !== 'false';
  const autoscrollEnabled = localStorage.getItem('zero-autoscroll-enabled') !== 'false';
  const scrolltopEnabled = localStorage.getItem('zero-scrolltop-enabled') !== 'false';
  
  const script = `
  (function() {
    if (window.__zeroInjected) return;
    window.__zeroInjected = true;
    
    const AUTOSCROLL = ${autoscrollEnabled};
    const SCROLLTOP = ${scrolltopEnabled};
    const AUTOFILL = ${autofillEnabled};
    const PROFILE = ${JSON.stringify(profile)};

    // ========== AUTO-SCROLL ==========
    if (AUTOSCROLL) {
      let scrollAnchor = null;
      let scrollInterval = null;
      let startX = 0, startY = 0;
      
      function stopAutoscroll() {
        if (scrollAnchor) { scrollAnchor.remove(); scrollAnchor = null; }
        if (scrollInterval) { clearInterval(scrollInterval); scrollInterval = null; }
        document.removeEventListener('mousemove', onScrollMove);
        document.removeEventListener('mousedown', onClickStop, true);
        document.removeEventListener('keydown', onKeyStop);
      }
      function onScrollMove(e) {
        if (!scrollAnchor) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        scrollAnchor._dx = dx / 10;
        scrollAnchor._dy = dy / 10;
      }
      function onClickStop() { stopAutoscroll(); }
      function onKeyStop(e) { if (e.key === 'Escape') stopAutoscroll(); }
      
      document.addEventListener('mousedown', function(e) {
        if (e.button !== 1) return;
        // Don't trigger on links or form elements (let them middle-click normally)
        const tag = e.target.tagName;
        if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.target.closest('a')) return;
        e.preventDefault();
        
        if (scrollAnchor) { stopAutoscroll(); return; }
        
        startX = e.clientX; startY = e.clientY;
        scrollAnchor = document.createElement('div');
        scrollAnchor.style.cssText = \`
          position: fixed; left: \${e.clientX - 14}px; top: \${e.clientY - 14}px;
          width: 28px; height: 28px; border-radius: 50%;
          background: rgba(0,0,0,0.7); border: 2px solid #fff;
          z-index: 2147483647; pointer-events: none;
          display: flex; align-items: center; justify-content: center;
        \`;
        scrollAnchor.innerHTML = '<div style="width:4px;height:4px;background:#fff;border-radius:50%"></div>';
        scrollAnchor._dx = 0; scrollAnchor._dy = 0;
        document.body.appendChild(scrollAnchor);
        
        scrollInterval = setInterval(function() {
          if (!scrollAnchor) return;
          window.scrollBy(scrollAnchor._dx, scrollAnchor._dy);
        }, 16);
        
        document.addEventListener('mousemove', onScrollMove);
        setTimeout(function() {
          document.addEventListener('mousedown', onClickStop, true);
          document.addEventListener('keydown', onKeyStop);
        }, 100);
      });
    }

    // ========== SCROLL TO TOP ==========
    if (SCROLLTOP) {
      const btn = document.createElement('div');
      btn.id = '__zero-scrolltop';
      btn.style.cssText = \`
        position: fixed; bottom: 24px; right: 24px;
        width: 44px; height: 44px; border-radius: 50%;
        background: rgba(99, 102, 241, 0.95); color: #fff;
        display: none; align-items: center; justify-content: center;
        cursor: pointer; z-index: 2147483646;
        box-shadow: 0 4px 16px rgba(0,0,0,0.3);
        transition: transform 0.2s, opacity 0.2s; opacity: 0;
      \`;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
      btn.addEventListener('mouseenter', function() { btn.style.transform = 'scale(1.1)'; });
      btn.addEventListener('mouseleave', function() { btn.style.transform = 'scale(1)'; });
      btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      function attachBtn() {
        if (document.body && !document.getElementById('__zero-scrolltop')) {
          document.body.appendChild(btn);
        }
      }
      attachBtn();
      window.addEventListener('scroll', function() {
        attachBtn();
        if (window.scrollY > 400) {
          btn.style.display = 'flex';
          requestAnimationFrame(function() { btn.style.opacity = '1'; });
        } else {
          btn.style.opacity = '0';
          setTimeout(function() { if (window.scrollY <= 400) btn.style.display = 'none'; }, 200);
        }
      }, { passive: true });
    }
    
    // ========== AUTO-FILL ==========
    if (AUTOFILL && Object.keys(PROFILE).length > 0) {
      const FIELD_MAP = {
        email: ['email', 'e-mail', 'mail'],
        firstName: ['first-name', 'firstname', 'given-name', 'fname', 'primeiro-nome', 'nome'],
        lastName: ['last-name', 'lastname', 'family-name', 'lname', 'surname', 'apelido'],
        fullName: ['name', 'full-name', 'fullname', 'nome-completo'],
        phone: ['phone', 'tel', 'mobile', 'telefone', 'telemovel'],
        address: ['address', 'street', 'morada', 'rua'],
        city: ['city', 'cidade', 'localidade'],
        postal: ['zip', 'postal', 'postcode', 'codigo-postal'],
        country: ['country', 'pais'],
        company: ['company', 'organization', 'org', 'empresa']
      };
      
      function guessField(input) {
        const hints = [
          input.name, input.id, input.placeholder,
          input.getAttribute('autocomplete'),
          input.getAttribute('aria-label'),
          (input.labels && input.labels[0] && input.labels[0].textContent) || ''
        ].filter(Boolean).join(' ').toLowerCase();
        
        for (const [key, keywords] of Object.entries(FIELD_MAP)) {
          if (keywords.some(k => hints.includes(k))) return key;
        }
        if (input.type === 'email') return 'email';
        if (input.type === 'tel') return 'phone';
        return null;
      }
      
      function showAutofillPrompt(input, field, value) {
        if (input.__zeroAutofillShown) return;
        input.__zeroAutofillShown = true;
        const rect = input.getBoundingClientRect();
        const prompt = document.createElement('div');
        prompt.style.cssText = \`
          position: fixed; left: \${rect.left}px; top: \${rect.bottom + 4}px;
          background: #14141a; color: #fff; border: 1px solid #2a2a35;
          border-radius: 6px; padding: 6px 10px; font-size: 12px;
          font-family: system-ui; z-index: 2147483645; cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex; align-items: center; gap: 8px;
        \`;
        prompt.innerHTML = '🔑 Preencher: <strong style="color:#a5b4fc">' + value + '</strong>';
        prompt.addEventListener('mousedown', function(e) {
          e.preventDefault();
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          prompt.remove();
        });
        document.body.appendChild(prompt);
        setTimeout(function() { if (prompt.parentNode) prompt.remove(); }, 6000);
        input.addEventListener('blur', function() { setTimeout(function(){ if (prompt.parentNode) prompt.remove(); }, 200); }, { once: true });
      }
      
      document.addEventListener('focusin', function(e) {
        const t = e.target;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
        if (t.type === 'password' || t.type === 'hidden' || t.type === 'file') return;
        if (t.value) return; // Don't prompt if already has value
        const field = guessField(t);
        if (!field) return;
        const value = PROFILE[field];
        if (!value) return;
        showAutofillPrompt(t, field, value);
      });
    }
  })();
  `;
  
  try {
    webview.executeJavaScript(script);
  } catch (e) {
    console.error('Failed to inject scripts:', e);
  }
}

function handleAutofillRequest(webview, data) {
  // Reserved for future bidirectional auto-fill
}

// ========================================
// Auto-fill Profile UI (Settings)
// ========================================
function loadAutofillProfileToUI() {
  const profile = getAutofillProfile();
  document.querySelectorAll('[data-autofill]').forEach(input => {
    const key = input.dataset.autofill;
    if (profile[key]) input.value = profile[key];
  });
  
  const enabledCb = document.getElementById('autofillEnabled');
  if (enabledCb) enabledCb.checked = localStorage.getItem('zero-autofill-enabled') !== 'false';
  
  const asCb = document.getElementById('autoscrollEnabled');
  if (asCb) asCb.checked = localStorage.getItem('zero-autoscroll-enabled') !== 'false';
  
  const stCb = document.getElementById('scrolltopEnabled');
  if (stCb) stCb.checked = localStorage.getItem('zero-scrolltop-enabled') !== 'false';
}

function setupAutofillUI() {
  const saveBtn = document.getElementById('saveAutofillBtn');
  const clearBtn = document.getElementById('clearAutofillBtn');
  const enabledCb = document.getElementById('autofillEnabled');
  const asCb = document.getElementById('autoscrollEnabled');
  const stCb = document.getElementById('scrolltopEnabled');
  
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const profile = {};
      document.querySelectorAll('[data-autofill]').forEach(input => {
        const v = input.value.trim();
        if (v) profile[input.dataset.autofill] = v;
      });
      saveAutofillProfile(profile);
      showToast('✓ Perfil de auto-fill guardado');
    });
  }
  
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (!confirm('Limpar todos os dados de auto-fill?')) return;
      saveAutofillProfile({});
      document.querySelectorAll('[data-autofill]').forEach(i => { i.value = ''; });
      showToast('Perfil limpo');
    });
  }
  
  if (enabledCb) {
    enabledCb.addEventListener('change', () => {
      localStorage.setItem('zero-autofill-enabled', enabledCb.checked ? 'true' : 'false');
    });
  }
  if (asCb) {
    asCb.addEventListener('change', () => {
      localStorage.setItem('zero-autoscroll-enabled', asCb.checked ? 'true' : 'false');
      showToast('Recarrega a página para aplicar');
    });
  }
  if (stCb) {
    stCb.addEventListener('change', () => {
      localStorage.setItem('zero-scrolltop-enabled', stCb.checked ? 'true' : 'false');
      showToast('Recarrega a página para aplicar');
    });
  }
}

// ========================================
// Site Permissions UI
// ========================================
const PERMISSION_LABELS = {
  media: 'Câmara/Microfone',
  camera: 'Câmara',
  microphone: 'Microfone',
  geolocation: 'Localização',
  notifications: 'Notificações',
  midi: 'MIDI',
  pointerLock: 'Bloqueio Ponteiro',
  fullscreen: 'Ecrã Inteiro',
  openExternal: 'Abrir Externa',
  clipboard: 'Área de transferência',
  'clipboard-read': 'Ler clipboard',
  'clipboard-sanitized-write': 'Escrever clipboard'
};

const PERMISSION_ICONS = {
  camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  media: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>',
  microphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8"></path></svg>',
  geolocation: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>',
  notifications: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path></svg>'
};

async function renderPermissionsList() {
  const list = document.getElementById('permissionsList');
  if (!list) return;
  try {
    const perms = await window.electronAPI.getSitePermissions();
    const hosts = Object.keys(perms);
    if (hosts.length === 0) {
      list.innerHTML = '<div class="empty-state">Nenhuma permissão guardada</div>';
      return;
    }
    list.innerHTML = hosts.map(host => {
      const items = Object.entries(perms[host]).map(([perm, val]) => 
        `<span class="permission-site-tag ${val}">${PERMISSION_LABELS[perm] || perm}: ${val === 'allow' ? 'Permitido' : 'Bloqueado'}</span>`
      ).join('');
      return `
        <div class="permission-site">
          <div class="permission-site-header">
            <span class="permission-site-host">${host}</span>
            <button class="permission-site-clear" data-host="${host}">Remover</button>
          </div>
          <div class="permission-site-items">${items}</div>
        </div>
      `;
    }).join('');
    
    list.querySelectorAll('.permission-site-clear').forEach(btn => {
      btn.addEventListener('click', async () => {
        await window.electronAPI.clearSitePermissions(btn.dataset.host);
        renderPermissionsList();
      });
    });
  } catch (e) { console.error(e); }
}

function setupPermissionPrompt() {
  const prompt = document.getElementById('permissionPrompt');
  const hostEl = document.getElementById('permissionHost');
  const descEl = document.getElementById('permissionDesc');
  const rememberCb = document.getElementById('permissionRemember');
  const allowBtn = document.getElementById('permissionAllow');
  const denyBtn = document.getElementById('permissionDeny');
  
  if (!prompt || !window.electronAPI.onPermissionRequest) return;
  
  let currentId = null;
  
  const hide = () => {
    prompt.classList.remove('active');
    currentId = null;
  };
  
  const respond = (allow) => {
    if (!currentId) return;
    window.electronAPI.respondToPermission(currentId, { allow, remember: rememberCb.checked });
    hide();
  };
  
  allowBtn.addEventListener('click', () => respond(true));
  denyBtn.addEventListener('click', () => respond(false));
  
  window.electronAPI.onPermissionRequest((data) => {
    currentId = data.id;
    hostEl.textContent = data.host || 'Site desconhecido';
    descEl.textContent = 'acesso a ' + (PERMISSION_LABELS[data.permission] || data.permission);
    rememberCb.checked = false;
    prompt.classList.add('active');
  });
  
  // Clear all permissions button
  const clearAllBtn = document.getElementById('clearAllPermissionsBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      if (!confirm('Limpar todas as permissões guardadas?')) return;
      await window.electronAPI.clearSitePermissions();
      renderPermissionsList();
      showToast('Permissões limpas');
    });
  }
}



// Hook into setupNewFeatureListeners to init UI things
(function patchSetup() {
  const original = setupNewFeatureListeners;
  window.setupNewFeatureListeners = function() {
    original();
    setupAutofillUI();
    setupPermissionPrompt();
    
    // Load UIs when settings open
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        setTimeout(() => {
          loadAutofillProfileToUI();
          renderPermissionsList();
        }, 100);
      });
    }
  };
})();

// Clean up legacy AI localStorage entries
try {
  ['zero-ai-provider', 'zero-ai-apikey', 'zero-ai-model', 'zero-ai-custom-url'].forEach(k => localStorage.removeItem(k));
} catch (e) {}

// ========================================
// Auto-Updater UI
// ========================================
function setupAutoUpdaterUI() {
  if (!window.electronAPI || !window.electronAPI.onUpdaterStatus) return;
  
  const banner = document.getElementById('updateBanner');
  const title = document.getElementById('updateTitle');
  const desc = document.getElementById('updateDesc');
  const actionBtn = document.getElementById('updateAction');
  const dismissBtn = document.getElementById('updateDismiss');
  const progressWrap = document.getElementById('updateProgress');
  const progressBar = document.getElementById('updateProgressBar');
  
  if (!banner) return;
  
  let currentState = null;
  const show = () => banner.classList.add('active');
  const hide = () => banner.classList.remove('active');
  
  dismissBtn.addEventListener('click', hide);
  
  actionBtn.addEventListener('click', () => {
    if (currentState === 'available') {
      // Start download
      actionBtn.disabled = true;
      actionBtn.textContent = 'A descarregar...';
      window.electronAPI.updaterDownload();
    } else if (currentState === 'ready') {
      // Install & restart
      window.electronAPI.updaterInstall();
    }
  });
  
  window.electronAPI.onUpdaterStatus((data) => {
    currentState = data.state;
    
    switch (data.state) {
      case 'available':
        title.textContent = '🎉 Nova versão disponível';
        desc.textContent = `v${data.version} está pronta para descarregar`;
        progressWrap.style.display = 'none';
        actionBtn.disabled = false;
        actionBtn.textContent = 'Descarregar';
        dismissBtn.style.display = '';
        show();
        break;
      
      case 'downloading':
        title.textContent = '⬇️ A descarregar atualização';
        desc.textContent = `${data.percent}%`;
        progressWrap.style.display = 'block';
        progressBar.style.width = data.percent + '%';
        actionBtn.disabled = true;
        dismissBtn.style.display = 'none';
        show();
        break;
      
      case 'ready':
        title.textContent = '✅ Atualização pronta';
        desc.textContent = `v${data.version} — reinicia para aplicar`;
        progressWrap.style.display = 'none';
        actionBtn.disabled = false;
        actionBtn.textContent = 'Reiniciar';
        dismissBtn.style.display = '';
        dismissBtn.textContent = 'Mais tarde';
        show();
        break;
      
      case 'error':
        console.error('Updater error:', data.message);
        break;
      
      case 'none':
      case 'checking':
        // Silent states
        break;
    }
  });
}

setTimeout(setupAutoUpdaterUI, 200);

// Fetch app version dynamically into About section
(async function loadAppVersion() {
  try {
    if (window.electronAPI?.getAppVersion) {
      const v = await window.electronAPI.getAppVersion();
      const el = document.getElementById('aboutVersion');
      if (el) el.textContent = 'Versão ' + v;
    }
  } catch (e) {}
})();

// Check for updates button in About
(function setupCheckUpdatesButton() {
  const btn = document.getElementById('checkUpdatesBtn');
  const status = document.getElementById('aboutUpdateStatus');
  if (!btn || !status) return;
  
  const setStatus = (text, type = '') => {
    status.textContent = text;
    status.className = 'about-update-status' + (type ? ' ' + type : '');
  };
  
  btn.addEventListener('click', async () => {
    if (!window.electronAPI?.updaterCheck) return;
    btn.disabled = true;
    setStatus('A verificar...', 'info');
    
    try {
      const result = await window.electronAPI.updaterCheck();
      
      if (!result.ok) {
        if (result.reason === 'dev') {
          setStatus('ℹ️ Procura de updates só funciona na versão instalada (não em dev)', 'info');
        } else {
          setStatus('❌ Erro: ' + (result.reason || 'desconhecido'), 'error');
        }
        btn.disabled = false;
        return;
      }
      
      // The actual result (available/none) comes via onUpdaterStatus event
      // Wait briefly for the status event
      const currentVersion = await window.electronAPI.getAppVersion();
      if (result.version && result.version !== currentVersion) {
        setStatus(`🎉 Nova versão disponível: v${result.version}`, 'success');
      } else {
        setStatus('✓ Estás na versão mais recente', 'success');
      }
    } catch (e) {
      setStatus('❌ ' + e.message, 'error');
    } finally {
      setTimeout(() => { btn.disabled = false; }, 1500);
    }
  });
})();

// Initialize on load
init();
// Run after init so DOM is ready
setTimeout(() => {
  (window.setupNewFeatureListeners || setupNewFeatureListeners)();
}, 100);
