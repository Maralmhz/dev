(function () {
  'use strict';
  if (window.__tabsInitV2Loaded) return;
  window.__tabsInitV2Loaded = true;

  const tabsState = (window.__tabsDebugState = window.__tabsDebugState || {
    listeners: [],
    delegationBound: false,
    switchCount: 0,
    lastSwitchAt: null,
    activeTabId: null,
    pendingActivationTimer: null,
  });

  function registerTrackedListener(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    tabsState.listeners.push({ target, event, handler, options });
  }

  function cleanupTrackedListeners() {
    while (tabsState.listeners.length) {
      const item = tabsState.listeners.pop();
      item.target.removeEventListener(item.event, item.handler, item.options);
    }
    tabsState.delegationBound = false;
  }

  function cleanupTabListeners(nextTabId) {
    console.time('🧹 cleanupTabListeners');
    const abaAtual = document.querySelector('.tab-content.active');
    const atualId = abaAtual?.id || null;

    if (atualId === 'gestao-oficina' && nextTabId !== 'gestao-oficina') {
      if (typeof window.pararDashboardFirestore === 'function') {
        window.pararDashboardFirestore();
      }
      if (typeof window.pararKanban === 'function') {
        window.pararKanban();
      }
      window.dispatchEvent(new CustomEvent('tabs:cleanup', { detail: { from: atualId, to: nextTabId } }));
    }

    console.timeEnd('🧹 cleanupTabListeners');
  }

  function parseTabIdFromOnclick(button) {
    const onclickAttr = button?.getAttribute('onclick') || '';
    const match = onclickAttr.match(/switchTab\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : null;
  }

  function ativarGestaoV2() {
    console.time('⚙️ ativarGestaoV2');
    try {
      window.GestaoOficinaV2?.init?.();
      window.GestaoOficinaAgendamentos?.montarCalendario?.();
      window.GestaoOficinaFinanceiro?.init?.();
      window.dispatchEvent(new CustomEvent('gestao-oficina:activated'));
    } catch (error) {
      console.error('❌ Falha ao ativar módulos V2:', error);
    } finally {
      console.timeEnd('⚙️ ativarGestaoV2');
    }
  }

  function ativarGestaoV2ComDebounce() {
    if (tabsState.pendingActivationTimer) {
      clearTimeout(tabsState.pendingActivationTimer);
    }

    tabsState.pendingActivationTimer = setTimeout(() => {
      ativarGestaoV2();
      if (typeof window.iniciarDashboardFirestoreDebounced === 'function') {
        window.iniciarDashboardFirestoreDebounced();
      } else if (typeof window.iniciarDashboardFirestore === 'function') {
        window.iniciarDashboardFirestore();
      }

      if (typeof window.iniciarKanbanDebounced === 'function') {
        window.iniciarKanbanDebounced();
      } else if (typeof window.iniciarKanban === 'function') {
        window.iniciarKanban();
      }
    }, 300);
  }

  function bindTabDelegation() {
    if (tabsState.delegationBound) return;

    const onTabClickCapture = function (event) {
      const botao = event.target.closest('.tab-button');
      if (!botao) return;

      const targetTabId = botao.dataset.tabGestao ? 'gestao-oficina' : parseTabIdFromOnclick(botao);
      if (!targetTabId) return;

      tabsState.switchCount += 1;
      tabsState.lastSwitchAt = Date.now();
      tabsState.activeTabId = targetTabId;

      cleanupTabListeners(targetTabId);

      if (targetTabId === 'gestao-oficina') {
        // A troca visual da aba continua com switchTab legado.
        // Aqui apenas protegemos inicialização pesada com debounce.
        ativarGestaoV2ComDebounce();
      }
    };

    registerTrackedListener(document, 'click', onTabClickCapture, true);
    tabsState.delegationBound = true;
  }

  function observarBotaoNovaOS() {
    const botaoNovaOS = document.querySelector('[data-btn-nova-os]');
    if (!botaoNovaOS || botaoNovaOS.dataset.boundNovaOs) return;

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

  function inicializarAbas() {
    console.time('🧩 tabs_init::inicializarAbas');
    cleanupTrackedListeners();
    bindTabDelegation();

    const abaGestaoOficina = document.querySelector('[data-tab-gestao]');
    if (abaGestaoOficina) {
      abaGestaoOficina.removeAttribute('onclick');
      if (!abaGestaoOficina.dataset.boundGestaoTab) {
        abaGestaoOficina.dataset.boundGestaoTab = '1';
      }
    }

    const observer = new MutationObserver(observarBotaoNovaOS);
    observer.observe(document.body, { childList: true, subtree: true });
    observarBotaoNovaOS();

    const abaInicialAtiva = document.querySelector('.tab-content.active#gestao-oficina');
    if (abaInicialAtiva) {
      ativarGestaoV2ComDebounce();
    }

    console.timeEnd('🧩 tabs_init::inicializarAbas');
    console.log('✅ Inicialização de abas concluída!');
  }

  window.cleanupTabListeners = cleanupTabListeners;
  window.ativarGestaoV2 = ativarGestaoV2;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAbas);
  } else {
    inicializarAbas();
  }
})();
