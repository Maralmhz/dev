// ==========================================
// INICIALIZADOR DE ABAS - Evita erros "is not defined"
// ==========================================
// Este arquivo garante que as funções sejam carregadas ANTES dos onclick

(function () {
  'use strict';

  const DEBUG = false;

  function debug(...args) {
    if (DEBUG) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  }

  if (window.__tabsInitV2Loaded) return;
  window.__tabsInitV2Loaded = true;

  function esperarFuncoes() {
    return new Promise(resolve => {
      const intervalo = setInterval(() => {
        // Verificar se as funções críticas estão carregadas
        if (window.switchTab) {
          clearInterval(intervalo);
          resolve();
        }
      }, 50); // Verifica a cada 50ms

      // Timeout de segurança de 5 segundos
      setTimeout(() => {
        clearInterval(intervalo);
        console.warn('⚠️ Timeout: Algumas funções podem não ter carregado');
        resolve();
      }, 5000);
    });
  }

  function ativarGestaoV2() {
    try {
      window.GestaoOficinaV2?.init?.();
      window.GestaoOficinaAgendamentos?.montarCalendario?.();
      window.GestaoOficinaFinanceiro?.init?.();
      window.dispatchEvent(new CustomEvent('gestao-oficina:activated'));
    } catch (error) {
      console.error('❌ Falha ao ativar módulos V2:', error);
    }
  }

  async function inicializarAbas() {
    debug('🔄 Aguardando carregamento das funções...');
    await esperarFuncoes();
    debug('✅ Funções carregadas! Inicializando abas...');

    // ✅ Inicializar aba Gestão Oficina com data-tab-gestao
    const abaGestaoOficina = document.querySelector('[data-tab-gestao]');
    if (abaGestaoOficina) {
      debug('🔍 Botão Gestão Oficina encontrado!');

      // Remover onclick inline se existir
      abaGestaoOficina.removeAttribute('onclick');

      // Adicionar listener seguro (apenas uma vez)
      if (!abaGestaoOficina.dataset.boundGestaoTab) {
        abaGestaoOficina.dataset.boundGestaoTab = '1';
        abaGestaoOficina.addEventListener('click', function (e) {
          e.preventDefault();
          debug('👆 Clique na aba Gestão Oficina');

          // 1. Trocar de aba
          if (typeof window.switchTab === 'function') {
            window.switchTab('gestao-oficina');
            window.dispatchEvent(new CustomEvent('gestao-oficina:activated'));
            debug('✅ Aba trocada para gestao-oficina');
          } else {
            console.error('❌ switchTab não está disponível');
          }

          // 2. Aguardar renderização e iniciar módulos
          setTimeout(() => {
            // Inicializar camada V2 explicitamente (fallback para evitar regressão visual)
            ativarGestaoV2();

            // Iniciar Dashboard
            if (typeof window.iniciarDashboardFirestore === 'function') {
              window.iniciarDashboardFirestore();
              debug('🔥 Dashboard iniciado!');
            } else {
              console.warn('⚠️ iniciarDashboardFirestore não disponível');
            }

            // Iniciar Kanban
            if (typeof window.iniciarKanban === 'function') {
              window.iniciarKanban();
              debug('🎯 Kanban iniciado!');
            } else {
              console.warn('⚠️ iniciarKanban não disponível');
            }
          }, 150);
        });
      }

      debug('✅ Aba Gestão Oficina inicializada');
    } else {
      console.error('❌ Botão [data-tab-gestao] não encontrado no DOM');
    }

    // ✅ Parar listeners ao sair da aba Gestão Oficina
    interceptarTrocaAba();

    // ✅ Inicializar botão Nova OS
    const observarBotaoNovaOS = () => {
      const botaoNovaOS = document.querySelector('[data-btn-nova-os]');
      if (botaoNovaOS && !botaoNovaOS.dataset.boundNovaOs) {
        botaoNovaOS.dataset.boundNovaOs = '1';
        botaoNovaOS.removeAttribute('onclick');
        botaoNovaOS.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof window.abrirModalNovoOS === 'function') {
            window.abrirModalNovoOS();
          }
        });
        debug('✅ Botão Nova OS inicializado');
      }
    };

    // Observar quando botão Nova OS aparecer (ele é renderizado dinamicamente)
    const observer = new MutationObserver(observarBotaoNovaOS);
    observer.observe(document.body, { childList: true, subtree: true });
    observarBotaoNovaOS(); // Tentar imediatamente também

    const abaInicialAtiva = document.querySelector('.tab-content.active#gestao-oficina');
    if (abaInicialAtiva) {
      setTimeout(ativarGestaoV2, 50);
    }

    debug('🎉 Inicialização de abas concluída!');
  }

  /**
   * Intercepta troca de aba para parar listeners
   */
  function interceptarTrocaAba() {
    const botoesAba = document.querySelectorAll('.tab-button');

    botoesAba.forEach(botao => {
      if (botao.dataset.boundTabIntercept) return;
      botao.dataset.boundTabIntercept = '1';
      botao.addEventListener('click', function () {
        // Se está saindo da aba gestão-oficina
        const abaAtual = document.querySelector('.tab-content.active');
        if (abaAtual && abaAtual.id === 'gestao-oficina') {
          // Parar dashboard
          if (typeof window.pararDashboardFirestore === 'function') {
            window.pararDashboardFirestore();
            debug('🛑 Dashboard parado');
          }

          // Parar kanban
          if (typeof window.pararKanban === 'function') {
            window.pararKanban();
            debug('🛑 Kanban parado');
          }
        }
      });
    });

    debug('✅ Interceptador de aba configurado');
  }

  window.ativarGestaoV2 = ativarGestaoV2;

  // Executar quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAbas);
  } else {
    inicializarAbas();
  }
})();
