// ==========================================
// GESTÃO DA OFICINA - Módulo Completo
// ==========================================

const OS_AGENDA_KEY = 'os_agenda_oficina';
const ETAPAS = ['mecanica', 'lanternagem', 'preparacao', 'pintura', 'eletrica', 'montagem', 'finalizacao'];

// Criar nova OS
function novoOS(placa = '', cliente = '', telefone = '') {
  return {
    id: Date.now(),
    oficina_id: window.OFICINA_CONFIG?.oficina_id || 'default',
    placa: placa.toUpperCase(),
    nome_cliente: cliente,
    telefone: telefone,
    modelo: '',
    data_criacao: new Date().toISOString(),
    data_prevista_entrada: new Date().toISOString(),
    data_prevista_saida: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(), // +9h
    data_entrada_real: null,
    data_saida_real: null,
    status_geral: 'agendado', // agendado, em_andamento, aguardando_cliente, aguardando_peca, finalizado, cancelado
    etapa_atual: 'mecanica',
    tempo_estimado_min: 480,
    tempo_real_min: null,
    observacoes: '',
    checklist_id: null,
    atrasado: false,
    nao_compareceu: false
  };
}

// Salvar OS no localStorage
function salvarOS(os) {
  let lista = JSON.parse(localStorage.getItem(OS_AGENDA_KEY) || '[]');
  const idx = lista.findIndex(o => o.id === os.id);
  
  if (idx > -1) {
    lista[idx] = os;
  } else {
    lista.unshift(os); // Adiciona no topo
  }
  
  localStorage.setItem(OS_AGENDA_KEY, JSON.stringify(lista));
  
  // TODO: Salvar no Firebase
  // salvarOSNoFirebase(os);
}

// Carregar todas as OS
function carregarOS() {
  return JSON.parse(localStorage.getItem(OS_AGENDA_KEY) || '[]');
}

// Calcular alertas (atraso e não compareceu)
function calcularAlertas(os) {
  const agora = new Date();
  const previstaSaida = new Date(os.data_prevista_saida);
  
  // Verificar atraso
  os.atrasado = os.status_geral !== 'finalizado' && agora > previstaSaida;
  
  // Verificar não comparecimento (30 min após horário previsto)
  if (os.status_geral === 'agendado') {
    const previstaEntrada = new Date(os.data_prevista_entrada);
    const atrasoEntrada = agora.getTime() - previstaEntrada.getTime();
    os.nao_compareceu = atrasoEntrada > 30 * 60 * 1000; // 30 minutos
  } else {
    os.nao_compareceu = false;
  }
  
  return os;
}

// Renderizar Kanban
function renderizarKanban() {
  const hoje = new Date().toDateString();
  const osHoje = carregarOS()
    .filter(os => new Date(os.data_prevista_entrada).toDateString() === hoje)
    .map(calcularAlertas);
  
  const statusMap = {
    'agendado': 'agendados',
    'em_andamento': 'em_andamento',
    'finalizado': 'finalizados'
  };
  
  Object.entries(statusMap).forEach(([status, containerId]) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const filtrados = osHoje.filter(os => os.status_geral === status);
    
    if (filtrados.length === 0) {
      container.innerHTML = '<div class="empty-card">📭 Nenhum veículo</div>';
      return;
    }
    
    container.innerHTML = filtrados.map(os => `
      <div class="os-card ${os.atrasado ? 'atrasado' : ''} ${os.nao_compareceu ? 'nao-chegou' : ''}" data-id="${os.id}">
        <div class="os-header">
          <strong>${os.placa}</strong>
          ${os.atrasado ? '🚨' : os.nao_compareceu ? '⏰' : ''}
        </div>
        <div class="os-info">
          <div>👤 ${os.nome_cliente || 'Cliente não informado'}</div>
          <div>⏰ Entrada: ${new Date(os.data_prevista_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
          <div>📍 <strong>${formatarEtapa(os.etapa_atual)}</strong></div>
          ${os.observacoes ? `<div class="os-obs">💬 ${os.observacoes}</div>` : ''}
        </div>
        <div class="os-actions">
          ${os.status_geral === 'agendado' ? `<button onclick="acaoOS(${os.id}, 'entrada')" title="Marcar entrada do veículo">🚗 Entrada</button>` : ''}
          ${os.status_geral === 'em_andamento' ? `<button onclick="acaoOS(${os.id}, 'proxima_etapa')" title="Avançar para próxima etapa">🔄 Próxima</button>` : ''}
          ${os.status_geral !== 'finalizado' ? `<button onclick="acaoOS(${os.id}, 'finalizar')" class="btn-success" title="Finalizar atendimento">✅ Finalizar</button>` : ''}
          <button onclick="editarOS(${os.id})" class="btn-edit" title="Editar OS">✏️</button>
          <button onclick="excluirOS(${os.id})" class="btn-delete" title="Excluir OS">🗑️</button>
        </div>
      </div>
    `).join('');
  });
  
  atualizarResumoTopo(osHoje);
}

