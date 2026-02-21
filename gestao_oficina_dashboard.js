// ==========================================
// 📊 DASHBOARD GESTÃO DA OFICINA - TEMPO REAL
// ==========================================
// Conecta ao Firestore e exibe estatísticas em tempo real
// Respeita multi-tenant (OFICINA_ID)

// ✅ Usa window.OFICINA_CONFIG diretamente (sem redeclarar)
const getOficinaID = () => window.OFICINA_CONFIG?.oficina_id || 'modelo';

// ==========================================
// LISTENERS DE TEMPO REAL (onSnapshot)
// ==========================================

let unsubscribeRecebido = null;
let unsubscribeEmAndamento = null;
let unsubscribeFinalizado = null;
let unsubscribeEntregue = null;

/**
 * Inicia todos os listeners de tempo real do dashboard
 */
function iniciarDashboardFirestore() {
  const OFICINA_ID = getOficinaID();
  console.log('🔥 Iniciando Dashboard Firestore para oficina:', OFICINA_ID);
  
  if (!firebase || !firebase.firestore) {
    console.error('❌ Firebase Firestore não disponível');
    return;
  }
  
  // ✅ Renderizar dashboard antes de iniciar listeners
  renderizarDashboard();
  
  const db = firebase.firestore();
  const baseRef = db
    .collection('oficinas')
    .doc(OFICINA_ID)
    .collection('ordens_servico');
  
  // ✅ Listener: RECEBIDO
  unsubscribeRecebido = baseRef
    .where('status', '==', 'RECEBIDO')
    .onSnapshot(snapshot => {
      atualizarContador('recebido', snapshot.size);
      console.log('📊 RECEBIDO:', snapshot.size);
    }, error => {
      console.error('❌ Erro listener RECEBIDO:', error);
    });
  
  // ✅ Listener: EM_ANDAMENTO
  unsubscribeEmAndamento = baseRef
    .where('status', '==', 'EM_ANDAMENTO')
    .onSnapshot(snapshot => {
      atualizarContador('em_andamento', snapshot.size);
      console.log('📊 EM_ANDAMENTO:', snapshot.size);
    }, error => {
      console.error('❌ Erro listener EM_ANDAMENTO:', error);
    });
  
  // ✅ Listener: FINALIZADO
  unsubscribeFinalizado = baseRef
    .where('status', '==', 'FINALIZADO')
    .onSnapshot(snapshot => {
      atualizarContador('finalizado', snapshot.size);
      console.log('📊 FINALIZADO:', snapshot.size);
    }, error => {
      console.error('❌ Erro listener FINALIZADO:', error);
    });
  
  // ✅ Listener: ENTREGUE
  unsubscribeEntregue = baseRef
    .where('status', '==', 'ENTREGUE')
    .onSnapshot(snapshot => {
      atualizarContador('entregue', snapshot.size);
      console.log('📊 ENTREGUE:', snapshot.size);
    }, error => {
      console.error('❌ Erro listener ENTREGUE:', error);
    });
  
  // ✅ Calcular total financeiro
  calcularTotalFinanceiro();
  
  console.log('✅ Dashboard Firestore iniciado com sucesso!');
}

/**
 * Para todos os listeners ao sair da aba
 */
function pararDashboardFirestore() {
  console.log('🛑 Parando listeners do Dashboard');
  
  if (unsubscribeRecebido) unsubscribeRecebido();
  if (unsubscribeEmAndamento) unsubscribeEmAndamento();
  if (unsubscribeFinalizado) unsubscribeFinalizado();
  if (unsubscribeEntregue) unsubscribeEntregue();
}

// ==========================================
// ATUALIZAÇÃO DE UI
// ==========================================

/**
 * Atualiza contador específico na UI
 */
function atualizarContador(tipo, quantidade) {
  const mapa = {
    'recebido': 'contadorRecebido',
    'em_andamento': 'contadorEmAndamento',
    'finalizado': 'contadorFinalizado',
    'entregue': 'contadorEntregue'
  };
  
  const elementoId = mapa[tipo];
  const elemento = document.getElementById(elementoId);
  
  if (elemento) {
    elemento.textContent = quantidade;
    
    // Animação de update
    elemento.style.transform = 'scale(1.2)';
    elemento.style.color = 'var(--color-primary)';
    setTimeout(() => {
      elemento.style.transform = 'scale(1)';
      elemento.style.color = '';
    }, 300);
  } else {
    console.warn('⚠️ Elemento não encontrado:', elementoId);
  }
}

/**
 * Calcula total financeiro de todas as OS abertas
 */
