# 📊 Estrutura do Repositório

## 📁 Estrutura de Diretórios

```
/
├── .github/              # Configurações do GitHub
├── docs/                 # Documentação completa
├── functions/            # Funções Firebase
├── tests/                # Testes automatizados
├── *.html                # Páginas do sistema
├── *.js                  # Módulos JavaScript
├── *.css                 # Folhas de estilo
└── *.md                  # Documentação principal
```

## 🛠️ Arquivos Principais

### Páginas HTML
- `index.html` - Landing page
- `login.html` - Página de login
- `cadastro.html` - Cadastro de usuários
- `app.html` - Sistema principal (Checklist)
- `super-admin.html` - Painel super admin
- `perfil-usuario.html` - Perfil do usuário

### Módulos Core
- `config.js` - Configurações Firebase
- `firebase.js` - Inicialização Firebase
- `auth-guard.js` - Proteção de autenticação
- `oficina-guard.js` - Validação de oficina
- `session-manager.js` - Gerenciamento de sessões

### Módulos de Gestão (V2)
- `gestao_oficina_v2.js` - Sistema principal V2
- `gestao_oficina_firebase.js` - Integração Firebase
- `gestao_oficina_os.js` - Ordens de Serviço
- `gestao_oficina_clientes.js` - Gestão de clientes
- `gestao_oficina_estoque.js` - Controle de estoque
- `gestao_oficina_financeiro.js` - Financeiro
- `gestao_oficina_agendamentos.js` - Agendamentos
- `gestao_oficina_dashboard.js` - Dashboard
- `gestao_oficina_whitelabel.js` - White Label
- `gestao_oficina_plano.js` - Gerenciamento de planos
- `kanban_manager.js` - Sistema Kanban

### Estilos CSS
- `styles.css` - Estilos globais
- `gestao_oficina.css` - Estilos do sistema
- `gestao_oficina_v2.css` - Estilos V2
- `sidebar-menu.css` - Menu lateral
- `logout-style.css` - Estilos de logout
- `responsive-mobile.css` - Responsividade mobile

### Utilitários
- `pdf-logo-fix.js` - Correção de logo em PDF
- `placa-os-updater.js` - Atualização automática de OS
- `firestore-wrapper.js` - Wrapper do Firestore
- `status-monitor.js` - Monitor de status

## 📚 Documentação

Toda documentação detalhada está em `/docs/`:
- Changelogs de versões
- Guias de implementação
- Estrutura do Firebase
- Guias de migração
- Hotfixes e patches

## 🧹 Limpeza

Para limpar arquivos obsoletos, execute:
```bash
chmod +x cleanup.sh
./cleanup.sh
```

## 🚀 Versão Atual

**v3.7-hotfix-complete** - Sistema restaurado e organizado

Última atualização: 02/03/2026
