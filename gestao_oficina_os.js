// ==========================================
// 🚗 SISTEMA DE ORDEM DE SERVIÇO (OS)
// ==========================================
// Gestão completa de OS com validações e integração

const osManager = {
  oficina_id: null,
  db: null,
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ OS Manager inicializado para:', oficina_id);
  },
  
  // ==========================================
  // CRIAR NOVA OS
  // ==========================================
  
  async criarOS(dadosOS) {
    try {
      // Validações
      this.validarOS(dadosOS);
      
      // Preparar dados
      const osData = {
        // Identificação
        numero_os: dadosOS.numero_os || this.gerarNumeroOS(),
        
        // Relacionamentos
        cliente_id: dadosOS.cliente_id,
        veiculo_id: dadosOS.veiculo_id,
        
        // Status
        status: dadosOS.status || 'RECEBIDO',
        prioridade: dadosOS.prioridade || 'Normal',
        
        // Serviços e Peças
        servicos: dadosOS.servicos || [],
        pecas: dadosOS.pecas || [],
        
        // Financeiro
        financeiro: {
          total_servicos: this.calcularTotalServicos(dadosOS.servicos || []),
          total_pecas: this.calcularTotalPecas(dadosOS.pecas || []),
          desconto: dadosOS.desconto || 0,
          total: 0, // Será calculado
          valor_pago: 0,
          valor_restante: 0,
          status_pagamento: 'pendente',
          forma_pagamento: dadosOS.forma_pagamento || null,
          data_vencimento: dadosOS.data_vencimento || null
        },
        
        // Checklist (vazio por enquanto)
        checklist: {
          itens: [],
          progresso: 0,
          status: 'pendente'
        },
        
        // Observações
        observacoes: dadosOS.observacoes || '',
        
        // Fotos
        fotos: dadosOS.fotos || [],
        
        // Timestamps
        data_entrada: firebase.firestore.Timestamp.now(),
        ultima_atualizacao: firebase.firestore.Timestamp.now(),
        
        // Histórico
        historico: [{
          timestamp: firebase.firestore.Timestamp.now(),
          tipo: 'criacao',
          descricao: 'OS criada no sistema',
          usuario: 'Sistema'
        }]
      };
      
      // Calcular totais
      osData.financeiro.total = this.calcularTotal(osData);
      osData.financeiro.valor_restante = osData.financeiro.total;
      
      // Salvar no Firestore
      const osRef = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .add(osData);
      
      console.log('✅ OS criada:', osRef.id);
      
      // Baixar estoque (se houver peças)
      if (osData.pecas.length > 0) {
        await this.baixarEstoque(osData.pecas, osRef.id);
      }
      
      return { success: true, id: osRef.id, numero_os: osData.numero_os };
      
    } catch (error) {
      console.error('❌ Erro ao criar OS:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // ATUALIZAR OS
  // ==========================================
  
  async atualizarOS(osId, dados) {
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      // Buscar OS atual
      const osDoc = await osRef.get();
      if (!osDoc.exists) {
        throw new Error('OS não encontrada');
      }
      
      const osAtual = osDoc.data();
      
      // Preparar dados de atualização
      const updateData = {
        ...dados,
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      };
      
      // Recalcular totais se necessário
      if (dados.servicos || dados.pecas || dados.desconto !== undefined) {
        const servicos = dados.servicos || osAtual.servicos;
        const pecas = dados.pecas || osAtual.pecas;
        const desconto = dados.desconto !== undefined ? dados.desconto : osAtual.financeiro.desconto;
        
        updateData.financeiro = {
          ...osAtual.financeiro,
          total_servicos: this.calcularTotalServicos(servicos),
          total_pecas: this.calcularTotalPecas(pecas),
          desconto: desconto
        };
        
        updateData.financeiro.total = 
          updateData.financeiro.total_servicos + 
          updateData.financeiro.total_pecas - 
          updateData.financeiro.desconto;
        
        updateData.financeiro.valor_restante = 
          updateData.financeiro.total - (osAtual.financeiro.valor_pago || 0);
      }
      
      // Atualizar status de pagamento
      if (updateData.financeiro) {
        updateData.financeiro.status_pagamento = this.determinarStatusPagamento(
          updateData.financeiro.valor_pago || osAtual.financeiro.valor_pago,
          updateData.financeiro.total,
          updateData.financeiro.data_vencimento || osAtual.financeiro.data_vencimento
        );
      }
      
      // Adicionar ao histórico
      const historicoEntry = {
        timestamp: firebase.firestore.Timestamp.now(),
        tipo: 'atualizacao',
        descricao: dados.historico_descricao || 'OS atualizada',
        usuario: dados.usuario || 'Sistema'
      };
      
      updateData.historico = firebase.firestore.FieldValue.arrayUnion(historicoEntry);
      
      // Salvar
      await osRef.update(updateData);
      
      console.log('✅ OS atualizada:', osId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar OS:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // REGISTRAR PAGAMENTO
  // ==========================================
  
  async registrarPagamento(osId, valorPagamento, formaPagamento) {
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      const osDoc = await osRef.get();
      if (!osDoc.exists) {
        throw new Error('OS não encontrada');
      }
      
      const osData = osDoc.data();
      const valorAtual = osData.financeiro.valor_pago || 0;
      const novoValorPago = valorAtual + valorPagamento;
      
      // Validar pagamento
      if (novoValorPago > osData.financeiro.total) {
        throw new Error('Valor pago não pode ser maior que o total');
      }
      
      const novoValorRestante = osData.financeiro.total - novoValorPago;
      const novoStatus = this.determinarStatusPagamento(
        novoValorPago,
        osData.financeiro.total,
        osData.financeiro.data_vencimento
      );
      
      // Atualizar
      await osRef.update({
        'financeiro.valor_pago': novoValorPago,
        'financeiro.valor_restante': novoValorRestante,
        'financeiro.status_pagamento': novoStatus,
        'financeiro.forma_pagamento': formaPagamento,
        ultima_atualizacao: firebase.firestore.Timestamp.now(),
        historico: firebase.firestore.FieldValue.arrayUnion({
          timestamp: firebase.firestore.Timestamp.now(),
          tipo: 'pagamento',
          descricao: `Pagamento de R$ ${valorPagamento.toFixed(2)} recebido (${formaPagamento})`,
          usuario: 'Sistema'
        })
      });
      
      console.log('✅ Pagamento registrado:', valorPagamento);
      return { success: true, valor_restante: novoValorRestante };
      
    } catch (error) {
      console.error('❌ Erro ao registrar pagamento:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // MUDAR STATUS
  // ==========================================
  
  async mudarStatus(osId, novoStatus) {
    try {
      // Validar se pode finalizar (checklist completo)
      if (novoStatus === 'FINALIZADO') {
        const podeFinalizar = await this.podeFinalizarOS(osId);
        if (!podeFinalizar.pode) {
          throw new Error(podeFinalizar.motivo);
        }
      }
      
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      await osRef.update({
        status: novoStatus,
        ultima_atualizacao: firebase.firestore.Timestamp.now(),
        historico: firebase.firestore.FieldValue.arrayUnion({
          timestamp: firebase.firestore.Timestamp.now(),
          tipo: 'mudanca_status',
          descricao: `Status alterado para ${novoStatus}`,
          usuario: 'Sistema'
        })
      });
      
      console.log('✅ Status atualizado para:', novoStatus);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao mudar status:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VALIDAÇÕES
  // ==========================================
  
  validarOS(dados) {
    if (!dados.cliente_id) {
      throw new Error('Cliente é obrigatório');
    }
    
    if (!dados.veiculo_id) {
      throw new Error('Veículo é obrigatório');
    }
    
    if (dados.desconto && dados.desconto < 0) {
      throw new Error('Desconto não pode ser negativo');
    }
  },
  
  async podeFinalizarOS(osId) {
    const osDoc = await this.db
      .collection('oficinas')
      .doc(this.oficina_id)
      .collection('ordens_servico')
      .doc(osId)
      .get();
    
    if (!osDoc.exists) {
      return { pode: false, motivo: 'OS não encontrada' };
    }
    
    const osData = osDoc.data();
    
    // Verificar checklist
    if (osData.checklist && osData.checklist.itens.length > 0) {
      if (osData.checklist.progresso < 100) {
        return { pode: false, motivo: 'Checklist não está 100% concluído' };
      }
    }
    
    return { pode: true };
  },
  
  determinarStatusPagamento(valorPago, total, dataVencimento) {
    if (valorPago === 0) {
      // Verificar se está atrasado
      if (dataVencimento) {
        const vencimento = new Date(dataVencimento);
        const hoje = new Date();
        if (hoje > vencimento) {
          return 'atrasado';
        }
      }
      return 'pendente';
    }
    
    if (valorPago >= total) {
      return 'pago';
    }
    
    return 'parcial';
  },
  
  // ==========================================
  // CÁLCULOS
  // ==========================================
  
  calcularTotalServicos(servicos) {
    return servicos.reduce((total, s) => total + (s.valor || 0), 0);
  },
  
  calcularTotalPecas(pecas) {
    return pecas.reduce((total, p) => total + ((p.valor || 0) * (p.quantidade || 1)), 0);
  },
  
  calcularTotal(osData) {
    const totalServicos = osData.financeiro.total_servicos || 0;
    const totalPecas = osData.financeiro.total_pecas || 0;
    const desconto = osData.financeiro.desconto || 0;
    
    return totalServicos + totalPecas - desconto;
  },
  
  // ==========================================
  // ESTOQUE
  // ==========================================
  
  async baixarEstoque(pecas, osId) {
    // Implementação simplificada - será completada em gestao_oficina_estoque.js
    console.log('🔄 Baixando estoque para OS:', osId);
    
    for (const peca of pecas) {
      if (peca.peca_id) {
        // Lógica de baixa será implementada no módulo de estoque
        console.log(`  - ${peca.nome}: ${peca.quantidade} unidades`);
      }
    }
  },
  
  // ==========================================
  // UTILITÁRIOS
  // ==========================================
  
  gerarNumeroOS() {
    const hoje = new Date();
    const placa = 'XXXXX'; // Será preenchido com placa do veículo
    const dia = hoje.getDate().toString().padStart(2, '0');
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0');
    const ano = hoje.getFullYear().toString().substr(-2);
    
    return `${placa}-${dia}${mes}${ano}`;
  },
  
  // ==========================================
  // BUSCAR OS
  // ==========================================
  
  async buscarOS(osId) {
    try {
      const osDoc = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId)
        .get();
      
      if (!osDoc.exists) {
        return { success: false, error: 'OS não encontrada' };
      }
      
      return { success: true, data: { id: osDoc.id, ...osDoc.data() } };
      
    } catch (error) {
      console.error('❌ Erro ao buscar OS:', error);
      return { success: false, error: error.message };
    }
  },
  
  async listarOS(filtros = {}) {
    try {
      let query = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico');
      
      // Aplicar filtros
      if (filtros.status) {
        query = query.where('status', '==', filtros.status);
      }
      
      if (filtros.cliente_id) {
        query = query.where('cliente_id', '==', filtros.cliente_id);
      }
      
      if (filtros.data_inicio && filtros.data_fim) {
        query = query
          .where('data_entrada', '>=', firebase.firestore.Timestamp.fromDate(new Date(filtros.data_inicio)))
          .where('data_entrada', '<=', firebase.firestore.Timestamp.fromDate(new Date(filtros.data_fim)));
      }
      
      // Ordenar
      query = query.orderBy('data_entrada', 'desc');
      
      // Limitar
      if (filtros.limite) {
        query = query.limit(filtros.limite);
      }
      
      const snapshot = await query.get();
      
      const osList = [];
      snapshot.forEach(doc => {
        osList.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: osList };
      
    } catch (error) {
      console.error('❌ Erro ao listar OS:', error);
      return { success: false, error: error.message };
    }
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.osManager = osManager;
}

console.log('✅ gestao_oficina_os.js v1.0.1 carregado');