async function calcularTotalFinanceiro() {
  const OFICINA_ID = getOficinaID();
  
  try {
    const db = firebase.firestore();
    const snapshot = await db
      .collection('oficinas')
      .doc(OFICINA_ID)
      .collection('ordens_servico')
      .where('status', 'in', ['RECEBIDO', 'EM_ANDAMENTO', 'FINALIZADO'])
      .get();
    
    let totalAberto = 0;
    let totalPago = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const total = Number(data.financeiro?.total) || 0;
      const pago = Number(data.financeiro?.pago) || 0;
      
      totalAberto += total;
      totalPago += pago;
    });
    
    const totalReceber = totalAberto - totalPago;
    
    // Atualizar UI
    const elemTotal = document.getElementById('totalFinanceiro');
    const elemReceber = document.getElementById('totalReceber');
    const elemPago = document.getElementById('totalPago');
    
    if (elemTotal) elemTotal.textContent = `R$ ${totalAberto.toFixed(2)}`;
    if (elemReceber) elemReceber.textContent = `R$ ${totalReceber.toFixed(2)}`;
    if (elemPago) elemPago.textContent = `R$ ${totalPago.toFixed(2)}`;
    
    console.log('💰 Total financeiro:', totalAberto);
    
  } catch (error) {
    console.error('❌ Erro ao calcular total financeiro:', error);
  }
}

// ==========================================
// RENDERIZAÇÃO DO DASHBOARD
// ==========================================

/**
 * Renderiza o HTML do dashboard
 */
function renderizarDashboard() {
  const container = document.querySelector('#gestao-oficina .content');
  if (!container) {
    console.warn('⚠️ Container #gestao-oficina .content não encontrado');
    return;
  }
  
  console.log('🎨 Renderizando dashboard...');
  
  const nomeOficina = window.OFICINA_CONFIG?.nome || 'Oficina';
  
  const html = `
    <div class="dashboard-header">
      <h2>📊 Dashboard - ${nomeOficina}</h2>
      <button class="btn-primary" onclick="atualizarDashboard()">🔄 Atualizar</button>
    </div>
    
    <div class="dashboard-grid">
      <!-- CARD: RECEBIDO -->
      <div class="dashboard-card card-recebido">
        <div class="card-icon">📥</div>
        <div class="card-info">
          <div class="card-label">Recebidos</div>
          <div class="card-value" id="contadorRecebido">0</div>
        </div>
      </div>
      
      <!-- CARD: EM ANDAMENTO -->
      <div class="dashboard-card card-andamento">
        <div class="card-icon">🔧</div>
        <div class="card-info">
          <div class="card-label">Em Andamento</div>
          <div class="card-value" id="contadorEmAndamento">0</div>
        </div>
      </div>
      
      <!-- CARD: FINALIZADO -->
      <div class="dashboard-card card-finalizado">
        <div class="card-icon">✅</div>
        <div class="card-info">
          <div class="card-label">Finalizados</div>
          <div class="card-value" id="contadorFinalizado">0</div>
        </div>
      </div>
      
      <!-- CARD: ENTREGUE -->
      <div class="dashboard-card card-entregue">
        <div class="card-icon">🚗</div>
        <div class="card-info">
          <div class="card-label">Entregues</div>
          <div class="card-value" id="contadorEntregue">0</div>
        </div>
      </div>
    </div>
    
    <!-- SEÇÃO FINANCEIRA -->
    <div class="dashboard-financeiro">
      <h3>💰 Financeiro</h3>
      <div class="financeiro-grid">
        <div class="financeiro-item">
          <span class="financeiro-label">Total em Aberto:</span>
          <span class="financeiro-value" id="totalFinanceiro">R$ 0,00</span>
        </div>
        <div class="financeiro-item">
          <span class="financeiro-label">A Receber:</span>
          <span class="financeiro-value danger" id="totalReceber">R$ 0,00</span>
        </div>
        <div class="financeiro-item">
          <span class="financeiro-label">Já Pago:</span>
          <span class="financeiro-value success" id="totalPago">R$ 0,00</span>
        </div>
      </div>
    </div>
    
    <!-- PAINEL DE CONTROLE (mantido do código antigo) -->
    <div id="painel-controle"></div>
    
    <!-- RESUMO TOPO (mantido do código antigo) -->
    <div id="resumoTopo" class="resumo-cards"></div>
    
    <!-- KANBAN VIEW (mantido do código antigo) -->
    <div id="kanban-view" class="kanban-container">
      <div class="kanban-coluna">
        <h3>📅 Recebidos</h3>
        <div class="cards-container" id="recebido"></div>
      </div>
      <div class="kanban-coluna">
        <h3>🔧 Em Andamento</h3>
        <div class="cards-container" id="em_andamento"></div>
      </div>
      <div class="kanban-coluna">
        <h3>✅ Finalizados</h3>
        <div class="cards-container" id="finalizado"></div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  console.log('✅ Dashboard renderizado!');
}

/**
 * Força atualização manual do dashboard
 */
function atualizarDashboard() {
  console.log('🔄 Atualizando dashboard...');
  calcularTotalFinanceiro();
  
  // Notificação de sucesso
  if (window.mostrarNotificacao) {
    window.mostrarNotificacao('✅ Dashboard atualizado!', 'success');
  }
}

// ==========================================
// EXPOR FUNÇÕES GLOBAIS
// ==========================================

if (typeof window !== 'undefined') {
  window.iniciarDashboardFirestore = iniciarDashboardFirestore;
  window.pararDashboardFirestore = pararDashboardFirestore;
  window.atualizarDashboard = atualizarDashboard;
  window.calcularTotalFinanceiro = calcularTotalFinanceiro;
  window.renderizarDashboard = renderizarDashboard;
}

console.log('✅ gestao_oficina_dashboard.js carregado');
