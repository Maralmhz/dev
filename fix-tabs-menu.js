/**
 * Correção para abas e menu hamburguer não funcionando
 * Fix para Issue #29
 */
(function fixTabsAndMenu() {
  'use strict';

  console.log('🔧 Iniciando correções de abas e menu...');

  // Função para trocar de aba
  function switchTab(tabId) {
    console.log('🔄 Trocando para aba:', tabId);
    
    try {
      // Remover classe active de todas as abas
      const allTabs = document.querySelectorAll('.tab-content');
      const allButtons = document.querySelectorAll('.tab-button');
      
      allTabs.forEach(tab => tab.classList.remove('active'));
      allButtons.forEach(btn => btn.classList.remove('active'));
      
      // Adicionar classe active na aba selecionada
      const targetTab = document.getElementById(tabId);
      if (targetTab) {
        targetTab.classList.add('active');
        console.log('✅ Aba ativada:', tabId);
      } else {
        console.error('❌ Aba não encontrada:', tabId);
      }
      
      // Ativar botão correspondente
      const buttons = document.querySelectorAll('.tab-button');
      buttons.forEach(btn => {
        const onClick = btn.getAttribute('onclick');
        if (onClick && onClick.includes(tabId)) {
          btn.classList.add('active');
        }
      });
    } catch (error) {
      console.error('❌ Erro ao trocar aba:', error);
    }
  }

  // Tornar switchTab global
  window.switchTab = switchTab;

  // Função para verificar e corrigir event listeners
  function fixTabEventListeners() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach((button, index) => {
      // Verificar se já tem onclick
      if (button.hasAttribute('onclick')) {
        console.log(`✅ Botão ${index} já tem onclick`);
        return;
      }
      
      // Se não tiver, adicionar listener manual
      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const onclickAttr = this.getAttribute('onclick');
        if (onclickAttr) {
          try {
            eval(onclickAttr);
          } catch (error) {
            console.error('❌ Erro ao executar onclick:', error);
          }
        }
      });
      
      console.log(`✅ Listener adicionado ao botão ${index}`);
    });
  }

  // Função para verificar CSS bloqueador
  function checkBlockingCSS() {
    const tabButtons = document.querySelectorAll('.tab-button');
    
    tabButtons.forEach((button, index) => {
      const styles = window.getComputedStyle(button);
      const pointerEvents = styles.getPropertyValue('pointer-events');
      const zIndex = styles.getPropertyValue('z-index');
      
      if (pointerEvents === 'none') {
        console.warn(`⚠️ Botão ${index} tem pointer-events: none`);
        button.style.pointerEvents = 'auto';
      }
      
      if (parseInt(zIndex) < 0) {
        console.warn(`⚠️ Botão ${index} tem z-index negativo`);
        button.style.zIndex = '10';
      }
    });
  }

  // Função para corrigir menu hamburguer
  function fixHamburgerMenu() {
    const menuToggle = document.querySelector('[data-sidebar-toggle]');
    const menuBtn = document.querySelector('.menu-toggle');
    const hamburgerBtn = document.querySelector('.hamburger-menu');
    
    const targetBtn = menuToggle || menuBtn || hamburgerBtn;
    
    if (targetBtn) {
      console.log('🍔 Botão hamburguer encontrado');
      
      // Garantir que está clicável
      targetBtn.style.pointerEvents = 'auto';
      targetBtn.style.cursor = 'pointer';
      
      // Verificar se tem listener
      const hasListener = targetBtn.hasAttribute('onclick') || 
                         targetBtn.hasAttribute('data-sidebar-toggle');
      
      if (!hasListener) {
        targetBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const sidebar = document.querySelector('.sidebar');
          const sidebarMenu = document.querySelector('.sidebar-menu');
          const menu = sidebar || sidebarMenu;
          
          if (menu) {
            menu.classList.toggle('active');
            menu.classList.toggle('open');
            console.log('✅ Menu toggled');
          } else {
            console.error('❌ Menu sidebar não encontrado');
          }
        });
        console.log('✅ Listener adicionado ao botão hamburguer');
      }
    } else {
      console.warn('⚠️ Botão hamburguer não encontrado');
    }
  }

  // Executar correções quando o DOM estiver pronto
  function init() {
    console.log('🚀 Executando correções de UI...');
    
    fixTabEventListeners();
    checkBlockingCSS();
    fixHamburgerMenu();
    
    console.log('✅ Correções de UI aplicadas');
  }

  // Executar após um pequeno delay para garantir que o DOM está completo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }

  // Observar mudanças no DOM para garantir que novos elementos também funcionem
  const observer = new MutationObserver(function(mutations) {
    let shouldRecheck = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && (node.classList?.contains('tab-button') || node.classList?.contains('tab-content'))) {
            shouldRecheck = true;
          }
        });
      }
    });
    
    if (shouldRecheck) {
      console.log('🔄 Novos elementos detectados, reaplicando correções...');
      setTimeout(init, 50);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('🛡️ Módulo fix-tabs-menu carregado');
})();