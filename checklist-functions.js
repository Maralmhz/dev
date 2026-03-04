// ==========================================
// CHECKLIST FUNCTIONS - Funções Essenciais
// ==========================================
// Define funções básicas do checklist que estão faltando

let pdfServiceModulePromise = null;
let ultimoPDFGerado = null;

function getPDFService() {
  if (!pdfServiceModulePromise) {
    pdfServiceModulePromise = import('./pdfService.js');
  }
  return pdfServiceModulePromise;
}

async function gerarPDFComPipeline(contexto = 'manual') {
  try {
    const { generatePDF, applyOCR } = await getPDFService();
    const resultadoPDF = await generatePDF({ numeroOS: gerarNumeroOS() }, {
      sourceSelector: '#resumoContainer'
    });

    ultimoPDFGerado = await applyOCR(resultadoPDF);
    console.log(`✅ Pipeline PDF concluído (${contexto})`, ultimoPDFGerado.ocrReason || 'sem OCR');
    return ultimoPDFGerado;
  } catch (error) {
    console.warn(`⚠️ Falha no pipeline PDF (${contexto}):`, error.message || error);
    return null;
  }
}

async function enviarPDFWhatsApp() {
  try {
    const { sendPDFToWhatsApp } = await getPDFService();
    const pdfResult = ultimoPDFGerado || await gerarPDFComPipeline('whatsapp');
    if (!pdfResult) {
      alert('Não foi possível preparar o PDF para envio.');
      return;
    }

    const envio = await sendPDFToWhatsApp(pdfResult);
    if (!envio.sent && envio.fallback === 'download') {
      alert('WhatsApp indisponível. PDF baixado como fallback.');
    }
  } catch (error) {
    console.error('❌ Erro ao enviar PDF para WhatsApp:', error);
    alert(`Erro ao enviar PDF: ${error.message}`);
  }
}


