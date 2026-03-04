// ==========================================
// 📊 DASHBOARD GESTÃO DA OFICINA - ENXUTO
// ==========================================
// Dashboard simplificado com métricas essenciais

const dashboardManager = {
  oficina_id: null,
  db: null,
  listeners: {
    recebido: null,
    em_andamento: null,
    finalizado: null,
    entregue: null
  },
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ Dashboard Manager inicializado');
  },
  
  // ==========================================
  // INICIAR LISTENERS TEMPO REAL
  // ==========================================
  
  iniciar() {
    console.log('🔥 Iniciando Dashboard Tempo Real');
    
    if (!this.db) {
      console.error('❌ Firestore não disponível');
      return;
    }
    
    const baseRef = this.db
      .collection('oficinas')
      .doc(this.oficina_id)
      .collection('ordens_servico');
    
    // Listener: RECEBIDO
    this.listeners.recebido = baseRef
      .where('status', '==', 'RECEBIDO')
      .onSnapshot(snapshot => {
        this.atualizarCard('recebido', snapshot);
      });
    
    // Listener: EM_ANDAMENTO
    this.listeners.em_andamento = baseRef
      .where('status', '==', 'EM_ANDAMENTO')
      .onSnapshot(snapshot => {
        this.atualizarCard('em_andamento', snapshot);
      });
    
    // Listener: FINALIZADO
    this.listeners.finalizado = baseRef
      .where('status', '==', 'FINALIZADO')
      .onSnapshot(snapshot => {
        this.atualizarCard('finalizado', snapshot);
      });
    
    // Listener: ENTREGUE
    this.listeners.entregue = baseRef
      .where('status', '==', 'ENTREGUE')
      .onSnapshot(snapshot => {
        this.atualizarCard('entregue', snapshot);
      });
    
    // Atualizar financeiro
    this.atualizarFinanceiro();
    
    console.log('✅ Dashboard iniciado!');
  },
  
  // ==========================================
  // PARAR LISTENERS
  // ==========================================
  
  parar() {
    console.log('🛑 Parando Dashboard');
    
    Object.values(this.listeners).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    
    this.listeners = {
      recebido: null,
      em_andamento: null,
      finalizado: null,
      entregue: null
    };
  },
  
  // ==========================================
  // ATUALIZAR CARDS
  // ==========================================
  
  atualizarCard(tipo, snapshot) {
    const quantidade = snapshot.size;
    
    // Calcular totais financeiros
    let totalValor = 0;
    let totalPago = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      totalValor += (data.financeiro?.total || 0);
      totalPago += (data.financeiro?.valor_pago || 0);
    });
    
    const totalReceber = totalValor - totalPago;
    
    // Atualizar UI
    const mapa = {
      'recebido': 'card-recebido',
      'em_andamento': 'card-em-andamento',
      'finalizado': 'card-finalizado',
      'entregue': 'card-entregue'
    };
    
    const cardId = mapa[tipo];
    const card = document.getElementById(cardId);
    
    if (card) {
      const countEl = card.querySelector('.card-count');
      const valueEl = card.querySelector('.card-value');
      const receberEl = card.querySelector('.card-receber');
      
      if (countEl) {
        countEl.textContent = quantidade;
        // Animação
        countEl.style.transform = 'scale(1.1)';
        setTimeout(() => {
          countEl.style.transform = 'scale(1)';
        }, 200);
      }
      
      if (valueEl) {
        valueEl.textContent = `R$ ${totalValor.toFixed(2)}`;
      }
      
      if (receberEl && tipo !== 'entregue') {
        receberEl.textContent = `A receber: R$ ${totalReceber.toFixed(2)}`;
      }
    }
    
    console.log(`📊 ${tipo.toUpperCase()}: ${quantidade} OS - R$ ${totalValor.toFixed(2)}`);
  },
  
  // ==========================================
  // ATUALIZAR FINANCEIRO GERAL
  // ==========================================
  
  async atualizarFinanceiro() {
    try {
      const hoje = new Date();
      const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .where('data_entrada', '>=', firebase.firestore.Timestamp.fromDate(primeiroDiaMes))
        .get();
      
      let faturamentoMes = 0;
      let totalReceber = 0;
      let totalVencido = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const total = data.financeiro?.total || 0;
        const pago = data.financeiro?.valor_pago || 0;
        const restante = total - pago;
        
        // Soma faturamento do mês
        faturamentoMes += pago;
        
        // Se ainda tem saldo a receber
        if (restante > 0) {
          totalReceber += restante;
          
          // Verificar se está vencido
          const vencimento = data.financeiro?.data_vencimento;
          if (vencimento) {
            const dataVenc = vencimento.toDate ? vencimento.toDate() : new Date(vencimento);
            if (dataVenc < hoje) {
              totalVencido += restante;
            }
          }
        }
      });
      
      // Atualizar UI
      this.atualizarFinanceiroUI(faturamentoMes, totalReceber, totalVencido);
      
    } catch (error) {
      console.error('❌ Erro ao atualizar financeiro:', error);
    }
  },
  
  atualizarFinanceiroUI(faturamentoMes, totalReceber, totalVencido) {
    const elemFaturamento = document.getElementById('faturamento-mes');
    const elemReceber = document.getElementById('total-receber');
    const elemVencido = document.getElementById('total-vencido');
    
    if (elemFaturamento) {
      elemFaturamento.textContent = `R$ ${faturamentoMes.toFixed(2)}`;
    }
    
    if (elemReceber) {
      elemReceber.textContent = `R$ ${totalReceber.toFixed(2)}`;
    }
    
    if (elemVencido) {
      elemVencido.textContent = `R$ ${totalVencido.toFixed(2)}`;
      
      // Destacar se houver valores vencidos
      if (totalVencido > 0) {
        elemVencido.style.color = '#dc2626';
        elemVencido.style.fontWeight = 'bold';
      } else {
        elemVencido.style.color = '';
        elemVencido.style.fontWeight = '';
      }
    }
  },
  
  // ==========================================
  // RENDERIZAR DASHBOARD
  // ==========================================
  
  renderizar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Container não encontrado:', containerId);
      return;
    }
    
    const html = `
      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <h2 style="margin: 0; font-size: 24px; color: #333;">📊 Dashboard da Oficina</h2>
        <div style="display: flex; gap: 12px;">
          <select id="filtro-periodo" onchange="dashboardManager.aplicarFiltro()" style="
            padding: 10px 16px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 14px;
            cursor: pointer;
          ">
            <option value="hoje">Hoje</option>
            <option value="semana">Esta Semana</option>
            <option value="mes" selected>Este Mês</option>
            <option value="customizado">Personalizado</option>
          </select>
          <button onclick="dashboardManager.atualizar()" style="
            padding: 10px 20px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">🔄 Atualizar</button>
        </div>
      </div>
      
      <!-- CARDS DE STATUS -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 32px;">
        
        <!-- RECEBIDO -->
        <div id="card-recebido" style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 32px;">📅</div>
            <div style="font-size: 16px; font-weight: 600;">Recebidos</div>
          </div>
          <div class="card-count" style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">0</div>
          <div class="card-value" style="font-size: 14px; opacity: 0.9;">R$ 0,00</div>
          <div class="card-receber" style="font-size: 12px; opacity: 0.8; margin-top: 4px;">A receber: R$ 0,00</div>
        </div>
        
        <!-- EM ANDAMENTO -->
        <div id="card-em-andamento" style="
          background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%);
          color: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 32px;">🔧</div>
            <div style="font-size: 16px; font-weight: 600;">Em Andamento</div>
          </div>
          <div class="card-count" style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">0</div>
          <div class="card-value" style="font-size: 14px; opacity: 0.9;">R$ 0,00</div>
          <div class="card-receber" style="font-size: 12px; opacity: 0.8; margin-top: 4px;">A receber: R$ 0,00</div>
        </div>
        
        <!-- FINALIZADO -->
        <div id="card-finalizado" style="
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 32px;">✅</div>
            <div style="font-size: 16px; font-weight: 600;">Finalizados</div>
          </div>
          <div class="card-count" style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">0</div>
          <div class="card-value" style="font-size: 14px; opacity: 0.9;">R$ 0,00</div>
          <div class="card-receber" style="font-size: 12px; opacity: 0.8; margin-top: 4px;">A receber: R$ 0,00</div>
        </div>
        
        <!-- ENTREGUE -->
        <div id="card-entregue" style="
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: #fff;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
            <div style="font-size: 32px;">🎉</div>
            <div style="font-size: 16px; font-weight: 600;">Entregues</div>
          </div>
          <div class="card-count" style="font-size: 48px; font-weight: bold; margin-bottom: 8px;">0</div>
          <div class="card-value" style="font-size: 14px; opacity: 0.9;">R$ 0,00</div>
        </div>
        
      </div>
      
      <!-- RESUMO FINANCEIRO -->
      <div style="background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 32px;">
        <h3 style="margin: 0 0 20px 0; font-size: 18px; color: #333;">💰 Resumo Financeiro (Mês Atual)</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
          
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Faturamento Recebido</div>
            <div id="faturamento-mes" style="font-size: 28px; font-weight: bold; color: #10b981;">R$ 0,00</div>
          </div>
          
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Total a Receber</div>
            <div id="total-receber" style="font-size: 28px; font-weight: bold; color: #f59e0b;">R$ 0,00</div>
          </div>
          
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">Total Vencido</div>
            <div id="total-vencido" style="font-size: 28px; font-weight: bold; color: #dc2626;">R$ 0,00</div>
          </div>
          
        </div>
      </div>
      
      <!-- KANBAN VIEW -->
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
  },
  
  // ==========================================
  // FILTROS
  // ==========================================
  
  aplicarFiltro() {
    const filtro = document.getElementById('filtro-periodo')?.value;
    console.log('📊 Aplicando filtro:', filtro);
    
    // Lógica de filtro será implementada
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao('🚧 Filtro em desenvolvimento', 'info');
    }
  },
  
  atualizar() {
    console.log('🔄 Atualizando dashboard...');
    this.atualizarFinanceiro();
    
    if (window.mostrarNotificacao) {
      window.mostrarNotificacao('✅ Dashboard atualizado!', 'success');
    }
  }
};

// ==========================================
// FUNÇÕES LEGADO (COMPATIBILIDADE)
// ==========================================

function iniciarDashboardFirestore() {
  const OFICINA_ID = window.OFICINA_CONFIG?.oficina_id || 'modelo';
  dashboardManager.init(OFICINA_ID);
  dashboardManager.iniciar();
}

function pararDashboardFirestore() {
  dashboardManager.parar();
}

function renderizarDashboard() {
  const container = document.querySelector('#gestao-oficina .content');
  if (container) {
    dashboardManager.renderizar('gestao-oficina-content');
    // Criar elemento com ID se não existir
    if (!document.getElementById('gestao-oficina-content')) {
      container.id = 'gestao-oficina-content';
      dashboardManager.renderizar('gestao-oficina-content');
    }
  }
}

function atualizarDashboard() {
  dashboardManager.atualizar();
}

function calcularTotalFinanceiro() {
  dashboardManager.atualizarFinanceiro();
}

// Expor globalmente
if (typeof window !== 'undefined') {
  window.dashboardManager = dashboardManager;
  window.iniciarDashboardFirestore = iniciarDashboardFirestore;
  window.pararDashboardFirestore = pararDashboardFirestore;
  window.renderizarDashboard = renderizarDashboard;
  window.atualizarDashboard = atualizarDashboard;
  window.calcularTotalFinanceiro = calcularTotalFinanceiro;
}

console.log('✅ gestao_oficina_dashboard.js v2.0.0 (ENXUTO) carregado');