// Formatar nome da etapa
function formatarEtapa(etapa) {
  const nomes = {
    'mecanica': 'Mecânica',
    'lanternagem': 'Lanternagem',
    'preparacao': 'Preparação',
    'pintura': 'Pintura',
    'eletrica': 'Elétrica',
    'montagem': 'Montagem',
    'finalizacao': 'Finalização'
  };
  return nomes[etapa] || etapa;
}

// Atualizar resumo do topo
function atualizarResumoTopo(osHoje) {
  const resumo = document.getElementById('resumoTopo');
  if (!resumo) return;
  
  const counts = {
    agendado: osHoje.filter(o => o.status_geral === 'agendado').length,
    em_andamento: osHoje.filter(o => o.status_geral === 'em_andamento').length,
    atrasados: osHoje.filter(o => o.atrasado).length,
    nao_chegaram: osHoje.filter(o => o.nao_compareceu).length,
    total: osHoje.length
  };
  
  resumo.innerHTML = `
    <div class="resumo-card">
      <div class="resumo-icon">📅</div>
      <div class="resumo-info">
        <div class="resumo-label">Agendados</div>
        <div class="resumo-valor">${counts.agendado}</div>
      </div>
    </div>
    <div class="resumo-card">
      <div class="resumo-icon">🔧</div>
      <div class="resumo-info">
        <div class="resumo-label">Em Andamento</div>
        <div class="resumo-valor">${counts.em_andamento}</div>
      </div>
    </div>
    <div class="resumo-card danger">
      <div class="resumo-icon">🚨</div>
      <div class="resumo-info">
        <div class="resumo-label">Atrasados</div>
        <div class="resumo-valor">${counts.atrasados}</div>
      </div>
    </div>
    <div class="resumo-card warning">
      <div class="resumo-icon">⏰</div>
      <div class="resumo-info">
        <div class="resumo-label">Não Chegaram</div>
        <div class="resumo-valor">${counts.nao_chegaram}</div>
      </div>
    </div>
    <div class="resumo-card info">
      <div class="resumo-icon">📊</div>
      <div class="resumo-info">
        <div class="resumo-label">Total Hoje</div>
        <div class="resumo-valor">${counts.total}</div>
      </div>
    </div>
  `;
}

// Modal para criar/editar OS
let modalOS = null;
let osEditando = null;

function abrirModalNovoOS() {
  osEditando = null;
  abrirModalOS();
}

