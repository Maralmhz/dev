// bootstrap-patch.js
// Patch emergencial para substituir função de inicialização
// =============================================================

console.log('🩹 Aplicando patch de bootstrap...');

// Sobrescrever função antiga se ela existir
if (typeof window.esperarModulos === 'function') {
  console.log('⚠️ Sobrescrevendo esperarModulos() antiga');
  
  // Nova versão sem polling
  window.esperarModulos = async function() {
    console.log('⏳ [PATCH] Aguardando módulos...');
    
    const MAX_TENTATIVAS = 50;
    let tentativas = 0;
    
    while (tentativas < MAX_TENTATIVAS) {
      const oficinaIdOk = !!window.OFICINA_CONFIG?.oficinaId;
      const gestaoV2Ok = typeof window.GestaoOficinaV2 !== 'undefined';
      const moduloOSOk = typeof window.ModuloOS !== 'undefined';
      
      if (oficinaIdOk && gestaoV2Ok && moduloOSOk) {
        console.log('✅ [PATCH] Módulos carregados!');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      tentativas++;
    }
    
    console.error('❌ [PATCH] Timeout');
    return false;
  };
}

// Proteger contra dupla execução
if (typeof window.iniciarSistemaCompleto === 'function') {
  const original = window.iniciarSistemaCompleto;
  let executado = false;
  
  window.iniciarSistemaCompleto = async function() {
    if (executado) {
      console.log('⚠️ [PATCH] Inicialização já executada, ignorando');
      return;
    }
    
    executado = true;
    console.log('✅ [PATCH] Executando inicialização protegida');
    
    return await original();
  };
  
  console.log('✅ Patch aplicado: iniciarSistemaCompleto agora é protegida');
}

console.log('✅ Bootstrap patch aplicado com sucesso');