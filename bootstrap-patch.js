// bootstrap-patch.js
// Patch AGRESSIVO para eliminar polling e timeouts
// ==================================================

console.log('🩹 Aplicando patch de bootstrap...');

// 🚨 SOBRESCREVER esperarModulos ANTES QUE ELE SEJA CHAMADO
window.esperarModulos = async function() {
  console.log('⏳ [PATCH] Aguardando módulos (Promise-based, SEM polling)...');
  
  const MAX_TENTATIVAS = 50;
  let tentativas = 0;
  
  while (tentativas < MAX_TENTATIVAS) {
    const oficinaIdOk = !!window.OFICINA_CONFIG?.oficinaId;
    const gestaoV2Ok = typeof window.GestaoOficinaV2 !== 'undefined';
    const moduloOSOk = typeof window.ModuloOS !== 'undefined';
    
    if (tentativas % 10 === 0) {
      console.log(`🔍 [PATCH] Check [${tentativas}]: oficinaId=${oficinaIdOk}, GestaoV2=${gestaoV2Ok}, ModuloOS=${moduloOSOk}`);
    }
    
    if (oficinaIdOk && gestaoV2Ok && moduloOSOk) {
      console.log('✅ [PATCH] Todos os módulos carregados!');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    tentativas++;
  }
  
  console.error('❌ [PATCH] Timeout aguardando módulos');
  return false;
};

// 🔒 PROTEGER iniciarSistemaCompleto contra dupla execução
if (typeof window.iniciarSistemaCompleto === 'function') {
  const funcaoOriginal = window.iniciarSistemaCompleto;
  let jaExecutou = false;
  
  window.iniciarSistemaCompleto = async function() {
    if (jaExecutou) {
      console.log('⚠️ [PATCH] Sistema já iniciado, bloqueando execução duplicada');
      return;
    }
    
    jaExecutou = true;
    console.log('✅ [PATCH] Executando inicialização protegida (UMA ÚNICA VEZ)');
    
    try {
      return await funcaoOriginal();
    } catch (error) {
      console.error('❌ [PATCH] Erro na inicialização:', error);
      jaExecutou = false; // Permitir retry em caso de erro
      throw error;
    }
  };
  
  console.log('✅ [PATCH] iniciarSistemaCompleto protegida contra dupla execução');
}

console.log('✅ Bootstrap patch aplicado com sucesso');

// 🧹 LIMPEZA: Tentar cancelar qualquer setInterval/setTimeout residual do código antigo
// (isso é agressivo mas necessário para eliminar race conditions)
if (typeof window.__timeoutCleanup === 'undefined') {
  window.__timeoutCleanup = true;
  
  // Guardar referências originais
  const _setTimeout = window.setTimeout;
  const _setInterval = window.setInterval;
  const timersAtivos = new Set();
  
  // Interceptar setTimeout para rastrear timers
  window.setTimeout = function(...args) {
    const id = _setTimeout.apply(this, args);
    timersAtivos.add({ type: 'timeout', id });
    return id;
  };
  
  // Interceptar setInterval para rastrear intervals
  window.setInterval = function(...args) {
    const id = _setInterval.apply(this, args);
    timersAtivos.add({ type: 'interval', id });
    return id;
  };
  
  // Expor função para limpar timers se necessário
  window.limparTimersLegados = function() {
    console.log(`🧹 Limpando ${timersAtivos.size} timers residuais...`);
    timersAtivos.forEach(timer => {
      if (timer.type === 'timeout') clearTimeout(timer.id);
      if (timer.type === 'interval') clearInterval(timer.id);
    });
    timersAtivos.clear();
    console.log('✅ Timers limpos');
  };
  
  console.log('🔍 Timer tracking ativado (use limparTimersLegados() se necessário)');
}