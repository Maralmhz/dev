# DEPENDENCIES (v5.0.0-alpha)

## Scripts críticos (boot/autenticação)
- `boot-sequence-monitor.js`
- `config.js`
- `firebase-init.js`
- `core/error-handler.js`
- `core/app-context.js`
- `session-manager.js`
- `app-auth-guard.js`

## Scripts de feature (carregados em `iniciarSistemaCompleto`)
- `auth-guard.js`
- `oficina-guard.js`
- `firestore-wrapper.js`
- `pdf-logo-fix.js`
- `placa-os-updater.js`
- `app.js`
- `core_utils.js`
- `firebase.js`
- `checklist.js`
- `gestao_oficina*.js`
- `kanban_manager.js`
- `v2-modules-expose.js`
- `logout.js`
- `sidebar-menu.js`
- `status-monitor.js`
- `tabs_init.js` (opcional)

## Scripts potencialmente duplicados
- `firebase.js` (helpers Firebase compat)
- `firebase_app.js` (módulo Firebase v10)
- `firebase_app_OLD_GIST.js` (legado)

## Ordem de carregamento atual (`app.html`)
1. Boot monitor
2. Firebase SDK compat
3. Configuração e inicialização (`config.js`, `firebase-init.js`)
4. Infraestrutura global (`core/error-handler.js`, `core/app-context.js`)
5. Sessão e guard (`session-manager.js`, `app-auth-guard.js`)
6. Carregamento progressivo dos módulos da aplicação (`iniciarSistemaCompleto`)
