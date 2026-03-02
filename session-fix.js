// ==========================================
// SESSION FIX - HOTFIX TEMPORÁRIO
// ==========================================
// Intercepta a validação rígida de oficinaId no app.html
// e permite que oficina-guard.js faça a validação correta

console.log('💉 SessionFix: Aplicando hotfix...');

// ✅ SOLUÇÃO 1: Sobrescrever alert para ignorar "Sessão inválida"
const originalAlert = window.alert;
window.alert = function(message) {
  if (message && typeof message === 'string') {
    // Ignorar alerts de sessão inválida
    if (message.includes('Sessão inválida') || 
        message.includes('Session inválida') ||
        message.includes('Faça login novamente')) {
      console.warn('🚫 SessionFix: Bloqueou alert:', message);
      console.log('⏳ Aguardando oficina-guard.js validar oficinaId...');
      
      // Verificar oficinaId após 3 segundos
      setTimeout(() => {
        const oficinaId = sessionStorage.getItem('oficinaId');
        if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
          console.error('❌ SessionFix: oficinaId não foi resolvido após 3s');
          console.log('🔄 Redirecionando para login...');
          window.location.href = 'index.html';
        } else {
          console.log('✅ SessionFix: oficinaId recuperado!', oficinaId);
          window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
        }
      }, 3000);
      
      return; // NÃO mostrar o alert
    }
  }
  // Outros alerts funcionam normalmente
  return originalAlert.apply(window, arguments);
};

// ✅ SOLUÇÃO 2: Interceptar firebase.auth().signOut() temporário
let signOutBlocked = false;
let signOutTimer = null;

if (window.firebase && firebase.auth) {
  const originalSignOut = firebase.auth().signOut.bind(firebase.auth());
  
  firebase.auth().signOut = async function() {
    // Se ainda não validou oficinaId, bloquear logout temporário
    const oficinaId = sessionStorage.getItem('oficinaId');
    
    if ((!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') && !signOutBlocked) {
      console.warn('🚫 SessionFix: Bloqueou signOut temporário (aguardando oficinaId)');
      signOutBlocked = true;
      
      // Permitir logout após 3 segundos se ainda não tiver oficinaId
      signOutTimer = setTimeout(async () => {
        const checkId = sessionStorage.getItem('oficinaId');
        if (!checkId || checkId === 'undefined' || checkId === 'null') {
          console.error('❌ SessionFix: oficinaId não resolvido, fazendo logout...');
          await originalSignOut();
          window.location.href = 'index.html';
        }
      }, 3000);
      
      return Promise.resolve(); // Retorna promessa vazia
    }
    
    // Se já tem oficinaId ou já esperou, permite logout
    if (signOutTimer) clearTimeout(signOutTimer);
    return originalSignOut();
  };
}

// ✅ SOLUÇÃO 3: Monitorar sessionStorage e avisar quando oficinaId for definido
const checkOficinaId = setInterval(() => {
  const oficinaId = sessionStorage.getItem('oficinaId');
  
  if (oficinaId && oficinaId !== 'undefined' && oficinaId !== 'null') {
    console.log('✅ SessionFix: oficinaId detectado!', oficinaId);
    
    // Limpar timers de bloqueio
    if (signOutTimer) {
      clearTimeout(signOutTimer);
      signOutTimer = null;
    }
    signOutBlocked = false;
    
    // Garantir que OFICINA_CONFIG está atualizado
    if (window.OFICINA_CONFIG) {
      window.OFICINA_CONFIG.oficinaId = oficinaId;
    } else {
      window.OFICINA_CONFIG = { oficinaId };
    }
    
    clearInterval(checkOficinaId);
    console.log('✅ SessionFix: Hotfix concluído com sucesso!');
  }
}, 100);

// Timeout de segurança (10 segundos)
setTimeout(() => {
  clearInterval(checkOficinaId);
  const oficinaId = sessionStorage.getItem('oficinaId');
  
  if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
    console.error('❌ SessionFix: Timeout - oficinaId não foi resolvido em 10s');
  }
}, 10000);

console.log('✅ SessionFix: Hotfix aplicado!');
console.log('ℹ️ Aguardando oficinaId ser resolvido pelo oficina-guard.js...');