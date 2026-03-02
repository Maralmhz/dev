// ==========================================
// OFICINA GUARD - PROTEÇÃO MULTI-TENANT
// ==========================================

const OficinaGuard = {
  REQUIRED_CONFIG: ['oficinaId'],
  
  validate() {
    // Verificar OFICINA_CONFIG
    if (!window.OFICINA_CONFIG) {
      console.error('❌ OFICINA_CONFIG não definido');
      this.showError('Erro de configuração. Faça login novamente.');
      return false;
    }
    
    // Verificar oficinaId
    const oficinaId = window.OFICINA_CONFIG.oficinaId || sessionStorage.getItem('oficinaId');
    
    if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
      console.error('❌ oficinaId inválido:', oficinaId);
      this.showError('Sessão inválida. Redirecionando para login...');
      setTimeout(() => {
        firebase.auth().signOut();
        window.location.href = 'index.html';
      }, 2000);
      return false;
    }
    
    // Sincronizar globalmente
    window.OFICINA_CONFIG.oficinaId = oficinaId;
    sessionStorage.setItem('oficinaId', oficinaId);
    
    console.log('✅ Oficina validada:', oficinaId);
    return true;
  },
  
  getOficinaId() {
    if (!this.validate()) {
      throw new Error('oficinaId não disponível');
    }
    return window.OFICINA_CONFIG.oficinaId;
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
    `;
    alertDiv.textContent = '⚠️ ' + message;
    document.body.appendChild(alertDiv);
  }
};

// Validar automaticamente ao carregar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => OficinaGuard.validate());
} else {
  OficinaGuard.validate();
}

// Expor globalmente
window.OficinaGuard = OficinaGuard;