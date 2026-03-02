// ==========================================
// SESSION FIX - HOTFIX TEMPORÁRIO
// ==========================================
// Intercepta validação rígida e busca oficinaId do Firestore

console.log('💉 SessionFix: Aplicando hotfix...');

// ✅ FUNÇÃO PRINCIPAL: Validar e recuperar oficinaId
async function validarOficinaId() {
  console.log('🔐 SessionFix: Validando oficinaId...');
  
  // Aguardar Firebase Auth estar pronto (máx 10 segundos)
  let tentativas = 0;
  while (!firebase?.auth?.().currentUser && tentativas < 100) {
    await new Promise(resolve => setTimeout(resolve, 100));
    tentativas++;
  }
  
  const user = firebase.auth().currentUser;
  if (!user) {
    console.error('❌ SessionFix: Usuário não autenticado após 10s');
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
    
    console.log('✅ SessionFix: oficinaId recuperado e salvo:', oficinaId);
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
          console.error('❌ SessionFix: Validação falhou, redirecionando em 2s...');
          setTimeout(() => {
            window.location.href = 'index.html';
          }, 2000);
        } else {
          console.log('✅ SessionFix: Validação bem-sucedida!');
          // Remover tela de loading se existir
          document.getElementById('auth-loading')?.remove();
          document.getElementById('auth-lock')?.remove();
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
        signOutBlocked = false;
        await originalSignOut();
        window.location.href = 'index.html';
        return;
      }
      
      console.log('✅ SessionFix: Validação bem-sucedida, cancelando logout');
      signOutBlocked = false;
      return Promise.resolve();
    }
    
    signOutBlocked = false;
    return originalSignOut();
  };
}

// ✅ LISTENER: Aguardar onAuthStateChanged para validar
if (window.firebase && firebase.auth) {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      console.log('🔔 SessionFix: Usuário logado detectado, validando oficinaId...');
      
      // Pequeno delay para garantir que o login terminou
      setTimeout(() => {
        validarOficinaId().then(success => {
          if (success) {
            console.log('✅ SessionFix: Sistema pronto para uso!');
          }
        });
      }, 500);
    }
  });
}

console.log('✅ SessionFix: Hotfix aplicado!');
console.log('ℹ️ Aguardando login para validar oficinaId...');