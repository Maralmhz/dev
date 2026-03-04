/**
 * Auto-preenche campos de data e hora com valores atuais
 * Fix para Issue #27
 */
(function autoDateTimeInit() {
  'use strict';

  function preencherDataHoraAtual() {
    const now = new Date();
    
    // Campo de data
    const dataInput = document.getElementById('data');
    if (dataInput && !dataInput.value) {
      const ano = now.getFullYear();
      const mes = String(now.getMonth() + 1).padStart(2, '0');
      const dia = String(now.getDate()).padStart(2, '0');
      dataInput.value = `${ano}-${mes}-${dia}`;
      console.log('✅ Data preenchida automaticamente:', dataInput.value);
    }
    
    // Campo de hora
    const horaInput = document.getElementById('hora');
    if (horaInput && !horaInput.value) {
      const horas = String(now.getHours()).padStart(2, '0');
      const minutos = String(now.getMinutes()).padStart(2, '0');
      horaInput.value = `${horas}:${minutos}`;
      console.log('✅ Hora preenchida automaticamente:', horaInput.value);
    }
  }

  // Executar quando o DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preencherDataHoraAtual);
  } else {
    preencherDataHoraAtual();
  }

  // Também executar quando a aba de novo checklist for ativada
  const observador = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'novo-checklist' && mutation.target.classList.contains('active')) {
        preencherDataHoraAtual();
      }
    });
  });

  // Aguardar o elemento estar disponível
  const intervalId = setInterval(() => {
    const elemento = document.getElementById('novo-checklist');
    if (elemento) {
      observador.observe(elemento, { attributes: true, attributeFilter: ['class'] });
      clearInterval(intervalId);
    }
  }, 100);

  console.log('📅 Módulo auto-datetime carregado');
})();