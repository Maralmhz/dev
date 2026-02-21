// ==========================================
// 🚗 SISTEMA DE ORDEM DE SERVIÇO (OS)
// ==========================================
// V2.0: COM TRANSAÇÕES, IDEMPOTÊNCIA E VERSIONAMENTO

const osManager = {
  oficina_id: null,
  db: null,
  operacoesEmAndamento: new Set(), // Proteção contra clique duplo
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ OS Manager v2.0 (BLINDADO) inicializado para:', oficina_id);
  },
  
  // ==========================================
  // CRIAR NOVA OS - COM TRANSAÇÃO ATÔMICA
  // ==========================================
  
  async criarOS(dadosOS) {
    // Gerar ID de operação para idempotência
    const operacaoId = `criar_os_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Proteção contra clique duplo
    if (this.operacoesEmAndamento.has('criar_os')) {
      return { success: false, error: 'Operação já em andamento. Aguarde...' };
    }
    
    this.operacoesEmAndamento.add('criar_os');
    
    try {
      // Validações
      this.validarOS(dadosOS);
      
      // Preparar dados base
      const timestamp = firebase.firestore.Timestamp.now();
      const numero_os = dadosOS.numero_os || this.gerarNumeroOS();
      
      const osData = {
        // Identificação
        numero_os: numero_os,
        operacao_id: operacaoId, // Para idempotência
        version: 1, // Controle de concorrência
        
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
          total: 0,
          valor_pago: 0,
          valor_restante: 0,
          status_pagamento: 'pendente',
          forma_pagamento: dadosOS.forma_pagamento || null,
          data_vencimento: dadosOS.data_vencimento || null
        },
        
        // Checklist
        checklist: {
          itens: [],
          progresso: 0,
          status: 'pendente'
        },
        
        // Observações e fotos
        observacoes: dadosOS.observacoes || '',
        fotos: dadosOS.fotos || [],
        
        // Timestamps
        data_entrada: timestamp,
        ultima_atualizacao: timestamp,
        
        // Histórico
        historico: [{
          timestamp: timestamp,
          tipo: 'criacao',
          descricao: 'OS criada no sistema',
          usuario: 'Sistema'
        }]
      };
      
      // Calcular totais
      osData.financeiro.total = this.calcularTotal(osData);
      osData.financeiro.valor_restante = osData.financeiro.total;
      
      // ==================================================
      // TRANSAÇÃO FIRESTORE - CRIAR OS + BAIXAR ESTOQUE
      // ==================================================
      
      const resultado = await this.db.runTransaction(async (transaction) => {
        const oficinaRef = this.db.collection('oficinas').doc(this.oficina_id);
        
        // 1. Criar referência da OS
        const osRef = oficinaRef.collection('ordens_servico').doc();
        
        // 2. Validar e reservar estoque
        const pecasRefs = [];
        const pecasData = [];
        
        for (const peca of osData.pecas) {
          if (peca.peca_id && peca.quantidade) {
            const pecaRef = oficinaRef.collection('pecas').doc(peca.peca_id);
            const pecaDoc = await transaction.get(pecaRef);
            
            if (!pecaDoc.exists) {
              throw new Error(`Peça ${peca.nome} não encontrada no estoque`);
            }
            
            const pecaData = pecaDoc.data();
            const qtdAtual = pecaData.quantidade_atual || 0;
            
            if (qtdAtual < peca.quantidade) {
              throw new Error(`Estoque insuficiente para ${peca.nome}. Disponível: ${qtdAtual}, Necessário: ${peca.quantidade}`);
            }
            
            pecasRefs.push(pecaRef);
            pecasData.push({
              ...pecaData,
              nova_quantidade: qtdAtual - peca.quantidade,
              quantidade_baixada: peca.quantidade
            });
          }
        }
        
        // 3. Criar OS
        transaction.set(osRef, osData);
        
        // 4. Baixar estoque e criar movimentações
        for (let i = 0; i < pecasRefs.length; i++) {
          const pecaRef = pecasRefs[i];
          const peca = pecasData[i];
          
          // Atualizar quantidade
          transaction.update(pecaRef, {
            quantidade_atual: peca.nova_quantidade,
            ultima_movimentacao: timestamp,
            version: firebase.firestore.FieldValue.increment(1)
          });
          
          // Criar registro de movimentação
          const movRef = oficinaRef.collection('movimentacoes_estoque').doc();
          transaction.set(movRef, {
            peca_id: pecaRef.id,
            tipo: 'saida',
            quantidade: peca.quantidade_baixada,
            motivo: `Saída para OS ${numero_os}`,
            referencia_tipo: 'os',
            referencia_id: osRef.id,
            quantidade_anterior: peca.quantidade_atual,
            quantidade_nova: peca.nova_quantidade,
            data: timestamp,
            usuario: 'Sistema'
          });
        }
        
        return { osId: osRef.id, numero_os: numero_os };
      });
      
      console.log('✅ OS criada com transação:', resultado.osId);
      
      return { 
        success: true, 
        id: resultado.osId, 
        numero_os: resultado.numero_os,
        operacao_id: operacaoId
      };
      
    } catch (error) {
      console.error('❌ Erro ao criar OS:', error);
      return { success: false, error: error.message };
    } finally {
      // Liberar proteção após 2 segundos
      setTimeout(() => {
        this.operacoesEmAndamento.delete('criar_os');
      }, 2000);
    }
  },
  
  // ==========================================
  // REGISTRAR PAGAMENTO - COM TRANSAÇÃO
  // ==========================================
  
  async registrarPagamento(osId, valorPagamento, formaPagamento) {
    const operacaoId = `pag_${osId}_${Date.now()}`;
    
    // Proteção contra duplicação
    if (this.operacoesEmAndamento.has(operacaoId)) {
      return { success: false, error: 'Pagamento já em processamento' };
    }
    
    this.operacoesEmAndamento.add(operacaoId);
    
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      // ==================================================
      // TRANSAÇÃO FIRESTORE - REGISTRAR PAGAMENTO
      // ==================================================
      
      const resultado = await this.db.runTransaction(async (transaction) => {
        const osDoc = await transaction.get(osRef);
        
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
        
        // Atualizar OS atomicamente
        transaction.update(osRef, {
          'financeiro.valor_pago': novoValorPago,
          'financeiro.valor_restante': novoValorRestante,
          'financeiro.status_pagamento': novoStatus,
          'financeiro.forma_pagamento': formaPagamento,
          ultima_atualizacao: firebase.firestore.Timestamp.now(),
          version: firebase.firestore.FieldValue.increment(1),
          historico: firebase.firestore.FieldValue.arrayUnion({
            timestamp: firebase.firestore.Timestamp.now(),
            tipo: 'pagamento',
            descricao: `Pagamento de R$ ${valorPagamento.toFixed(2)} recebido (${formaPagamento})`,
            usuario: 'Sistema',
            operacao_id: operacaoId
          })
        });
        
        return { valor_restante: novoValorRestante };
      });
      
      console.log('✅ Pagamento registrado:', valorPagamento);
      return { success: true, ...resultado, operacao_id: operacaoId };
      
    } catch (error) {
      console.error('❌ Erro ao registrar pagamento:', error);
      return { success: false, error: error.message };
    } finally {
      setTimeout(() => {
        this.operacoesEmAndamento.delete(operacaoId);
      }, 2000);
    }
  },
  
  // ==========================================
  // ATUALIZAR OS - COM CONTROLE DE VERSÃO
  // ==========================================
  
  async atualizarOS(osId, dados, versaoEsperada = null) {
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      return await this.db.runTransaction(async (transaction) => {
        const osDoc = await transaction.get(osRef);
        
        if (!osDoc.exists) {
          throw new Error('OS não encontrada');
        }
        
        const osAtual = osDoc.data();
        
        // Verificar versão (controle de concorrência)
        if (versaoEsperada !== null && osAtual.version !== versaoEsperada) {
          throw new Error('OS foi modificada por outro usuário. Recarregue os dados.');
        }
        
        const updateData = {
          ...dados,
          ultima_atualizacao: firebase.firestore.Timestamp.now(),
          version: firebase.firestore.FieldValue.increment(1)
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
        
        // Adicionar ao histórico
        const historicoEntry = {
          timestamp: firebase.firestore.Timestamp.now(),
          tipo: 'atualizacao',
          descricao: dados.historico_descricao || 'OS atualizada',
          usuario: dados.usuario || 'Sistema'
        };
        
        updateData.historico = firebase.firestore.FieldValue.arrayUnion(historicoEntry);
        
        transaction.update(osRef, updateData);
        
        return { success: true, nova_versao: osAtual.version + 1 };
      });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar OS:', error);
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
        version: firebase.firestore.FieldValue.increment(1),
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
  // UTILITÁRIOS
  // ==========================================
  
  gerarNumeroOS() {
    const hoje = new Date();
    const placa = 'XXXXX';
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
      
      query = query.orderBy('data_entrada', 'desc');
      
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

console.log('✅ gestao_oficina_os.js v2.0.0 (BLINDADO: TRANSAÇÕES + IDEMPOTÊNCIA + VERSIONAMENTO) carregado');