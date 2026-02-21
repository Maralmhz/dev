// ==========================================
// 🎯 KANBAN MANAGER - DRAG & DROP TEMPO REAL
// ==========================================
// Sistema Kanban com atualização em tempo real via Firestore
// Respeita multi-tenant (OFICINA_ID)

// ✅ Função auxiliar para pegar OFICINA_ID
function getOficinaIDKanban() {
  return window.OFICINA_CONFIG?.oficina_id || 'modelo';
}

// ==========================================
// ESTADO DO KANBAN
// ==========================================

let kanbanListeners = {
  recebido: null,
  em_andamento: null,
  finalizado: null
};

let draggedOS = null; // OS sendo arrastada

// ==========================================
// INICIALIZAÇÃO DO KANBAN
// ==========================================

/**
 * Inicia o Kanban com listeners em tempo real
 */
function iniciarKanban() {
  const OFICINA_ID = getOficinaIDKanban();
  console.log('🎯 Iniciando Kanban para oficina:', OFICINA_ID);
  
  if (!firebase || !firebase.firestore) {
    console.error('❌ Firebase Firestore não disponível');
    return;
  }
  
  const db = firebase.firestore();
  const baseRef = db
    .collection('oficinas')
    .doc(OFICINA_ID)
    .collection('ordens_servico');
  
  // Listener: RECEBIDO
  kanbanListeners.recebido = baseRef
    .where('status', '==', 'RECEBIDO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColuna('recebido', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban RECEBIDO:', error);
    });
  
  // Listener: EM_ANDAMENTO
  kanbanListeners.em_andamento = baseRef
    .where('status', '==', 'EM_ANDAMENTO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColuna('em_andamento', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban EM_ANDAMENTO:', error);
    });
  
  // Listener: FINALIZADO
  kanbanListeners.finalizado = baseRef
    .where('status', '==', 'FINALIZADO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColuna('finalizado', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban FINALIZADO:', error);
    });
  
  console.log('✅ Kanban iniciado com sucesso!');
}

/**
 * Para todos os listeners do Kanban
 */
function pararKanban() {
  console.log('🛑 Parando listeners do Kanban');
  
  Object.values(kanbanListeners).forEach(unsubscribe => {
    if (unsubscribe) unsubscribe();
  });
}

// ==========================================
// RENDERIZAÇÃO DAS COLUNAS
// ==========================================

/**
 * Renderiza uma coluna específica do Kanban
 */
function renderizarColuna(status, docs) {
  const containerId = status === 'em_andamento' ? 'em_andamento' : status;
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.warn('⚠️ Container não encontrado:', containerId);
    return;
  }
  
  // Limpar container
  container.innerHTML = '';
  
  if (docs.length === 0) {
    container.innerHTML = '<div class="empty-card">📦 Nenhuma OS aqui</div>';
    return;
  }
  
  // Renderizar cada OS como card
  docs.forEach(doc => {
    const data = doc.data();
    const card = criarCardOS(doc.id, data, status);
    container.appendChild(card);
  });
  
  console.log(`📋 Coluna ${status}: ${docs.length} OS`);
}

/**
 * Cria um card de OS para o Kanban
 */
function criarCardOS(osId, data, statusAtual) {
  const card = document.createElement('div');
  card.className = 'os-card';
  card.draggable = true;
  card.dataset.osId = osId;
  card.dataset.status = statusAtual;
  
  // Extrair dados
  const placa = data.veiculo?.placa || 'SEM PLACA';
  const modelo = data.veiculo?.modelo || 'Veículo';
  const cliente = data.cliente?.nome || 'Cliente não informado';
  const numeroOS = data.numero_os || osId.substring(0, 8).toUpperCase();
  const dataEntrada = formatarData(data.data_entrada);
  const total = data.financeiro?.total || 0;
  
  // HTML do card
  card.innerHTML = `
    <div class="os-header">
      <span style="font-weight: bold; color: #333;">#${numeroOS}</span>
      <span style="font-size: 12px; color: #666;">${dataEntrada}</span>
    </div>
    
    <div class="os-info">
      <div class="os-cliente">👤 ${cliente}</div>
      <div class="os-modelo">🚗 ${modelo}</div>
      <div style="background: #e3f2fd; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #1976d2; font-weight: 600; text-align: center;">
        ${placa}
      </div>
    </div>
    
    ${total > 0 ? `
      <div style="margin-top: 12px; padding: 8px; background: #f0f0f0; border-radius: 6px; text-align: center;">
        <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Total</div>
        <div style="font-size: 16px; font-weight: bold; color: #27ae60;">R$ ${total.toFixed(2)}</div>
      </div>
    ` : ''}
    
    <div class="os-actions" style="margin-top: 12px;">
      <button class="btn-acao btn-edit" onclick="editarOS('${osId}')" title="Editar">✏️</button>
      <button class="btn-acao" onclick="visualizarOS('${osId}')" style="flex: 1;">Ver Detalhes</button>
    </div>
  `;
  
  // Eventos de drag & drop
  card.addEventListener('dragstart', handleDragStart);
  card.addEventListener('dragend', handleDragEnd);
  
  return card;
}

// ==========================================
// DRAG & DROP
// ==========================================

/**
 * Inicia o arrasto de um card
 */
