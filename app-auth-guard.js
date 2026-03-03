// ==============================================
// 🔒 APP AUTH GUARD - SAFE BOOT SEQUENCE
// ==============================================
// CSS auth-lock already blocks render
// This validates auth AFTER DOM is ready

// 🛡️ LOOP PROTECTION
const REDIRECT_KEY = '__auth_redirect_count';
const MAX_REDIRECTS = 3;

function checkRedirectLoop() {
  const count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0');
  
  if (count >= MAX_REDIRECTS) {
    console.error('❌ LOOP DETECTED! Stopping redirects.');
    sessionStorage.removeItem(REDIRECT_KEY);
    alert('❌ Erro: Loop de redirecionamento detectado. Limpe o cache e faça login novamente.');
    return true;
  }
  
  sessionStorage.setItem(REDIRECT_KEY, (count + 1).toString());
  return false;
}

function clearRedirectCount() {
  sessionStorage.removeItem(REDIRECT_KEY);
}

document.addEventListener('DOMContentLoaded', async function() {
  
  console.log('🔒 [AUTH-GUARD] Starting validation...');

  // Check for redirect loop
  if (checkRedirectLoop()) {
    // Show content even if auth failed (emergency bailout)
    const authLock = document.getElementById('auth-lock');
    if (authLock) authLock.remove();
    const authLoading = document.getElementById('auth-loading');
    if (authLoading) authLoading.remove();
    return;
  }

  try {

    // 1️⃣ Check Firebase initialized
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
      console.error("❌ Firebase não inicializado.");
      sessionStorage.setItem('logoutMessage', '❌ Erro ao carregar sistema');
      window.location.href = "index.html";
      return;
    }
    console.log('✅ Firebase initialized');

    // 2️⃣ Wait for auth state
    console.log('⏳ Waiting for auth state...');
    const user = await new Promise(resolve => {
      const unsubscribe = firebase.auth().onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.warn('⚠️ Auth state timeout');
        resolve(null);
      }, 5000);
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

    // ✅ SUCCESS - Clear redirect counter
    clearRedirectCount();

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
    clearRedirectCount();
    sessionStorage.setItem('logoutMessage', '❌ Erro ao validar autenticação: ' + err.message);
    window.location.href = "index.html";
  }

});

console.log('✅ [AUTH-GUARD] Script loaded, waiting for DOM...');
