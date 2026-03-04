// ==============================================
// 🔒 APP AUTH GUARD - SAFE BOOT SEQUENCE (v4.3)
// ==============================================

document.addEventListener('DOMContentLoaded', async function () {
  const guardStart = Date.now();
  console.log('🔒 [AUTH-GUARD] DOM ready, starting guarded boot...');

  const guardPromise = (async () => {
    if (window.bootMonitor) window.bootMonitor.start('auth-guard-execution');

    // 1) Wait for Firebase init promise
    if (!window.firebaseReady || typeof window.firebaseReady.then !== 'function') {
      throw new Error('window.firebaseReady ausente. Verifique carregamento de firebase-init.js.');
    }

    console.log('⏳ [AUTH-GUARD] Waiting for firebaseReady...');
    await window.firebaseReady;
    console.log('✅ [AUTH-GUARD] firebaseReady resolved.');

    // 2) Verify apps after readiness
    if (!window.firebase?.apps || window.firebase.apps.length === 0) {
      throw new Error('Firebase sem apps mesmo após firebaseReady. Estado inconsistente.');
    }

    // 3) Wait auth state
    const user = await new Promise((resolve) => {
      const unsubscribe = firebase.auth().onAuthStateChanged((authUser) => {
        unsubscribe();
        resolve(authUser);
      });
      setTimeout(() => resolve(null), 5000);
    });

    if (!user) {
      console.warn('❌ [AUTH-GUARD] Usuário não autenticado.');
      sessionStorage.setItem('logoutMessage', '❌ Faça login para continuar');
      window.location.href = 'index.html?from=app';
      return;
    }

    console.log('✅ [AUTH-GUARD] Usuário autenticado:', user.email);

    // 4) SessionManager
    if (!window.sessionManager) {
      throw new Error('SessionManager não disponível após boot.');
    }

    console.log('🔍 [AUTH-GUARD] Validando sessão ativa...');
    const result = await window.sessionManager.validateAndRegisterSession();

    if (!result.allowed) {
      console.error('❌ [AUTH-GUARD] Sessão bloqueada:', result.message);
      await firebase.auth().signOut();
      sessionStorage.setItem('logoutMessage', result.message || '❌ Sessão inválida. Faça login novamente.');
      window.location.href = 'index.html?from=app';
      return;
    }

    if (window.AppContext && typeof window.AppContext.init === 'function') {
      window.AppContext.init({
        oficinaId: window.OFICINA_CONFIG?.oficinaId,
        oficina_id: window.OFICINA_CONFIG?.oficina_id,
        user,
        plano: window.OFICINA_CONFIG?.plano
      });
      console.log('✅ AppContext inicializado');
    }

    // Render unlock
    const authLock = document.getElementById('auth-lock');
    if (authLock) authLock.remove();
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) authLoading.remove();

    if (document.body) {
      document.body.style.display = '';
      document.body.style.opacity = '1';
    }

    console.log(`✅ [AUTH-GUARD] Page unlocked in ${Date.now() - guardStart}ms.`);

    if (typeof window.iniciarSistemaCompleto === 'function') {
      window.bootMonitor?.start('app-initialization-call');
      await window.iniciarSistemaCompleto();
      window.bootMonitor?.complete('app-initialization-call');
    } else {
      console.warn('⚠️ [AUTH-GUARD] iniciarSistemaCompleto not found.');
    }

    if (window.bootMonitor) window.bootMonitor.complete('auth-guard-execution');
  })();

  try {
    await Promise.race([
      guardPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de validação do guard (15s).')), 15000))
    ]);
  } catch (error) {
    console.error('❌ [AUTH-GUARD] Falha durante validação:', error);
    sessionStorage.setItem('logoutMessage', '❌ Falha ao validar autenticação. Faça login novamente.');
    window.bootMonitor?.fail('auth-guard-execution', error.message || String(error));
    window.location.href = 'index.html?from=app';
  }
});

console.log('✅ [AUTH-GUARD] Script loaded, waiting DOMContentLoaded.');
