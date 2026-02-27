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
    const f = os.financeiro || {};
    return `<div id="recibo-pdf" style="font-family:Arial,sans-serif;padding:20px;color:#0f172a">
      <h2 style="margin:0 0 8px">${window.OFICINA_CONFIG?.nome_oficina || 'Fast Car Centro Automotivo'}</h2>
      <p style="margin:0 0 14px">CNPJ: ${window.OFICINA_CONFIG?.cnpj || '-'} · ${window.OFICINA_CONFIG?.endereco || '-'}</p>
      <hr>
      <h3>Recibo de Ordem de Serviço</h3>
      <p><strong>Cliente:</strong> ${os.nome_cliente || '-'} · <strong>Telefone:</strong> ${os.telefone || '-'}</p>
      <p><strong>Veículo:</strong> ${os.placa || '-'} ${os.modelo || ''}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Valor Peças</td><td style="border:1px solid #cbd5e1;padding:8px">${moeda(f.valor_pecas)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Valor Serviços</td><td style="border:1px solid #cbd5e1;padding:8px">${moeda(f.valor_servicos)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px">Desconto</td><td style="border:1px solid #cbd5e1;padding:8px">${moeda(f.desconto)}</td></tr>
        <tr><td style="border:1px solid #cbd5e1;padding:8px"><strong>Total</strong></td><td style="border:1px solid #cbd5e1;padding:8px"><strong>${moeda(f.valor_total)}</strong></td></tr>
      </table>
      <p style="margin-top:8px"><strong>Forma de pagamento:</strong> ${f.forma_pagamento || '-'}</p>
      <p><strong>Data:</strong> ${new Date().toLocaleString('pt-BR')}</p>
      <p style="margin-top:25px">_____________________________________<br>Assinatura</p>
    </div>`;
  }

  function gerarRecibo(osId) {
    const os = obterOS().find(item => String(item.id) === String(osId));
    if (!os) return;
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
        .finally(() => wrapper.remove());
      return;
    }

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
})();
