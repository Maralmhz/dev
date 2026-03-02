// =========================================
// 🚨 APLIQUE ESTE SCRIPT NO CONSOLE DO NAVEGADOR
// =========================================
// Cole este código completo no Console (F12) e aperte Enter
// Depois recarregue a página

console.log('🩹 Aplicando patch emergencial de bootstrap...');

// 1. Sobrescrever esperarModulos para usar Promise (sem setInterval)
window.esperarModulos = async function() {
  console.log('⏳ [PATCH] Aguardando módulos (SEM POLLING)...');
  
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
      console.log('✅ [PATCH] Módulos carregados!');
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    tentativas++;
  }
  
  console.error('❌ [PATCH] Timeout');
  return false;
};

// 2. Proteger iniciarSistemaCompleto contra dupla execução
const originalIniciar = window.iniciarSistemaCompleto;
let executadoUmaVez = false;

window.iniciarSistemaCompleto = async function() {
  if (executadoUmaVez) {
    console.log('⚠️ [PATCH] Sistema já iniciado, BLOQUEANDO execução duplicada');
    return;
  }
  
  executadoUmaVez = true;
  console.log('✅ [PATCH] Executando inicialização protegida (UMA ÚNICA VEZ)');
  
  return await originalIniciar();
};

console.log('✅ Patch aplicado com sucesso!');
console.log('🔄 Agora RECARREGUE a página (Ctrl+Shift+R)');

// =========================================
// AGORA ADICIONE ESTA LINHA NO app.html:
// <script src="bootstrap-patch.js?v=3.8"></script>
// (logo após <script src="config.js?v=3.5"></script>)
// =========================================