// ==========================================
// ✅ SISTEMA DE CHECKLIST (INTEGRADO À OS)
// ==========================================
// Checklist simples com progresso e validação

const checklistManager = {
  oficina_id: null,
  db: null,
  
  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init(oficina_id) {
    this.oficina_id = oficina_id;
    this.db = firebase.firestore();
    console.log('✅ Checklist Manager inicializado');
  },
  
  // ==========================================
  // ADICIONAR ITENS AO CHECKLIST
  // ==========================================
  
  async adicionarItens(osId, itens) {
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      // Formatar itens
      const itensFormatados = itens.map((item, index) => ({
        ordem: index + 1,
        descricao: item.descricao || item,
        concluido: false,
        observacao: ''
      }));
      
      await osRef.update({
        'checklist.itens': itensFormatados,
        'checklist.progresso': 0,
        'checklist.status': 'pendente',
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      console.log('✅ Checklist adicionado à OS:', osId);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Erro ao adicionar checklist:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // MARCAR/DESMARCAR ITEM
  // ==========================================
  
  async marcarItem(osId, indexItem, concluido, observacao = '') {
    try {
      const osRef = this.db
        .collection('oficinas')
        .doc(this.oficina_id)
        .collection('ordens_servico')
        .doc(osId);
      
      // Buscar OS
      const osDoc = await osRef.get();
      if (!osDoc.exists) {
        throw new Error('OS não encontrada');
      }
      
      const osData = osDoc.data();
      const checklist = osData.checklist || { itens: [] };
      
      // Validar índice
      if (indexItem < 0 || indexItem >= checklist.itens.length) {
        throw new Error('Índice do item inválido');
      }
      
      // Atualizar item
      checklist.itens[indexItem].concluido = concluido;
      if (observacao) {
        checklist.itens[indexItem].observacao = observacao;
      }
      
      // Recalcular progresso
      const totalItens = checklist.itens.length;
      const itensConcluidos = checklist.itens.filter(i => i.concluido).length;
      const progresso = totalItens > 0 ? Math.round((itensConcluidos / totalItens) * 100) : 0;
      
      checklist.progresso = progresso;
      checklist.status = progresso === 100 ? 'concluido' : progresso > 0 ? 'em_execucao' : 'pendente';
      
      // Salvar
      await osRef.update({
        checklist: checklist,
        ultima_atualizacao: firebase.firestore.Timestamp.now()
      });
      
      console.log(`✅ Item ${indexItem + 1} ${concluido ? 'marcado' : 'desmarcado'} (Progresso: ${progresso}%)`);
      
      return { 
        success: true, 
        progresso: progresso,
        status: checklist.status
      };
      
    } catch (error) {
      console.error('❌ Erro ao marcar item:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR CHECKLIST
  // ==========================================
  
  async buscarChecklist(osId) {
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
      
      const checklist = osDoc.data().checklist || { itens: [], progresso: 0, status: 'pendente' };
      
      return { success: true, data: checklist };
      
    } catch (error) {
      console.error('❌ Erro ao buscar checklist:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VERIFICAR SE CHECKLIST ESTÁ COMPLETO
  // ==========================================
  
  async verificarCompleto(osId) {
    const resultado = await this.buscarChecklist(osId);
    
    if (!resultado.success) {
      return { completo: false, motivo: resultado.error };
    }
    
    const checklist = resultado.data;
    
    if (checklist.itens.length === 0) {
      return { completo: true, motivo: 'Nenhum checklist definido' };
    }
    
    if (checklist.progresso < 100) {
      return { 
        completo: false, 
        motivo: `Checklist ${checklist.progresso}% concluído`,
        progresso: checklist.progresso
      };
    }
    
    return { completo: true, progresso: 100 };
  },
  
  // ==========================================
  // TEMPLATES PRÉ-DEFINIDOS (SIMPLIFICADOS)
  // ==========================================
  
  templates: {
    'revisao_10k': [
      'Trocar óleo do motor',
      'Trocar filtro de óleo',
      'Verificar nível de fluidos',
      'Inspecionar freios',
      'Verificar pressão dos pneus',
      'Testar luzes'
    ],
    
    'revisao_20k': [
      'Trocar óleo do motor',
      'Trocar filtro de óleo',
      'Trocar filtro de ar',
      'Trocar filtro de cabine',
      'Verificar velas de ignição',
      'Inspecionar sistema de freios',
      'Verificar alinhamento e balanceamento',
      'Revisar sistema de suspensão'
    ],
    
    'troca_pastilhas': [
      'Inspecionar discos de freio',
      'Remover pastilhas antigas',
      'Verificar estado dos pistões',
      'Instalar pastilhas novas',
      'Testar sistema de freios',
      'Fazer test-drive'
    ],
    
    'alinhamento_balanceamento': [
      'Verificar pressão dos pneus',
      'Inspecionar estado dos pneus',
      'Realizar balanceamento',
      'Realizar alinhamento',
      'Conferir geometria',
      'Fazer test-drive'
    ],
    
    'troca_oleo': [
      'Drenar óleo usado',
      'Trocar filtro de óleo',
      'Adicionar óleo novo',
      'Verificar nível final',
      'Verificar vazamentos',
      'Resetar indicador de manutenção'
    ],
    
    'inspecao_geral': [
      'Verificar nível de fluidos',
      'Inspecionar correias',
      'Verificar bateria',
      'Testar sistema elétrico',
      'Inspecionar pneus',
      'Verificar freios',
      'Testar ar-condicionado',
      'Inspecionar suspensão'
    ]
  },
  
  // ==========================================
  // APLICAR TEMPLATE
  // ==========================================
  
  async aplicarTemplate(osId, nomeTemplate) {
    const itens = this.templates[nomeTemplate];
    
    if (!itens) {
      return { success: false, error: 'Template não encontrado' };
    }
    
    return await this.adicionarItens(osId, itens);
  },
  
  // ==========================================
  // LISTAR TEMPLATES DISPONÍVEIS
  // ==========================================
  
  listarTemplates() {
    return Object.keys(this.templates).map(key => ({
      id: key,
      nome: this.formatarNomeTemplate(key),
      itens: this.templates[key].length
    }));
  },
  
  formatarNomeTemplate(key) {
    const nomes = {
      'revisao_10k': 'Revisão 10.000 km',
      'revisao_20k': 'Revisão 20.000 km',
      'troca_pastilhas': 'Troca de Pastilhas de Freio',
      'alinhamento_balanceamento': 'Alinhamento e Balanceamento',
      'troca_oleo': 'Troca de Óleo',
      'inspecao_geral': 'Inspeção Geral'
    };
    
    return nomes[key] || key;
  },
  
  // ==========================================
  // RENDERIZAR CHECKLIST (INTERFACE)
  // ==========================================
  
  async renderizarChecklist(osId, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Container não encontrado:', containerId);
      return;
    }
    
    const resultado = await this.buscarChecklist(osId);
    
    if (!resultado.success) {
      container.innerHTML = `<div style="color: red; padding: 20px;">❌ Erro ao carregar checklist</div>`;
      return;
    }
    
    const checklist = resultado.data;
    
    if (checklist.itens.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          <p style="font-size: 40px; margin-bottom: 10px;">📝</p>
          <p>Nenhum checklist definido para esta OS</p>
          <button onclick="checklistManager.exibirTemplates('${osId}', '${containerId}')" style="
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
          ">➕ Adicionar Template</button>
        </div>
      `;
      return;
    }
    
    // Renderizar checklist
    let html = `
      <div style="background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #e5e7eb;">
          <h3 style="margin: 0; font-size: 18px; color: #333;">✅ Checklist de Execução</h3>
          <div style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: ${checklist.progresso === 100 ? '#10b981' : '#667eea'};">
              ${checklist.progresso}%
            </div>
            <div style="font-size: 12px; color: #999;">
              ${checklist.itens.filter(i => i.concluido).length} de ${checklist.itens.length} itens
            </div>
          </div>
        </div>
        
        <!-- BARRA DE PROGRESSO -->
        <div style="background: #e5e7eb; height: 12px; border-radius: 6px; margin-bottom: 24px; overflow: hidden;">
          <div style="
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            height: 100%;
            width: ${checklist.progresso}%;
            transition: width 0.3s ease;
          "></div>
        </div>
        
        <!-- ITENS -->
        <div style="display: flex; flex-direction: column; gap: 12px;">
    `;
    
    checklist.itens.forEach((item, index) => {
      html += `
        <div style="
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: ${item.concluido ? '#f0fdf4' : '#f8fafc'};
          border: 2px solid ${item.concluido ? '#10b981' : '#e5e7eb'};
          border-radius: 10px;
          transition: all 0.2s;
        ">
          <input 
            type="checkbox" 
            id="check-${index}" 
            ${item.concluido ? 'checked' : ''}
            onchange="checklistManager.toggleItem('${osId}', ${index}, '${containerId}')"
            style="
              width: 24px;
              height: 24px;
              cursor: pointer;
              margin-top: 2px;
            "
          >
          <div style="flex: 1;">
            <label for="check-${index}" style="
              display: block;
              font-size: 15px;
              font-weight: 500;
              color: ${item.concluido ? '#059669' : '#374151'};
              text-decoration: ${item.concluido ? 'line-through' : 'none'};
              cursor: pointer;
              margin-bottom: ${item.observacao ? '8px' : '0'};
            ">
              ${item.ordem}. ${item.descricao}
            </label>
            ${item.observacao ? `
              <div style="
                font-size: 13px;
                color: #6b7280;
                font-style: italic;
                padding: 8px 12px;
                background: #fff;
                border-radius: 6px;
                border-left: 3px solid #667eea;
              ">
                📝 ${item.observacao}
              </div>
            ` : ''}
            <textarea 
              id="obs-${index}"
              placeholder="Adicionar observação (opcional)..."
              onchange="checklistManager.salvarObservacao('${osId}', ${index}, this.value, '${containerId}')"
              style="
                width: 100%;
                margin-top: 8px;
                padding: 8px 12px;
                border: 1px solid #e5e7eb;
                border-radius: 6px;
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                min-height: 40px;
                display: ${item.observacao ? 'none' : 'block'};
              "
            >${item.observacao || ''}</textarea>
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
        
        <!-- FOOTER -->
        <div style="margin-top: 24px; padding-top: 16px; border-top: 2px solid #e5e7eb; text-align: center;">
          ${checklist.progresso === 100 ? `
            <div style="
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: #fff;
              padding: 16px;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
            ">
              ✅ Checklist 100% Concluído!
            </div>
          ` : `
            <div style="color: #6b7280; font-size: 14px;">
              ⚠️ OS não pode ser finalizada até o checklist estar completo
            </div>
          `}
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  },
  
  // ==========================================
  // TOGGLE ITEM (USADO PELA INTERFACE)
  // ==========================================
  
  async toggleItem(osId, indexItem, containerId) {
    const checkbox = document.getElementById(`check-${indexItem}`);
    const concluido = checkbox.checked;
    
    const resultado = await this.marcarItem(osId, indexItem, concluido);
    
    if (resultado.success) {
      // Re-renderizar
      await this.renderizarChecklist(osId, containerId);
    } else {
      alert('❌ Erro ao atualizar item: ' + resultado.error);
      checkbox.checked = !concluido; // Reverter
    }
  },
  
  async salvarObservacao(osId, indexItem, observacao, containerId) {
    const resultado = await this.marcarItem(osId, indexItem, true, observacao);
    
    if (resultado.success) {
      await this.renderizarChecklist(osId, containerId);
    }
  },
  
  // ==========================================
  // EXIBIR TEMPLATES (MODAL SIMPLES)
  // ==========================================
  
  exibirTemplates(osId, containerId) {
    const templates = this.listarTemplates();
    
    let html = '<div style="padding: 20px;"><h3>Escolha um template:</h3><div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">';
    
    templates.forEach(template => {
      html += `
        <button onclick="checklistManager.aplicarERecarregar('${osId}', '${template.id}', '${containerId}')" style="
          padding: 16px;
          background: #fff;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          transition: all 0.2s;
        ">
          <div>${template.nome}</div>
          <div style="font-size: 12px; color: #999; margin-top: 4px;">${template.itens} itens</div>
        </button>
      `;
    });
    
    html += '</div></div>';
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = html;
    }
  },
  
  async aplicarERecarregar(osId, templateId, containerId) {
    const resultado = await this.aplicarTemplate(osId, templateId);
    
    if (resultado.success) {
      await this.renderizarChecklist(osId, containerId);
    } else {
      alert('❌ Erro ao aplicar template: ' + resultado.error);
    }
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.checklistManager = checklistManager;
}

console.log('✅ gestao_oficina_checklist.js v1.0.0 carregado');
