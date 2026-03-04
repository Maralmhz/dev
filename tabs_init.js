(function () {
  'use strict';
  if (window.__tabsInitV2Loaded) return;
  window.__tabsInitV2Loaded = true;

  const state = (window.__tabsDebugState = window.__tabsDebugState || {
    switchCount: 0,
    lastSwitchAt: null,
    activeTabId: null,
    delegationBound: false,
    pendingActivationTimer: null,
    gestaoActive: false,
    activationRunning: false,
  });

  function parseTabIdFromOnclick(button) {
    const onclickAttr = button?.getAttribute('onclick') || '';
    const match = onclickAttr.match(/switchTab\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : null;
  }

  function cleanupTabListeners(nextTabId) {
    console.time('🧹 cleanupTabListeners');
    const currentId = document.querySelector('.tab-content.active')?.id || null;

    if (currentId === 'gestao-oficina' && nextTabId !== 'gestao-oficina') {
      if (typeof window.pararDashboardFirestore === 'function') window.pararDashboardFirestore();
      if (typeof window.pararKanban === 'function') window.pararKanban();
      state.gestaoActive = false;
      window.dispatchEvent(new CustomEvent('tabs:cleanup', { detail: { from: currentId, to: nextTabId } }));
    }

    console.timeEnd('🧹 cleanupTabListeners');
  }

  function ativarGestaoV2() {
    if (state.activationRunning) return;
    state.activationRunning = true;

    console.time('⚙️ ativarGestaoV2');
    try {
      window.GestaoOficinaV2?.init?.();
      window.GestaoOficinaAgendamentos?.montarCalendario?.();
      window.GestaoOficinaFinanceiro?.init?.();
      window.dispatchEvent(new CustomEvent('gestao-oficina:activated'));
      state.gestaoActive = true;
    } catch (error) {
      console.error('❌ Falha ao ativar módulos V2:', error);
    } finally {
      console.timeEnd('⚙️ ativarGestaoV2');
      setTimeout(() => {
        state.activationRunning = false;
      }, 0);
    }
  }

  function scheduleGestaoActivation() {
    if (state.pendingActivationTimer) clearTimeout(state.pendingActivationTimer);
    state.pendingActivationTimer = setTimeout(() => {
      if (!state.gestaoActive) {
        ativarGestaoV2();
      }
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

  function handleDocumentClick(event) {
    const tabButton = event.target.closest('.tab-button');
    if (tabButton) {
      const targetTabId = tabButton.dataset.tabGestao ? 'gestao-oficina' : parseTabIdFromOnclick(tabButton);
      if (targetTabId) {
        state.switchCount += 1;
        state.lastSwitchAt = Date.now();
        state.activeTabId = targetTabId;
        cleanupTabListeners(targetTabId);

        if (targetTabId === 'gestao-oficina') {
          scheduleGestaoActivation();
        }
      }
      return;
    }

    const btnNovaOS = event.target.closest('[data-btn-nova-os]');
    if (btnNovaOS) {
      event.preventDefault();
      if (typeof window.abrirModalNovoOS === 'function') {
        window.abrirModalNovoOS();
      } else if (window.GestaoOficinaV2?.abrirModalNovoOS) {
        window.GestaoOficinaV2.abrirModalNovoOS();
      } else {
        console.warn('⚠️ abrirModalNovoOS não disponível');
      }
    }
  }

  function inicializarAbas() {
    if (state.delegationBound) return;
    console.time('🧩 tabs_init::inicializarAbas');

    const abaGestao = document.querySelector('[data-tab-gestao]');
    if (abaGestao) abaGestao.removeAttribute('onclick');

    document.addEventListener('click', handleDocumentClick, true);
    state.delegationBound = true;

    const initial = document.querySelector('.tab-content.active')?.id;
    state.activeTabId = initial || null;
    if (initial === 'gestao-oficina') {
      scheduleGestaoActivation();
    }

    console.timeEnd('🧩 tabs_init::inicializarAbas');
    console.log('✅ Inicialização de abas concluída!');
  }

  window.cleanupTabListeners = cleanupTabListeners;
  window.ativarGestaoV2 = ativarGestaoV2;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarAbas, { once: true });
  } else {
    inicializarAbas();
  }
})();
