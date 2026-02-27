(function () {
  if (window.__recibosV2Loaded) return;
  window.__recibosV2Loaded = true;

  function obterOS() {
    return typeof window.carregarOS === 'function' ? window.carregarOS() : [];
  }

  function moeda(v) {
    return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function criarTemplateRecibo(os) {
    // 🔥 FIX: Validar e normalizar dados financeiros antes de gerar recibo
    const f = os.financeiro || {};
    
    // ✅ Garantir valores padrão caso financeiro esteja vazio
    const valorPecas = Number(f.valor_pecas || 0);
    const valorServicos = Number(f.valor_servicos || 0);
    const desconto = Number(f.desconto || 0);
    const valorTotal = Number(f.valor_total || 0);
    const formaPagamento = f.forma_pagamento || 'Não informado';
    
    // ⚠️ Validar se há dados financeiros mínimos
    if (valorTotal === 0 && valorPecas === 0 && valorServicos === 0) {
      console.warn('⚠️ Recibo sem dados financeiros:', os.id);
      window.mostrarNotificacao?.('⚠️ Atenção: Esta OS não possui dados financeiros cadastrados!', 'warning');
    }
    
    return `<div id="recibo-pdf" style="font-family:Arial,sans-serif;padding:20px;color:#0f172a">
      <h2 style="margin:0 0 8px">${window.OFICINA_CONFIG?.nome_oficina || 'Fast Car Centro Automotivo'}</h2>
      <p style="margin:0 0 14px">CNPJ: ${window.OFICINA_CONFIG?.cnpj || '-'} · ${window.OFICINA_CONFIG?.endereco || '-'}</p>
      <hr>
      <h3>Recibo de Ordem de Serviço #${os.id || '-'}</h3>
      <p><strong>Cliente:</strong> ${os.nome_cliente || '-'} · <strong>Telefone:</strong> ${os.telefone || '-'}</p>
      <p><strong>Veículo:</strong> ${os.placa || '-'} ${os.modelo || ''}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Valor Peças</td><td style="border:1px solid #cbd5e1;padding:8px;text-align:right">${moeda(valorPecas)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Valor Serviços</td><td style="border:1px solid #cbd5e1;padding:8px;text-align:right">${moeda(valorServicos)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Desconto</td><td style="border:1px solid #cbd5e1;padding:8px;text-align:right">${moeda(desconto)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px"><strong>Total</strong></td><td style="border:1px solid #cbd5e1;padding:8px;text-align:right"><strong>${moeda(valorTotal)}</strong></td></tr>
      </table>
      <p style="margin-top:8px"><strong>Forma de pagamento:</strong> ${formaPagamento}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p style="margin-top:25px">_____________________________________<br>Assinatura</p>
    </div>`;
  }

  function gerarRecibo(osId) {
    const os = obterOS().find(item => String(item.id) === String(osId));
    if (!os) {
      console.error('❌ OS não encontrada:', osId);
      window.mostrarNotificacao?.('Erro: OS não encontrada!', 'error');
      return;
    }
    
    const wrapper = document.createElement('div');
    wrapper.innerHTML = criarTemplateRecibo(os);
    document.body.appendChild(wrapper);

    if (window.html2pdf) {
      window
        .html2pdf()
        .set({
          margin: 10,
          filename: `recibo_${os.placa || os.id}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(wrapper.querySelector('#recibo-pdf'))
        .save()
        .then(() => {
          console.log('✅ PDF gerado com sucesso');
          window.mostrarNotificacao?.('Recibo gerado com sucesso!', 'success');
        })
        .catch(err => {
          console.error('❌ Erro ao gerar PDF:', err);
          window.mostrarNotificacao?.('Erro ao gerar PDF. Abrindo para impressão...', 'warning');
          // Fallback: abrir em nova janela
          const nova = window.open('', '_blank');
          nova.document.write(wrapper.innerHTML);
          nova.document.close();
          nova.print();
        })
        .finally(() => wrapper.remove());
      return;
    }

    // Fallback caso html2pdf não esteja disponível
    const nova = window.open('', '_blank');
    nova.document.write(wrapper.innerHTML);
    nova.document.close();
    nova.print();
    wrapper.remove();
  }

  function gerarRelatorioFinanceiro() {
    const dados = obterOS();
    const total = dados.reduce((acc, os) => acc + Number(os.financeiro?.valor_total || 0), 0);
    const html = `<div style="font-family:Arial;padding:20px"><h2>Relatório Financeiro</h2><p>Total acumulado: <strong>${moeda(total)}</strong></p><table border="1" cellspacing="0" cellpadding="6"><tr><th>Placa</th><th>Cliente</th><th>Total</th></tr>${dados.map(os => `<tr><td>${os.placa || '-'}</td><td>${os.nome_cliente || '-'}</td><td>${moeda(os.financeiro?.valor_total || 0)}</td></tr>`).join('')}</table></div>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  }

  window.GestaoOficinaRecibos = { gerarRecibo, gerarRelatorioFinanceiro };
  
  console.log('✅ Módulo Recibos V2 carregado');
})();
