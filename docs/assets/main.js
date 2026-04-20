// Zero Browser website — shared JS
// Sempre busca a ÚLTIMA versão em tempo real do GitHub Releases

const REPO = 'Zero-Lta/zerobrowser';
const API_URL = `https://api.github.com/repos/${REPO}/releases/latest`;
const RELEASES_PAGE = `https://github.com/${REPO}/releases/latest`;
const CACHE_KEY = 'zb-latest-release';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

// Highlight active nav link (desktop + mobile)
(function markActiveNav() {
  const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === path || (path === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// Sticky header: adicionar classe ".scrolled" ao fazer scroll
(function stickyHeader() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  const onScroll = () => {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
})();

// Burger mobile menu
(function mobileBurger() {
  const burger = document.getElementById('navBurger');
  const menu = document.getElementById('mobileNav');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    if (!open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.setAttribute('data-open', 'true'));
    } else {
      menu.removeAttribute('data-open');
      setTimeout(() => (menu.hidden = true), 200);
    }
  });
  // Fechar ao clicar num link
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      burger.setAttribute('aria-expanded', 'false');
      menu.removeAttribute('data-open');
      setTimeout(() => (menu.hidden = true), 200);
    });
  });
})();

// GitHub star count (com cache em sessionStorage)
(function ghStars() {
  const el = document.getElementById('ghStars');
  if (!el) return;
  const CK = 'zb-gh-stars';
  const cached = (() => {
    try {
      const raw = sessionStorage.getItem(CK);
      if (!raw) return null;
      const { ts, v } = JSON.parse(raw);
      if (Date.now() - ts > 30 * 60 * 1000) return null;
      return v;
    } catch (e) { return null; }
  })();
  const render = (n) => {
    if (n == null) { el.textContent = '★'; return; }
    el.textContent = '★ ' + (n >= 1000 ? (n / 1000).toFixed(1) + 'k' : n);
  };
  if (cached != null) { render(cached); return; }
  fetch('https://api.github.com/repos/Zero-Lta/zerobrowser')
    .then(r => r.ok ? r.json() : null)
    .then(d => {
      if (d && typeof d.stargazers_count === 'number') {
        try { sessionStorage.setItem(CK, JSON.stringify({ ts: Date.now(), v: d.stargazers_count })); } catch (e) {}
        render(d.stargazers_count);
      }
    })
    .catch(() => {});
})();

// ---- Cache helpers (reduzir rate-limit do GitHub API) ----
function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch (e) { return null; }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
}

async function fetchLatestRelease() {
  const cached = readCache();
  if (cached) return cached;
  try {
    // Cache-bust para garantir frescura na primeira ida
    const res = await fetch(API_URL + '?_=' + Date.now(), {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    writeCache(data);
    return data;
  } catch (e) {
    console.warn('[ZeroBrowser] Não foi possível buscar o release:', e);
    return null;
  }
}

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(1) + ' MB';
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  } catch (e) { return ''; }
}

function pickAsset(assets, predicate) {
  return (assets || []).find(predicate);
}

// Marca botões como "a carregar" enquanto fetch decorre
function setLoadingState(elements, loading) {
  elements.forEach(el => {
    if (loading) {
      el.setAttribute('data-loading', '1');
      el.setAttribute('aria-busy', 'true');
      el.style.pointerEvents = 'none';
      el.style.opacity = '0.7';
    } else {
      el.removeAttribute('data-loading');
      el.removeAttribute('aria-busy');
      el.style.pointerEvents = '';
      el.style.opacity = '';
    }
  });
}

async function hydrateReleaseInfo() {
  const versionEls = document.querySelectorAll('[data-version]');
  const installerLinks = document.querySelectorAll('[data-asset="installer"]');
  const portableLinks = document.querySelectorAll('[data-asset="portable"]');
  const anyDownloadLinks = document.querySelectorAll('[data-asset="latest"]'); // botões "download rápido"
  const dateEls = document.querySelectorAll('[data-release-date]');
  const sizeInstaller = document.querySelectorAll('[data-size="installer"]');
  const sizePortable = document.querySelectorAll('[data-size="portable"]');

  const allButtons = [...installerLinks, ...portableLinks, ...anyDownloadLinks];

  // Fallback imediato: apontar para a página de releases do GitHub
  // (garante que um clique antes do fetch completar funciona na mesma)
  allButtons.forEach(a => {
    if (!a.href || a.href.endsWith('#') || a.href === location.href) {
      a.href = RELEASES_PAGE;
    }
  });

  if (versionEls.length === 0 && allButtons.length === 0) return;

  setLoadingState(allButtons, true);

  const release = await fetchLatestRelease();

  setLoadingState(allButtons, false);

  if (!release) {
    // Mantém fallback para a página de releases
    allButtons.forEach(a => { a.href = RELEASES_PAGE; });
    return;
  }

  const version = (release.tag_name || release.name || '').replace(/^v/i, '');
  versionEls.forEach(el => (el.textContent = version));

  dateEls.forEach(el => (el.textContent = formatDate(release.published_at)));

  const assets = release.assets || [];
  const installer = pickAsset(assets, a => /Setup.*\.exe$/i.test(a.name));
  const portable  = pickAsset(assets, a => /\.exe$/i.test(a.name) && !/Setup/i.test(a.name) && !/blockmap/i.test(a.name));

  if (installer) {
    installerLinks.forEach(a => (a.href = installer.browser_download_url));
    // O botão "latest" genérico (ex: hero CTA) também vai para o instalador
    anyDownloadLinks.forEach(a => (a.href = installer.browser_download_url));
    sizeInstaller.forEach(el => (el.textContent = formatSize(installer.size)));
  } else {
    anyDownloadLinks.forEach(a => (a.href = RELEASES_PAGE));
  }

  if (portable) {
    portableLinks.forEach(a => (a.href = portable.browser_download_url));
    sizePortable.forEach(el => (el.textContent = formatSize(portable.size)));
  }
}

// Hidrata imediatamente
hydrateReleaseInfo();

// Total de downloads (usado no hero e na página de download)
async function hydrateLiveDownloads() {
  const el = document.getElementById('liveDownloads');
  if (!el) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`, {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const releases = await res.json();
    let total = 0;
    releases.forEach(r => (r.assets || []).forEach(a => { total += a.download_count || 0; }));
    el.textContent = total.toLocaleString('pt-PT') + ' downloads';
  } catch (e) {
    el.textContent = 'Open source';
  }
}
hydrateLiveDownloads();

// E de novo se a página voltar de bfcache (ex: utilizador volta com "back")
window.addEventListener('pageshow', (e) => {
  if (e.persisted) { hydrateReleaseInfo(); hydrateLiveDownloads(); }
});