function abrirModalOS(os = null) {
  modalOS = document.createElement('div');
  modalOS.className = 'modal-overlay';
  
  const dataEntradaDefault = os ? os.data_prevista_entrada.substring(0, 16) : new Date().toISOString().substring(0, 16);
  const dataSaidaDefault = os ? os.data_prevista_saida.substring(0, 16) : new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().substring(0, 16);
  
  modalOS.innerHTML = `
    <div class="modal">
      <h3>${os ? '✏️ Editar' : '➕ Novo'} Agendamento</h3>
      <div class="modal-form">
        <input id="modal_placa" placeholder="Placa *" maxlength="8" value="${os?.placa || ''}" required>
        <input id="modal_cliente" placeholder="Nome do Cliente *" value="${os?.nome_cliente || ''}" required>
        <input id="modal_telefone" placeholder="Telefone" value="${os?.telefone || ''}">
        <input id="modal_modelo" placeholder="Modelo do Veículo" value="${os?.modelo || ''}">
        <label>Data/Hora Entrada Prevista:</label>
        <input type="datetime-local" id="modal_entrada" value="${dataEntradaDefault}">
        <label>Data/Hora Saída Prevista:</label>
        <input type="datetime-local" id="modal_saida" value="${dataSaidaDefault}">
        <textarea id="modal_obs" placeholder="Observações" rows="3">${os?.observacoes || ''}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" onclick="salvarNovoOS()">${os ? 'Salvar' : 'Criar'}</button>
        <button class="btn-secondary" onclick="fecharModal()">Cancelar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalOS);
  document.getElementById('modal_placa').focus();
  
  // Fechar ao clicar fora
  modalOS.onclick = (e) => {
    if (e.target === modalOS) fecharModal();
  };
}

function salvarNovoOS() {
  const placa = document.getElementById('modal_placa').value.trim();
  const cliente = document.getElementById('modal_cliente').value.trim();
  const telefone = document.getElementById('modal_telefone').value.trim();
  const modelo = document.getElementById('modal_modelo').value.trim();
  const entrada = document.getElementById('modal_entrada').value;
  const saida = document.getElementById('modal_saida').value;
  const obs = document.getElementById('modal_obs').value.trim();
  
  if (!placa) {
    alert('⚠️ Placa é obrigatória!');
    document.getElementById('modal_placa').focus();
    return;
  }
  
  if (!cliente) {
    alert('⚠️ Nome do cliente é obrigatório!');
    document.getElementById('modal_cliente').focus();
    return;
  }
  
  let os;
  if (osEditando) {
    os = osEditando;
    os.placa = placa.toUpperCase();
    os.nome_cliente = cliente;
    os.telefone = telefone;
    os.modelo = modelo;
    os.data_prevista_entrada = new Date(entrada).toISOString();
    os.data_prevista_saida = new Date(saida).toISOString();
    os.observacoes = obs;
  } else {
    os = novoOS(placa, cliente, telefone);
    os.modelo = modelo;
    os.data_prevista_entrada = new Date(entrada).toISOString();
    os.data_prevista_saida = new Date(saida).toISOString();
    os.observacoes = obs;
  }
  
  salvarOS(os);
  fecharModal();
  renderizarKanban();
  
  const msg = osEditando ? 'OS atualizada com sucesso!' : 'OS criada com sucesso!';
  mostrarNotificacao(msg, 'success');
}

function editarOS(id) {
  const os = carregarOS().find(o => o.id === id);
  if (!os) return;
  osEditando = os;
  abrirModalOS(os);
}

function excluirOS(id) {
  if (!confirm('🗑️ Tem certeza que deseja excluir esta OS?\n\nEsta ação não pode ser desfeita.')) return;
  
  let lista = carregarOS().filter(o => o.id !== id);
  localStorage.setItem(OS_AGENDA_KEY, JSON.stringify(lista));
  renderizarKanban();
  mostrarNotificacao('OS excluída com sucesso!', 'success');
}

// Ações da OS
function acaoOS(id, acao) {
  const os = carregarOS().find(o => o.id === id);
  if (!os) return;
  
  switch (acao) {
    case 'entrada':
      if (!os.data_entrada_real) {
        os.data_entrada_real = new Date().toISOString();
        os.status_geral = 'em_andamento';
        mostrarNotificacao(`🚗 Entrada registrada: ${os.placa}`, 'success');
      }
      break;
      
    case 'proxima_etapa':
      const idxAtual = ETAPAS.indexOf(os.etapa_atual);
      if (idxAtual < ETAPAS.length - 1) {
        os.etapa_atual = ETAPAS[idxAtual + 1];
        mostrarNotificacao(`🔄 ${os.placa} → ${formatarEtapa(os.etapa_atual)}`, 'info');
      } else {
        mostrarNotificacao('⚠️ Já está na última etapa. Use "Finalizar".', 'warning');
        return;
      }
      break;
      
    case 'finalizar':
      if (confirm(`✅ Finalizar atendimento de ${os.placa}?`)) {
        os.data_saida_real = new Date().toISOString();
        os.status_geral = 'finalizado';
        os.etapa_atual = 'finalizacao';
        
        // Calcular tempo real
        if (os.data_entrada_real) {
          const entrada = new Date(os.data_entrada_real);
          const saida = new Date(os.data_saida_real);
          os.tempo_real_min = Math.round((saida - entrada) / (1000 * 60));
        }
        
        mostrarNotificacao(`✅ ${os.placa} finalizado!`, 'success');
      } else {
        return;
      }
      break;
  }
  
  salvarOS(os);
  renderizarKanban();
}

function fecharModal() {
  if (modalOS) {
    modalOS.remove();
    modalOS = null;
  }
  osEditando = null;
}

// Sistema de notificações
function mostrarNotificacao(mensagem, tipo = 'info') {
  const notif = document.createElement('div');
  notif.className = `notificacao notif-${tipo}`;
  notif.textContent = mensagem;
  
  document.body.appendChild(notif);
  
  setTimeout(() => notif.classList.add('show'), 10);
  
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

// Inicialização quando a aba é aberta
function iniciarGestaoOficina() {
  renderizarKanban();
  
  // Atualizar alertas a cada 1 minuto
  setInterval(() => {
    if (document.getElementById('gestao-oficina')?.classList.contains('active')) {
      renderizarKanban();
    }
  }, 60000);
}

// Iniciar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gestao-oficina')) {
      iniciarGestaoOficina();
    }
  });
} else {
  if (document.getElementById('gestao-oficina')) {
    iniciarGestaoOficina();
  }
}
