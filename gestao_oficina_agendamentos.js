(function () {
  if (window.__agendamentosV2Loaded) return;
  window.__agendamentosV2Loaded = true;

  const HORA_INICIO = 7;
  const HORA_FIM = 19;
  const SLOT_MIN = 30;
  const state = {
    inicializado: false,
    visao: 'dia',
    dataAtual: new Date(),
  };

  // 🔒 CORREÇÃO: Função para obter oficinaId atual
  function obterOficinaIdAtual() {
    // Tentar pegar de várias fontes (prioridade: session > config > guard)
    const oficinaId = 
      sessionStorage.getItem('oficinaId') ||
      window.OFICINA_CONFIG?.oficinaId ||
      window.OficinaGuard?.getOficinaId?.() ||
      null;
    
    if (!oficinaId) {
      console.error('❌ oficinaId não encontrado! Agendamentos não serão filtrados.');
    }
    
    return oficinaId;
  }

  // 🔒 CORREÇÃO: Filtrar OS apenas da oficina atual
  function obterOS() {
    const oficinaId = obterOficinaIdAtual();
    const todasOS = typeof window.carregarOS === 'function' ? window.carregarOS() : [];
    
    if (!oficinaId) {
      console.warn('⚠️ Sem oficinaId, retornando todas OS (inseguro)');
      return todasOS;
    }
    
    // Filtrar apenas OS desta oficina
    const osFiltradas = todasOS.filter(os => {
      // Se OS não tem oficinaId, assumir que é da oficina atual (legacy)
      if (!os.oficinaId) {
        console.warn('⚠️ OS sem oficinaId:', os.id);
        return true; // Manter para compatibilidade
      }
      
      return os.oficinaId === oficinaId;
    });
    
    console.log(`📋 Agendamentos carregados: ${osFiltradas.length} de ${todasOS.length} (oficinaId: ${oficinaId})`);
    
    return osFiltradas;
  }

  function salvar(os) {
    // 🔒 CORREÇÃO: Garantir que oficinaId seja salvo
    const oficinaId = obterOficinaIdAtual();
    
    if (oficinaId && !os.oficinaId) {
      os.oficinaId = oficinaId;
      console.log(`✅ oficinaId adicionado à OS: ${os.id} -> ${oficinaId}`);
    }
    
    if (typeof window.salvarOS === 'function') window.salvarOS(os);
  }

  function inicioDoDia(data) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 0, 0, 0, 0);
  }

  function fimDoDia(data) {
    return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
  }

  function formatarDataInput(date) {
    const off = date.getTimezoneOffset();
    const local = new Date(date.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  }

  function classificarServico(tempoHoras) {
    if (tempoHoras <= 2) return 'rapida';
    if (tempoHoras <= 6) return 'media';
    return 'complexa';
  }

  function conflitoAgendamento(inicio, fim, ignoraId = null) {
    return obterOS().some(os => {
      if (ignoraId && String(os.id) === String(ignoraId)) return false;
      if (!os.data_prevista_entrada || !os.data_prevista_saida) return false;
      const a = new Date(os.data_prevista_entrada).getTime();
      const b = new Date(os.data_prevista_saida).getTime();
      return inicio < b && fim > a;
    });
  }

  function sugerirProximoHorario(inicio, duracaoMs) {
    let cursor = new Date(inicio.getTime() + SLOT_MIN * 60 * 1000);
    for (let i = 0; i < 50; i += 1) {
      const fim = new Date(cursor.getTime() + duracaoMs);
      if (!conflitoAgendamento(cursor.getTime(), fim.getTime())) return cursor;
      cursor = new Date(cursor.getTime() + SLOT_MIN * 60 * 1000);
    }
    return null;
  }

  function criarHeaderAgenda() {
    // 🔒 CORREÇÃO: Mostrar oficinaId no cabeçalho (debug)
    const oficinaId = obterOficinaIdAtual();
    const oficinaLabel = oficinaId ? `<small style="color:#999; font-size:11px; margin-left:8px;">(${oficinaId})</small>` : '';
    
    return `
      <div class="agenda-header agenda-header-v2">
        <h3>📆 Calendário ${oficinaLabel}</h3>
        <div class="agenda-actions">
          <button class="btn-mini" data-ag-nav="prev">◀</button>
          <button class="btn-mini" data-ag-nav="today">Hoje</button>
          <button class="btn-mini" data-ag-nav="next">▶</button>
          <span class="agenda-data" id="agenda-data-ref"></span>
          <button class="btn-primary" id="agenda-novo">+ Agendar</button>
        </div>
      </div>
      <div class="agenda-views">
        <button class="btn-mini" data-ag-view="dia">Dia</button>
        <button class="btn-mini" data-ag-view="semana">Semana</button>
        <button class="btn-mini" data-ag-view="mes">Mês</button>
        <button class="btn-mini" data-ag-view="ano">Ano</button>
      </div>
      <div id="agenda-grid"></div>
    `;
  }

  function abrirModalAgendamento(slotDate = new Date()) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal modal-v2">
      <h3>📅 Novo Agendamento</h3>
      <div class="modal-form">
        <input id="ag-placa" placeholder="Placa *" required>
        <input id="ag-cliente" placeholder="Cliente *" required>
        <input id="ag-telefone" placeholder="Telefone">
        <label>Data e hora de entrada</label>
        <input id="ag-entrada" type="datetime-local" value="${formatarDataInput(slotDate)}" required>
        <label>Tempo estimado</label>
        <select id="ag-tempo"><option value="1">1h</option><option value="2">2h</option><option value="4">4h</option><option value="8">8h</option></select>
        <label>Tipo de serviço</label>
        <select id="ag-tipo"><option value="rapida">Rápida</option><option value="media">Média</option><option value="complexa">Complexa</option></select>
        <label>Prioridade</label>
        <select id="ag-prioridade"><option value="baixa">Baixa</option><option value="normal" selected>Normal</option><option value="urgente">Urgente</option></select>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" id="ag-salvar">💾 Salvar</button>
        <button class="btn-secondary" id="ag-cancelar">Cancelar</button>
      </div>
    </div>`;

    modal
      .querySelector('#ag-cancelar')
      ?.addEventListener('click', () => modal.remove(), { once: true });
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('#ag-tempo')?.addEventListener('change', event => {
      modal.querySelector('#ag-tipo').value = classificarServico(Number(event.target.value));
    });

    modal.querySelector('#ag-salvar')?.addEventListener('click', () => {
      const placa = modal.querySelector('#ag-placa').value.trim().toUpperCase();
      const cliente = modal.querySelector('#ag-cliente').value.trim();
      const telefone = modal.querySelector('#ag-telefone').value.trim();
      const entradaStr = modal.querySelector('#ag-entrada').value;
      const tempoHoras = Number(modal.querySelector('#ag-tempo').value);
      const tipo = modal.querySelector('#ag-tipo').value;
      const prioridade = modal.querySelector('#ag-prioridade').value;

      if (!placa || !cliente || !entradaStr)
        return window.mostrarNotificacao?.('Preencha os campos obrigatórios.', 'error');

      const entrada = new Date(entradaStr);
      const saida = new Date(entrada.getTime() + tempoHoras * 3600000);
      if (entrada < new Date())
        return window.mostrarNotificacao?.('Não é permitido agendar no passado.', 'warning');
      if (entrada.getHours() < HORA_INICIO || saida.getHours() > HORA_FIM)
        return window.mostrarNotificacao?.('Tempo fora do expediente.', 'warning');
      if (conflitoAgendamento(entrada.getTime(), saida.getTime())) {
        const sugestao = sugerirProximoHorario(entrada, tempoHoras * 3600000);
        return window.mostrarNotificacao?.(
          sugestao
            ? `Horário ocupado. Próximo disponível: ${sugestao.toLocaleString('pt-BR')}`
            : 'Horário ocupado e sem sugestão disponível.',
          'warning'
        );
      }

      const nova =
        typeof window.novoOS === 'function'
          ? window.novoOS(placa, cliente)
          : { id: `os_${Date.now()}`, placa, nome_cliente: cliente };
      nova.telefone = telefone;
      nova.tipo_servico = tipo;
      nova.prioridade = prioridade;
      nova.tempo_estimado_min = tempoHoras * 60;
      nova.data_prevista_entrada = entrada.toISOString();
      nova.data_prevista_saida = saida.toISOString();
      nova.status_geral = 'agendado';
      
      // 🔒 CORREÇÃO: Garantir oficinaId
      nova.oficinaId = obterOficinaIdAtual();

      salvar(nova);
      window.renderizarVisao?.();
      renderizarAgenda();
      window.mostrarNotificacao?.('Agendamento salvo com sucesso!', 'success');
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  function formatarReferencia() {
    const data = state.dataAtual;
    if (state.visao === 'ano') return String(data.getFullYear());
    if (state.visao === 'mes')
      return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    if (state.visao === 'semana') {
      const inicio = new Date(data);
      inicio.setDate(data.getDate() - data.getDay());
      const fim = new Date(inicio);
      fim.setDate(inicio.getDate() + 6);
      return `${inicio.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}`;
    }
    return data.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  function moverData(direcao) {
    const d = new Date(state.dataAtual);
    if (state.visao === 'dia') d.setDate(d.getDate() + direcao);
    if (state.visao === 'semana') d.setDate(d.getDate() + direcao * 7);
    if (state.visao === 'mes') d.setMonth(d.getMonth() + direcao);
    if (state.visao === 'ano') d.setFullYear(d.getFullYear() + direcao);
    state.dataAtual = d;
    renderizarAgenda();
  }

  function filtrarOSPeriodo(inicio, fim) {
    return obterOS().filter(os => {
      const entrada = new Date(os.data_prevista_entrada);
      return entrada >= inicio && entrada <= fim;
    });
  }

  function renderDia(container) {
    container.className = 'agenda-grid';
    const diaInicio = inicioDoDia(state.dataAtual);
    const diaFim = fimDoDia(state.dataAtual);
    const osDia = filtrarOSPeriodo(diaInicio, diaFim);
    const slots = [];
    for (let h = HORA_INICIO; h < HORA_FIM; h += 1) {
      for (let m = 0; m < 60; m += SLOT_MIN) {
        slots.push(
          new Date(diaInicio.getFullYear(), diaInicio.getMonth(), diaInicio.getDate(), h, m)
        );
      }
    }
    container.innerHTML = slots
      .map(slot => {
        const encontrado = osDia.find(os => {
          const ini = new Date(os.data_prevista_entrada);
          const fim = new Date(os.data_prevista_saida);
          return slot >= ini && slot < fim;
        });
        if (encontrado) {
          return `<button class="slot slot-ocupado ${encontrado.tipo_servico}" aria-label="Slot ocupado">${slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br><strong>${encontrado.placa}</strong></button>`;
        }
        return `<button class="slot" data-slot="${slot.toISOString()}">${slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</button>`;
      })
      .join('');
    container
      .querySelectorAll('[data-slot]')
      .forEach(btn =>
        btn.addEventListener('click', () => abrirModalAgendamento(new Date(btn.dataset.slot)))
      );
  }

  function renderSemana(container) {
    container.className = 'agenda-semana';
    const inicio = new Date(state.dataAtual);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    const dias = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(inicio);
      d.setDate(inicio.getDate() + i);
      return d;
    });
    container.innerHTML = dias
      .map(d => {
        const lista = filtrarOSPeriodo(inicioDoDia(d), fimDoDia(d));
        return `<div class="dia-semana"><h4>${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}</h4>${lista.map(os => `<button class="evento-semana ${os.tipo_servico}" data-os="${os.id}">${new Date(os.data_prevista_entrada).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · ${os.placa}</button>`).join('') || '<p class="empty-state">Sem agendamentos</p>'}<button class="btn-mini" data-new-day="${d.toISOString()}">+ horário</button></div>`;
      })
      .join('');
    container
      .querySelectorAll('[data-new-day]')
      .forEach(btn =>
        btn.addEventListener('click', () => abrirModalAgendamento(new Date(btn.dataset.newDay)))
      );
  }

  function renderMes(container) {
    container.className = 'agenda-mes';
    const ano = state.dataAtual.getFullYear();
    const mes = state.dataAtual.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const offset = primeiro.getDay();
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    const celulas = [];
    for (let i = 0; i < offset; i += 1) celulas.push('<div class="dia-mes vazio"></div>');
    for (let dia = 1; dia <= diasNoMes; dia += 1) {
      const d = new Date(ano, mes, dia);
      const total = filtrarOSPeriodo(inicioDoDia(d), fimDoDia(d)).length;
      celulas.push(
        `<button class="dia-mes ${total ? 'com-evento' : ''}" data-dia="${d.toISOString()}"><span>${dia}</span>${total ? `<small>${total} ag.</small>` : ''}</button>`
      );
    }
    container.innerHTML = `<div class="agenda-mes-head">Dom Seg Ter Qua Qui Sex Sáb</div><div class="agenda-mes-grid">${celulas.join('')}</div>`;
    container.querySelectorAll('[data-dia]').forEach(btn =>
      btn.addEventListener('click', () => {
        state.visao = 'dia';
        state.dataAtual = new Date(btn.dataset.dia);
        renderizarAgenda();
      })
    );
  }

  function renderAno(container) {
    container.className = 'agenda-ano';
    const ano = state.dataAtual.getFullYear();
    const barras = Array.from({ length: 12 }).map((_, idx) => {
      const inicio = new Date(ano, idx, 1);
      const fim = new Date(ano, idx + 1, 0, 23, 59, 59);
      const total = filtrarOSPeriodo(inicio, fim).length;
      return { idx, total, nome: inicio.toLocaleDateString('pt-BR', { month: 'short' }) };
    });
    const max = Math.max(...barras.map(b => b.total), 1);
    container.innerHTML = `<div class="ano-bars">${barras.map(b => `<button class="ano-bar" data-mes="${b.idx}" style="height:${Math.max(24, (b.total / max) * 140)}px"><span>${b.nome}</span><strong>${b.total}</strong></button>`).join('')}</div>`;
    container.querySelectorAll('[data-mes]').forEach(btn =>
      btn.addEventListener('click', () => {
        state.visao = 'mes';
        state.dataAtual = new Date(ano, Number(btn.dataset.mes), 1);
        renderizarAgenda();
      })
    );
  }

  function renderizarAgenda() {
    const wrap = document.getElementById('agenda-calendario-v2');
    if (!wrap) return;
    wrap.querySelector('#agenda-data-ref').textContent = formatarReferencia();
    wrap
      .querySelectorAll('[data-ag-view]')
      .forEach(btn => btn.classList.toggle('active', btn.dataset.agView === state.visao));
    const container = wrap.querySelector('#agenda-grid');
    if (!container) return;
    if (state.visao === 'dia') renderDia(container);
    if (state.visao === 'semana') renderSemana(container);
    if (state.visao === 'mes') renderMes(container);
    if (state.visao === 'ano') renderAno(container);
  }

  function enviarLembrete(os, janela) {
    console.log(`[lembrete] ${janela} para ${os.placa}`);
    window.mostrarNotificacao?.(`⏰ Lembrete ${janela}: ${os.placa}`, 'info');
  }

  function verificarLembretes() {
    const agora = new Date();
    obterOS().forEach(os => {
      if (os.status_geral !== 'agendado') return;
      const entrada = new Date(os.data_prevista_entrada);
      const horas = (entrada - agora) / 36e5;
      if (horas >= 47 && horas <= 49 && !os.lembrete_2dias_enviado) {
        enviarLembrete(os, '48h');
        os.lembrete_2dias_enviado = true;
        salvar(os);
      }
      if (horas >= 23 && horas <= 25 && !os.lembrete_1dia_enviado) {
        enviarLembrete(os, '24h');
        os.lembrete_1dia_enviado = true;
        salvar(os);
      }
      if (horas >= 1.5 && horas <= 2.5 && !os.lembrete_2h_enviado) {
        enviarLembrete(os, '2h');
        os.lembrete_2h_enviado = true;
        salvar(os);
      }
    });
  }

  function montarCalendario() {
    if (state.inicializado) return;
    
    // 🔒 CORREÇÃO: Verificar oficinaId antes de montar calendário
    const oficinaId = obterOficinaIdAtual();
    if (!oficinaId) {
      console.error('❌ Calendário NÃO inicializado: oficinaId ausente!');
      
      const host = document.querySelector('#gestao-oficina .content');
      if (host) {
        const aviso = document.createElement('div');
        aviso.className = 'alert alert-error';
        aviso.style.margin = '20px';
        aviso.innerHTML = `
          <strong>⚠️ Erro de Inicialização</strong><br>
          Não foi possível carregar o calendário. Faça logout e login novamente.
        `;
        host.prepend(aviso);
      }
      return;
    }
    
    console.log(`✅ Inicializando calendário para oficinaId: ${oficinaId}`);
    
    const host = document.querySelector('#gestao-oficina .content');
    if (!host) return;
    let wrap = document.getElementById('agenda-calendario-v2');
    if (!wrap) {
      wrap = document.createElement('section');
      wrap.id = 'agenda-calendario-v2';
      wrap.className = 'painel-v2';
      wrap.innerHTML = criarHeaderAgenda();
      host.appendChild(wrap);
    }
    wrap
      .querySelector('#agenda-novo')
      ?.addEventListener('click', () => abrirModalAgendamento(state.dataAtual));
    wrap.querySelectorAll('[data-ag-view]').forEach(btn =>
      btn.addEventListener('click', () => {
        state.visao = btn.dataset.agView;
        renderizarAgenda();
      })
    );
    wrap.querySelectorAll('[data-ag-nav]').forEach(btn =>
      btn.addEventListener('click', () => {
        const acao = btn.dataset.agNav;
        if (acao === 'today') state.dataAtual = new Date();
        if (acao === 'prev') moverData(-1);
        if (acao === 'next') moverData(1);
        if (acao === 'today') renderizarAgenda();
      })
    );
    state.inicializado = true;
    renderizarAgenda();
    verificarLembretes();
    setInterval(verificarLembretes, 60 * 60 * 1000);
  }

  function initQuandoAbaAtiva() {
    if (window.__agendamentosObserver) return;
    const tentar = () => {
      const aba = document.getElementById('gestao-oficina');
      if (aba?.classList.contains('active')) montarCalendario();
    };
    tentar();
    document
      .querySelector('[data-tab-gestao]')
      ?.addEventListener('click', () => setTimeout(tentar, 80));
    window.addEventListener('gestao-oficina:activated', tentar);
    const observer = new MutationObserver(tentar);
    observer.observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
    window.__agendamentosObserver = observer;
  }

  window.GestaoOficinaAgendamentos = {
    montarCalendario,
    abrirModalAgendamento,
    verificarLembretes,
    conflitoAgendamento,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQuandoAbaAtiva, { once: true });
  } else {
    initQuandoAbaAtiva();
  }
})();
