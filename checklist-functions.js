// ==========================================
// CHECKLIST FUNCTIONS - Funções Essenciais
// ==========================================
// Define funções básicas do checklist que estão faltando

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
    
    // Verificar se html2pdf está disponível
    if (typeof html2pdf === 'undefined') {
      console.warn('⚠️ html2pdf não disponível, usando impressão do navegador');
      window.print();
      return;
    }
    
    // Pegar elemento do resumo
    const elemento = document.getElementById('conteudo-resumo');
    if (!elemento) {
      console.error('❌ Elemento conteudo-resumo não encontrado');
      alert('Erro: Conteúdo do resumo não encontrado');
      return;
    }
    
    // Gerar nome do arquivo
    const numeroOS = gerarNumeroOS();
    const nomeArquivo = `OS-${numeroOS}.pdf`;
    
    // Opções do PDF
    const opcoes = {
      margin: [10, 10, 10, 10],
      filename: nomeArquivo,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };
    
    // Gerar PDF
    await html2pdf().set(opcoes).from(elemento).save();
    
    console.log('✅ PDF gerado:', nomeArquivo);
    
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

// Expor funções globalmente
window.atualizarResumoOS = atualizarResumoOS;
window.gerarPDFResumo = gerarPDFResumo;
window.salvarChecklist = salvarChecklist;
window.gerarNumeroOS = gerarNumeroOS;

console.log('✅ Checklist Functions carregado');
