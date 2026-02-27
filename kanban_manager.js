// ==========================================
// 📱 KANBAN MANAGER - MOBILE FIRST v3.1.2
// ==========================================
// Sistema Kanban otimizado para smartphones
// Cards clicáveis com menu de ações (sem drag & drop)

// ==========================================
// ESTADO DO KANBAN (DECLARADO NO TOPO)
// ==========================================

const kanbanState = {
  listeners: {
    recebido: null,
    em_andamento: null,
    finalizado: null,
  },
  modalAberto: false,
  osAtual: null,
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
  const baseRef = db.collection('oficinas').doc(OFICINA_ID).collection('ordens_servico');

  // Listener: RECEBIDO
  kanbanState.listeners.recebido = baseRef
    .where('status', '==', 'RECEBIDO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(
      snapshot => {
        renderizarColunaKanban('recebido', snapshot.docs);
      },
      error => {
        console.error('❌ Erro listener Kanban RECEBIDO:', error);
      }
    );

  // Listener: EM_ANDAMENTO
  kanbanState.listeners.em_andamento = baseRef
    .where('status', '==', 'EM_ANDAMENTO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(
      snapshot => {
        renderizarColunaKanban('em_andamento', snapshot.docs);
      },
      error => {
        console.error('❌ Erro listener Kanban EM_ANDAMENTO:', error);
      }
    );

  // Listener: FINALIZADO
  kanbanState.listeners.finalizado = baseRef
    .where('status', '==', 'FINALIZADO')
    .orderBy('data_entrada', 'desc')
    .onSnapshot(
      snapshot => {
        renderizarColunaKanban('finalizado', snapshot.docs);
      },
      error => {
        console.error('❌ Erro listener Kanban FINALIZADO:', error);
      }
    );

  // Criar modals
  criarModalAcoes();
  criarModalDetalhes();
  configurarDragDropKanban();

  console.log('✅ Kanban iniciado com sucesso!');
}

