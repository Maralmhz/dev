// ==========================================
// SESSION FIX - HOTFIX TEMPORÁRIO
// ==========================================
// Executa validação de oficinaId ANTES da validação rígida do app.html

console.log('💉 SessionFix: Aplicando hotfix...');

// ✅ FUNÇÃO PRINCIPAL: Validar e recuperar oficinaId
async function validarOficinaId() {
  console.log('🔐 SessionFix: Validando oficinaId...');
  
  // Aguardar Firebase Auth estar pronto
  let tentativas = 0;
  while (!firebase?.auth?.().currentUser && tentativas < 30) {
    await new Promise(resolve => setTimeout(resolve, 100));
    tentativas++;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('❌ SessionFix: Usuário não autenticado');
    return false;
  }
  
  console.log('✅ SessionFix: Usuário autenticado:', user.email);
  
  // Tentar pegar do sessionStorage primeiro
  let oficinaId = sessionStorage.getItem('oficinaId');
  
  if (oficinaId && oficinaId !== 'undefined' && oficinaId !== 'null') {
    console.log('✅ SessionFix: oficinaId encontrado no sessionStorage:', oficinaId);
    window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
    return true;
  }
  
  // Buscar no Firestore
  console.log('⚠️ SessionFix: oficinaId não encontrado, buscando no Firestore...');
  
  try {
    const userDoc = await firebase.firestore().collection('usuarios').doc(user.uid).get();
    
    if (!userDoc.exists) {
      console.error('❌ SessionFix: Usuário não encontrado no Firestore');
      return false;
    }
    
    const userData = userDoc.data();
    
    if (userData.status !== 'ativo') {
      console.error('❌ SessionFix: Usuário não ativo:', userData.status);
      return false;
    }
    
    if (!userData.oficinaId) {
      console.error('❌ SessionFix: Usuário sem oficinaId vinculado');
      return false;
    }
    
    // Salvar no sessionStorage
    oficinaId = userData.oficinaId;
    sessionStorage.setItem('oficinaId', oficinaId);
    sessionStorage.setItem('userRole', userData.role || 'user');
    sessionStorage.setItem('userEmail', user.email);
    
    window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
    
    console.log('✅ SessionFix: oficinaId recuperado do Firestore:', oficinaId);
    return true;
    
  } catch (error) {
    console.error('❌ SessionFix: Erro ao validar oficinaId:', error);
    return false;
  }
}

// ✅ Sobrescrever alert para ignorar "Sessão inválida"
const originalAlert = window.alert;
window.alert = function(message) {
  if (message && typeof message === 'string') {
    if (message.includes('Sessão inválida') || 
        message.includes('Session inválida') ||
        message.includes('Faça login novamente')) {
      console.warn('🚫 SessionFix: Bloqueou alert:', message);
      
      // Tentar validar oficinaId automaticamente
      validarOficinaId().then(success => {
        if (!success) {
          console.error('❌ SessionFix: Validação falhou, redirecionando...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 1000);
        } else {
          console.log('✅ SessionFix: Validação bem-sucedida!');
        }
      });
      
      return; // NÃO mostrar o alert
    }
  }
  return originalAlert.apply(window, arguments);
};

// ✅ Interceptar firebase.auth().signOut() temporário
let signOutBlocked = false;

if (window.firebase && firebase.auth) {
  const originalSignOut = firebase.auth().signOut.bind(firebase.auth());
  
  firebase.auth().signOut = async function() {
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if ((!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') && !signOutBlocked) {
      console.warn('🚫 SessionFix: Bloqueou signOut, tentando validar oficinaId...');
      signOutBlocked = true;
      
      const success = await validarOficinaId();
      
      if (!success) {
        console.error('❌ SessionFix: Validação falhou, fazendo logout...');
        await originalSignOut();
        window.location.href = 'index.html';
        return;
      }
      
      console.log('✅ SessionFix: Validação bem-sucedida, cancelando logout');
      signOutBlocked = false;
      return Promise.resolve();
    }
    
    return originalSignOut();
  };
}

// ✅ Executar validação imediatamente quando Firebase estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => validarOficinaId(), 500);
  });
} else {
  setTimeout(() => validarOficinaId(), 500);
}

console.log('✅ SessionFix: Hotfix aplicado!');
console.log('ℹ️ Validando oficinaId automaticamente...');