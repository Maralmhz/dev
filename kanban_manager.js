// ==========================================
// 🎯 KANBAN MANAGER - DRAG & DROP TEMPO REAL
// ==========================================
// Sistema Kanban com atualização em tempo real via Firestore
// Respeita multi-tenant (OFICINA_ID)

// ✅ ESTADO DO KANBAN (DECLARADO PRIMEIRO!)
const kanbanState = {
  listeners: {
    recebido: null,
    em_andamento: null,
    finalizado: null
  },
  draggedOS: null
};

// ==========================================
// INICIALIZAÇÃO DO KANBAN
// ==========================================

function iniciarKanban() {
  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';
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
  kanbanState.listeners.recebido = baseRef
    .where('status', '==', 'RECEBIDO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColunaKanban('recebido', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban RECEBIDO:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Crie o índice em:', error.message);
      }
    });
  
  // Listener: EM_ANDAMENTO
  kanbanState.listeners.em_andamento = baseRef
    .where('status', '==', 'EM_ANDAMENTO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColunaKanban('em_andamento', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban EM_ANDAMENTO:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Crie o índice em:', error.message);
      }
    });
  
  // Listener: FINALIZADO
  kanbanState.listeners.finalizado = baseRef
    .where('status', '==', 'FINALIZADO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColunaKanban('finalizado', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban FINALIZADO:', error);
      if (error.code === 'failed-precondition') {
        console.log('⚠️ Crie o índice em:', error.message);
      }
    });
  
  console.log('✅ Kanban iniciado com sucesso!');
}

function pararKanban() {
  console.log('🛑 Parando listeners do Kanban');
  
  Object.values(kanbanState.listeners).forEach(unsubscribe => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  
  // Resetar listeners
  kanbanState.listeners = {
    recebido: null,
    em_andamento: null,
    finalizado: null
  };
}

// ==========================================
// RENDERIZAÇÃO DAS COLUNAS
// ==========================================

function renderizarColunaKanban(status, docs) {
  const containerId = status === 'em_andamento' ? 'em_andamento' : status;
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.warn('⚠️ Container não encontrado:', containerId);
    return;
  }
  
  container.innerHTML = '';
  
  if (docs.length === 0) {
    container.innerHTML = '<div class="empty-card" style="padding: 20px; text-align: center; color: #999;">📦 Nenhuma OS aqui</div>';
    return;
  }
  
  docs.forEach(doc => {
    const data = doc.data();
    const card = criarCardKanban(doc.id, data, status);
    container.appendChild(card);
  });
  
  console.log(`📋 Coluna ${status}: ${docs.length} OS`);
}

