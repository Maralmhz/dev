(function () {
  if (window.FirebaseV2) return;

  function getDb() {
    if (!window.firebase?.firestore) return null;
    return window.firebase.firestore();
  }

  function getOficinaId() {
    return window.OFICINA_CONFIG?.oficina_id || 'modelo';
  }

  function isAdmin() {
    return window.authClaimsManager?.isAdmin?.() || window.currentUserRole === 'admin';
  }

  async function upsertClienteAuto({ nome, telefone, email = '', cpf_cnpj = '' }) {
    const nomeLimpo = String(nome || '').trim();
    const telLimpo = String(telefone || '').replace(/\D/g, '');
    if (!nomeLimpo || !telLimpo) return { ok: false, motivo: 'dados_insuficientes' };

    const db = getDb();
    if (!db) return { ok: false, motivo: 'sem_firestore' };

    const base = db.collection('oficinas').doc(getOficinaId()).collection('clientes');
    const existente = await base.where('telefone', '==', telLimpo).limit(1).get();

    const payload = {
      nome: nomeLimpo,
      telefone: telLimpo,
      email: String(email || '').trim(),
      cpf_cnpj: String(cpf_cnpj || '').trim(),
      atualizado_em: window.firebase.firestore.FieldValue.serverTimestamp(),
    };

    if (!existente.empty) {
      const doc = existente.docs[0];
      await doc.ref.set(payload, { merge: true });
      return { ok: true, id: doc.id, atualizado: true };
    }

    payload.criado_em = window.firebase.firestore.FieldValue.serverTimestamp();
    const ref = await base.add(payload);
    return { ok: true, id: ref.id, criado: true };
  }

  function criarMensagemLembreteWhatsApp(os, dias = 3) {
    const data = new Date(os?.data_prevista_entrada || Date.now()).toLocaleString('pt-BR');
    const nome = os?.nome_cliente || os?.cliente?.nome || 'cliente';
    const placa = os?.placa || os?.veiculo?.placa || '';
    return `Olá ${nome}! 👋\nLembrete da Fast Car: seu agendamento é em ${dias} dia(s), em ${data}.\nVeículo: ${placa}.\nSe precisar remarcar, responda esta mensagem.`;
  }

  window.FirebaseV2 = {
    getDb,
    getOficinaId,
    upsertClienteAuto,
    criarMensagemLembreteWhatsApp,
    isAdmin,
  };
})();
