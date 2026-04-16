# Zero Browser 🌐

Um navegador desktop moderno, leve e rápido construído com Electron e Node.js.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-28.0.0-9FE349.svg)

## 🌟 Características

### Principais
- **Interface Moderna e Minimalista** - Design inspirado no Google Chrome e Opera GX
- **Sistema de Abas** - Crie, feche e alternar entre múltiplas abas
- **Barra de Navegação** - Campo de URL/pesquisa com suporte para Google Search
- **Botões de Navegação** - Voltar, avançar e recarregar
- **Página Inicial Personalizada** - Logo "Zero Browser" com quick links
- **Suporte a Múltiplas Janelas** - Abra novas janelas do navegador

### Extras
- **Modo Escuro** - Ativado por padrão com tema gamer/clean
- **Bloqueador de Anúncios** - Filtros básicos para bloquear anúncios comuns
- **Otimização de Performance** - Processos desnecessários do Electron desativados
- **Sistema de Favoritos** - Salve e gerencie seus sites favoritos (armazenamento JSON)
- **Sistema de Histórico** - Acompanhe as URLs visitadas
- **Indicador de Loading** - Animação de carregamento nas abas
- **Atalhos de Teclado** - Navegação rápida com shortcuts

### Atalhos de Teclado
- `Ctrl+T` - Nova aba
- `Ctrl+W` - Fechar aba atual
- `Ctrl+L` - Focar barra de URL
- `Ctrl+N` - Nova janela
- `Ctrl+Q` - Sair do aplicativo

## 🎨 Design

- **Estilo Gamer/Clean** - Inspirado no Opera GX
- **Cores Escuras** - Fundo escuro com detalhes em roxo e azul neon (#6366f1, #a855f7)
- **Animações Suaves** - Transições fluidas em todas as interações
- **Interface Responsiva** - Adaptável a diferentes tamanhos de janela

## 📁 Estrutura do Projeto

```
ZeroBrowser/
├── src/
│   ├── main.js           # Processo principal do Electron
│   ├── preload.js        # Script de preload para comunicação IPC
│   └── renderer/
│       ├── index.html    # Estrutura HTML da interface
│       ├── styles.css    # Estilos CSS (tema escuro)
│       └── renderer.js   # Lógica do frontend
├── assets/               # Ícones e recursos (opcional)
├── package.json          # Dependências e scripts
└── README.md            # Este arquivo
```

## 🚀 Instalação

### Pré-requisitos
- Node.js (v14 ou superior)
- npm (geralmente instalado com Node.js)

### Passos

1. **Clone ou baixe o projeto**
   ```bash
   cd ZeroBrowser
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o navegador**
   ```bash
   npm start
   ```

## 🛠️ Scripts Disponíveis

- `npm start` - Inicia o navegador em modo de desenvolvimento
- `npm run dev` - Inicia com flags de desenvolvimento
- `npm run build` - Cria build para distribuição
- `npm run build-win` - Cria build específico para Windows

## 📦 Tecnologias Utilizadas

- **Electron** - Framework para criar aplicações desktop com tecnologias web
- **Node.js** - Runtime JavaScript para o backend
- **HTML5/CSS3/JavaScript** - Tecnologias web para a interface
- **IPC (Inter-Process Communication)** - Comunicação entre processos do Electron

## 🔧 Configuração

### Bloqueador de Anúncios
Os filtros de bloqueio de anúncios são configurados em `src/main.js`. Para adicionar novos filtros:

```javascript
const adBlockFilters = [
  '*://*.doubleclick.net/*',
  // Adicione mais filtros aqui
];
```

### Otimizações de Performance
As otimizações são aplicadas no início do `main.js`:

```javascript
app.commandLine.appendSwitch('disable-features', 'HardwareAcceleration');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
```

### Armazenamento de Dados
- **Favoritos**: `~/.config/zero-browser/bookmarks.json` (Linux/Mac) ou `%APPDATA%/zero-browser/bookmarks.json` (Windows)
- **Histórico**: `~/.config/zero-browser/history.json` (Linux/Mac) ou `%APPDATA%/zero-browser/history.json` (Windows)

## 🎯 Funcionalidades em Detalhe

### Sistema de Abas
- Criar novas abas com botão ou Ctrl+T
- Fechar abas individualmente
- Alternar entre abas clicando nelas
- Indicador de loading durante carregamento
- Título dinâmico baseado na página

### Navegação
- Barra de URL inteligente (detecta URLs vs. pesquisa)
- Botões voltar/avançar/recarregar
- Botão home para página inicial
- Histórico de navegação automático

### Favoritos
- Adicionar página atual aos favoritos
- Visualizar lista de favoritos
- Navegar para favorito com um clique
- Excluir favoritos
- Persistência em arquivo JSON

### Histórico
- Registro automático de páginas visitadas
- Visualização de histórico completo
- Navegar para item do histórico
- Limpar todo o histórico
- Limite de 1000 entradas (automático)

## 🐛 Troubleshooting

### O navegador não inicia
- Verifique se o Node.js está instalado corretamente
- Execute `npm install` novamente
- Verifique se não há conflitos com outras instâncias do Electron

### Páginas não carregam
- Verifique sua conexão com a internet
- Alguns sites podem bloquear webviews do Electron
- Tente recarregar a página com F5 ou o botão de recarregar

### Performance lenta
- As otimizações já estão aplicadas por padrão
- Feche abas não utilizadas
- Limpe o histórico periodicamente

## 📝 Notas de Desenvolvimento

### Arquitetura
- **Frontend**: HTML/CSS/JavaScript no processo renderer
- **Backend**: Node.js no processo principal do Electron
- **Comunicação**: IPC através do preload script para segurança

### Segurança
- `nodeIntegration` desativado no renderer
- `contextIsolation` ativado
- `enableRemoteModule` desativado
- Comunicação segura através de `contextBridge`

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:
- Reportar bugs
- Sugerir novas funcionalidades
- Enviar pull requests
- Melhorar a documentação

## 📄 Licença

MIT License - Sinta-se livre para usar este projeto para fins pessoais ou comerciais.

## 👥 Créditos

Desenvolvido com ❤️ usando Electron e Node.js

---

**Zero Browser v1.0** - Navegação rápida, segura e moderna! 🚀
