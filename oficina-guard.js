// ==========================================
// OFICINA GUARD - PROTEÇÃO MULTI-TENANT
// ==========================================

const OficinaGuard = {
  REQUIRED_CONFIG: ['oficinaId'],
  validated: false,
  
  async validate() {
    if (this.validated) {
      console.log('✅ oficinaGuard já validado anteriormente');
      return true;
    }
    
    console.log('🔐 Validando oficinaId resolvido pelo SessionManager...');

    let tentativas = 0;
    while (!window.sessionManager && tentativas < 100) {
      await new Promise(resolve => setTimeout(resolve, 100));
      tentativas += 1;
    }

    if (!window.sessionManager) {
      console.error('❌ SessionManager não disponível');
      this.showError('Erro de inicialização da sessão.');
      return false;
    }

    const currentUser = await window.sessionManager.waitForAuthReady();
    if (!currentUser) {
      console.error('❌ Usuário não autenticado após inicialização');
      this.showError('Sessão expirada. Redirecionando...');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return false;
    }

    const oficinaId = window.sessionManager.oficinaId || sessionStorage.getItem('oficinaId');
    if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
      console.error('❌ oficinaId não foi resolvido pelo SessionManager');
      this.showError('Erro ao validar sessão. Tente novamente.');
      setTimeout(async () => {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      }, 2000);
      return false;
    }

    window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
    this.validated = true;
    console.log('✅ oficinaGuard validado com oficinaId pronto:', oficinaId);
    return true;
  },
  
  getOficinaId() {
    const oficinaId = (window.AppContext?.isReady?.() ? window.AppContext.getOficinaId() : null) || window.OFICINA_CONFIG?.oficinaId || sessionStorage.getItem('oficinaId');
    if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
      console.error('❌ oficinaId não disponível');
      throw new Error('oficinaId não disponível');
    }
    return oficinaId;
  },
  
  showError(message) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #f8d7da;
      color: #721c24;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 999999;
      font-weight: 600;
      max-width: 90%;
      text-align: center;
    `;
    alertDiv.textContent = '⚠️ ' + message;
    document.body.appendChild(alertDiv);
  }
};

// Validar automaticamente ao carregar (async)
(async function() {
  if (document.readyState === 'loading') {
    await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
  }
  await OficinaGuard.validate();
})();

// Expor globalmente
window.OficinaGuard = OficinaGuard;
