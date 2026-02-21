// ==========================================
// 👥 SISTEMA DE GESTÃO DE CLIENTES
// ==========================================
// Cadastro, histórico e análise de clientes

const clienteManager = {
  oficina_id: null,
  db: null,
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ Cliente Manager inicializado');
  },
  
  // ==========================================
  // CRIAR CLIENTE
  // ==========================================
  
  async criarCliente(dadosCliente) {
    try {
      // Validações
      this.validarCliente(dadosCliente);
      
      // Verificar se já existe (por CPF/CNPJ)
      if (dadosCliente.cpf_cnpj) {
        const existe = await this.buscarPorCpfCnpj(dadosCliente.cpf_cnpj);
        if (existe.success && existe.data) {
          return { success: false, error: 'Cliente já cadastrado com este CPF/CNPJ' };
        }
      }
      
      // Preparar dados
      const clienteData = {
        nome: dadosCliente.nome,
        cpf_cnpj: dadosCliente.cpf_cnpj || '',
        telefone: dadosCliente.telefone || '',
        telefone2: dadosCliente.telefone2 || '',
        email: dadosCliente.email || '',
        endereco: dadosCliente.endereco || '',
        observacoes: dadosCliente.observacoes || '',
        
        // Estatísticas
        total_gasto: 0,
        total_os: 0,
        ultima_visita: null,
        
        // Veículos vinculados
        veiculos: [],
        
        // Timestamps
        data_cadastro: firebase.firestore.Timestamp.now(),
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      };
      
      // Salvar
      const clienteRef = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .add(clienteData);
      
      console.log('✅ Cliente criado:', clienteRef.id);
      return { success: true, id: clienteRef.id };
      
    } catch (error) {
      console.error('❌ Erro ao criar cliente:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // ATUALIZAR CLIENTE
  // ==========================================
  
  async atualizarCliente(clienteId, dados) {
    try {
      const clienteRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .doc(clienteId);
      
      const updateData = {
        ...dados,
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      };
      
      await clienteRef.update(updateData);
      
      console.log('✅ Cliente atualizado:', clienteId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar cliente:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR CLIENTE
  // ==========================================
  
  async buscarCliente(clienteId) {
    try {
      const clienteDoc = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .doc(clienteId)
        .get();
      
      if (!clienteDoc.exists) {
        return { success: false, error: 'Cliente não encontrado' };
      }
      
      return { success: true, data: { id: clienteDoc.id, ...clienteDoc.data() } };
      
    } catch (error) {
      console.error('❌ Erro ao buscar cliente:', error);
      return { success: false, error: error.message };
    }
  },
  
  async buscarPorCpfCnpj(cpfCnpj) {
    try {
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .where('cpf_cnpj', '==', cpfCnpj)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: true, data: null };
      }
      
      const doc = snapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
      
    } catch (error) {
      console.error('❌ Erro ao buscar por CPF/CNPJ:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // LISTAR CLIENTES
  // ==========================================
  
  async listarClientes(filtros = {}) {
    try {
      let query = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes');
      
      // Ordenar por última atualização
      query = query.orderBy('ultima_atualizacao', 'desc');
      
      // Limitar
      if (filtros.limite) {
        query = query.limit(filtros.limite);
      }
      
      const snapshot = await query.get();
      
      const clientes = [];
      snapshot.forEach(doc => {
        clientes.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: clientes };
      
    } catch (error) {
      console.error('❌ Erro ao listar clientes:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR CLIENTES (SEARCH)
  // ==========================================
  
  async buscarClientesPorNome(termo) {
    try {
      // Busca simples por nome (Firebase não suporta LIKE)
      // Para busca avançada, usar Algolia ou índice próprio
      
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .orderBy('nome')
        .get();
      
      const clientes = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        // Filtro client-side
        if (data.nome.toLowerCase().includes(termo.toLowerCase())) {
          clientes.push({ id: doc.id, ...data });
        }
      });
      
      return { success: true, data: clientes };
      
    } catch (error) {
      console.error('❌ Erro ao buscar clientes:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // HISTÓRICO DO CLIENTE
  // ==========================================
  
  async buscarHistoricoOS(clienteId) {
    try {
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .where('cliente_id', '==', clienteId)
        .orderBy('data_entrada', 'desc')
        .get();
      
      const historico = [];
      snapshot.forEach(doc => {
        historico.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: historico };
      
    } catch (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // ESTATÍSTICAS DO CLIENTE
  // ==========================================
  
  async atualizarEstatisticas(clienteId) {
    try {
      // Buscar todas as OS do cliente
      const historico = await this.buscarHistoricoOS(clienteId);
      
      if (!historico.success) {
        throw new Error('Erro ao buscar histórico');
      }
      
      const osList = historico.data;
      
      // Calcular estatísticas
      const totalOS = osList.length;
      const totalGasto = osList.reduce((sum, os) => {
        return sum + (os.financeiro?.total || 0);
      }, 0);
      
      // Encontrar última visita
      let ultimaVisita = null;
      if (osList.length > 0) {
        ultimaVisita = osList[0].data_entrada; // Já ordenado por desc
      }
      
      // Atualizar cliente
      await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .doc(clienteId)
        .update({
          total_os: totalOS,
          total_gasto: totalGasto,
          ultima_visita: ultimaVisita,
          ultima_atualizacao: firebase.firestore.Timestamp.now()
        });
      
      console.log('✅ Estatísticas atualizadas:', { totalOS, totalGasto });
      return { success: true, totalOS, totalGasto };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar estatísticas:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VINCULAR VEÍCULO
  // ==========================================
  
  async vincularVeiculo(clienteId, veiculoId) {
    try {
      const clienteRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .doc(clienteId);
      
      await clienteRef.update({
        veiculos: firebase.firestore.FieldValue.arrayUnion(veiculoId),
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      console.log('✅ Veículo vinculado ao cliente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao vincular veículo:', error);
      return { success: false, error: error.message };
    }
  },
  
  async desvincularVeiculo(clienteId, veiculoId) {
    try {
      const clienteRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('clientes')
        .doc(clienteId);
      
      await clienteRef.update({
        veiculos: firebase.firestore.FieldValue.arrayRemove(veiculoId),
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      console.log('✅ Veículo desvinculado do cliente');
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao desvincular veículo:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR VEÍCULOS DO CLIENTE
  // ==========================================
  
  async buscarVeiculos(clienteId) {
    try {
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('veiculos')
        .where('cliente_id', '==', clienteId)
        .get();
      
      const veiculos = [];
      snapshot.forEach(doc => {
        veiculos.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: veiculos };
      
    } catch (error) {
      console.error('❌ Erro ao buscar veículos:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VALIDAÇÕES
  // ==========================================
  
  validarCliente(dados) {
    if (!dados.nome || dados.nome.trim() === '') {
      throw new Error('Nome do cliente é obrigatório');
    }
    
    if (dados.cpf_cnpj && !this.validarCpfCnpj(dados.cpf_cnpj)) {
      throw new Error('CPF/CNPJ inválido');
    }
    
    if (dados.telefone && !this.validarTelefone(dados.telefone)) {
      throw new Error('Telefone inválido');
    }
  },
  
  validarCpfCnpj(valor) {
    // Remover caracteres não numéricos
    const limpo = valor.replace(/\D/g, '');
    
    // CPF tem 11 dígitos, CNPJ tem 14
    return limpo.length === 11 || limpo.length === 14;
  },
  
  validarTelefone(valor) {
    // Remover caracteres não numéricos
    const limpo = valor.replace(/\D/g, '');
    
    // Telefone deve ter 10 ou 11 dígitos (com DDD)
    return limpo.length >= 10 && limpo.length <= 11;
  },
  
  // ==========================================
  // RENDERIZAR LISTA DE CLIENTES
  // ==========================================
  
  async renderizarLista(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Container não encontrado:', containerId);
      return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Carregando clientes...</div>';
    
    const resultado = await this.listarClientes({ limite: 50 });
    
    if (!resultado.success) {
      container.innerHTML = `<div style="color: red; padding: 20px;">❌ Erro ao carregar clientes</div>`;
      return;
    }
    
    const clientes = resultado.data;
    
    if (clientes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          <p style="font-size: 40px; margin-bottom: 10px;">👥</p>
          <p>Nenhum cliente cadastrado</p>
          <button onclick="clienteManager.exibirFormulario()" style="
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">➕ Cadastrar Primeiro Cliente</button>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0;">👥 Clientes (${clientes.length})</h3>
          <button onclick="clienteManager.exibirFormulario()" style="
            padding: 10px 20px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">➕ Novo Cliente</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    clientes.forEach(cliente => {
      const ultimaVisita = cliente.ultima_visita 
        ? new Date(cliente.ultima_visita.toDate()).toLocaleDateString('pt-BR')
        : 'Nunca';
      
      html += `
        <div onclick="clienteManager.exibirDetalhes('${cliente.id}')" style="
          padding: 16px;
          background: #f8fafc;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.borderColor='#667eea'" onmouseout="this.style.borderColor='#e5e7eb'">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 8px;">
                ${cliente.nome}
              </div>
              <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280;">
                ${cliente.telefone ? `<div>📱 ${cliente.telefone}</div>` : ''}
                ${cliente.cpf_cnpj ? `<div>🆔 ${cliente.cpf_cnpj}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 18px; font-weight: bold; color: #10b981;">
                R$ ${(cliente.total_gasto || 0).toFixed(2)}
              </div>
              <div style="font-size: 12px; color: #999; margin-top: 4px;">
                ${cliente.total_os || 0} OS
              </div>
              <div style="font-size: 11px; color: #999; margin-top: 4px;">
                Última: ${ultimaVisita}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
    
    container.innerHTML = html;
  },
  
  // ==========================================
  // FORMULÁRIO & DETALHES (SIMPLIFICADO)
  // ==========================================
  
  exibirFormulario() {
    alert('🚧 Formulário de cadastro em desenvolvimento');
    // Será implementado na interface
  },
  
  exibirDetalhes(clienteId) {
    alert('🚧 Detalhes do cliente em desenvolvimento');
    // Será implementado na interface
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.clienteManager = clienteManager;
}

console.log('✅ gestao_oficina_clientes.js v1.0.0 carregado');
