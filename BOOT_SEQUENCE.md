# 🚀 Boot Sequence Documentation

## Ordem de Inicialização

1. **boot-sequence-monitor.js** (0ms)
   - Inicia sistema de monitoramento
   - Cria `window.bootMonitor`

2. **Firebase SDKs** (0-500ms)
   - Carrega CDN do Firebase
   - Disponibiliza `firebase` global

3. **config.js** (500-600ms)
   - Define `FIREBASE_CONFIG`
   - Define `OFICINA_CONFIG`

4. **firebase-init.js** (600-800ms)
   - Aguarda Firebase SDK
   - Inicializa Firebase
   - Resolve `window.firebaseReady`

5. **session-manager.js** (800-1000ms)
   - Cria `window.sessionManager`
   - Aguarda Firebase auth

6. **app-auth-guard.js** (DOMContentLoaded)
   - Aguarda `window.firebaseReady`
   - Valida autenticação
   - Valida sessão
   - Remove lock de render
   - Inicia app

7. **iniciarSistemaCompleto()** (após guard)
   - Carrega módulos críticos em sequência
   - Carrega módulos principais com retry
   - Carrega opcionais com `Promise.allSettled`
   - Completa boot

## Troubleshooting

### Loop Infinito
**Causa:** login.js auto-redirect + guard redirect.
**Solução:** Query parameter `?from=app` previne loop e força limpar sessão inválida.

### Firebase não inicializado
**Causa:** Race condition no load do SDK.
**Solução:** `window.firebaseReady` Promise + timeout explícito.

### Timeout de boot
**Causa:** Script travado, erro de rede ou cache inconsistente.
**Solução:** Verificar report do `window.bootMonitor.getReport()` no console e usar botão de limpeza de cache.
