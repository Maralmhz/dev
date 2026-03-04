/**
 * MÓDULOS V2 - EXPOSIÇÃO GLOBAL
 * 
 * Este arquivo garante que todos os módulos V2 estejam disponíveis
 * globalmente via window.* para facilitar testes e debugging.
 * 
 * Carregar DEPOIS de todos os scripts V2 (no final do index.html)
 */

(function exposeV2Modules() {
  'use strict';

  console.log('%c[V2 Modules] Expondo módulos globalmente...', 'color: #2563eb; font-weight: bold;');

  // Módulo GestaoV2
  if (window.GestaoOficinaV2) {
    window.GestaoV2 = window.GestaoOficinaV2;
    console.log('%c✅ GestaoV2 exposto', 'color: #16a34a;');
  } else {
    console.warn('%c⚠️ GestaoOficinaV2 não encontrado', 'color: #ea580c;');
  }

  // Módulo AgendamentosV2
  if (window.GestaoOficinaAgendamentos) {
    window.AgendamentosV2 = window.GestaoOficinaAgendamentos;
    console.log('%c✅ AgendamentosV2 exposto', 'color: #16a34a;');
  } else {
    console.warn('%c⚠️ GestaoOficinaAgendamentos não encontrado', 'color: #ea580c;');
  }

  // Módulo FinanceiroV2 (se existir)
  if (window.GestaoOficinaFinanceiro) {
    window.FinanceiroV2 = window.GestaoOficinaFinanceiro;
    console.log('%c✅ FinanceiroV2 exposto', 'color: #16a34a;');
  }

  // Módulo RecibosV2 (se existir)
  if (window.GestaoOficinaRecibos) {
    window.RecibosV2 = window.GestaoOficinaRecibos;
    console.log('%c✅ RecibosV2 exposto', 'color: #16a34a;');
  }

  // Módulo FirebaseV2 (se existir)
  if (window.GestaoOficinaFirebase) {
    window.FirebaseV2 = window.GestaoOficinaFirebase;
    console.log('%c✅ FirebaseV2 exposto', 'color: #16a34a;');
  }

  // Build marker
  if (!window.__GESTAO_V2_BUILD__) {
    window.__GESTAO_V2_BUILD__ = 'v2-cache-1.0.4-global';
  }

  console.log(`%c[V2 Modules] Build: ${window.__GESTAO_V2_BUILD__}`, 'color: #2563eb; font-weight: bold;');
  console.log('%c[V2 Modules] Todos os módulos V2 estão disponíveis via window.*', 'color: #16a34a;');

  // Log de módulos disponíveis
  const modulosDisponiveis = [];
  if (window.GestaoV2) modulosDisponiveis.push('GestaoV2');
  if (window.AgendamentosV2) modulosDisponiveis.push('AgendamentosV2');
  if (window.FinanceiroV2) modulosDisponiveis.push('FinanceiroV2');
  if (window.RecibosV2) modulosDisponiveis.push('RecibosV2');
  if (window.FirebaseV2) modulosDisponiveis.push('FirebaseV2');

  console.log(
    `%c[V2 Modules] ${modulosDisponiveis.length} módulo(s): ${modulosDisponiveis.join(', ')}`,
    'color: #2563eb;'
  );

  // Disponibilizar helper de debug
  window.debugV2 = function () {
    console.group('%c🔍 DEBUG V2 - Informações dos Módulos', 'background: #0f172a; color: white; padding: 5px; font-weight: bold;');
    
    console.log('%cBuild:', 'font-weight: bold;', window.__GESTAO_V2_BUILD__ || 'N/A');
    console.log('');

    console.log('%cMódulos Carregados:', 'font-weight: bold;');
    console.log('  GestaoV2:', window.GestaoV2 ? '✅' : '❌');
    console.log('  AgendamentosV2:', window.AgendamentosV2 ? '✅' : '❌');
    console.log('  FinanceiroV2:', window.FinanceiroV2 ? '✅' : '❌');
    console.log('  RecibosV2:', window.RecibosV2 ? '✅' : '❌');
    console.log('  FirebaseV2:', window.FirebaseV2 ? '✅' : '❌');
    console.log('');

    console.log('%cFunções Globais:', 'font-weight: bold;');
    console.log('  window.salvarNovoOS:', typeof window.salvarNovoOS === 'function' ? '✅' : '❌');
    console.log('  window.salvarOS:', typeof window.salvarOS === 'function' ? '✅' : '❌');
    console.log('  window.editarOS:', typeof window.editarOS === 'function' ? '✅' : '❌');
    console.log('  window.carregarOS:', typeof window.carregarOS === 'function' ? '✅' : '❌');
    console.log('');

    if (typeof window.carregarOS === 'function') {
      const os = window.carregarOS();
      console.log('%cDados:', 'font-weight: bold;');
      console.log(`  Total de OS: ${Array.isArray(os) ? os.length : 0}`);
      console.log(`  Firebase: ${window.firebase?.firestore ? '✅ Conectado' : '❌ Offline'}`);
    }

    console.log('');
    console.log('%cPara executar testes automáticos:', 'font-weight: bold;');
    console.log('  fetch(\'https://raw.githubusercontent.com/Maralmhz/dev/main/test-bugfixes-v2.js\').then(r => r.text()).then(eval);');

    console.groupEnd();
  };

  console.log('%c💡 Dica: Execute debugV2() no console para ver todas as informações', 'color: #2563eb; font-style: italic;');
})();