function pararKanban() {
  console.log('🛑 Parando listeners do Kanban');

  if (kanbanState && kanbanState.listeners) {
    Object.values(kanbanState.listeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    kanbanState.listeners = {
      recebido: null,
      em_andamento: null,
      finalizado: null,
    };
  }
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
    container.innerHTML =
      '<div style="padding: 30px; text-align: center; color: #999; font-size: 14px;">📦 Nenhuma OS aqui</div>';
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
    ${
      total > 0
        ? `
      <div style="margin-top: 12px; padding: 10px; background: #f0f9ff; border-radius: 8px; text-align: center; border: 1px solid #bfdbfe;">
        <div style="font-size: 11px; color: #1e40af; margin-bottom: 2px; font-weight: 600;">TOTAL ORÇAMENTO</div>
        <div style="font-size: 18px; font-weight: bold; color: #16a34a;">R$ ${total.toFixed(2)}</div>
      </div>
    `
        : `
      <div style="margin-top: 12px; padding: 10px; background: #fef3c7; border-radius: 8px; text-align: center; border: 1px solid #fbbf24;">
        <div style="font-size: 13px; color: #92400e; font-weight: 600;">📝 A ORÇAR</div>
      </div>
    `
    }
    <div style="margin-top: 12px; padding: 8px; background: #f8fafc; border-radius: 6px; text-align: center; font-size: 13px; color: #64748b; font-weight: 500;">
      👆 Toque para ações
    </div>
  `;

  card.setAttribute('draggable', 'true');
  card.dataset.osId = osId;
  card.dataset.statusAtual = statusAtual;

  card.addEventListener('dragstart', event => {
    event.dataTransfer.setData('text/plain', JSON.stringify({ osId, statusAtual, numeroOS }));
    event.dataTransfer.effectAllowed = 'move';
  });

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
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      fecharModalAcoes();
    }
  });

  // Botão fechar
  document.getElementById('modal-fechar').addEventListener('click', fecharModalAcoes);

  // Animação CSS
  if (!document.getElementById('kanban-animations')) {
    const style = document.createElement('style');
    style.id = 'kanban-animations';
    style.textContent = `
      @keyframes slideUp {
        from { transform: translateY(100%); }
        to { transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
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
    { status: 'ENTREGUE', icone: '🎉', label: 'Entregue', cor: '#8b5cf6' },
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
  btnDetalhes.onclick = () => verDetalhesOS(osId, osData);
  listaAcoes.appendChild(btnDetalhes);

  // Mostrar modal
  modal.style.display = 'flex';
}

function fecharModalAcoes() {
  const modal = document.getElementById('kanban-modal-acoes');
  modal.style.display = 'none';
  kanbanState.modalAberto = false;
}

// ==========================================
// MODAL DE DETALHES COMPLETOS
// ==========================================

function criarModalDetalhes() {
  if (document.getElementById('kanban-modal-detalhes')) return;

  const modal = document.createElement('div');
  modal.id = 'kanban-modal-detalhes';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.6);
    z-index: 10000;
    overflow-y: auto;
    animation: fadeIn 0.3s ease;
  `;

  modal.innerHTML = `
    <div id="modal-detalhes-content" style="
      background: #fff;
      width: 100%;
      max-width: 700px;
      margin: 20px auto;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      overflow: hidden;
    ">
      <!-- Conteúdo será inserido aqui -->
    </div>
  `;

  document.body.appendChild(modal);

  // Fechar ao clicar fora
  modal.addEventListener('click', e => {
    if (e.target === modal) {
      fecharModalDetalhes();
    }
  });
}

function verDetalhesOS(osId, osData) {
  fecharModalAcoes();

  const modal = document.getElementById('kanban-modal-detalhes');
  const content = document.getElementById('modal-detalhes-content');

  const numeroOS = osData.numero_os || osId.substring(0, 8).toUpperCase();
  const placa = osData.veiculo?.placa || 'SEM PLACA';
  const modelo = osData.veiculo?.modelo || '-';
  const chassi = osData.veiculo?.chassi || '-';
  const kmEntrada = osData.veiculo?.km_entrada || '-';
  const kmSaida = osData.veiculo?.km_saida || '-';
  const combustivel = osData.veiculo?.combustivel || '-';

  const clienteNome = osData.cliente?.nome || '-';
  const clienteTel = osData.cliente?.telefone || '-';
  const clienteCPF = osData.cliente?.cpf_cnpj || '-';
  const clienteEndereco = osData.cliente?.endereco || '-';

  const dataEntrada = formatarDataCompletaKanban(osData.data_entrada);
  const dataAtualizacao = formatarDataCompletaKanban(
    osData.ultima_atualizacao || osData.data_entrada
  );

  const totalPecas = osData.financeiro?.total_pecas || 0;
  const totalServicos = osData.financeiro?.total_servicos || 0;
  const totalGeral = osData.financeiro?.total || 0;

  const servicosSolicitados = osData.servicos_solicitados || '-';
  const observacoes = osData.observacoes_inspecao || '-';

  const historico = osData.historico || [];
  const statusAtual = osData.status || 'RECEBIDO';

  content.innerHTML = `
    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 24px; color: #fff;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h2 style="margin: 0; font-size: 22px;">📄 OS #${numeroOS}</h2>
        <button onclick="fecharModalDetalhes()" style="
          background: rgba(255,255,255,0.2);
          border: none;
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap;">
        <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          ${placa}
        </div>
        <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 14px;">
          ${traduzirStatusKanban(statusAtual)}
        </div>
      </div>
    </div>
    
    <!-- CONTEÚDO SCROLL -->
    <div style="padding: 20px; max-height: 70vh; overflow-y: auto;">
      
      <!-- VEÍCULO -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          🚗 VEÍCULO
        </h3>
        <div style="display: grid; gap: 8px; font-size: 14px;">
          <div><strong>Placa:</strong> ${placa}</div>
          <div><strong>Modelo:</strong> ${modelo}</div>
          <div><strong>Chassi:</strong> ${chassi}</div>
          <div><strong>KM Entrada:</strong> ${kmEntrada}</div>
          <div><strong>KM Saída:</strong> ${kmSaida}</div>
          <div><strong>Combustível:</strong> ${combustivel}</div>
        </div>
      </div>
      
      <!-- CLIENTE -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          👤 CLIENTE
        </h3>
        <div style="display: grid; gap: 8px; font-size: 14px;">
          <div><strong>Nome:</strong> ${clienteNome}</div>
          <div><strong>Telefone:</strong> ${clienteTel}</div>
          <div><strong>CPF/CNPJ:</strong> ${clienteCPF}</div>
          <div><strong>Endereço:</strong> ${clienteEndereco}</div>
        </div>
      </div>
      
      <!-- DATAS -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          📅 DATAS
        </h3>
        <div style="display: grid; gap: 8px; font-size: 14px;">
          <div><strong>Entrada:</strong> ${dataEntrada}</div>
          <div><strong>Última atualização:</strong> ${dataAtualizacao}</div>
        </div>
      </div>
      
      <!-- ORÇAMENTO -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          💰 ORÇAMENTO
        </h3>
        <div style="background: #f8fafc; padding: 16px; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>Peças:</span>
            <strong style="color: #0056b3;">R$ ${totalPecas.toFixed(2)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span>Serviços:</span>
            <strong style="color: #e41616;">R$ ${totalServicos.toFixed(2)}</strong>
          </div>
          <div style="border-top: 2px solid #ddd; padding-top: 12px; display: flex; justify-content: space-between; font-size: 18px;">
            <strong>TOTAL:</strong>
            <strong style="color: #16a34a;">R$ ${totalGeral.toFixed(2)}</strong>
          </div>
        </div>
      </div>
      
      <!-- SERVIÇOS SOLICITADOS -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          🔧 SERVIÇOS SOLICITADOS
        </h3>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
          ${servicosSolicitados}
        </div>
      </div>
      
      <!-- OBSERVAÇÕES -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          📝 OBSERVAÇÕES DA INSPEÇÃO
        </h3>
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; font-size: 14px; line-height: 1.6;">
          ${observacoes}
        </div>
      </div>
      
      <!-- HISTÓRICO -->
      <div style="margin-bottom: 24px;">
        <h3 style="color: #333; font-size: 16px; margin: 0 0 12px; padding-bottom: 8px; border-bottom: 2px solid #667eea;">
          📊 HISTÓRICO (${historico.length} eventos)
        </h3>
        ${
          historico.length > 0
            ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${historico
              .slice(0, 5)
              .reverse()
              .map(
                h => `
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; font-size: 13px; border-left: 3px solid #667eea;">
                <div style="font-weight: 600; color: #555; margin-bottom: 4px;">
                  ${formatarDataCompletaKanban(h.timestamp)}
                </div>
                <div style="color: #777;">${h.descricao || h.tipo}</div>
              </div>
            `
              )
              .join('')}
            ${historico.length > 5 ? `<div style="text-align: center; color: #999; font-size: 12px; margin-top: 8px;">+ ${historico.length - 5} eventos anteriores</div>` : ''}
          </div>
        `
            : '<div style="text-align: center; color: #999; padding: 20px;">Nenhum histórico registrado</div>'
        }
      </div>
      
    </div>
    
    <!-- FOOTER COM AÇÕES -->
    <div style="padding: 20px; border-top: 1px solid #e5e7eb; display: flex; flex-direction: column; gap: 10px;">
      <button onclick="editarOSKanban('${osId}')" style="
        width: 100%;
        padding: 14px;
        background: #3b82f6;
        border: none;
        border-radius: 10px;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">✏️ Editar OS</button>
      
      <button onclick="gerarPDFOSKanban('${osId}')" style="
        width: 100%;
        padding: 14px;
        background: #10b981;
        border: none;
        border-radius: 10px;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">📄 Gerar PDF</button>
      
      <button onclick="enviarWhatsAppOS('${numeroOS}', '${clienteNome}', '${clienteTel}')" style="
        width: 100%;
        padding: 14px;
        background: #25d366;
        border: none;
        border-radius: 10px;
        color: #fff;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">📱 Enviar WhatsApp</button>
      
      <button onclick="fecharModalDetalhes()" style="
        width: 100%;
        padding: 14px;
        background: #f1f5f9;
        border: none;
        border-radius: 10px;
        color: #64748b;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
      ">❌ Fechar</button>
    </div>
  `;

  modal.style.display = 'block';
}

function fecharModalDetalhes() {
  const modal = document.getElementById('kanban-modal-detalhes');
  if (modal) {
    modal.style.display = 'none';
  }
  if (kanbanState) {
    kanbanState.osAtual = null;
  }
}

// ==========================================
// AÇÕES
// ==========================================

async function moverOSParaStatus(osId, novoStatus, statusAnterior, numeroOS) {
  fecharModalAcoes();

  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';

  try {
    const db = firebase.firestore();
    const osRef = db.collection('oficinas').doc(OFICINA_ID).collection('ordens_servico').doc(osId);

    const historicoEntry = {
      timestamp: firebase.firestore.Timestamp.now(),
      tipo: 'mudanca_status',
      status_anterior: statusAnterior,
      status_novo: novoStatus,
      usuario: 'Sistema',
      descricao: `Status alterado de ${traduzirStatusKanban(statusAnterior)} para ${traduzirStatusKanban(novoStatus)}`,
    };

    await osRef.update({
      status: novoStatus,
      ultima_atualizacao: firebase.firestore.Timestamp.now(),
      historico: firebase.firestore.FieldValue.arrayUnion(historicoEntry),
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

async function editarOSKanban(osId) {
  fecharModalDetalhes();
  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';
  const db = firebase.firestore();
  const osRef = db.collection('oficinas').doc(OFICINA_ID).collection('ordens_servico').doc(osId);
  const doc = await osRef.get();
  if (!doc.exists) return;
  const osData = doc.data();

  const novaData = prompt(
    'Data/Hora prevista (YYYY-MM-DDTHH:mm)',
    osData.data_previsao?.toDate ? osData.data_previsao.toDate().toISOString().slice(0, 16) : ''
  );
  if (novaData === null) return;
  const novoServico = prompt(
    'Tipo de serviço (rapida/media/complexa)',
    osData.tipo_servico || 'media'
  );
  if (novoServico === null) return;
  const novaEtapa = prompt(
    'Status (RECEBIDO/EM_ANDAMENTO/FINALIZADO/ENTREGUE)',
    osData.status || 'RECEBIDO'
  );
  if (novaEtapa === null) return;

  try {
    await osRef.set(
      {
        data_previsao: novaData
          ? firebase.firestore.Timestamp.fromDate(new Date(novaData))
          : osData.data_previsao || null,
        tipo_servico: String(novoServico || 'media').toLowerCase(),
        status: String(novaEtapa || 'RECEBIDO').toUpperCase(),
        ultima_atualizacao: firebase.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    window.mostrarNotificacao?.('✅ OS atualizada com sucesso', 'success');
  } catch (error) {
    console.error('❌ Erro ao editar OS:', error);
    window.mostrarNotificacao?.('❌ Falha ao editar OS (permissão/regras)', 'danger');
  }
}

function gerarPDFOSKanban(osId) {
  console.log('📄 Gerar PDF da OS:', osId);

  if (window.mostrarNotificacao) {
    window.mostrarNotificacao('🚧 Geração de PDF em desenvolvimento', 'info');
  }
}

function enviarWhatsAppOS(numeroOS, clienteNome, clienteTel) {
  console.log('📱 Enviar WhatsApp:', numeroOS);

  const telefone = clienteTel.replace(/\D/g, '');
  const mensagem = `Olá ${clienteNome}! Sua OS #${numeroOS} foi atualizada. Qualquer dúvida, estamos à disposição!`;
  const url = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;

  window.open(url, '_blank');
}

function configurarDragDropKanban() {
  const mapa = {
    recebido: 'RECEBIDO',
    em_andamento: 'EM_ANDAMENTO',
    finalizado: 'FINALIZADO',
  };

  Object.entries(mapa).forEach(([containerId, statusDestino]) => {
    const coluna = document.getElementById(containerId);
    if (!coluna || coluna.dataset.dropBound === '1') return;
    coluna.dataset.dropBound = '1';

    coluna.addEventListener('dragover', event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      coluna.style.outline = '2px dashed #22c55e';
    });

    coluna.addEventListener('dragleave', () => {
      coluna.style.outline = 'none';
    });

    coluna.addEventListener('drop', async event => {
      event.preventDefault();
      coluna.style.outline = 'none';
      try {
        const payload = JSON.parse(event.dataTransfer.getData('text/plain') || '{}');
        if (!payload.osId || !payload.statusAtual || payload.statusAtual === statusDestino) return;
        await moverOSParaStatus(
          payload.osId,
          statusDestino,
          payload.statusAtual,
          payload.numeroOS || payload.osId.slice(0, 8)
        );
      } catch (error) {
        console.error('❌ Drop inválido:', error);
      }
    });
  });
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
      minute: '2-digit',
    });
  } catch (e) {
    return '-';
  }
}

function formatarDataCompletaKanban(timestamp) {
  if (!timestamp) return '-';

  try {
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '-';
  }
}

function traduzirStatusKanban(status) {
  const mapa = {
    RECEBIDO: 'Recebido',
    EM_ANDAMENTO: 'Em Andamento',
    FINALIZADO: 'Finalizado',
    ENTREGUE: 'Entregue',
  };
  return mapa[status] || status;
}

// ==========================================
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

if (typeof window !== 'undefined') {
  window.iniciarKanban = iniciarKanban;
  window.pararKanban = pararKanban;
  window.fecharModalDetalhes = fecharModalDetalhes;
  window.editarOSKanban = editarOSKanban;
  window.gerarPDFOSKanban = gerarPDFOSKanban;
  window.enviarWhatsAppOS = enviarWhatsAppOS;
}

console.log('✅ kanban_manager.js v3.1.2 FIX kanbanState carregado');
