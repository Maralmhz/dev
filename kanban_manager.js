// ==========================================
// 📱 KANBAN MANAGER - MOBILE FIRST
// ==========================================
// Sistema Kanban otimizado para smartphones
// Cards clicáveis com menu de ações (sem drag & drop)

const kanbanState = {
  listeners: {
    recebido: null,
    em_andamento: null,
    finalizado: null
  },
  modalAberto: false,
  osAtual: null
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
    });
  
  // Listener: EM_ANDAMENTO
  kanbanState.listeners.em_andamento = baseRef
    .where('status', '==', 'EM_ANDAMENTO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColunaKanban('em_andamento', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban EM_ANDAMENTO:', error);
    });
  
  // Listener: FINALIZADO
  kanbanState.listeners.finalizado = baseRef
    .where('status', '==', 'FINALIZADO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(snapshot => {
      renderizarColunaKanban('finalizado', snapshot.docs);
    }, error => {
      console.error('❌ Erro listener Kanban FINALIZADO:', error);
    });
  
  // Criar modal de ações (se não existir)
  criarModalAcoes();
  
  console.log('✅ Kanban iniciado com sucesso!');
}

function pararKanban() {
  console.log('🛑 Parando listeners do Kanban');
  
  Object.values(kanbanState.listeners).forEach(unsubscribe => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  });
  
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
    container.innerHTML = '<div style="padding: 30px; text-align: center; color: #999; font-size: 14px;">📦 Nenhuma OS aqui</div>';
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
  card.className = 'os-card-mobile';
  card.style.cssText = `
    background: #fff;
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  const placa = data.veiculo?.placa || 'SEM PLACA';
  const modelo = data.veiculo?.modelo || 'Veículo';
  const cliente = data.cliente?.nome || 'Cliente não informado';
  const numeroOS = data.numero_os || osId.substring(0, 8).toUpperCase();
  const dataEntrada = formatarDataKanban(data.data_entrada);
  const total = data.financeiro?.total || 0;
  
  card.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <span style="font-weight: bold; font-size: 16px; color: #333;">#${numeroOS}</span>
      <span style="font-size: 12px; color: #999;">${dataEntrada}</span>
    </div>
    <div style="font-size: 15px; color: #555; margin-bottom: 6px; font-weight: 500;">👤 ${cliente}</div>
    <div style="font-size: 14px; color: #777; margin-bottom: 8px;">🚗 ${modelo}</div>
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 8px 12px; border-radius: 8px; font-size: 14px; color: #fff; font-weight: 700; text-align: center; letter-spacing: 1px;">
      ${placa}
    </div>
    ${total > 0 ? `
      <div style="margin-top: 12px; padding: 10px; background: #f0f9ff; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
        <div style="font-size: 11px; color: #1e40af; margin-bottom: 2px; font-weight: 600;">TOTAL ORÇAMENTO</div>
        <div style="font-size: 18px; font-weight: bold; color: #16a34a;">R$ ${total.toFixed(2)}</div>
      </div>
    ` : `
      <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-radius: 8px; text-align: center; border: 1px solid #fbbf24;">
        <div style="font-size: 13px; color: #92400e; font-weight: 600;">📝 A ORÇAR</div>
      </div>
    `}
    <div style="margin-top: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; text-align: center; font-size: 13px; color: #64748b; font-weight: 500;">
      👆 Toque para ações
    </div>
  `;
  
  // Evento de clique no card
  card.addEventListener('click', () => {
    abrirModalAcoes(osId, data, statusAtual);
  });
  
  // Efeito hover (mobile)
  card.addEventListener('touchstart', () => {
    card.style.transform = 'scale(0.98)';
    card.style.borderColor = '#667eea';
  });
  
  card.addEventListener('touchend', () => {
    card.style.transform = 'scale(1)';
    card.style.borderColor = '#e0e0e0';
  });
  
  return card;
}

// ==========================================
// MODAL DE AÇÕES
// ==========================================

