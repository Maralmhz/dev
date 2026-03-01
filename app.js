// switchTab foi movido para checklist.js mas precisa estar disponível globalmente
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  const targetTab = document.getElementById(tabId);
  if (targetTab) targetTab.classList.add('active');
  document.querySelectorAll('.tab-button').forEach(btn => {
    const onclickAttr = btn.getAttribute('onclick');
    if (onclickAttr && onclickAttr.includes(tabId)) btn.classList.add('active');
  });
  if (tabId === 'historico' && typeof carregarHistorico === 'function') carregarHistorico();
  if (tabId === 'relatorios' && typeof atualizarRelatorios === 'function') atualizarRelatorios();
  if (tabId === 'orcamento' && typeof atualizarResumoVeiculo === 'function') atualizarResumoVeiculo();
}

function showStep(stepNum) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.step-indicator').forEach(i => i.classList.remove('active'));
  const targetStep = document.getElementById(`step${stepNum}`);
  if (targetStep) targetStep.classList.add('active');
  const indicator = document.querySelector(`.step-indicator[data-step="${stepNum}"]`);
  if (indicator) indicator.classList.add('active');
}

function nextStep(stepNum) {
  showStep(stepNum);
}

function prevStep(stepNum) {
  showStep(stepNum);
}

document.addEventListener('DOMContentLoaded', function () {
  if (!window.OFICINA_CONFIG) {
    console.warn('OFICINA_CONFIG não encontrado. Usando textos padrão do HTML.');
    return;
  }
  const cfg = window.OFICINA_CONFIG;
  const elTituloPagina = document.getElementById('titulo-pagina');
  const elLogo = document.getElementById('logo-oficina');
  const elNomeOficina = document.getElementById('nome-oficina');
  const elSubtitulo = document.getElementById('subtitulo-oficina');
  const elCnpj = document.getElementById('cnpj-oficina');
  const elTelefone = document.getElementById('telefone-oficina');
  const elEndereco = document.getElementById('endereco-oficina');
  if (elTituloPagina && cfg.nome) elTituloPagina.textContent = `Checklist de Entrada – ${cfg.nome}`;
  if (elLogo && cfg.logo) elLogo.src = cfg.logo;
  if (elNomeOficina && cfg.nome) elNomeOficina.textContent = cfg.nome;
  if (elSubtitulo && cfg.subtitulo) elSubtitulo.textContent = cfg.subtitulo;
  if (elCnpj && cfg.cnpj) elCnpj.textContent = `CNPJ: ${cfg.cnpj}`;
  if (elTelefone && cfg.telefone) elTelefone.textContent = cfg.telefone;
  if (elEndereco && cfg.endereco) elEndereco.textContent = cfg.endereco;
  if (cfg.corPrimaria) {
    document.documentElement.style.setProperty('--color-primary', cfg.corPrimaria);
  }
});

console.log('✅ app.js carregado com switchTab global');