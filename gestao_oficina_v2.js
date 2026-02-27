(function () {
  if (window.__gestaoV2Loaded) return;
  window.__gestaoV2Loaded = true;


  const ETAPAS_PADRAO = [
    'mecanica',
    'lanternagem',
    'preparacao',
    'pintura',
    'eletrica',
    'montagem',
    'finalizacao',
  ];
  let inicializado = false;
  let rafId = null;


  function obterOS() {
    return typeof window.carregarOS === 'function' ? window.carregarOS() : [];
  }

  function initials(nome) {
    return String(nome || 'Cliente')
      .trim()
      .split(/\s+/)
      .filter(Boolean)

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

  function abrirModalAcompanhamento(osId) {
    const os = obterOS().find(item => String(item.id) === String(osId));
    if (!os) return;
    const feitas = new Set((os.historico_etapas || []).map(h => h.etapa));
    const timeline = ETAPAS_PADRAO.map(etapa => {
      const done = feitas.has(etapa);
      const current = os.etapa_atual === etapa;
      return `<div class="timeline-step ${done ? 'done' : ''} ${current ? 'current' : ''}">${done ? '✅' : current ? '🔧' : '⏳'} ${etapa}</div>`;
    }).join('<span class="timeline-arrow">→</span>');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal modal-v2"><h3>🚗 Acompanhamento ${os.placa}</h3><p>Cliente: <strong>${os.nome_cliente || '-'}</strong> · Status: ${os.status_geral}</p><div class="timeline-wrap">${timeline}</div><p>Previsão de saída: <strong>${new Date(os.data_prevista_saida).toLocaleString('pt-BR')}</strong></p><button class="btn-primary">Fechar</button></div>`;
    modal.querySelector('button')?.addEventListener('click', () => modal.remove(), { once: true });
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });
    document.body.appendChild(modal);
  }

  function aprimorarCardsOS() {
    document.querySelectorAll('.os-card').forEach(card => {
      if (card.dataset.v2Enhanced === '1') return;
      const os = obterOS().find(item => String(item.id) === String(card.dataset.id));
      if (!os) return;
      card.dataset.v2Enhanced = '1';

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
      const info = card.querySelector('.os-info');
      if (info) {
        const percentual = progressoOS(os);
        const progress = document.createElement('div');
        progress.className = 'os-progress-wrap';
        progress.innerHTML = `<div class="os-progress-label">Progresso: ${percentual}%</div><div class="os-progress-bar"><span style="width:${percentual}%"></span></div>`;
        info.appendChild(progress);
      }
      card.title = `Cliente: ${os.nome_cliente || '-'}\nPlaca: ${os.placa || '-'}\nEntrada: ${new Date(os.data_prevista_entrada).toLocaleString('pt-BR')}`;
      card.addEventListener('dblclick', () => abrirModalAcompanhamento(os.id), { once: true });
    });
  }

  function renderizarClientesAtrasados() {
    let container = document.getElementById('clientes-atrasados-v2');
    if (!container) {
      container = document.createElement('section');
      container.id = 'clientes-atrasados-v2';

      container.className = 'painel-v2';
      container.innerHTML = '<h3>⚠️ Clientes Atrasados</h3><div class="conteudo"></div>';
      document.querySelector('#gestao-oficina .content')?.appendChild(container);
    }

    const agora = new Date();
    const atrasados = obterOS().filter(
      os => os.status_geral === 'agendado' && new Date(os.data_prevista_entrada) < agora
    );
    container.querySelector('.conteudo').innerHTML = atrasados.length
      ? atrasados
          .map(
            os =>
              `<div class="atrasado-item"><div><strong>${os.placa}</strong> · ${os.nome_cliente || 'Sem nome'}<br><small>${Math.round((agora - new Date(os.data_prevista_entrada)) / 36e5)}h de atraso</small></div><div class="acoes-inline"><a class="btn-mini" href="tel:${os.telefone || ''}">📞 Ligar</a><a class="btn-mini" target="_blank" rel="noopener" href="https://wa.me/55${String(os.telefone || '').replace(/\D/g, '')}">💬 WhatsApp</a></div></div>`
          )
          .join('')
      : '<p class="empty-state">🟢 Nenhum cliente atrasado no momento.</p>';

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
    const emAndamento = obterOS().filter(os => os.status_geral !== 'finalizado');
    secao.querySelector('.veiculos-grid').innerHTML =
      emAndamento
        .map(
          os =>
            `<article class="veiculo-card-v2"><div class="veiculo-foto">🚘</div><h4>${os.placa} · ${os.modelo || 'Modelo não informado'}</h4><p>Etapa: <strong>${os.etapa_atual || '-'}</strong></p><p>Saída prevista: ${new Date(os.data_prevista_saida).toLocaleString('pt-BR')}</p><div class="os-progress-bar"><span style="width:${progressoOS(os)}%"></span></div></article>`

        )
        .join('') || '<p class="empty-state">Sem veículos em andamento.</p>';
  }

  function atualizarUIV2() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      aprimorarCardsOS();
      renderizarClientesAtrasados();
      renderizarVeiculosNaOficina();
      rafId = null;
    });
  }

  function init() {
    if (inicializado) return;
    document.body.classList.add('gestao-v2-enabled');
    inicializado = true;
    atualizarUIV2();
    const originalRender = window.renderizarVisao;
    if (typeof originalRender === 'function' && !window.__renderV2Wrapped) {
      window.renderizarVisao = function (...args) {
        const res = originalRender.apply(this, args);
        atualizarUIV2();
        return res;
      };
      window.__renderV2Wrapped = true;
    }
  }

  function initQuandoAbaAtiva() {
    const tentar = () => {
      const aba = document.getElementById('gestao-oficina');
      if (aba?.classList.contains('active')) init();
    };
    tentar();
    document
      .querySelector('[data-tab-gestao]')
      ?.addEventListener('click', () => setTimeout(tentar, 80));

  }

  window.GestaoOficinaV2 = { init, abrirModalAcompanhamento, atualizarUIV2 };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuandoAbaAtiva, { once: true });
  } else {
    initQuandoAbaAtiva();

  }
})();
