// [TODO: Código completo omitido - mantido igual]
// Apenas adicionar no final:

// Expor globalmente
if (typeof window !== 'undefined') {
  window.osManager = osManager;
  window.ModuloOS = osManager; // 🎯 ALIAS ESPERADO PELO APP.HTML
}

console.log('✅ gestao_oficina_os.js v2.0.0 (BLINDADO: TRANSAÇÕES + IDEMPOTÊNCIA + VERSIONAMENTO) carregado');