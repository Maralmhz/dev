// ==========================================
// AUTH GUARD - PROTEÇÃO UNIVERSAL
// ==========================================

(function() {
  const ALLOWED_UNAUTHENTICATED_PAGES = [
    'index.html',
    'cadastro.html',
    'reset-password.html'
  ];
  
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Verificar se página requer autenticação
  if (!ALLOWED_UNAUTHENTICATED_PAGES.includes(currentPage)) {
    // Bloquear conteúdo imediatamente
    const style = document.createElement('style');
    style.id = 'auth-guard-lock';
    style.textContent = 'body { display: none !important; }';
    document.head.appendChild(style);
    
    // Verificar autenticação
    firebase.auth().onAuthStateChanged((user) => {
      if (!user) {
        console.error("🚫 Acesso negado - autenticação requerida");
        sessionStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'index.html';
      } else {
        // Liberar conteúdo
        document.getElementById('auth-guard-lock')?.remove();
        document.body.style.display = '';
      }
    });
  }
})();