function criarModalAcoes() {
  if (document.getElementById('kanban-modal-acoes')) return;
  
  const modal = document.createElement('div');
  modal.id = 'kanban-modal-acoes';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 9999;
    justify-content: center;
    align-items: flex-end;
    padding: 0;
  `;
  
  modal.innerHTML = `
    <div id="modal-acoes-content" style="
      background: #fff;
      width: 100%;
      max-width: 600px;
      border-radius: 24px 24px 0 0;
      padding: 24px;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease;
    ">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 40px; height: 4px; background: #ddd; border-radius: 2px; margin: 0 auto 16px;"></div>
        <h3 id="modal-titulo" style="font-size: 18px; color: #333; margin: 0;">AÇÕES DA OS</h3>
        <p id="modal-numero" style="font-size: 14px; color: #999; margin: 4px 0 0;"></p>
      </div>
      
      <div id="modal-acoes-lista" style="display: flex; flex-direction: column; gap: 12px;">
        <!-- Botões serão inseridos aqui -->
      </div>
      
      <button id="modal-fechar" style="
        width: 100%;
        padding: 16px;
        background: #f1f5f9;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        color: #64748b;
        margin-top: 16px;
        cursor: pointer;
      ">❌ Fechar</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Fechar ao clicar fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModalAcoes();
    }
  });
  
  // Botão fechar
  document.getElementById('modal-fechar').addEventListener('click', fecharModalAcoes);
  
  // Animação CSS
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}

function abrirModalAcoes(osId, osData, statusAtual) {
  kanbanState.modalAberto = true;
  kanbanState.osAtual = { id: osId, data: osData, status: statusAtual };
  
  const modal = document.getElementById('kanban-modal-acoes');
  const titulo = document.getElementById('modal-numero');
  const listaAcoes = document.getElementById('modal-acoes-lista');
  
  const numeroOS = osData.numero_os || osId.substring(0, 8).toUpperCase();
  titulo.textContent = `OS #${numeroOS} - ${osData.veiculo?.placa || 'SEM PLACA'}`;
  
  // Limpar ações anteriores
  listaAcoes.innerHTML = '';
  
  // BOTÕES DE MUDANÇA DE STATUS
  const statusDisponiveis = [
    { status: 'RECEBIDO', icone: '📅', label: 'Recebido', cor: '#3b82f6' },
    { status: 'EM_ANDAMENTO', icone: '🔧', label: 'Em Andamento', cor: '#f59e0b' },
    { status: 'FINALIZADO', icone: '✅', label: 'Finalizado', cor: '#10b981' },
    { status: 'ENTREGUE', icone: '🎉', label: 'Entregue', cor: '#8b5cf6' }
  ];
  
  statusDisponiveis.forEach(({ status, icone, label, cor }) => {
    if (status !== statusAtual) {
      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 100%;
        padding: 18px;
        background: ${cor};
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: transform 0.1s;
      `;
      btn.innerHTML = `${icone} Mover para ${label}`;
      btn.onclick = () => moverOSParaStatus(osId, status, statusAtual, numeroOS);
      
      btn.addEventListener('touchstart', () => {
        btn.style.transform = 'scale(0.95)';
      });
      btn.addEventListener('touchend', () => {
        btn.style.transform = 'scale(1)';
      });
      
      listaAcoes.appendChild(btn);
    }
  });
  
  // SEPARADOR
  const separador = document.createElement('div');
  separador.style.cssText = 'height: 1px; background: #e5e7eb; margin: 8px 0;';
  listaAcoes.appendChild(separador);
  
  // BOTÃO VER DETALHES
  const btnDetalhes = document.createElement('button');
  btnDetalhes.style.cssText = `
    width: 100%;
    padding: 16px;
    background: #fff;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    color: #374151;
    cursor: pointer;
  `;
  btnDetalhes.innerHTML = '👁️ Ver Detalhes Completos';
  btnDetalhes.onclick = () => verDetalhesOS(osId);
  listaAcoes.appendChild(btnDetalhes);
  
  // Mostrar modal
  modal.style.display = 'flex';
}

function fecharModalAcoes() {
  const modal = document.getElementById('kanban-modal-acoes');
  modal.style.display = 'none';
  kanbanState.modalAberto = false;
  kanbanState.osAtual = null;
}

// ==========================================
// AÇÕES
// ==========================================

async function moverOSParaStatus(osId, novoStatus, statusAnterior, numeroOS) {
  fecharModalAcoes();
  
  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';
  
  try {
    const db = firebase.firestore();
    const osRef = db
      .collection('oficinas')
      .doc(OFICINA_ID)
      .collection('ordens_servico')
      .doc(osId);
    
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

function verDetalhesOS(osId) {
  fecharModalAcoes();
  console.log('👁️ Ver detalhes da OS:', osId);
  
  // TODO: Implementar modal de detalhes completo
  if (window.mostrarNotificacao) {
    window.mostrarNotificacao('🚧 Detalhes completos em desenvolvimento', 'info');
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
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

if (typeof window !== 'undefined') {
  window.iniciarKanban = iniciarKanban;
  window.pararKanban = pararKanban;
}

console.log('✅ kanban_manager.js v3.0 MOBILE-FIRST carregado');
