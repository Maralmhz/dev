(function () {
  const ETAPAS_PADRAO = [
    'mecanica',
    'lanternagem',
    'preparacao',
    'pintura',
    'eletrica',
    'montagem',
    'finalizacao',
  ];
  const REFRESH_DEBOUNCE_MS = 300;
  let refreshTimeout = null;

  function debounceRefresh() {
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(() => {
      aprimorarCardsOS();
      renderizarResumoV2();
      renderizarClientesAtrasados();
      renderizarVeiculosNaOficina();
    }, REFRESH_DEBOUNCE_MS);
  }

  function obterOS() {
    return typeof window.carregarOS === 'function' ? window.carregarOS() : [];
  }

  function initials(nome) {
    const partes = String(nome || 'Cliente')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return partes
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  function progressoOS(os) {
    const totalEtapas = ETAPAS_PADRAO.length;
    const concluidas = Array.isArray(os.historico_etapas) ? os.historico_etapas.length : 0;
    return Math.max(8, Math.min(100, Math.round((concluidas / totalEtapas) * 100)));
  }

  function tipoServicoCor(tipo) {
    if (tipo === 'rapida') return '#10b981';
    if (tipo === 'complexa') return '#ef4444';
    return '#f59e0b';
  }

  function aprimorarCardsOS() {
    document.querySelectorAll('.os-card').forEach(card => {
      if (card.dataset.v2Enhanced === '1') return;
      card.dataset.v2Enhanced = '1';
      const osId = card.dataset.id;
      const os = obterOS().find(item => String(item.id) === String(osId));
      if (!os) return;

      const faixa = document.createElement('div');
      faixa.className = 'os-priority-strip';
      faixa.style.background = tipoServicoCor(os.tipo_servico);
      card.prepend(faixa);

      const header = card.querySelector('.os-header');
      if (header) {
        const avatar = document.createElement('span');
        avatar.className = 'cliente-avatar';
        avatar.textContent = initials(os.nome_cliente);
        header.prepend(avatar);
      }

      const progress = document.createElement('div');
      const percentual = progressoOS(os);
      progress.className = 'os-progress-wrap';
      progress.innerHTML = `
        <div class="os-progress-label">Progresso: ${percentual}%</div>
        <div class="os-progress-bar" role="progressbar" aria-label="Progresso da OS" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual}">
          <span style="width:${percentual}%"></span>
        </div>
      `;

      const info = card.querySelector('.os-info');
      if (info) info.appendChild(progress);

      card.title = `Cliente: ${os.nome_cliente || '-'}\nPlaca: ${os.placa || '-'}\nEntrada: ${new Date(os.data_prevista_entrada).toLocaleString('pt-BR')}`;
      card.addEventListener('dblclick', () => abrirModalAcompanhamento(os.id));
    });
  }

  function sparkline(values = []) {
    if (!values.length) return '';
    const max = Math.max(...values, 1);
    const points = values
      .map((v, i) => `${(i / (values.length - 1 || 1)) * 100},${40 - (v / max) * 35}`)
      .join(' ');
    return `<svg viewBox="0 0 100 40" class="sparkline" aria-hidden="true"><polyline points="${points}"/></svg>`;
  }

  function renderizarResumoV2() {
    const resumoTopo = document.getElementById('resumoTopo');
    if (!resumoTopo) return;
    const osList = obterOS();
    const hoje = new Date();
    const ontem = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const totalHoje = osList.filter(
      os => new Date(os.data_prevista_entrada).toDateString() === hoje.toDateString()
    ).length;
    const totalOntem = osList.filter(
      os => new Date(os.data_prevista_entrada).toDateString() === ontem.toDateString()
    ).length;
    const variacao = totalOntem
      ? Math.round(((totalHoje - totalOntem) / totalOntem) * 100)
      : totalHoje
        ? 100
        : 0;

    const blocos = [
      {
        id: 'agendado',
        label: 'Agendados',
        value: osList.filter(o => o.status_geral === 'agendado').length,
      },
      {
        id: 'em_andamento',
        label: 'Em andamento',
        value: osList.filter(o => o.status_geral === 'em_andamento').length,
      },
      {
        id: 'finalizado',
        label: 'Finalizadas',
        value: osList.filter(o => o.status_geral === 'finalizado').length,
      },
      { id: 'atrasado', label: 'Atrasadas', value: osList.filter(o => o.atrasado).length },
      { id: 'total', label: 'Total', value: osList.length },
    ];

    resumoTopo.classList.add('resumo-v2-grid');
    resumoTopo.innerHTML =
      blocos
        .map(
          bloco => `
      <button class="resumo-card resumo-v2-card" aria-label="Filtrar por ${bloco.label}" onclick="window.irParaColunaKanban && window.irParaColunaKanban('${bloco.id}')">
        <strong>${bloco.value}</strong>
        <span>${bloco.label}</span>
        ${sparkline([Math.max(0, bloco.value - 2), Math.max(0, bloco.value - 1), bloco.value])}
      </button>
    `
        )
        .join('') +
      `<div class="resumo-variacao">${variacao >= 0 ? '↑' : '↓'} ${Math.abs(variacao)}% vs ontem</div>`;
  }

  function renderizarClientesAtrasados() {
    const containerId = 'clientes-atrasados-v2';
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement('section');
      container.id = containerId;
      container.className = 'painel-v2';
      container.innerHTML = '<h3>⚠️ Clientes Atrasados</h3><div class="conteudo"></div>';
      document.querySelector('#gestao-oficina .content')?.appendChild(container);
    }

    const agora = new Date();
    const atrasados = obterOS().filter(
      os => os.status_geral === 'agendado' && new Date(os.data_prevista_entrada) < agora
    );
    const body = container.querySelector('.conteudo');
    if (!body) return;
    if (!atrasados.length) {
      body.innerHTML = '<p class="empty-state">🟢 Nenhum cliente atrasado no momento.</p>';
      return;
    }

    body.innerHTML = atrasados
      .map(os => {
        const atrasoHoras = Math.round((agora - new Date(os.data_prevista_entrada)) / 36e5);
        return `<div class="atrasado-item">
        <div><strong>${os.placa}</strong> · ${os.nome_cliente || 'Sem nome'}<br><small>${atrasoHoras}h de atraso</small></div>
        <div class="acoes-inline">
          <a class="btn-mini" href="tel:${os.telefone || ''}">📞 Ligar</a>
          <a class="btn-mini" target="_blank" rel="noopener" href="https://wa.me/55${String(os.telefone || '').replace(/\D/g, '')}">💬 WhatsApp</a>
        </div>
      </div>`;
      })
      .join('');
  }

  function abrirModalAcompanhamento(osId) {
    const os = obterOS().find(item => String(item.id) === String(osId));
    if (!os) return;
    const etapas = ETAPAS_PADRAO;
    const feitas = new Set((os.historico_etapas || []).map(h => h.etapa));
    const timeline = etapas
      .map(etapa => {
        const done = feitas.has(etapa);
        const current = os.etapa_atual === etapa;
        return `<div class="timeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}">${done ? '✅' : current ? '🔧' : '⏳'} ${etapa}</div>`;
      })
      .join('<span class="timeline-arrow">→</span>');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal modal-v2"><h3>🚗 Acompanhamento ${os.placa}</h3>
      <p>Cliente: <strong>${os.nome_cliente || '-'}</strong> · Status: ${os.status_geral}</p>
      <div class="timeline-wrap">${timeline}</div>
      <p>Previsão de saída: <strong>${new Date(os.data_prevista_saida).toLocaleString('pt-BR')}</strong></p>
      <button class="btn-primary" aria-label="Fechar acompanhamento">Fechar</button></div>`;
    modal.querySelector('button')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function renderizarVeiculosNaOficina() {
    let secao = document.getElementById('veiculos-oficina-v2');
    if (!secao) {
      secao = document.createElement('section');
      secao.id = 'veiculos-oficina-v2';
      secao.className = 'painel-v2';
      secao.innerHTML = '<h3>🚗 Veículos na Oficina</h3><div class="veiculos-grid"></div>';
      document.querySelector('#gestao-oficina .content')?.appendChild(secao);
    }

    const grid = secao.querySelector('.veiculos-grid');
    if (!grid) return;
    const emAndamento = obterOS().filter(os => os.status_geral !== 'finalizado');
    grid.innerHTML =
      emAndamento
        .map(
          os => `
      <article class="veiculo-card-v2">
        <div class="veiculo-foto">🚘</div>
        <h4>${os.placa} · ${os.modelo || 'Modelo não informado'}</h4>
        <p>Etapa: <strong>${os.etapa_atual || '-'}</strong></p>
        <p>Saída prevista: ${new Date(os.data_prevista_saida).toLocaleString('pt-BR')}</p>
        <div class="os-progress-bar"><span style="width:${progressoOS(os)}%"></span></div>
      </article>
    `
        )
        .join('') || '<p class="empty-state">Sem veículos em andamento.</p>';
  }

  function init() {
    document.body.classList.add('gestao-v2-enabled');
    debounceRefresh();
    const observer = new MutationObserver(debounceRefresh);
    observer.observe(document.getElementById('gestao-oficina') || document.body, {
      childList: true,
      subtree: true,
    });
  }

  window.GestaoOficinaV2 = { init, abrirModalAcompanhamento };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
