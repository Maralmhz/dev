(function () {
  const HORA_INICIO = 7;
  const HORA_FIM = 19;
  const SLOT_MIN = 30;

  function obterOS() {
    return typeof window.carregarOS === 'function' ? window.carregarOS() : [];
  }

  function salvar(os) {
    if (typeof window.salvarOS === 'function') window.salvarOS(os);
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

    modal.querySelector('#ag-cancelar')?.addEventListener('click', () => modal.remove());
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
        const msg = sugestao
          ? `Horário ocupado. Próximo disponível: ${sugestao.toLocaleString('pt-BR')}`
          : 'Horário ocupado e sem sugestão disponível.';
        return window.mostrarNotificacao?.(msg, 'warning');
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

      salvar(nova);
      window.renderizarVisao?.();
      window.mostrarNotificacao?.('Agendamento salvo com sucesso!', 'success');
      modal.remove();
    });

    document.body.appendChild(modal);
  }

  function montarCalendario() {
    let wrap = document.getElementById('agenda-calendario-v2');
    if (!wrap) {
      wrap = document.createElement('section');
      wrap.id = 'agenda-calendario-v2';
      wrap.className = 'painel-v2';
      wrap.innerHTML = `<div class="agenda-header"><h3>📆 Calendário</h3><button class="btn-primary" id="agenda-novo">+ Agendar</button></div><div class="agenda-grid" id="agenda-grid"></div>`;
      document.querySelector('#gestao-oficina .content')?.appendChild(wrap);
    }

    wrap
      .querySelector('#agenda-novo')
      ?.addEventListener('click', () => abrirModalAgendamento(new Date()));

    const grid = wrap.querySelector('#agenda-grid');
    const hoje = new Date();
    const slots = [];
    for (let h = HORA_INICIO; h < HORA_FIM; h += 1) {
      for (let m = 0; m < 60; m += SLOT_MIN) {
        const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), h, m, 0, 0);
        slots.push(d);
      }
    }

    const osHoje = obterOS().filter(
      os => new Date(os.data_prevista_entrada).toDateString() === hoje.toDateString()
    );
    grid.innerHTML = slots
      .map(slot => {
        const encontrado = osHoje.find(os => {
          const ini = new Date(os.data_prevista_entrada);
          const fim = new Date(os.data_prevista_saida);
          return slot >= ini && slot < fim;
        });
        if (encontrado) {
          return `<button class="slot slot-ocupado ${encontrado.tipo_servico}" aria-label="Slot ocupado">${slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}<br><strong>${encontrado.placa}</strong></button>`;
        }
        return `<button class="slot" aria-label="Novo agendamento em ${slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}" data-slot="${slot.toISOString()}">${slot.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</button>`;
      })
      .join('');

    grid
      .querySelectorAll('.slot[data-slot]')
      .forEach(btn =>
        btn.addEventListener('click', () => abrirModalAgendamento(new Date(btn.dataset.slot)))
      );
  }

  function enviarLembrete(os, janela) {
    console.log(`[lembrete] ${janela} para ${os.placa}`);
    window.mostrarNotificacao?.(
      `⏰ Lembrete ${janela}: ${os.placa} (${os.nome_cliente || 'cliente'})`,
      'info'
    );
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

  function init() {
    montarCalendario();
    verificarLembretes();
    setInterval(verificarLembretes, 60 * 60 * 1000);
  }

  window.GestaoOficinaAgendamentos = {
    init,
    abrirModalAgendamento,
    verificarLembretes,
    conflitoAgendamento,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