function handleDragStart(e) {
  draggedOS = {
    id: e.target.dataset.osId,
    statusAtual: e.target.dataset.status
  };
  
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  console.log('👋 Arrastando OS:', draggedOS.id);
}

/**
 * Finaliza o arrasto
 */
function handleDragEnd(e) {
  e.target.style.opacity = '1';
}

/**
 * Permite drop sobre a coluna
 */
function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropType = 'move';
  return false;
}

/**
 * Drop do card na coluna
 */
async function handleDrop(e, novoStatus) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (!draggedOS) return;
  
  const statusAtual = draggedOS.statusAtual;
  
  // Não fazer nada se soltar na mesma coluna
  if (statusAtual === novoStatus) {
    console.log('⚠️ Mesma coluna, nada a fazer');
    return;
  }
  
  console.log(`🔄 Movendo OS ${draggedOS.id}: ${statusAtual} → ${novoStatus}`);
  
  // Atualizar status no Firestore
  await atualizarStatusOS(draggedOS.id, novoStatus, statusAtual);
  
  draggedOS = null;
}

// ==========================================
// ATUALIZAÇÃO DE STATUS
// ==========================================

/**
 * Atualiza status da OS e registra no histórico
 */
async function atualizarStatusOS(osId, novoStatus, statusAnterior) {
  const OFICINA_ID = getOficinaIDKanban();
  
  try {
    const db = firebase.firestore();
    const osRef = db
      .collection('oficinas')
      .doc(OFICINA_ID)
      .collection('ordens_servico')
      .doc(osId);
    
    // ✅ Buscar dados da OS
    const osDoc = await osRef.get();
    if (!osDoc.exists) {
      console.error('❌ OS não encontrada:', osId);
      return;
    }
    
    const osData = osDoc.data();
    
    // ✅ Criar entrada de histórico
    const historicoEntry = {
      timestamp: firebase.firestore.Timestamp.now(),
      tipo: 'mudanca_status',
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      usuario: 'Sistema',
      descricao: `Status alterado de ${traduzirStatus(statusAnterior)} para ${traduzirStatus(novoStatus)}`
    };
    
    // ✅ Atualizar OS com novo status e histórico
    await osRef.update({
      status: novoStatus,
      ultima_atualizacao: firebase.firestore.Timestamp.now(),
      historico: firebase.firestore.FieldValue.arrayUnion(historicoEntry)
    });
    
    console.log('✅ Status atualizado:', novoStatus);
    
    // Notificação de sucesso
    if (window.mostrarNotificacao) {
      const numeroOS = osData.numero_os || osId.substring(0, 8).toUpperCase();
      window.mostrarNotificacao(
        `✅ OS #${numeroOS} movida para ${traduzirStatus(novoStatus)}`,
        'success'
      );
    }
    
  } catch (error) {
    console.error('❌ Erro ao atualizar status:', error);
    
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao('❌ Erro ao atualizar status da OS', 'danger');
    }
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Formata Timestamp do Firestore para string
 */
function formatarData(timestamp) {
  if (!timestamp) return '-';
  
  try {
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '-';
  }
}

/**
 * Traduz status para português
 */
function traduzirStatus(status) {
  const mapa = {
    'RECEBIDO': 'Recebido',
    'EM_ANDAMENTO': 'Em Andamento',
    'FINALIZADO': 'Finalizado',
    'ENTREGUE': 'Entregue'
  };
  return mapa[status] || status;
}

/**
 * Visualiza detalhes da OS (placeholder)
 */
function visualizarOS(osId) {
  console.log('👁️ Visualizar OS:', osId);
  // TODO: Implementar modal de detalhes
  if (window.mostrarNotificacao) {
    window.mostrarNotificacao('🚧 Detalhes da OS em desenvolvimento', 'info');
  }
}

/**
 * Edita a OS (placeholder)
 */
function editarOS(osId) {
  console.log('✏️ Editar OS:', osId);
  // TODO: Implementar edição
  if (window.mostrarNotificacao) {
    window.mostrarNotificacao('🚧 Edição de OS em desenvolvimento', 'info');
  }
}

// ==========================================
// INICIALIZAÇÃO DAS COLUNAS COM DROP
// ==========================================

/**
 * Configura eventos de drop nas colunas
 */
function configurarDropZones() {
  const colunas = [
    { id: 'recebido', status: 'RECEBIDO' },
    { id: 'em_andamento', status: 'EM_ANDAMENTO' },
    { id: 'finalizado', status: 'FINALIZADO' }
  ];
  
  colunas.forEach(({ id, status }) => {
    const coluna = document.getElementById(id);
    if (coluna) {
      coluna.addEventListener('dragover', handleDragOver);
      coluna.addEventListener('drop', (e) => handleDrop(e, status));
      console.log(`✅ Drop zone configurada: ${id}`);
    }
  });
}

// ==========================================
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

if (typeof window !== 'undefined') {
  window.iniciarKanban = iniciarKanban;
  window.pararKanban = pararKanban;
  window.visualizarOS = visualizarOS;
  window.editarOS = editarOS;
  window.configurarDropZones = configurarDropZones;
}

// Configurar drop zones quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarDropZones);
} else {
  configurarDropZones();
}

console.log('✅ kanban_manager.js carregado');
