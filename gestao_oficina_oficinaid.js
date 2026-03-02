// gestao_oficina_oficinaid.js - Utilitário puro para oficinaId
// ==========================================================

'use strict';

function gerarOficinaId(nomeOficina) {
  const normalizado = String(nomeOficina || 'oficina')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30) || 'oficina';

  const timestamp = Date.now().toString(36).slice(-6);
  return `${normalizado}-${timestamp}`;
}

async function verificarDuplicidade(oficinaId) {
  const db = firebase.firestore();
  const doc = await db.collection('oficinas').doc(oficinaId).get();
  return doc.exists;
}

async function criarOficinaId(nomeOficina, emailUsuario) {
  let oficinaId = gerarOficinaId(nomeOficina);
  let tentativas = 0;

  while (await verificarDuplicidade(oficinaId) && tentativas < 5) {
    const random = Math.random().toString(36).substring(2, 6);
    oficinaId = `${oficinaId.split('-')[0]}-${random}`;
    tentativas += 1;
  }

  if (tentativas >= 5) {
    throw new Error('Não foi possível gerar oficinaId único após 5 tentativas');
  }

  const db = firebase.firestore();
  await db.collection('oficinas').doc(oficinaId).set({
    oficinaId,
    nome: nomeOficina,
    criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
    criadoPor: emailUsuario,
    plano: 'free',
    usuariosAtivos: 1,
    limiteUsuarios: 2
  });

  await db.collection('oficinas').doc(oficinaId).collection('usuarios').doc(emailUsuario).set({
    email: emailUsuario,
    role: 'admin',
    adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
  });

  await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
    acao: 'oficina_criada',
    usuario: emailUsuario,
    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    dados: { nomeOficina, oficinaId }
  });

  return oficinaId;
}

async function verificarOficinaUsuario(emailUsuario) {
  const db = firebase.firestore();
  const snapshot = await db.collection('oficinas')
    .where('criadoPor', '==', emailUsuario)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].id;
}

window.OficinaIdGenerator = {
  gerarOficinaId,
  verificarDuplicidade,
  criarOficinaId,
  verificarOficinaUsuario
};