function criarCardKanban(osId, data, statusAtual) {
  const card = document.createElement('div');
  card.className = 'os-card';
  card.draggable = true;
  card.dataset.osId = osId;
  card.dataset.status = statusAtual;
  card.style.cssText = 'background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 12px; margin-bottom: 10px; cursor: move;';
  
  const placa = data.veiculo?.placa || 'SEM PLACA';
  const modelo = data.veiculo?.modelo || 'Veículo';
  const cliente = data.cliente?.nome || 'Cliente não informado';
  const numeroOS = data.numero_os || osId.substring(0, 8).toUpperCase();
  const dataEntrada = formatarDataKanban(data.data_entrada);
  const total = data.financeiro?.total || 0;
  
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
      <span style="font-weight: bold; color: #333;">#${numeroOS}</span>
      <span style="font-size: 12px; color: #666;">${dataEntrada}</span>
    </div>
    <div style="font-size: 14px; color: #555; margin-bottom: 4px;">👤 ${cliente}</div>
    <div style="font-size: 13px; color: #777; margin-bottom: 6px;">🚗 ${modelo}</div>
    <div style="background: #e3f2fd; padding: 6px 10px; border-radius: 6px; font-size: 12px; color: #1976d2; font-weight: 600; text-align: center; margin-bottom: 8px;">
      ${placa}
    </div>
    ${total > 0 ? `
      <div style="margin-top: 8px; padding: 8px; background: #f0f0f0; border-radius: 6px; text-align: center;">
        <div style="font-size: 11px; color: #666;">Total</div>
        <div style="font-size: 16px; font-weight: bold; color: #27ae60;">R$ ${total.toFixed(2)}</div>
      </div>
    ` : ''}
  `;
  
  card.addEventListener('dragstart', handleKanbanDragStart);
  card.addEventListener('dragend', handleKanbanDragEnd);
  
  return card;
}

// ==========================================
// DRAG & DROP
// ==========================================

function handleKanbanDragStart(e) {
  kanbanState.draggedOS = {
    id: e.target.dataset.osId,
    statusAtual: e.target.dataset.status
  };
  
  e.target.style.opacity = '0.5';
  e.dataTransfer.effectAllowed = 'move';
  console.log('👋 Arrastando OS:', kanbanState.draggedOS.id);
}

function handleKanbanDragEnd(e) {
  e.target.style.opacity = '1';
}

function handleKanbanDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropType = 'move';
  return false;
}

async function handleKanbanDrop(e, novoStatus) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (!kanbanState.draggedOS) return;
  
  const statusAtual = kanbanState.draggedOS.statusAtual;
  
  if (statusAtual === novoStatus) {
    console.log('⚠️ Mesma coluna, nada a fazer');
    return;
  }
  
  console.log(`🔄 Movendo OS ${kanbanState.draggedOS.id}: ${statusAtual} → ${novoStatus}`);
  
  await atualizarStatusKanban(kanbanState.draggedOS.id, novoStatus, statusAtual);
  
  kanbanState.draggedOS = null;
}

// ==========================================
// ATUALIZAÇÃO DE STATUS
// ==========================================

async function atualizarStatusKanban(osId, novoStatus, statusAnterior) {
  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';
  
  try {
    const db = firebase.firestore();
    const osRef = db
      .collection('oficinas')
      .doc(OFICINA_ID)
      .collection('ordens_servico')
      .doc(osId);
    
    const osDoc = await osRef.get();
    if (!osDoc.exists) {
      console.error('❌ OS não encontrada:', osId);
      return;
    }
    
    const osData = osDoc.data();
    
    const historicoEntry = {
      timestamp: firebase.firestore.Timestamp.now(),
      tipo: 'mudanca_status',
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      usuario: 'Sistema',
      descricao: `Status alterado de ${traduzirStatusKanban(statusAnterior)} para ${traduzirStatusKanban(novoStatus)}`
    };
    
    await osRef.update({
      status: novoStatus,
      ultima_atualizacao: firebase.firestore.Timestamp.now(),
      historico: firebase.firestore.FieldValue.arrayUnion(historicoEntry)
    });
    
    console.log('✅ Status atualizado:', novoStatus);
    
    if (window.mostrarNotificacao) {
      const numeroOS = osData.numero_os || osId.substring(0, 8).toUpperCase();
      window.mostrarNotificacao(
        `✅ OS #${numeroOS} movida para ${traduzirStatusKanban(novoStatus)}`,
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

function formatarDataKanban(timestamp) {
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

function traduzirStatusKanban(status) {
  const mapa = {
    'RECEBIDO': 'Recebido',
    'EM_ANDAMENTO': 'Em Andamento',
    'FINALIZADO': 'Finalizado',
    'ENTREGUE': 'Entregue'
  };
  return mapa[status] || status;
}

// ==========================================
// CONFIGURAÇÃO DE DROP ZONES
// ==========================================

function configurarDropZones() {
  const colunas = [
    { id: 'recebido', status: 'RECEBIDO' },
    { id: 'em_andamento', status: 'EM_ANDAMENTO' },
    { id: 'finalizado', status: 'FINALIZADO' }
  ];
  
  colunas.forEach(({ id, status }) => {
    const coluna = document.getElementById(id);
    if (coluna) {
      coluna.addEventListener('dragover', handleKanbanDragOver);
      coluna.addEventListener('drop', (e) => handleKanbanDrop(e, status));
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
  window.configurarDropZones = configurarDropZones;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', configurarDropZones);
} else {
  configurarDropZones();
}

console.log('✅ kanban_manager.js v2.0 carregado (SEM CONFLITOS)');
