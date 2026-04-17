# Zero Browser — Website

Website oficial do Zero Browser, servido via **GitHub Pages**.

## Estrutura

```
docs/
├── index.html        # Landing
├── features.html     # Funcionalidades
├── privacy.html      # Privacidade
├── download.html     # Download (puxa release do GitHub API)
├── about.html        # Sobre
└── assets/
    ├── style.css     # CSS partilhado
    ├── main.js       # JS (nav ativa + fetch GitHub Releases)
    └── logo.png      # Logo
```

## Deploy (uma vez)

1. Vai a **GitHub → `Zero-Lta/zerobrowser` → Settings → Pages**
2. Em **Source**, escolhe:
   - Branch: `main`
   - Folder: `/docs`
3. Clica **Save**

Após ~1 minuto o site fica disponível em:
`https://zero-lta.github.io/zerobrowser/`

## Desenvolvimento local

É HTML estático — abre `index.html` direto no browser, ou serve com:

```powershell
# PowerShell
cd docs
python -m http.server 8000
# abre http://localhost:8000
```

## Como atualizar

- Editas os `.html` / `.css` / `.js`
- `git commit` + `git push`
- GitHub Pages reconstrói automaticamente em ~1 min

## Integração com releases

A página `download.html` e o botão do hero puxam **automaticamente** a última versão da API do GitHub (`api.github.com/repos/Zero-Lta/zerobrowser/releases/latest`), por isso cada novo release aparece sem intervenção manual.