function ensureTableHorizontalScroll() {
  const tables = document.querySelectorAll('#orcamento table, #resumo table');
  tables.forEach((table) => {
    if (table.parentElement?.classList.contains('table-scroll')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentElement?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function ensureWhatsAppPDFButton() {
  if (document.getElementById('btnEnviarPdfWhatsApp')) return;

  const target = document.querySelector('#orcamento .content .action-buttons')
    || document.querySelector('#orcamento .content');
  if (!target) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'btnEnviarPdfWhatsApp';
  button.className = 'btn-primary btn-pdf-whatsapp';
  button.textContent = '📲 Enviar PDF para WhatsApp';
  button.addEventListener('click', enviarPDFWhatsApp);

  target.appendChild(button);
}

/**
 * Atualiza o resumo da OS na aba Resumo
 */
function atualizarResumoOS() {
  try {
    console.log('📝 Atualizando resumo da OS...');
    
    // Pegar dados do formulário
    const placa = document.getElementById('placa')?.value || 'N/A';
    const modelo = document.getElementById('modelo')?.value || 'N/A';
    const km = document.getElementById('km')?.value || 'N/A';
    const cliente = document.getElementById('nome_cliente')?.value || 'N/A';
    const telefone = document.getElementById('telefone_cliente')?.value || 'N/A';
    const data = document.getElementById('data')?.value || new Date().toISOString().split('T')[0];
    
    // Atualizar elementos do resumo
    document.getElementById('resumo-placa').textContent = placa;
    document.getElementById('resumo-modelo').textContent = modelo;
    document.getElementById('resumo-km').textContent = km;
    document.getElementById('resumo-cliente').textContent = cliente;
    document.getElementById('resumo-telefone').textContent = telefone;
    document.getElementById('resumo-data').textContent = data;
    
    // Atualizar número da OS
    const numeroOS = gerarNumeroOS();
    const numeroOSElement = document.getElementById('numeroOS');
    if (numeroOSElement) {
      numeroOSElement.textContent = numeroOS;
    }
    
    console.log('✅ Resumo atualizado');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar resumo:', error);
  }
}

/**
 * Gera número da OS baseado na placa e data
 */
function gerarNumeroOS() {
  const placa = (document.getElementById('placa')?.value || 'SEM').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const dataRaw = document.getElementById('data')?.value;
  const dataObj = dataRaw ? new Date(dataRaw + 'T00:00:00') : new Date();
  
  const dia = String(dataObj.getDate()).padStart(2, '0');
  const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
  const ano = String(dataObj.getFullYear()).slice(-2);
  
  return `${placa}-${dia}${mes}${ano}`;
}

/**
 * Gera PDF do resumo da OS
 */
async function gerarPDFResumo() {
  try {
    console.log('📝 Gerando PDF do resumo...');
    
    // Atualizar resumo antes de gerar PDF
    atualizarResumoOS();
    
    // Aguardar logo ser aplicada (se PDFLogoFix estiver disponível)
    if (window.PDFLogoFix?.aplicarLogoResumo) {
      await window.PDFLogoFix.aplicarLogoResumo();
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const pdfProcessado = await gerarPDFComPipeline('resumo');

    if (!pdfProcessado?.blob) {
      console.warn('⚠️ Pipeline indisponível, usando impressão do navegador');
      window.print();
      return;
    }

    const downloadLink = document.createElement('a');
    downloadLink.href = pdfProcessado.url;
    downloadLink.download = pdfProcessado.filename;
    downloadLink.click();

    console.log('✅ PDF gerado:', pdfProcessado.filename);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF: ' + error.message);
  }
}

/**
 * Salva checklist no localStorage e/ou Firebase
 */
async function salvarChecklist() {
  try {
    console.log('💾 Salvando checklist...');
    
    // Coletar dados do formulário
    const dados = {
      id: gerarIdChecklist(),
      numeroOS: gerarNumeroOS(),
      placa: document.getElementById('placa')?.value || '',
      modelo: document.getElementById('modelo')?.value || '',
      km: document.getElementById('km')?.value || '',
      chassi: document.getElementById('chassi')?.value || '',
      nome_cliente: document.getElementById('nome_cliente')?.value || '',
      telefone_cliente: document.getElementById('telefone_cliente')?.value || '',
      email_cliente: document.getElementById('email_cliente')?.value || '',
      data: document.getElementById('data')?.value || new Date().toISOString().split('T')[0],
      observacoes: document.getElementById('observacoes')?.value || '',
      criadoEm: new Date().toISOString(),
      oficinaId: window.OFICINA_CONFIG?.oficina_id || 'desconhecido'
    };
    
    // Validar dados essenciais
    if (!dados.placa || !dados.modelo || !dados.nome_cliente) {
      alert('⚠️ Preencha os campos obrigatórios: Placa, Modelo e Nome do Cliente');
      return false;
    }
    
    // Salvar no localStorage
    const chaveStorage = `checklists_${dados.oficinaId}`;
    const checklists = JSON.parse(localStorage.getItem(chaveStorage) || '[]');
    checklists.push(dados);
    localStorage.setItem(chaveStorage, JSON.stringify(checklists));
    
    console.log('✅ Checklist salvo no localStorage');
    
    // Tentar salvar no Firestore (se disponível)
    if (window.FirestoreWrapper?.salvarDocumento) {
      try {
        await window.FirestoreWrapper.salvarDocumento('checklists', dados.id, dados);
        console.log('✅ Checklist sincronizado com Firestore');
      } catch (error) {
        console.warn('⚠️ Não foi possível sincronizar com Firestore:', error);
      }
    }
    
    alert('✅ Checklist salvo com sucesso!');

    // Pipeline de PDF/OCR após salvar checklist sem interromper fluxo legado
    gerarPDFComPipeline('salvarChecklist');

    return true;
    
  } catch (error) {
    console.error('❌ Erro ao salvar checklist:', error);
    alert('Erro ao salvar: ' + error.message);
    return false;
  }
}

/**
 * Gera ID único para checklist
 */
function gerarIdChecklist() {
  if (window.CoreUtils?.generateStableId) {
    return window.CoreUtils.generateStableId('chk');
  }
  return `chk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}


/**
 * Navegação por Enter para formulários (idempotente)
 * - Enter em descrição de item -> foco no valor
 * - Enter em valor -> foco/click em adicionar
 * - Evita submit automático inesperado
 */
function createEnterNavigation(formSelector) {
  const container = document.querySelector(formSelector);
  if (!container) return null;

  if (container.dataset.enterNavBound === '1') {
    return {
      destroy() {}
    };
  }

  const handler = (event) => {
    if (event.key !== 'Enter') return;

    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const dentroDoContainer = target.closest(formSelector);
    if (!dentroDoContainer) return;

    const id = target.id || '';

    // Enter no campo de peça/descrição -> vai para preço
    if (id === 'descricaoItem') {
      event.preventDefault();
      const valorInput = container.querySelector('#valorItem');
      if (valorInput instanceof HTMLElement) {
        valorInput.focus();
      }
      return;
    }

    // Enter no preço -> vai para botão adicionar
    if (id === 'valorItem') {
      event.preventDefault();
      const btnAdicionar = container.querySelector('#btnAdicionarItem');
      if (btnAdicionar instanceof HTMLElement) {
        btnAdicionar.focus();
        if (typeof btnAdicionar.click === 'function') {
          btnAdicionar.click();
        }
      }
      return;
    }

    // Evitar submit inesperado em inputs/selects do formulário principal
    const isCampoPreventivo = target.matches('input, select');
    const emChecklistForm = !!target.closest('#checklistForm');
    if (isCampoPreventivo && emChecklistForm) {
      event.preventDefault();
    }
  };

  container.addEventListener('keydown', handler);
  container.dataset.enterNavBound = '1';

  return {
    destroy() {
      container.removeEventListener('keydown', handler);
      delete container.dataset.enterNavBound;
    }
  };
}

function initEnterNavigationChecklistOrcamento() {
  if (window.__enterNavigationInitialized) return;
  window.__enterNavigationInitialized = true;

  // O orçamento está dentro do fluxo do checklist; aplicar nos 2 escopos de forma segura
  createEnterNavigation('#checklistForm');
  createEnterNavigation('#orcamento .content');
  ensureWhatsAppPDFButton();
  ensureTableHorizontalScroll();

  const btnAdicionar = document.getElementById('btnAdicionarItem');
  if (btnAdicionar && btnAdicionar.dataset.pdfHookBound !== '1') {
    btnAdicionar.addEventListener('click', () => {
      setTimeout(() => gerarPDFComPipeline('orcamento'), 250);
    });
    btnAdicionar.dataset.pdfHookBound = '1';
  }
}

// Expor funções globalmente
window.atualizarResumoOS = atualizarResumoOS;
window.gerarPDFResumo = gerarPDFResumo;
window.salvarChecklist = salvarChecklist;
window.gerarNumeroOS = gerarNumeroOS;
window.createEnterNavigation = createEnterNavigation;
window.enviarPDFWhatsApp = enviarPDFWhatsApp;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEnterNavigationChecklistOrcamento, { once: true });
} else {
  initEnterNavigationChecklistOrcamento();
}

console.log('✅ Checklist Functions carregado');
