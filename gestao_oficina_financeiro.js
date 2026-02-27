(function () {
  const FORMAS = ['dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'faturado'];

  function obterOS() {
    return typeof window.carregarOS === 'function' ? window.carregarOS() : [];
  }

  function salvar(os) {
    if (typeof window.salvarOS === 'function') window.salvarOS(os);
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function normalizarFinanceiro(os) {
    os.financeiro = os.financeiro || {};
    const base = {
      custo_pecas: 0,
      custo_mao_obra: 0,
      custo_terceiros: 0,
      valor_pecas: 0,
      valor_servicos: 0,
      desconto: 0,
      acrescimo: 0,
      valor_subtotal: 0,
      valor_total: 0,
      margem_lucro_reais: 0,
      margem_lucro_percent: 0,
      forma_pagamento: '',
      dias_faturamento: 0,
      data_vencimento: null,
      status_pagamento: 'pendente',
      data_pagamento: null,
      parcelado: false,
      num_parcelas: 1,
      valor_parcela: 0,
      historico_pagamentos: [],
    };
    os.financeiro = { ...base, ...os.financeiro };
    return os;
  }

  function calcularFinanceiro(financeiro) {
    const custos = financeiro.custo_pecas + financeiro.custo_mao_obra + financeiro.custo_terceiros;
    financeiro.valor_subtotal = financeiro.valor_pecas + financeiro.valor_servicos;
    financeiro.valor_total = Math.max(
      0,
      financeiro.valor_subtotal - financeiro.desconto + financeiro.acrescimo
    );
    financeiro.margem_lucro_reais = financeiro.valor_total - custos;
    financeiro.margem_lucro_percent = financeiro.valor_total
      ? (financeiro.margem_lucro_reais / financeiro.valor_total) * 100
      : 0;
    if (financeiro.forma_pagamento === 'faturado' && financeiro.dias_faturamento > 0) {
      const venc = new Date();
      venc.setDate(venc.getDate() + Number(financeiro.dias_faturamento));
      financeiro.data_vencimento = venc.toISOString();
    }
    if (financeiro.parcelado && financeiro.num_parcelas > 1) {
      financeiro.valor_parcela = financeiro.valor_total / financeiro.num_parcelas;
    }
    return financeiro;
  }

  function abrirModalFinanceiro(osId) {
    const os = obterOS().find(item => String(item.id) === String(osId));
    if (!os) return;
    normalizarFinanceiro(os);

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal modal-v2">
      <h3>💰 Financeiro - ${os.placa}</h3>
      <div class="wizard-financeiro">
        <div class="step-title">Etapa 1: Custos</div>
        <input id="f-custo-pecas" type="number" min="0" step="0.01" value="${os.financeiro.custo_pecas}" placeholder="Custo peças">
        <input id="f-custo-mao" type="number" min="0" step="0.01" value="${os.financeiro.custo_mao_obra}" placeholder="Custo mão de obra">
        <input id="f-custo-terceiros" type="number" min="0" step="0.01" value="${os.financeiro.custo_terceiros}" placeholder="Custo terceiros">

        <div class="step-title">Etapa 2: Valores cliente</div>
        <input id="f-valor-pecas" type="number" min="0" step="0.01" value="${os.financeiro.valor_pecas}" placeholder="Valor peças">
        <input id="f-valor-servicos" type="number" min="0" step="0.01" value="${os.financeiro.valor_servicos}" placeholder="Valor serviços">
        <input id="f-desconto" type="number" min="0" step="0.01" value="${os.financeiro.desconto}" placeholder="Desconto">
        <input id="f-acrescimo" type="number" min="0" step="0.01" value="${os.financeiro.acrescimo}" placeholder="Acréscimo">

        <div class="step-title">Etapa 3: Pagamento</div>
        <select id="f-forma">${FORMAS.map(f => `<option value="${f}" ${os.financeiro.forma_pagamento === f ? 'selected' : ''}>${f}</option>`).join('')}</select>
        <select id="f-dias"><option value="0">À vista</option><option value="15">15 dias</option><option value="30">30 dias</option><option value="45">45 dias</option><option value="60">60 dias</option><option value="90">90 dias</option></select>
        <select id="f-parcelas">${Array.from({ length: 12 })
          .map((_, i) => `<option value="${i + 1}">${i + 1}x</option>`)
          .join('')}</select>

        <div id="f-resumo" class="painel-financeiro-resumo"></div>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" id="f-salvar">💾 Salvar e Gerar Recibo</button>
        <button class="btn-secondary" id="f-cancelar">Cancelar</button>
      </div>
    </div>`;

    function atualizarResumo() {
      const f = os.financeiro;
      f.custo_pecas = Number(modal.querySelector('#f-custo-pecas').value || 0);
      f.custo_mao_obra = Number(modal.querySelector('#f-custo-mao').value || 0);
      f.custo_terceiros = Number(modal.querySelector('#f-custo-terceiros').value || 0);
      f.valor_pecas = Number(modal.querySelector('#f-valor-pecas').value || 0);
      f.valor_servicos = Number(modal.querySelector('#f-valor-servicos').value || 0);
      f.desconto = Number(modal.querySelector('#f-desconto').value || 0);
      f.acrescimo = Number(modal.querySelector('#f-acrescimo').value || 0);
      f.forma_pagamento = modal.querySelector('#f-forma').value;
      f.dias_faturamento = Number(modal.querySelector('#f-dias').value || 0);
      f.num_parcelas = Number(modal.querySelector('#f-parcelas').value || 1);
      f.parcelado = f.num_parcelas > 1;
      calcularFinanceiro(f);
      const corMargem =
        f.margem_lucro_percent > 30 ? 'ok' : f.margem_lucro_percent >= 15 ? 'warn' : 'danger';
      modal.querySelector('#f-resumo').innerHTML = `
        <p>Subtotal: <strong>${moeda(f.valor_subtotal)}</strong></p>
        <p>Total: <strong>${moeda(f.valor_total)}</strong></p>
        <p class="${corMargem}">Margem: <strong>${f.margem_lucro_percent.toFixed(1)}%</strong> (${moeda(f.margem_lucro_reais)})</p>
      `;
    }

    modal
      .querySelectorAll('input,select')
      .forEach(el => el.addEventListener('input', atualizarResumo));
    atualizarResumo();

    modal.querySelector('#f-salvar')?.addEventListener('click', () => {
      os.financeiro.historico_pagamentos.push({
        data: new Date().toISOString(),
        valor: os.financeiro.valor_total,
        forma: os.financeiro.forma_pagamento,
        usuario: 'sistema_local',
      });
      salvar(os);
      renderizarPainelFinanceiro();
      window.mostrarNotificacao?.('Financeiro atualizado.', 'success');
      modal.remove();
    });

    modal.querySelector('#f-cancelar')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function gerarRelatorioFinanceiro() {
    const dados = obterOS().map(os => normalizarFinanceiro(os));
    const linhas = dados
      .map(
        os =>
          `<tr><td>${os.placa}</td><td>${os.nome_cliente || '-'}</td><td>${moeda(os.financeiro.valor_total)}</td><td>${os.financeiro.status_pagamento}</td></tr>`
      )
      .join('');
    const totalReceita = dados.reduce((acc, os) => acc + (os.financeiro.valor_total || 0), 0);
    const html = `<!doctype html><html><body><h1>Relatório Financeiro</h1><p>Total receita: <strong>${moeda(totalReceita)}</strong></p><table border="1" cellspacing="0" cellpadding="6"><thead><tr><th>Placa</th><th>Cliente</th><th>Total</th><th>Status</th></tr></thead><tbody>${linhas}</tbody></table></body></html>`;
    const nova = window.open('', '_blank');
    if (!nova) return;
    nova.document.write(html);
    nova.document.close();
  }

  function renderizarPainelFinanceiro() {
    let secao = document.getElementById('financeiro-v2');
    if (!secao) {
      secao = document.createElement('section');
      secao.id = 'financeiro-v2';
      secao.className = 'painel-v2';
      secao.innerHTML = `<div class="agenda-header"><h3>💰 Financeiro</h3><button class="btn-primary" id="gerar-relatorio-financeiro">📊 Gerar Relatório</button></div><div class="financeiro-cards"></div><div class="financeiro-lista"></div>`;
      document.querySelector('#gestao-oficina .content')?.appendChild(secao);
    }

    const listaOS = obterOS().map(os => normalizarFinanceiro(os));
    const receitaMes = listaOS.reduce((acc, os) => acc + os.financeiro.valor_total, 0);
    const custosMes = listaOS.reduce(
      (acc, os) =>
        acc +
        os.financeiro.custo_pecas +
        os.financeiro.custo_mao_obra +
        os.financeiro.custo_terceiros,
      0
    );
    const lucroMes = receitaMes - custosMes;
    const pendente = listaOS
      .filter(os => os.financeiro.status_pagamento !== 'pago')
      .reduce((acc, os) => acc + os.financeiro.valor_total, 0);

    secao.querySelector('.financeiro-cards').innerHTML = `
      <div class="resumo-v2-grid">
        <div class="resumo-v2-card"><strong>${moeda(receitaMes)}</strong><span>Receita mês</span></div>
        <div class="resumo-v2-card"><strong>${moeda(custosMes)}</strong><span>Custos mês</span></div>
        <div class="resumo-v2-card"><strong>${moeda(lucroMes)}</strong><span>Lucro líquido</span></div>
        <div class="resumo-v2-card"><strong>${moeda(pendente)}</strong><span>A receber</span></div>
      </div>`;

    secao.querySelector('.financeiro-lista').innerHTML =
      listaOS
        .map(
          os => `
      <div class="atrasado-item">
        <div><strong>${os.placa}</strong> · ${os.nome_cliente || '-'}<br><small>${moeda(os.financeiro.valor_total)} · ${os.financeiro.forma_pagamento || 'sem forma'}</small></div>
        <div><button class="btn-mini" data-fin-os="${os.id}">Editar</button></div>
      </div>
    `
        )
        .join('') || '<p class="empty-state">Nenhuma OS para exibir.</p>';

    secao
      .querySelectorAll('[data-fin-os]')
      .forEach(btn => btn.addEventListener('click', () => abrirModalFinanceiro(btn.dataset.finOs)));
    secao
      .querySelector('#gerar-relatorio-financeiro')
      ?.addEventListener('click', gerarRelatorioFinanceiro);
  }

  function init() {
    renderizarPainelFinanceiro();
    setInterval(renderizarPainelFinanceiro, 15 * 60 * 1000);
  }

  window.GestaoOficinaFinanceiro = {
    init,
    normalizarFinanceiro,
    calcularFinanceiro,
    abrirModalFinanceiro,
    gerarRelatorioFinanceiro,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
