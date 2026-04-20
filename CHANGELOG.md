# Changelog

Todas as alterações relevantes do Zero Browser.

## [1.3.0] — 2026-04-20

### ✨ Novo

- **Motor de Privacidade avançado** com bloqueio por categoria:
  - Anúncios (DoubleClick, Criteo, Taboola, Outbrain…)
  - Rastreadores e Analytics (Google Analytics, Hotjar, Segment, Mixpanel…)
  - Widgets sociais (Facebook, Twitter, LinkedIn, Disqus)
  - Mineradores de crypto (Coinhive, JSECoin…)
  - Fingerprinting (FingerprintJS, ThreatMetrix, PerimeterX)
  - Malware e phishing
- **Controlos avançados**:
  - Bloqueio de cookies de terceiros (comparação de eTLD+1)
  - Remoção automática de parâmetros de rastreio do URL (`utm_*`, `fbclid`, `gclid`, `mc_eid`…)
  - Upgrade automático HTTP → HTTPS
  - Referrer estrito (só origem)
- **Sinais de privacidade**: envio de `DNT: 1` e `Sec-GPC: 1`
- **Nova aba "Proteção"** nas Definições com:
  - Dashboard de estatísticas em tempo real (9 contadores)
  - 12 toggles individuais com aplicação live (sem reiniciar)
  - Botões de reset de estatísticas e predefinições
- Persistência em `privacy-settings.json` no userData

### 🌐 Site (zerobrowser.pt)

- Design responsivo melhorado para telemóveis (iPhone SE, notch, safe areas)
- SEO expandido: `BreadcrumbList`, `WebPage`, `AboutPage` schemas em todas as páginas
- `hreflang` e `googlebot` meta em todas as páginas
- `humans.txt` e `.well-known/security.txt` adicionados
- `robots.txt` expandido (permite GPTBot, ClaudeBot, PerplexityBot)
- Reduced-motion + touch target tuning
- Suporte a `prefers-reduced-motion`

### 🐛 Correções

- Array `trackingBlockFilters` com hostname malformado (espaço em ` Segment.io`) removido
- Precedência de operadores na condição de strip de cookies

## [1.2.9] e anteriores

Ver [releases no GitHub](https://github.com/Zero-Lta/zerobrowser/releases).
