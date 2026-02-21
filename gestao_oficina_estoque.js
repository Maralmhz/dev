// ==========================================
// 📦 SISTEMA DE CONTROLE DE ESTOQUE
// ==========================================
// Controle de peças com baixa automática e alertas

const estoqueManager = {
  oficina_id: null,
  db: null,
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ Estoque Manager inicializado');
  },
  
  // ==========================================
  // CADASTRAR PEÇA
  // ==========================================
  
  async cadastrarPeca(dadosPeca) {
    try {
      // Validações
      this.validarPeca(dadosPeca);
      
      // Verificar se já existe (por código)
      if (dadosPeca.codigo) {
        const existe = await this.buscarPorCodigo(dadosPeca.codigo);
        if (existe.success && existe.data) {
          return { success: false, error: 'Peça já cadastrada com este código' };
        }
      }
      
      // Preparar dados
      const pecaData = {
        nome: dadosPeca.nome,
        codigo: dadosPeca.codigo || '',
        descricao: dadosPeca.descricao || '',
        
        // Estoque
        quantidade_atual: dadosPeca.quantidade_inicial || 0,
        estoque_minimo: dadosPeca.estoque_minimo || 0,
        
        // Preços
        preco_custo: dadosPeca.preco_custo || 0,
        preco_venda: dadosPeca.preco_venda || 0,
        
        // Fornecedor
        fornecedor: dadosPeca.fornecedor || '',
        
        // Timestamps
        data_cadastro: firebase.firestore.Timestamp.now(),
        ultima_atualizacao: firebase.firestore.Timestamp.now(),
        
        // Histórico de movimentações (resumido)
        ultima_entrada: null,
        ultima_saida: null
      };
      
      // Salvar
      const pecaRef = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .add(pecaData);
      
      console.log('✅ Peça cadastrada:', pecaRef.id);
      return { success: true, id: pecaRef.id };
      
    } catch (error) {
      console.error('❌ Erro ao cadastrar peça:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // ATUALIZAR PEÇA
  // ==========================================
  
  async atualizarPeca(pecaId, dados) {
    try {
      const pecaRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .doc(pecaId);
      
      const updateData = {
        ...dados,
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      };
      
      await pecaRef.update(updateData);
      
      console.log('✅ Peça atualizada:', pecaId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao atualizar peça:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // DAR ENTRADA NO ESTOQUE
  // ==========================================
  
  async darEntrada(pecaId, quantidade, observacao = '') {
    try {
      if (quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }
      
      const pecaRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .doc(pecaId);
      
      const pecaDoc = await pecaRef.get();
      if (!pecaDoc.exists) {
        throw new Error('Peça não encontrada');
      }
      
      const pecaData = pecaDoc.data();
      const novaQuantidade = (pecaData.quantidade_atual || 0) + quantidade;
      
      await pecaRef.update({
        quantidade_atual: novaQuantidade,
        ultima_entrada: firebase.firestore.Timestamp.now(),
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      // Registrar movimentação
      await this.registrarMovimentacao(pecaId, 'entrada', quantidade, novaQuantidade, observacao);
      
      console.log(`✅ Entrada registrada: ${quantidade} unidades`);
      return { success: true, quantidade_nova: novaQuantidade };
      
    } catch (error) {
      console.error('❌ Erro ao dar entrada:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // DAR SAÍDA DO ESTOQUE (MANUAL)
  // ==========================================
  
  async darSaida(pecaId, quantidade, observacao = '') {
    try {
      if (quantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }
      
      const pecaRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .doc(pecaId);
      
      const pecaDoc = await pecaRef.get();
      if (!pecaDoc.exists) {
        throw new Error('Peça não encontrada');
      }
      
      const pecaData = pecaDoc.data();
      const quantidadeAtual = pecaData.quantidade_atual || 0;
      
      if (quantidadeAtual < quantidade) {
        throw new Error(`Estoque insuficiente. Disponível: ${quantidadeAtual}`);
      }
      
      const novaQuantidade = quantidadeAtual - quantidade;
      
      await pecaRef.update({
        quantidade_atual: novaQuantidade,
        ultima_saida: firebase.firestore.Timestamp.now(),
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      // Registrar movimentação
      await this.registrarMovimentacao(pecaId, 'saida', quantidade, novaQuantidade, observacao);
      
      console.log(`✅ Saída registrada: ${quantidade} unidades`);
      return { success: true, quantidade_nova: novaQuantidade };
      
    } catch (error) {
      console.error('❌ Erro ao dar saída:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BAIXAR ESTOQUE (AUTOMÁTICO POR OS)
  // ==========================================
  
  async baixarPorOS(pecas, osId) {
    try {
      const resultados = [];
      
      for (const peca of pecas) {
        if (!peca.peca_id) {
          console.warn('⚠️ Peça sem ID, pulando baixa:', peca.nome);
          continue;
        }
        
        const quantidade = peca.quantidade || 1;
        
        const resultado = await this.darSaida(
          peca.peca_id,
          quantidade,
          `Baixa automática - OS #${osId}`
        );
        
        if (resultado.success) {
          resultados.push({
            peca_id: peca.peca_id,
            nome: peca.nome,
            quantidade: quantidade,
            sucesso: true
          });
        } else {
          resultados.push({
            peca_id: peca.peca_id,
            nome: peca.nome,
            quantidade: quantidade,
            sucesso: false,
            erro: resultado.error
          });
        }
      }
      
      console.log('✅ Baixa de estoque concluída:', resultados);
      return { success: true, resultados };
      
    } catch (error) {
      console.error('❌ Erro ao baixar estoque:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VERIFICAR DISPONIBILIDADE
  // ==========================================
  
  async verificarDisponibilidade(pecaId, quantidadeNecessaria) {
    try {
      const pecaDoc = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .doc(pecaId)
        .get();
      
      if (!pecaDoc.exists) {
        return { disponivel: false, motivo: 'Peça não encontrada' };
      }
      
      const pecaData = pecaDoc.data();
      const quantidadeAtual = pecaData.quantidade_atual || 0;
      
      if (quantidadeAtual < quantidadeNecessaria) {
        return {
          disponivel: false,
          motivo: `Estoque insuficiente (disponível: ${quantidadeAtual}, necessário: ${quantidadeNecessaria})`,
          quantidade_disponivel: quantidadeAtual
        };
      }
      
      return {
        disponivel: true,
        quantidade_disponivel: quantidadeAtual
      };
      
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade:', error);
      return { disponivel: false, motivo: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR PEÇAS
  // ==========================================
  
  async buscarPeca(pecaId) {
    try {
      const pecaDoc = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .doc(pecaId)
        .get();
      
      if (!pecaDoc.exists) {
        return { success: false, error: 'Peça não encontrada' };
      }
      
      return { success: true, data: { id: pecaDoc.id, ...pecaDoc.data() } };
      
    } catch (error) {
      console.error('❌ Erro ao buscar peça:', error);
      return { success: false, error: error.message };
    }
  },
  
  async buscarPorCodigo(codigo) {
    try {
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque')
        .where('codigo', '==', codigo)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return { success: true, data: null };
      }
      
      const doc = snapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
      
    } catch (error) {
      console.error('❌ Erro ao buscar por código:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // LISTAR PEÇAS
  // ==========================================
  
  async listarPecas(filtros = {}) {
    try {
      let query = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('estoque');
      
      // Filtro: apenas com estoque baixo
      if (filtros.estoque_baixo) {
        // Firestore não suporta comparação entre campos diretamente
        // Filtro será feito client-side
      }
      
      query = query.orderBy('nome', 'asc');
      
      if (filtros.limite) {
        query = query.limit(filtros.limite);
      }
      
      const snapshot = await query.get();
      
      let pecas = [];
      snapshot.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        pecas.push(data);
      });
      
      // Filtro client-side: estoque baixo
      if (filtros.estoque_baixo) {
        pecas = pecas.filter(p => 
          (p.quantidade_atual || 0) <= (p.estoque_minimo || 0)
        );
      }
      
      return { success: true, data: pecas };
      
    } catch (error) {
      console.error('❌ Erro ao listar peças:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // REGISTRAR MOVIMENTAÇÃO
  // ==========================================
  
  async registrarMovimentacao(pecaId, tipo, quantidade, quantidade_nova, observacao) {
    try {
      await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('movimentacoes_estoque')
        .add({
          peca_id: pecaId,
          tipo: tipo, // 'entrada' ou 'saida'
          quantidade: quantidade,
          quantidade_nova: quantidade_nova,
          observacao: observacao,
          timestamp: firebase.firestore.Timestamp.now(),
          usuario: 'Sistema'
        });
      
      console.log(`✅ Movimentação registrada: ${tipo}`);
      
    } catch (error) {
      console.error('❌ Erro ao registrar movimentação:', error);
    }
  },
  
  // ==========================================
  // BUSCAR MOVIMENTAÇÕES
  // ==========================================
  
  async buscarMovimentacoes(pecaId, limite = 20) {
    try {
      const snapshot = await this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('movimentacoes_estoque')
        .where('peca_id', '==', pecaId)
        .orderBy('timestamp', 'desc')
        .limit(limite)
        .get();
      
      const movimentacoes = [];
      snapshot.forEach(doc => {
        movimentacoes.push({ id: doc.id, ...doc.data() });
      });
      
      return { success: true, data: movimentacoes };
      
    } catch (error) {
      console.error('❌ Erro ao buscar movimentações:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // ALERTAS DE ESTOQUE BAIXO
  // ==========================================
  
  async verificarEstoqueBaixo() {
    const resultado = await this.listarPecas({ estoque_baixo: true });
    
    if (!resultado.success) {
      return { success: false, error: resultado.error };
    }
    
    const pecasBaixas = resultado.data;
    
    return {
      success: true,
      total: pecasBaixas.length,
      pecas: pecasBaixas
    };
  },
  
  // ==========================================
  // VALIDAÇÕES
  // ==========================================
  
  validarPeca(dados) {
    if (!dados.nome || dados.nome.trim() === '') {
      throw new Error('Nome da peça é obrigatório');
    }
    
    if (dados.quantidade_inicial !== undefined && dados.quantidade_inicial < 0) {
      throw new Error('Quantidade inicial não pode ser negativa');
    }
    
    if (dados.estoque_minimo !== undefined && dados.estoque_minimo < 0) {
      throw new Error('Estoque mínimo não pode ser negativo');
    }
    
    if (dados.preco_custo !== undefined && dados.preco_custo < 0) {
      throw new Error('Preço de custo não pode ser negativo');
    }
    
    if (dados.preco_venda !== undefined && dados.preco_venda < 0) {
      throw new Error('Preço de venda não pode ser negativo');
    }
  },
  
  // ==========================================
  // RENDERIZAR LISTA DE ESTOQUE
  // ==========================================
  
  async renderizarLista(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Container não encontrado:', containerId);
      return;
    }
    
    container.innerHTML = '<div style="text-align: center; padding: 40px;">Carregando estoque...</div>';
    
    const resultado = await this.listarPecas({ limite: 100 });
    
    if (!resultado.success) {
      container.innerHTML = `<div style="color: red; padding: 20px;">❌ Erro ao carregar estoque</div>`;
      return;
    }
    
    const pecas = resultado.data;
    const pecasBaixas = pecas.filter(p => 
      (p.quantidade_atual || 0) <= (p.estoque_minimo || 0)
    );
    
    if (pecas.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          <p style="font-size: 40px; margin-bottom: 10px;">📦</p>
          <p>Nenhuma peça cadastrada no estoque</p>
          <button onclick="estoqueManager.exibirFormulario()" style="
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">➕ Cadastrar Primeira Peça</button>
        </div>
      `;
      return;
    }
    
    let html = `
      <div style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <div>
            <h3 style="margin: 0 0 8px 0;">📦 Estoque (${pecas.length} peças)</h3>
            ${pecasBaixas.length > 0 ? `
              <div style="display: inline-block; background: #fee2e2; color: #dc2626; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                ⚠️ ${pecasBaixas.length} peça(s) com estoque baixo
              </div>
            ` : ''}
          </div>
          <button onclick="estoqueManager.exibirFormulario()" style="
            padding: 10px 20px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">➕ Nova Peça</button>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    pecas.forEach(peca => {
      const estoqueBaixo = (peca.quantidade_atual || 0) <= (peca.estoque_minimo || 0);
      const percEstoque = peca.estoque_minimo > 0 
        ? Math.min(100, (peca.quantidade_atual / peca.estoque_minimo) * 100)
        : 100;
      
      html += `
        <div onclick="estoqueManager.exibirDetalhes('${peca.id}')" style="
          padding: 16px;
          background: ${estoqueBaixo ? '#fef2f2' : '#f8fafc'};
          border: 2px solid ${estoqueBaixo ? '#fecaca' : '#e5e7eb'};
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        " onmouseover="this.style.borderColor='${estoqueBaixo ? '#dc2626' : '#667eea'}'" onmouseout="this.style.borderColor='${estoqueBaixo ? '#fecaca' : '#e5e7eb'}'">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div style="flex: 1;">
              <div style="font-size: 16px; font-weight: 600; color: #333; margin-bottom: 4px;">
                ${peca.nome}
              </div>
              ${peca.codigo ? `
                <div style="font-size: 12px; color: #999; margin-bottom: 8px;">
                  Código: ${peca.codigo}
                </div>
              ` : ''}
              <div style="display: flex; gap: 16px; font-size: 13px; color: #6b7280; flex-wrap: wrap;">
                <div>💰 Venda: R$ ${(peca.preco_venda || 0).toFixed(2)}</div>
                ${peca.fornecedor ? `<div>📦 ${peca.fornecedor}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right; min-width: 120px;">
              <div style="font-size: 24px; font-weight: bold; color: ${estoqueBaixo ? '#dc2626' : '#10b981'};">
                ${peca.quantidade_atual || 0}
              </div>
              <div style="font-size: 12px; color: #999;">
                Mínimo: ${peca.estoque_minimo || 0}
              </div>
              ${estoqueBaixo ? `
                <div style="margin-top: 8px; font-size: 11px; color: #dc2626; font-weight: 600;">
                  ⚠️ ESTOQUE BAIXO
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div></div>';
    
    container.innerHTML = html;
  },
  
  exibirFormulario() {
    alert('🚧 Formulário de cadastro em desenvolvimento');
  },
  
  exibirDetalhes(pecaId) {
    alert('🚧 Detalhes da peça em desenvolvimento');
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.estoqueManager = estoqueManager;
}

console.log('✅ gestao_oficina_estoque.js v1.0.0 carregado');
