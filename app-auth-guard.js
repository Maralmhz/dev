// ==============================================
// 🔒 APP AUTH GUARD - SAFE BOOT SEQUENCE
// ==============================================
// CSS auth-lock already blocks render
// This validates auth AFTER DOM is ready

document.addEventListener('DOMContentLoaded', async function() {
  
  console.log('🔒 [AUTH-GUARD] Starting validation...');

  try {

    // 1️⃣ Check Firebase initialized
    if (!firebase.apps || firebase.apps.length === 0) {
      console.error("❌ Firebase não inicializado.");
      sessionStorage.setItem('logoutMessage', '❌ Erro ao carregar sistema');
      window.location.href = "index.html";
      return;
    }
    console.log('✅ Firebase initialized');

    // 2️⃣ Wait for auth state
    const user = await new Promise(resolve => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });

    if (!user) {
      console.warn('❌ No user authenticated');
      sessionStorage.setItem('logoutMessage', '❌ Faça login para continuar');
      window.location.href = "index.html";
      return;
    }
    console.log('✅ User authenticated:', user.email);

    // 3️⃣ Check SessionManager
    if (!window.sessionManager) {
      console.error("❌ SessionManager não disponível.");
      sessionStorage.setItem('logoutMessage', '❌ Erro: SessionManager não carregado');
      window.location.href = "index.html";
      return;
    }
    console.log('✅ SessionManager available');

    // 4️⃣ Validate session
    console.log('🔍 Validating session limit...');
    const result = await window.sessionManager.validateAndRegisterSession();

    if (!result.allowed) {
      console.error('❌ Session blocked:', result.message);
      await firebase.auth().signOut();
      alert(result.message);
      window.location.href = "index.html";
      return;
    }
    console.log('✅ Session validated');

    // ✅ Liberar renderização
    console.log('🚀 Unlocking page...');
    
    // Remove CSS lock
    const authLock = document.getElementById('auth-lock');
    if (authLock) authLock.remove();
    
    // Remove loading screen
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) authLoading.remove();
    
    // Show body
    if (document.body) {
      document.body.style.display = '';
      document.body.style.opacity = '1';
    }
    
    console.log('✅ Page unlocked - ready to render');
    
    // Initialize app
    if (typeof window.iniciarSistemaCompleto === 'function') {
      console.log('🚀 Starting app initialization...');
      window.iniciarSistemaCompleto();
    } else {
      console.warn('⚠️ iniciarSistemaCompleto not found');
    }

  } catch (err) {
    console.error("❌ Erro no Auth Guard:", err);
    sessionStorage.setItem('logoutMessage', '❌ Erro ao validar autenticação');
    window.location.href = "index.html";
  }

});

console.log('✅ [AUTH-GUARD] Script loaded, waiting for DOM...');
