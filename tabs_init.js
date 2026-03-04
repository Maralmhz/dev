(function () {
  'use strict';
  if (window.__tabsInitV2Loaded) return;
  window.__tabsInitV2Loaded = true;

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

  function inicializarAbas() {
    console.log('🔄 Inicializando abas...');

    const abaGestaoOficina = document.querySelector('[data-tab-gestao]');
    if (abaGestaoOficina) {
      abaGestaoOficina.removeAttribute('onclick');
      if (!abaGestaoOficina.dataset.boundGestaoTab) {
        abaGestaoOficina.dataset.boundGestaoTab = '1';
        abaGestaoOficina.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof window.switchTab === 'function') {
            window.switchTab('gestao-oficina');
            window.dispatchEvent(new CustomEvent('gestao-oficina:activated'));
          }
          setTimeout(() => {
            ativarGestaoV2();
            if (typeof window.iniciarDashboardFirestore === 'function') {
              window.iniciarDashboardFirestore();
            }
            if (typeof window.iniciarKanban === 'function') {
              window.iniciarKanban();
            }
          }, 150);
        });
      }
    }

    interceptarTrocaAba();

    const observarBotaoNovaOS = () => {
      const botaoNovaOS = document.querySelector('[data-btn-nova-os]');
      if (botaoNovaOS && !botaoNovaOS.dataset.boundNovaOs) {
        botaoNovaOS.dataset.boundNovaOs = '1';
        botaoNovaOS.removeAttribute('onclick');
        botaoNovaOS.addEventListener('click', function (e) {
          e.preventDefault();
          if (typeof window.abrirModalNovoOS === 'function') {
            window.abrirModalNovoOS();
          } else if (window.GestaoOficinaV2?.abrirModalNovoOS) {
            window.GestaoOficinaV2.abrirModalNovoOS();
          } else {
            console.warn('⚠️ abrirModalNovoOS não disponível');
          }
        });
      }
    };

    const observer = new MutationObserver(observarBotaoNovaOS);
    observer.observe(document.body, { childList: true, subtree: true });
    observarBotaoNovaOS();

    const abaInicialAtiva = document.querySelector('.tab-content.active#gestao-oficina');
    if (abaInicialAtiva) {
      setTimeout(ativarGestaoV2, 50);
    }

    console.log('✅ Inicialização de abas concluída!');
  }

  function interceptarTrocaAba() {
    const botoesAba = document.querySelectorAll('.tab-button');
    botoesAba.forEach(botao => {
      if (botao.dataset.boundTabIntercept) return;
      botao.dataset.boundTabIntercept = '1';
      botao.addEventListener('click', function () {
        const abaAtual = document.querySelector('.tab-content.active');
        if (abaAtual && abaAtual.id === 'gestao-oficina') {
          if (typeof window.pararDashboardFirestore === 'function') {
            window.pararDashboardFirestore();
          }
          if (typeof window.pararKanban === 'function') {
            window.pararKanban();
          }
        }
      });
    });
  }

  window.ativarGestaoV2 = ativarGestaoV2;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAbas);
  } else {
    inicializarAbas();
  }
})();