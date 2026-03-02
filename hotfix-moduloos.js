// ==========================================
// HOTFIX EMERGENCIAL - EXPOR ModuloOS
// ==========================================
// Este arquivo é um patch temporário enquanto gestao_oficina_os.js
// não pode ser restaurado corretamente

console.log('⚡ Aplicando hotfix ModuloOS...');

// Aguardar osManager estar carregado
const intervalCheck = setInterval(() => {
  if (window.osManager) {
    // Expor alias ModuloOS
    window.ModuloOS = window.osManager;
    
    console.log('✅ Hotfix ModuloOS aplicado!');
    console.log('🔍 ModuloOS agora aponta para osManager');
    
    clearInterval(intervalCheck);
  }
}, 100);

// Timeout de segurança (5 segundos)
setTimeout(() => {
  clearInterval(intervalCheck);
  
  if (!window.ModuloOS) {
    console.error('❌ Hotfix ModuloOS: osManager não foi carregado em 5s');
  }
}, 5000);