// ==========================================
// SESSION FIX - HOTFIX TEMPORÁRIO
// ==========================================
// Intercepta a validação rígida de oficinaId no app.html
// e permite que oficina-guard.js faça a validação correta

console.log('💉 SessionFix: Aplicando hotfix...');

// Sobrescrever alert para ignorar "Sessão inválida"
const originalAlert = window.alert;
window.alert = function(message) {
  if (message && typeof message === 'string') {
    // Ignorar alerts de sessão inválida
    if (message.includes('Sessão inválida') || message.includes('Session inválida')) {
      console.warn('🚫 SessionFix: Bloqueou alert de "Sessão inválida"');
      return; // NÃO mostrar o alert
    }
  }
  // Outros alerts funcionam normalmente
  return originalAlert.apply(window, arguments);
};

// Interceptar redirecionamentos para index.html causados por oficinaId
const originalLocation = window.location;
let redirectBlocked = false;

Object.defineProperty(window, 'location', {
  get: function() {
    return originalLocation;
  },
  set: function(value) {
    // Se está tentando redirecionar para index.html
    if (value === 'index.html' && !redirectBlocked) {
      console.warn('🚫 SessionFix: Bloqueou redirecionamento para index.html');
      console.log('⏳ Aguardando oficina-guard.js validar oficinaId...');
      redirectBlocked = true;
      
      // Aguardar 2 segundos para oficina-guard.js trabalhar
      setTimeout(() => {
        const oficinaId = sessionStorage.getItem('oficinaId');
        if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
          console.error('❌ Após 2s, oficinaId ainda não foi resolvido');
          console.log('🔄 Permitindo redirecionamento agora...');
          originalLocation.href = 'index.html';
        } else {
          console.log('✅ SessionFix: oficinaId recuperado com sucesso!', oficinaId);
          redirectBlocked = false;
        }
      }, 2000);
      return;
    }
    originalLocation.href = value;
  }
});

console.log('✅ SessionFix: Hotfix aplicado com sucesso!');
console.log('ℹ️ Este é um fix temporário. O app.html precisa ser atualizado corretamente.');