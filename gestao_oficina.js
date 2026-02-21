// ==========================================
// GESTÃO DA OFICINA - Módulo Completo V2
// ==========================================

const OS_AGENDA_KEY = 'os_agenda_oficina';
const ETAPAS = [
  { id: 'mecanica', nome: 'Mecânica', icon: '🔧' },
  { id: 'lanternagem', nome: 'Lanternagem', icon: '🔨' },
  { id: 'preparacao', nome: 'Preparação', icon: '🎨' },
  { id: 'pintura', nome: 'Pintura', icon: '🖌️' },
  { id: 'eletrica', nome: 'Elétrica', icon: '⚡' },
  { id: 'montagem', nome: 'Montagem', icon: '🔩' },
  { id: 'finalizacao', nome: 'Finalização', icon: '✅' }
];

const PRIORIDADES = {
  urgente: { nome: 'Urgente', cor: '🔴', class: 'prioridade-urgente' },
  normal: { nome: 'Normal', cor: '🟡', class: 'prioridade-normal' },
  baixa: { nome: 'Baixa', cor: '🟢', class: 'prioridade-baixa' }
};

let visualizacaoAtual = 'hoje'; // hoje, semana, mes, ano
let dropdownAberto = null;
let filtroKanbanAtivo = null;
let modoCalendarioCompacto = false;

// ==========================================
// MODELO DE DADOS
// ==========================================

function novoOS(placa = '', cliente = '') {
  return {
    id: gerarIdOS(),
    oficina_id: window.OFICINA_CONFIG?.oficina_id || 'default',
    placa: placa.toUpperCase(),
    nome_cliente: cliente,
    cliente_id: '',
    telefone: '',
    modelo: '',
    veiculo_id: '',
    data_criacao: new Date().toISOString(),
    data_prevista_entrada: new Date().toISOString(),
    data_prevista_saida: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
    data_entrada_real: null,
    data_saida_real: null,
    status_geral: 'agendado',
    etapa_atual: 'mecanica',
    prioridade: 'normal',
    tipo_servico: 'media', // rapida, media, complexa
    tempo_estimado_min: 480,
    tempo_real_min: null,
    custo_pecas: 0,
    custo_servicos: 0,
    valor_total: 0,
    margem_lucro: 0,
    status_pagamento: 'pendente', // pendente, aprovado, pago
    observacoes: '',
    checklist_id: null,
    atrasado: false,
    nao_compareceu: false,
    historico_etapas: [] // [{etapa, data, usuario}]
  };
}


function normalizarIdOS(valor) {
  if (window.CoreUtils?.normalizeId) return window.CoreUtils.normalizeId(valor);
  return String(valor ?? '').trim();
}

