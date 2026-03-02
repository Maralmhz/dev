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
    
    console.log('🔐 Validando oficinaId...');
    
    // Aguardar Firebase Auth estar pronto
    const user = firebase.auth().currentUser;
    if (!user) {
      console.log('⚠️ Aguardando Firebase Auth...');
      await new Promise((resolve) => {
        const unsubscribe = firebase.auth().onAuthStateChanged((u) => {
          if (u) {
            unsubscribe();
            resolve();
          }
        });
        // Timeout de 3 segundos
        setTimeout(() => {
          unsubscribe();
          resolve();
        }, 3000);
      });
    }
    
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
      console.error('❌ Usuário não autenticado');
      this.showError('Sessão expirada. Redirecionando...');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return false;
    }
    
    // 👉 TENTAR PEGAR DO SESSION STORAGE PRIMEIRO
    let oficinaId = sessionStorage.getItem('oficinaId');
    
    if (oficinaId && oficinaId !== 'undefined' && oficinaId !== 'null') {
      console.log('✅ oficinaId encontrado no sessionStorage:', oficinaId);
      window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
      this.validated = true;
      return true;
    }
    
    // 👉 SE NÃO EXISTE, BUSCAR NO FIRESTORE
    console.log('⚠️ oficinaId não encontrado, buscando no Firestore...');
    
    try {
      const userDoc = await firebase.firestore().collection('usuarios').doc(currentUser.uid).get();
      
      if (!userDoc.exists) {
        console.error('❌ Usuário não encontrado no Firestore');
        this.showError('Sessão inválida. Faça login novamente.');
        setTimeout(async () => {
          await firebase.auth().signOut();
          window.location.href = 'index.html';
        }, 2000);
        return false;
      }
      
      const userData = userDoc.data();
      
      if (userData.status !== 'ativo') {
        console.error('❌ Usuário não ativo:', userData.status);
        this.showError('Conta não está ativa. Status: ' + userData.status);
        setTimeout(async () => {
          await firebase.auth().signOut();
          window.location.href = 'index.html';
        }, 2000);
        return false;
      }
      
      if (!userData.oficinaId) {
        console.error('❌ Usuário sem oficinaId vinculado');
        this.showError('Usuário sem oficina vinculada. Contate o suporte.');
        setTimeout(async () => {
          await firebase.auth().signOut();
          window.location.href = 'index.html';
        }, 2000);
        return false;
      }
      
      // ✅ SALVAR NO SESSION STORAGE
      oficinaId = userData.oficinaId;
      sessionStorage.setItem('oficinaId', oficinaId);
      sessionStorage.setItem('userRole', userData.role || 'user');
      sessionStorage.setItem('userEmail', currentUser.email);
      
      window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
      
      console.log('✅ oficinaId recuperado do Firestore e salvo:', oficinaId);
      this.validated = true;
      return true;
      
    } catch (error) {
      console.error('❌ Erro ao validar oficinaId:', error);
      this.showError('Erro ao validar sessão. Tente novamente.');
      setTimeout(async () => {
        await firebase.auth().signOut();
        window.location.href = 'index.html';
      }, 2000);
      return false;
    }
  },
  
  getOficinaId() {
    const oficinaId = window.OFICINA_CONFIG?.oficinaId || sessionStorage.getItem('oficinaId');
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