function gerarIdOS() {
  if (window.CoreUtils?.generateStableId) return window.CoreUtils.generateStableId('os');
  return `os_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function buildOnclickId(osId) {
  return JSON.stringify(normalizarIdOS(osId));
}

function getOficinaAtualId() {
  return window.OFICINA_CONFIG?.oficina_id || 'default';
}

function buscarChecklistRecentePorPlaca(placa) {
  const placaNormalizada = (placa || '').toUpperCase().trim();
  if (!placaNormalizada) return null;

  const oficinaId = window.OFICINA_CONFIG?.oficina_id || 'sem_identificacao';
  const chave = `checklists_${oficinaId}`;
  const lista = JSON.parse(localStorage.getItem(chave) || '[]');

  return lista
    .filter(item => (item.placa || '').toUpperCase().trim() === placaNormalizada)
    .sort((a, b) => new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0))[0] || null;
}


function buscarChecklistRecentePorCampo(campo, valor) {
  const valorBusca = normalizarIdOS(valor);
  if (!valorBusca) return null;

  const oficinaId = window.OFICINA_CONFIG?.oficina_id || 'sem_identificacao';
  const chave = `checklists_${oficinaId}`;
  const lista = JSON.parse(localStorage.getItem(chave) || '[]');

  return lista
    .filter(item => normalizarIdOS(item[campo]) === valorBusca)
    .sort((a, b) => new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0))[0] || null;
}

// ==========================================
// STORAGE
// ==========================================

async function persistirOS(os) {
  try {
    const resultado = salvarOS(os);
    if (resultado && typeof resultado.then === 'function') {
      await resultado;
    }
    return { ok: true };
  } catch (error) {
    console.error('Erro ao persistir OS:', error);
    return { ok: false, erro: error };
  }
}

function salvarOS(os) {
  let lista = JSON.parse(localStorage.getItem(OS_AGENDA_KEY) || '[]');
  if (!os.id) {
    os.id = gerarIdOS();
  }
  const idx = lista.findIndex(o => normalizarIdOS(o.id) === normalizarIdOS(os.id));
  
  if (idx > -1) {
    lista[idx] = os;
  } else {
    lista.unshift(os);
  }
  
  localStorage.setItem(OS_AGENDA_KEY, JSON.stringify(lista));
  atualizarBadgeAlertas();
}

function carregarOS(filtro = null) {
  let lista = JSON.parse(localStorage.getItem(OS_AGENDA_KEY) || '[]');
  
  if (filtro) {
    return lista.filter(filtro);
  }
  
  return lista;
}

function excluirOS(id) {
  if (!confirm('🗑️ Tem certeza que deseja excluir esta OS?')) return;
  
  let lista = carregarOS().filter(o => normalizarIdOS(o.id) !== normalizarIdOS(id));
  localStorage.setItem(OS_AGENDA_KEY, JSON.stringify(lista));
  renderizarVisao();
  mostrarNotificacao('OS excluída!', 'success');
}

// ==========================================
// INTERATIVIDADE DO DASHBOARD E KANBAN (NOVO)
// ==========================================

// Função para buscar e destacar OS específica (ex: vinda do calendário ou semana)
function abrirDetalhesOS(placaOuId) {
    mudarVisualizacao('hoje');

    setTimeout(() => {
        let card = null;
        const idNormalizado = normalizarIdOS(placaOuId);
        card = document.querySelector(`.os-card[data-id="${idNormalizado}"]`);

        if (!card) {
            const placaBusca = String(placaOuId || '').toUpperCase();
            const cards = document.querySelectorAll('.os-card');
            for (let c of cards) {
                if (c.textContent.toUpperCase().includes(placaBusca)) {
                    card = c;
                    break;
                }
            }
        }

        if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.transition = 'all 0.3s ease';
            card.style.transform = 'scale(1.05)';
            card.style.boxShadow = '0 0 20px var(--color-primary)';

            setTimeout(() => {
                card.style.transform = 'scale(1)';
                card.style.boxShadow = '';
            }, 1500);
        } else {
            mostrarNotificacao(`OS ${placaOuId} não encontrada na visão de hoje.`, 'warning');
        }
    }, 120);
}

// Navegação rápida ao clicar nos blocos de resumo do topo
function irParaColunaKanban(tipo) {
    filtroKanbanAtivo = tipo === 'todos' ? null : tipo;
    mudarVisualizacao('hoje');

    setTimeout(() => {
        if (tipo === 'atrasados' || tipo === 'nao_chegaram') {
            const cardProblema = document.querySelector('.os-card.atrasado, .os-card.nao-chegou');
            if (cardProblema) {
                cardProblema.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
        }

        const mapa = { agendado: 'agendados', em_andamento: 'em_andamento', finalizado: 'finalizados' };
        const alvoId = mapa[tipo];
        const coluna = alvoId ? document.getElementById(alvoId) : null;
        if (coluna) coluna.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
}

// ==========================================
// ALERTAS E CÁLCULOS
// ==========================================

function calcularAlertas(os) {
  const agora = new Date();
  const previstaSaida = new Date(os.data_prevista_saida);
  
  os.atrasado = os.status_geral !== 'finalizado' && os.status_geral !== 'cancelado' && agora > previstaSaida;
  
  if (os.status_geral === 'agendado') {
    const previstaEntrada = new Date(os.data_prevista_entrada);
    const atrasoEntrada = agora.getTime() - previstaEntrada.getTime();
    os.nao_compareceu = atrasoEntrada > 30 * 60 * 1000;
  } else {
    os.nao_compareceu = false;
  }
  
  return os;
}

function calcularEstatisticas(listaOS) {
  const total = listaOS.length;
  const finalizados = listaOS.filter(os => os.status_geral === 'finalizado').length;
  const atrasados = listaOS.filter(os => os.atrasado).length;
  const emAndamento = listaOS.filter(os => os.status_geral === 'em_andamento').length;
  
  const temposMedios = {};
  ETAPAS.forEach(etapa => {
    const osEtapa = listaOS.filter(os => os.etapa_atual === etapa.id && os.tempo_real_min);
    if (osEtapa.length > 0) {
      temposMedios[etapa.id] = Math.round(osEtapa.reduce((acc, os) => acc + os.tempo_real_min, 0) / osEtapa.length);
    }
  });
  
  return {
    total,
    finalizados,
    atrasados,
    emAndamento,
    taxaConclusao: total > 0 ? Math.round((finalizados / total) * 100) : 0,
    temposMedios
  };
}

// ==========================================
// INTEGRAÇÃO COM CHECKLIST
// ==========================================

function buscarOSPorPlaca(placa) {
  return carregarOS(os => 
    os.placa === placa.toUpperCase() && 
    (os.status_geral === 'agendado' || os.status_geral === 'em_andamento')
  )[0];
}

async function vincularChecklistOS(osId, checklistId) {
  const os = carregarOS().find(o => normalizarIdOS(o.id) === normalizarIdOS(osId));
  if (!os) return;
  
  os.checklist_id = checklistId;
  if (os.status_geral === 'agendado') {
    os.status_geral = 'em_andamento';
    os.data_entrada_real = new Date().toISOString();
  }
  
  await persistirOS(os);
}

// Hook no formulário de checklist (adicionar no app.js)
if (typeof window !== 'undefined') {
  window.verificarOSExistente = function(placa) {
    const os = buscarOSPorPlaca(placa);
    if (os) {
      const vincular = confirm(
        `🔗 Encontramos uma OS para esta placa:\\n\\n` +
        `Cliente: ${os.nome_cliente}\\n` +
        `Status: ${os.status_geral}\\n` +
        `Etapa: ${formatarEtapa(os.etapa_atual)}\\n\\n` +
        `Deseja vincular ao checklist?`
      );
      
      if (vincular) {
        // Preencher dados automaticamente
        if (os.nome_cliente) document.getElementById('nome_cliente').value = os.nome_cliente;
        if (os.telefone) document.getElementById('celular_cliente').value = os.telefone;
        if (os.modelo) document.getElementById('modelo').value = os.modelo;
        
        return os.id;
      }
    }
    return null;
  };
}

// ==========================================
// RENDERIZAÇÃO - PAINÉIS
// ==========================================

function renderizarPainelControle() {
  const container = document.getElementById('painel-controle');
  if (!container) return;
  
  container.innerHTML = `
    <div class="painel-botoes">
      <button class="btn-painel ${visualizacaoAtual === 'hoje' ? 'active' : ''}" onclick="mudarVisualizacao('hoje')">
        📅 Hoje
      </button>
      <button class="btn-painel ${visualizacaoAtual === 'semana' ? 'active' : ''}" onclick="mudarVisualizacao('semana')">
        📆 Semana
      </button>
      <button class="btn-painel ${visualizacaoAtual === 'mes' ? 'active' : ''}" onclick="mudarVisualizacao('mes')">
        📊 Mês
      </button>
      <button class="btn-painel ${visualizacaoAtual === 'ano' ? 'active' : ''}" onclick="mudarVisualizacao('ano')">
        📈 Ano
      </button>
    </div>
  `;
}

function mudarVisualizacao(tipo) {
  visualizacaoAtual = tipo;
  renderizarPainelControle();
  renderizarVisao();
}

function renderizarVisao() {
  switch (visualizacaoAtual) {
    case 'hoje':
      renderizarKanban();
      break;
    case 'semana':
      renderizarPainelSemana();
      break;
    case 'mes':
      renderizarPainelMes();
      break;
    case 'ano':
      renderizarPainelAno();
      break;
  }
}

// ==========================================
// VISUALIZAÇÃO: HOJE (KANBAN)
// ==========================================

function renderizarKanban() {
  const hoje = new Date().toDateString();
  let osHoje = carregarOS()
    .filter(os => new Date(os.data_prevista_entrada).toDateString() === hoje)
    .map(calcularAlertas);

  if (filtroKanbanAtivo === 'atrasados') osHoje = osHoje.filter(os => os.atrasado);
  if (filtroKanbanAtivo === 'nao_chegaram') osHoje = osHoje.filter(os => os.nao_compareceu);
  if (['agendado', 'em_andamento', 'finalizado'].includes(filtroKanbanAtivo)) {
    osHoje = osHoje.filter(os => os.status_geral === filtroKanbanAtivo);
  }
  
  const kanbanContainer = document.getElementById('kanban-view');
  if (!kanbanContainer) return;
  
  kanbanContainer.style.display = 'flex';
  document.getElementById('semana-view')?.remove();
  document.getElementById('mes-view')?.remove();
  document.getElementById('ano-view')?.remove();
  
  const statusMap = {
    'agendado': { id: 'agendados', titulo: '📅 Agendados Hoje' },
    'em_andamento': { id: 'em_andamento', titulo: '🔧 Em Andamento' },
    'finalizado': { id: 'finalizados', titulo: '✅ Finalizados Hoje' }
  };
  
  Object.entries(statusMap).forEach(([status, config]) => {
    const container = document.getElementById(config.id);
    if (!container) return;
    
    const filtrados = osHoje.filter(os => os.status_geral === status);
    
    if (filtrados.length === 0) {
      container.innerHTML = '<div class="empty-card">📭 Vazio</div>';
      return;
    }
    
    container.innerHTML = filtrados.map(os => renderizarCardOS(os)).join('');
  });
  
  atualizarResumoTopo(osHoje);
}

function renderizarCardOS(os) {
  // ✅ FIX: Validação robusta da prioridade
  const prioridadeKey = os.prioridade || 'normal';
  const prioridade = PRIORIDADES[prioridadeKey] || PRIORIDADES['normal'];
  
  if (!prioridade) {
    console.error(`❌ Prioridade inválida: ${os.prioridade}`, os);
    return '<div class="os-card error">❌ Erro ao renderizar OS</div>';
  }
  
  return `
    <div class="os-card ${os.atrasado ? 'atrasado' : ''} ${os.nao_compareceu ? 'nao-chegou' : ''} ${prioridade.class}" data-id="${normalizarIdOS(os.id)}">
      <div class="os-header" style="cursor:pointer;" onclick="editarOS(${buildOnclickId(os.id)})" title="Clique para editar">
        <strong>${prioridade.cor} ${os.placa}</strong>
        ${os.atrasado ? '<span class="badge-atraso">🚨 ATRASADO</span>' : ''}
        ${os.nao_compareceu ? '<span class="badge-nao-chegou">⏰ NÃO CHEGOU</span>' : ''}
      </div>
      <div class="os-info" style="cursor:pointer;" onclick="editarOS(${buildOnclickId(os.id)})" title="Clique para editar">
        <div class="os-cliente">👤 ${os.nome_cliente || 'Cliente não informado'}</div>
        ${os.modelo ? `<div class="os-modelo">🚗 ${os.modelo}</div>` : ''}
        <div class="os-horario">⏰ ${new Date(os.data_prevista_entrada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</div>
        
        <div class="os-etapa-selector" onclick="event.stopPropagation();">
          <button class="btn-etapa" onclick="toggleDropdownEtapa(${buildOnclickId(os.id)}, event)">
            ${obterIconeEtapa(os.etapa_atual)} ${formatarEtapa(os.etapa_atual)} ▼
          </button>
          <div class="dropdown-etapas" id="dropdown-${os.id}" style="display: none;">
            ${ETAPAS.map(etapa => `
              <div class="dropdown-item ${os.etapa_atual === etapa.id ? 'active' : ''}" 
                   onclick="mudarEtapa(${buildOnclickId(os.id)}, '${etapa.id}')">
                ${etapa.icon} ${etapa.nome}
              </div>
            `).join('')}
          </div>
        </div>
        
        ${os.checklist_id ? `<div class="os-checklist">📋 Checklist #${os.checklist_id}</div>` : ''}
        ${os.observacoes ? `<div class="os-obs">💬 ${os.observacoes}</div>` : ''}
      </div>
      <div class="os-actions">
        ${os.status_geral === 'agendado' ? `<button onclick="acaoOS(${buildOnclickId(os.id)}, 'entrada')" class="btn-acao">🚗 Entrada</button>` : ''}
        ${os.status_geral !== 'finalizado' ? `<button onclick="acaoOS(${buildOnclickId(os.id)}, 'finalizar')" class="btn-acao btn-success">✅ Finalizar</button>` : ''}
        <button onclick="editarOS(${buildOnclickId(os.id)})" class="btn-acao btn-edit">✏️</button>
        <button onclick="excluirOS(${buildOnclickId(os.id)})" class="btn-acao btn-delete">🗑️</button>
      </div>
    </div>
  `;
}

function obterIconeEtapa(etapaId) {
  const etapa = ETAPAS.find(e => e.id === etapaId);
  return etapa ? etapa.icon : '📍';
}

function formatarEtapa(etapaId) {
  const etapa = ETAPAS.find(e => e.id === etapaId);
  return etapa ? etapa.nome : etapaId;
}

// Dropdown de etapas
function toggleDropdownEtapa(osId, event) {
  event.stopPropagation();
  
  const dropdown = document.getElementById(`dropdown-${osId}`);
  const todosDropdowns = document.querySelectorAll('.dropdown-etapas');
  
  // Fechar outros
  todosDropdowns.forEach(d => {
    if (d.id !== `dropdown-${osId}`) d.style.display = 'none';
  });
  
  // Toggle atual
  dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

async function mudarEtapa(osId, novaEtapa) {
  const os = carregarOS().find(o => normalizarIdOS(o.id) === normalizarIdOS(osId));
  if (!os) return;
  
  os.etapa_atual = novaEtapa;
  os.historico_etapas.push({
    etapa: novaEtapa,
    data: new Date().toISOString()
  });
  
  await persistirOS(os);
  renderizarVisao();
  mostrarNotificacao(`🔄 Movido para ${formatarEtapa(novaEtapa)}`, 'info');
  
  // Fechar dropdown
  document.getElementById(`dropdown-${osId}`).style.display = 'none';
}

// Fechar dropdowns ao clicar fora
if (typeof document !== 'undefined') {
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown-etapas').forEach(d => d.style.display = 'none');
  });
}

// ==========================================
// VISUALIZAÇÃO: SEMANA
// ==========================================

function renderizarPainelSemana() {
  const kanban = document.getElementById('kanban-view');
  if (kanban) kanban.style.display = 'none';
  
  let semanaView = document.getElementById('semana-view');
  if (!semanaView) {
    semanaView = document.createElement('div');
    semanaView.id = 'semana-view';
    document.getElementById('gestao-oficina').querySelector('.content')?.appendChild(semanaView);
  }
  
  const hoje = new Date();
  const diasSemana = [];
  
  for (let i = 0; i < 7; i++) {
    const dia = new Date(hoje);
    dia.setDate(hoje.getDate() - hoje.getDay() + i);
    diasSemana.push(dia);
  }
  
  let html = '<div class="painel-semana">';
  
  diasSemana.forEach(dia => {
    const osdia = carregarOS().filter(os => 
      new Date(os.data_prevista_entrada).toDateString() === dia.toDateString()
    ).map(calcularAlertas);
    
    // Ocultar dias passados se estiverem vazios para economizar espaço
    const isPassado = dia < hoje && dia.toDateString() !== hoje.toDateString();
    if (isPassado && osdia.length === 0) return; // Pula este dia do loop
    
    const isHoje = dia.toDateString() === hoje.toDateString();
    
    html += `
      <div class="dia-card ${isHoje ? 'dia-hoje' : ''}">
        <div class="dia-header" ${isHoje ? 'style="cursor:pointer;" onclick="mudarVisualizacao(\\'hoje\\')"' : ''}>
          <div class="dia-nome">${dia.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
          <div class="dia-data">${dia.getDate()}</div>
        </div>
        <div class="dia-stats">
          <div class="stat-item">
            <span class="stat-numero">${osdia.length}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-item">
            <span class="stat-numero" style="color:var(--color-danger)">${osdia.filter(o => o.atrasado).length}</span>
            <span class="stat-label">⚠️</span>
          </div>
        </div>
        ${osdia.slice(0, 3).map(os => `
          <div class="dia-os-mini" style="cursor:pointer;" onclick='abrirDetalhesOS(${buildOnclickId(os.id)})' title="Ir para OS">
            ${os.placa} ${os.atrasado ? '🔴' : ''}
          </div>
        `).join('')}
        ${osdia.length > 3 ? `<div class="dia-mais" style="cursor:pointer;" onclick='abrirDetalhesOS(${buildOnclickId(osdia[3].id)})'>+${osdia.length - 3} mais</div>` : ''}
      </div>
    `;
  });
  
  html += '</div>';
  semanaView.innerHTML = html;
}

// ==========================================
// VISUALIZAÇÃO: MÊS
// ==========================================

function renderizarPainelMes() {
  const kanban = document.getElementById('kanban-view');
  if (kanban) kanban.style.display = 'none';
  
  let mesView = document.getElementById('mes-view');
  if (!mesView) {
    mesView = document.createElement('div');
    mesView.id = 'mes-view';
    document.getElementById('gestao-oficina').querySelector('.content')?.appendChild(mesView);
  }
  
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();
  
  const osMes = carregarOS().filter(os => {
    const dataOS = new Date(os.data_prevista_entrada);
    return dataOS.getMonth() === mes && dataOS.getFullYear() === ano;
  }).map(calcularAlertas);
  
  const stats = calcularEstatisticas(osMes);
  
  let calendario = '<div class="calendario-mes">';
  calendario += `
    <div class="mes-header">
      <h3>${primeiroDia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
      <button class="btn-painel" onclick="toggleCalendarioCompacto()">${modoCalendarioCompacto ? '🗓️ Mostrar todos os dias' : '🧩 Mostrar apenas dias com agendamento'}</button>
    </div>
    <div class="mes-stats">
      <div class="stat-box">📊 Total: <strong>${stats.total}</strong></div>
      <div class="stat-box">✅ Finalizados: <strong>${stats.finalizados}</strong></div>
      <div class="stat-box">🚨 Atrasados: <strong>${stats.atrasados}</strong></div>
      <div class="stat-box">📈 Taxa: <strong>${stats.taxaConclusao}%</strong></div>
    </div>
    <div class="calendario-grid">
      <div class="dia-semana">Dom</div>
      <div class="dia-semana">Seg</div>
      <div class="dia-semana">Ter</div>
      <div class="dia-semana">Qua</div>
      <div class="dia-semana">Qui</div>
      <div class="dia-semana">Sex</div>
      <div class="dia-semana">Sáb</div>
  `;
  
  for (let i = 0; i < diaSemanaInicio; i++) {
    calendario += '<div class="dia-vazio"></div>';
  }
  
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = new Date(ano, mes, dia);
    const osDia = osMes.filter(os => 
      new Date(os.data_prevista_entrada).getDate() === dia
    );
    
    const isHoje = data.toDateString() === hoje.toDateString();
    const temOS = osDia.length > 0;

    if (modoCalendarioCompacto && !temOS && !isHoje) {
      calendario += '<div class="dia-vazio"></div>';
      continue;
    }

    const onclickDia = temOS ? `onclick='abrirDetalhesOS(${buildOnclickId(osDia[0].id)})'` : (isHoje ? "onclick=\"mudarVisualizacao('hoje')\"" : '');

    calendario += `
      <div class="dia-calendario ${isHoje ? 'hoje' : ''} ${temOS ? 'tem-os' : ''}"
           ${temOS || isHoje ? `style="cursor:pointer;" ${onclickDia}` : ''}>
        <div class="dia-numero">${dia}</div>
        ${temOS ? `<div class="dia-badge">${osDia.length}</div>` : ''}
      </div>
    `;
  }
  
  calendario += '</div></div>';
  mesView.innerHTML = calendario;
}

// ==========================================
// VISUALIZAÇÃO: ANO
// ==========================================

function renderizarPainelAno() {
  const kanban = document.getElementById('kanban-view');
  if (kanban) kanban.style.display = 'none';
  
  let anoView = document.getElementById('ano-view');
  if (!anoView) {
    anoView = document.createElement('div');
    anoView.id = 'ano-view';
    document.getElementById('gestao-oficina').querySelector('.content')?.appendChild(anoView);
  }
  
  const anoAtual = new Date().getFullYear();
  const meses = [];
  
  for (let mes = 0; mes < 12; mes++) {
    const osMes = carregarOS().filter(os => {
      const data = new Date(os.data_prevista_entrada);
      return data.getMonth() === mes && data.getFullYear() === anoAtual;
    }).map(calcularAlertas);
    
    const stats = calcularEstatisticas(osMes);
    
    meses.push({
      nome: new Date(anoAtual, mes, 1).toLocaleDateString('pt-BR', { month: 'short' }),
      total: stats.total,
      finalizados: stats.finalizados,
      atrasados: stats.atrasados,
      taxa: stats.taxaConclusao
    });
  }
  
  const maxTotal = Math.max(...meses.map(m => m.total), 1);
  
  anoView.innerHTML = `
    <div class="painel-ano">
      <h3>📈 Visão Anual ${anoAtual}</h3>
      <div class="grafico-barras">
        ${meses.map(mes => `
          <div class="barra-container" style="cursor:pointer;" onclick="mudarVisualizacao('mes')" title="Abrir Mês">
            <div class="barra" style="height: ${(mes.total / maxTotal) * 200}px">
              <div class="barra-fill"></div>
            </div>
            <div class="barra-valor">${mes.total}</div>
            <div class="barra-label">${mes.nome}</div>
          </div>
        `).join('')}
      </div>
      <div class="ano-resumo">
        <div class="resumo-item">📊 Total Ano: <strong>${meses.reduce((a, m) => a + m.total, 0)}</strong></div>
        <div class="resumo-item">✅ Finalizados: <strong>${meses.reduce((a, m) => a + m.finalizados, 0)}</strong></div>
        <div class="resumo-item">🚨 Atrasados: <strong>${meses.reduce((a, m) => a + m.atrasados, 0)}</strong></div>
      </div>
    </div>
  `;
}

// ==========================================
// RESUMO TOPO
// ==========================================

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
    <div class="resumo-card" style="cursor:pointer;" onclick="irParaColunaKanban('agendado')" title="Ver agendados">
      <div class="resumo-icon">📅</div>
      <div class="resumo-info">
        <div class="resumo-label">Agendados</div>
        <div class="resumo-valor">${counts.agendado}</div>
      </div>
    </div>
    <div class="resumo-card" style="cursor:pointer;" onclick="irParaColunaKanban('em_andamento')" title="Ver em andamento">
      <div class="resumo-icon">🔧</div>
      <div class="resumo-info">
        <div class="resumo-label">Em Andamento</div>
        <div class="resumo-valor">${counts.em_andamento}</div>
      </div>
    </div>
    <div class="resumo-card danger" style="cursor:pointer;" onclick="irParaColunaKanban('atrasados')" title="Ver problemas">
      <div class="resumo-icon">🚨</div>
      <div class="resumo-info">
        <div class="resumo-label">Atrasados</div>
        <div class="resumo-valor">${counts.atrasados}</div>
      </div>
    </div>
    <div class="resumo-card warning" style="cursor:pointer;" onclick="irParaColunaKanban('nao_chegaram')" title="Ver problemas">
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
    ${filtroKanbanAtivo ? `
      <div class="resumo-card" style="cursor:pointer;" onclick="irParaColunaKanban('todos')" title="Limpar filtro">
        <div class="resumo-icon">🧹</div>
        <div class="resumo-info">
          <div class="resumo-label">Limpar filtro</div>
          <div class="resumo-valor">${filtroKanbanAtivo}</div>
        </div>
      </div>
    ` : ''}
  `;
}

// ==========================================
// MODAL CRIAR/EDITAR OS
// ==========================================

let modalOS = null;
let osEditando = null;

function abrirModalNovoOS() {
  osEditando = null;
  abrirModalOS();
}

function editarOS(id) {
  const os = carregarOS().find(o => normalizarIdOS(o.id) === normalizarIdOS(id));
  if (!os) return;
  osEditando = os;
  abrirModalOS(os);
}

function abrirModalOS(os = null) {
  modalOS = document.createElement('div');
  modalOS.className = 'modal-overlay';
  
  const dataEntrada = os ? os.data_prevista_entrada.substring(0, 16) : new Date().toISOString().substring(0, 16);
  const dataSaida = os ? os.data_prevista_saida.substring(0, 16) : new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().substring(0, 16);
  
  modalOS.innerHTML = `
    <div class="modal">
      <h3>${os ? '✏️ Editar' : '➕ Nova'} OS</h3>
      <div class="modal-form">
        <input id="modal_placa" placeholder="Placa *" maxlength="8" value="${os?.placa || ''}" style="text-transform: uppercase;" onblur="autocompletarNovaOS()">
        <input id="modal_cliente_id" placeholder="ID Cliente" value="${os?.cliente_id || ''}" onblur="autocompletarNovaOS()">
        <input id="modal_veiculo_id" placeholder="ID Veículo" value="${os?.veiculo_id || ''}" onblur="autocompletarNovaOS()">
        <input id="modal_cliente" placeholder="Nome do Cliente *" value="${os?.nome_cliente || ''}">
        <input id="modal_telefone" placeholder="Telefone" value="${os?.telefone || ''}">
        <input id="modal_modelo" placeholder="Modelo" value="${os?.modelo || ''}">
        
        <label>Prioridade:</label>
        <select id="modal_prioridade">
          <option value="baixa" ${os?.prioridade === 'baixa' ? 'selected' : ''}>🟢 Baixa</option>
          <option value="normal" ${!os || os?.prioridade === 'normal' ? 'selected' : ''}>🟡 Normal</option>
          <option value="urgente" ${os?.prioridade === 'urgente' ? 'selected' : ''}>🔴 Urgente</option>
        </select>
        
        <label>Data/Hora Entrada:</label>
        <input type="datetime-local" id="modal_entrada" value="${dataEntrada}">
        
        <label>Data/Hora Saída Prevista:</label>
        <input type="datetime-local" id="modal_saida" value="${dataSaida}">
        
        <textarea id="modal_obs" placeholder="Observações" rows="3">${os?.observacoes || ''}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" onclick="salvarNovoOS()">${os ? '💾 Salvar' : '➕ Criar'}</button>
        <button class="btn-secondary" onclick="fecharModal()">❌ Cancelar</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modalOS);
  document.getElementById('modal_placa').focus();
  
  modalOS.onclick = (e) => {
    if (e.target === modalOS) fecharModal();
  };
}

async function autocompletarNovaOS() {
  if (osEditando) return;

  const inputPlaca = document.getElementById('modal_placa');
  const inputClienteId = document.getElementById('modal_cliente_id');
  const inputVeiculoId = document.getElementById('modal_veiculo_id');
  if (!inputPlaca) return;

  const placa = inputPlaca.value.trim().toUpperCase();
  const clienteId = inputClienteId?.value?.trim() || '';
  const veiculoId = inputVeiculoId?.value?.trim() || '';

  const oficinaAtual = getOficinaAtualId();
  const osLocal = carregarOS().filter(o => (o.oficina_id || 'default') === oficinaAtual);

  const osExistente = osLocal.find(o => (o.placa || '').toUpperCase() === placa) ||
    osLocal.find(o => normalizarIdOS(o.cliente_id) === normalizarIdOS(clienteId)) ||
    osLocal.find(o => normalizarIdOS(o.veiculo_id) === normalizarIdOS(veiculoId));

  const checklistRecente = buscarChecklistRecentePorPlaca(placa) ||
    buscarChecklistRecentePorCampo('cliente_id', clienteId) ||
    buscarChecklistRecentePorCampo('veiculo_id', veiculoId);

  const historico = window.debugOSFirebase?.historicoVeiculo && placa
    ? await window.debugOSFirebase.historicoVeiculo(placa)
    : null;

  const dados = osExistente || checklistRecente || historico;
  if (!dados) return;

  const cliente = document.getElementById('modal_cliente');
  const telefone = document.getElementById('modal_telefone');
  const modelo = document.getElementById('modal_modelo');

  if (cliente && !cliente.value && dados.nome_cliente) cliente.value = dados.nome_cliente;
  if (telefone && !telefone.value && dados.telefone) telefone.value = dados.telefone;
  if (modelo && !modelo.value && dados.modelo) modelo.value = dados.modelo;
  if (inputClienteId && !inputClienteId.value && dados.cliente_id) inputClienteId.value = dados.cliente_id;
  if (inputVeiculoId && !inputVeiculoId.value && dados.veiculo_id) inputVeiculoId.value = dados.veiculo_id;
}

async function salvarNovoOS() {
  const placa = document.getElementById('modal_placa').value.trim();
  const cliente = document.getElementById('modal_cliente').value.trim();
  
  if (!placa || !cliente) {
    alert('⚠️ Placa e Nome são obrigatórios!');
    return;
  }
  
  let os;
  if (osEditando) {
    os = osEditando;
  } else {
    os = novoOS(placa, cliente);
  }
  
  os.placa = placa.toUpperCase();
  os.nome_cliente = cliente;
  os.cliente_id = document.getElementById('modal_cliente_id')?.value.trim() || '';
  os.telefone = document.getElementById('modal_telefone').value.trim();
  os.modelo = document.getElementById('modal_modelo').value.trim();
  os.veiculo_id = document.getElementById('modal_veiculo_id')?.value.trim() || '';
  os.prioridade = document.getElementById('modal_prioridade').value;
  os.data_prevista_entrada = new Date(document.getElementById('modal_entrada').value).toISOString();
  os.data_prevista_saida = new Date(document.getElementById('modal_saida').value).toISOString();
  os.observacoes = document.getElementById('modal_obs').value.trim();
  
  const resultadoPersistencia = await persistirOS(os);

  const modoEdicao = Boolean(osEditando);
  fecharModal();
  renderizarVisao();
  
  if (resultadoPersistencia && resultadoPersistencia.ok) {
    mostrarNotificacao(modoEdicao ? '✅ OS atualizada e salva!' : '✅ OS criada e salva!', 'success');
  } else {
    mostrarNotificacao('⚠️ OS salva localmente. Verifique sincronização com Firebase.', 'warning');
  }
}

function fecharModal() {
  if (modalOS) {
    modalOS.remove();
    modalOS = null;
  }
  osEditando = null;
}

// ==========================================
// AÇÕES DA OS
// ==========================================

async function acaoOS(id, acao) {
  const listaOS = carregarOS();
  const os = listaOS.find(o => normalizarIdOS(o.id) === normalizarIdOS(id));
  if (!os) {
    console.error('OS não encontrada:', id);
    return;
  }
  
  console.log('Ação:', acao, 'OS antes:', os.status_geral);
  
  switch (acao) {
    case 'entrada':
      os.data_entrada_real = new Date().toISOString();
      os.status_geral = 'em_andamento';
      os.historico_etapas.push({
        acao: 'entrada',
        data: new Date().toISOString(),
        status_anterior: 'agendado',
        status_novo: 'em_andamento'
      });
      console.log('OS depois da entrada:', os.status_geral);
      await persistirOS(os);
      mostrarNotificacao(`🚗 Entrada registrada: ${os.placa}`, 'success');
      break;
      
    case 'finalizar':
      if (confirm(`✅ Finalizar ${os.placa}?`)) {
        os.data_saida_real = new Date().toISOString();
        os.status_geral = 'finalizado';
        os.etapa_atual = 'finalizacao';
        
        if (os.data_entrada_real) {
          const diff = new Date(os.data_saida_real) - new Date(os.data_entrada_real);
          os.tempo_real_min = Math.round(diff / (1000 * 60));
        }
        
        os.historico_etapas.push({
          acao: 'finalizacao',
          data: new Date().toISOString(),
          tempo_total_min: os.tempo_real_min
        });
        
        await persistirOS(os);
        mostrarNotificacao(`✅ ${os.placa} finalizado!`, 'success');
      } else {
        return;
      }
      break;
  }
  
  // Forçar re-renderização completa
  setTimeout(() => {
    console.log('Re-renderizando visão...');
    renderizarVisao();
  }, 100);
}

function toggleCalendarioCompacto() {
  modoCalendarioCompacto = !modoCalendarioCompacto;
  if (visualizacaoAtual === 'mes') renderizarPainelMes();
}

// ==========================================
// NOTIFICAÇÕES E ALERTAS
// ==========================================

function mostrarNotificacao(mensagem, tipo = 'info') {
  const notif = document.createElement('div');
  notif.className = `notificacao notif-${tipo}`;
  notif.textContent = mensagem;
  
  document.body.appendChild(notif);
  setTimeout(() => notif.classList.add('show'), 10);
  
  // Som de alerta para tipos importantes
  if (tipo === 'warning' || tipo === 'danger') {
    tocarSomAlerta();
  }
  
  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function tocarSomAlerta() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function atualizarBadgeAlertas() {
  const osHoje = carregarOS()
    .filter(os => new Date(os.data_prevista_entrada).toDateString() === new Date().toDateString())
    .map(calcularAlertas);
  
  const totalAlertas = osHoje.filter(os => os.atrasado || os.nao_compareceu).length;
  
  // Atualizar badge na aba
  const tabButton = document.querySelector('[onclick*="gestao-oficina"]');
  if (tabButton) {
    let badge = tabButton.querySelector('.tab-badge');
    if (!badge && totalAlertas > 0) {
      badge = document.createElement('span');
      badge.className = 'tab-badge';
      tabButton.appendChild(badge);
    }
    if (badge) {
      badge.textContent = totalAlertas;
      badge.style.display = totalAlertas > 0 ? 'inline-block' : 'none';
    }
  }
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function iniciarGestaoOficina() {
  renderizarPainelControle();
  renderizarVisao();
  atualizarBadgeAlertas();
  
  // Atualizar alertas a cada 1 minuto
  setInterval(() => {
    if (document.getElementById('gestao-oficina')?.classList.contains('active')) {
      atualizarBadgeAlertas();
      if (visualizacaoAtual === 'hoje') {
        renderizarKanban();
      }
    }
  }, 60000);
}

// Auto-iniciar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gestao-oficina')) {
      setTimeout(iniciarGestaoOficina, 100);
    }
  });
} else {
  if (document.getElementById('gestao-oficina')) {
    setTimeout(iniciarGestaoOficina, 100);
  }
}
