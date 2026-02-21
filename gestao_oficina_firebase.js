// ==========================================
// GESTÃO DA OFICINA - FIREBASE SYNC V1.0
// ==========================================

const OS_COLLECTION_PATH = (oficinaId, ano, mes) => 
  `oficinas/${oficinaId}/ordens_servico/${ano}/${mes}`;

let firebaseSyncAtivo = false;
let ultimaSincronizacao = null;

// ==========================================
// INICIALIZAÇÃO E CONFIGURAÇÃO
// ==========================================

async function initFirebaseOS() {
  try {
    if (!window.OFICINA_CONFIG?.oficina_id) {
      console.warn('⚠️ OFICINA_CONFIG não definido. Sincronização Firebase desabilitada.');
      return null;
    }

    // Reutiliza a inicialização existente do checklist
    const { initializeApp, getApps, getApp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'
    );
    const { getFirestore } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const config = {
      apiKey: window.FIREBASE_API_KEY,
      authDomain: 'checklist-oficina-72c9e.firebaseapp.com',
      projectId: 'checklist-oficina-72c9e',
      storageBucket: 'checklist-oficina-72c9e.appspot.com',
      messagingSenderId: window.FIREBASE_SENDER_ID,
      appId: window.FIREBASE_APP_ID
    };

    const app = getApps().length ? getApp() : initializeApp(config);
    const db = getFirestore(app);

    console.log('🔥 Firebase OS inicializado:', window.OFICINA_CONFIG.oficina_id);
    firebaseSyncAtivo = true;
    
    return db;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase OS:', error);
    firebaseSyncAtivo = false;
    return null;
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getOficinaId() {
  return window.OFICINA_CONFIG?.oficina_id || 'default';
}

function gerarCaminhoData(dataISO) {
  const data = new Date(dataISO);
  const ano = String(data.getFullYear());
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return { ano, mes };
}

function normalizarOS(os) {
  // Garante que todos os campos essenciais existem
  return {
    ...os,
    oficina_id: getOficinaId(),
    placa: os.placa?.toUpperCase() || '',
    status_geral: os.status_geral || 'agendado',
    prioridade: os.prioridade || 'normal',
    historico_etapas: os.historico_etapas || [],
    cliente_id: os.cliente_id || '',
    veiculo_id: os.veiculo_id || '',
    sync_status: os.sync_status || 'pending'
  };
}

// ==========================================
// SALVAR OS NO FIREBASE
// ==========================================

export async function salvarOSFirebase(os) {
  try {
    const db = await initFirebaseOS();
    if (!db) return false;

    const { doc, setDoc, serverTimestamp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const { ano, mes } = gerarCaminhoData(os.data_criacao);
    const colecao = OS_COLLECTION_PATH(getOficinaId(), ano, mes);
    const docId = String(os.id);

    const dados = {
      ...normalizarOS(os),
      firebase_created_at: serverTimestamp(),
      firebase_updated_at: serverTimestamp()
    };

    await setDoc(doc(db, colecao, docId), dados, { merge: true });
    console.log(`✅ OS ${os.placa} salva no Firebase: ${colecao}/${docId}`);

    // Atualizar índice do veículo
    if (os.placa) {
      await atualizarIndiceVeiculoOS(db, os);
    }

    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar OS no Firebase:', error);
    return false;
  }
}

// ==========================================
// ATUALIZAR ÍNDICE DE VEÍCULO
// ==========================================

async function atualizarIndiceVeiculoOS(db, os) {
  try {
    const { doc, setDoc, arrayUnion, serverTimestamp } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const oficinaId = getOficinaId();
    const placa = os.placa.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim();

    if (!placa) {
      console.warn('⚠️ Placa vazia, índice não criado');
      return;
    }

    const refVeiculo = doc(db, 'oficinas', oficinaId, 'veiculos', placa);

    await setDoc(refVeiculo, {
      placa,
      nome_cliente: os.nome_cliente || '',
      telefone: os.telefone || '',
      modelo: os.modelo || '',
      cliente_id: os.cliente_id || '',
      veiculo_id: os.veiculo_id || placa,
      ultima_os: os.data_criacao,
      historico_os_ids: arrayUnion(os.id),
      updated_at: serverTimestamp()
    }, { merge: true });

    console.log(`🚗 Índice veículo atualizado: ${placa}`);
  } catch (error) {
    console.error('❌ Erro ao atualizar índice veículo:', error);
  }
}

// ==========================================
// BUSCAR OS DO FIREBASE
// ==========================================

export async function buscarOSFirebaseMes(ano, mes, limite = 100) {
  try {
    const db = await initFirebaseOS();
    if (!db) return [];

    const { collection, getDocs, query, orderBy, limit } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const oficinaId = getOficinaId();
    const mesFormatado = String(mes).padStart(2, '0');
    const colecao = OS_COLLECTION_PATH(oficinaId, ano, mesFormatado);

    const ref = collection(db, colecao);
    const q = query(ref, orderBy('data_criacao', 'desc'), limit(limite));

    const snapshot = await getDocs(q);
    const ordens = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`☁️ ${ordens.length} OS encontradas: ${ano}/${mesFormatado}`);
    return ordens;
  } catch (error) {
    console.error('❌ Erro ao buscar OS do Firebase:', error);
    return [];
  }
}

export async function buscarOSFirebaseMesAtual(limite = 100) {
  const agora = new Date();
  return buscarOSFirebaseMes(
    agora.getFullYear(),
    agora.getMonth() + 1,
    limite
  );
}

// ==========================================
// SINCRONIZAÇÃO BIDIRECIONAL
// ==========================================

export async function sincronizarOSFirebase() {
  try {
    if (!firebaseSyncAtivo) {
      const db = await initFirebaseOS();
      if (!db) {
        mostrarNotificacao('⚠️ Sincronização Firebase não configurada', 'warning');
        return { sucesso: false, mensagem: 'Firebase não configurado' };
      }
    }
    mostrarNotificacao('🔄 Sincronizando com Firebase...', 'info');

    // 1. Buscar OS da nuvem (mês atual)
    const osNuvem = await buscarOSFirebaseMesAtual();
    
    // 2. Buscar OS locais
    const osLocais = carregarOS();

    // 3. Mesclar dados
    let novasOS = 0;
    let atualizadas = 0;

    // Importar OS da nuvem que não existem localmente
    osNuvem.forEach(osRemota => {
      const osLocal = osLocais.find(o => o.id === osRemota.id);
      
      if (!osLocal) {
        // Nova OS da nuvem
        salvarOS(osRemota);
        novasOS++;
      } else {
        // Verificar qual é mais recente
        const dataLocalUpdate = new Date(osLocal.firebase_updated_at || osLocal.data_criacao);
        const dataRemotaUpdate = new Date(osRemota.firebase_updated_at || osRemota.data_criacao);
        
        if (dataRemotaUpdate > dataLocalUpdate) {
          // OS remota é mais recente
          salvarOS(osRemota);
          atualizadas++;
        }
      }
    });

    // 4. Enviar OS locais que não estão na nuvem
    let enviadas = 0;
    for (const osLocal of osLocais) {
      const osRemota = osNuvem.find(o => o.id === osLocal.id);
      
      if (!osRemota) {
        await salvarOSFirebase(osLocal);
        enviadas++;
      }
    }

    ultimaSincronizacao = new Date();
    
    const mensagem = `✅ Sincronização concluída!\n` +
                    `📥 ${novasOS} novas\n` +
                    `🔄 ${atualizadas} atualizadas\n` +
                    `📤 ${enviadas} enviadas`;

    mostrarNotificacao(mensagem, 'success');
    
    // Atualizar visualização
    renderizarVisao();
    atualizarBadgeSincronizacao();

    return {
      sucesso: true,
      novas: novasOS,
      atualizadas,
      enviadas,
      total: osNuvem.length
    };

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    mostrarNotificacao('❌ Erro ao sincronizar: ' + error.message, 'danger');
    return { sucesso: false, mensagem: error.message };
  }
}

// ==========================================
// SINCRONIZAÇÃO AUTOMÁTICA
// ==========================================

let intervalSincAuto = null;

export function ativarSincronizacaoAutomatica(intervaloMinutos = 15) {
  if (intervalSincAuto) {
    clearInterval(intervalSincAuto);
  }

  // Sincronizar imediatamente
  sincronizarOSFirebase();

  // Configurar sincronização periódica
  intervalSincAuto = setInterval(() => {
    if (document.getElementById('gestao-oficina')?.classList.contains('active')) {
      console.log('🔄 Sincronização automática iniciada...');
      sincronizarOSFirebase();
    }
  }, intervaloMinutos * 60 * 1000);

  console.log(`⏰ Sincronização automática ativada: a cada ${intervaloMinutos} minutos`);
}

export function desativarSincronizacaoAutomatica() {
  if (intervalSincAuto) {
    clearInterval(intervalSincAuto);
    intervalSincAuto = null;
    console.log('⏹️ Sincronização automática desativada');
  }
}

// ==========================================
// BUSCAR HISTÓRICO DE VEÍCULO
// ==========================================

export async function buscarHistoricoVeiculoOS(placa) {
  if (!firebaseSyncAtivo) {
    return null;
  }

  try {
    const db = await initFirebaseOS();
    if (!db) return null;

    const { doc, getDoc } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const oficinaId = getOficinaId();
    const placaNormalizada = placa.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim();
    
    const refVeiculo = doc(db, 'oficinas', oficinaId, 'veiculos', placaNormalizada);
    const snapshot = await getDoc(refVeiculo);

    if (snapshot.exists()) {
      const dados = snapshot.data();
      console.log(`🚗 Histórico encontrado para ${placa}:`, dados);
      return dados;
    }

    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar histórico:', error);
    return null;
  }
}

// ==========================================
// EXCLUIR OS DO FIREBASE
// ==========================================

export async function excluirOSFirebase(osId, dataCriacao) {
  if (!firebaseSyncAtivo) {
    return true; // Se não está sincronizado, retorna sucesso
  }

  try {
    const db = await initFirebaseOS();
    if (!db) return true;

    const { doc, deleteDoc } = await import(
      'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'
    );

    const { ano, mes } = gerarCaminhoData(dataCriacao);
    const colecao = OS_COLLECTION_PATH(getOficinaId(), ano, mes);
    const docId = String(osId);

    await deleteDoc(doc(db, colecao, docId));
    console.log(`🗑️ OS ${osId} excluída do Firebase`);

    return true;
  } catch (error) {
    console.error('❌ Erro ao excluir OS do Firebase:', error);
    return false;
  }
}

// ==========================================
// INTEGRAÇÃO COM GESTAO_OFICINA.JS
// ==========================================

// Override da função salvarOS original
const salvarOSOriginal = window.salvarOS;
window.salvarOS = async function(os) {
  const payload = {
    ...os,
    sync_status: firebaseSyncAtivo ? 'syncing' : 'local_only',
    sync_error: null,
    last_sync_attempt: new Date().toISOString()
  };

  if (firebaseSyncAtivo) {
    const ok = await salvarOSFirebase(payload);
    if (ok) {
      payload.sync_status = 'synced';
      payload.last_sync_at = new Date().toISOString();
      payload.sync_error = null;
    } else {
      payload.sync_status = 'pending_sync';
      payload.sync_error = 'Falha ao persistir no Firebase';
    }
  }

  // fallback explícito local sempre preservado
  salvarOSOriginal(payload);
  return payload;
};

window.salvarOSFirebase = salvarOSFirebase;

// Override da função excluirOS
const excluirOSOriginal = window.excluirOS;
window.excluirOS = async function(id) {
  const os = carregarOS().find(o => String(o.id) === String(id));
  if (!os) return;

  if (!confirm('🗑️ Tem certeza que deseja excluir esta OS?')) return;

  // Excluir do Firebase
  await excluirOSFirebase(id, os.data_criacao);

  // Excluir localmente
  let lista = carregarOS().filter(o => String(o.id) !== String(id));
  localStorage.setItem(OS_AGENDA_KEY, JSON.stringify(lista));
  
  renderizarVisao();
  mostrarNotificacao('OS excluída!', 'success');
};

// ==========================================
// BADGE DE SINCRONIZAÇÃO
// ==========================================

function atualizarBadgeSincronizacao() {
  const badge = document.getElementById('badge-sync-os');
  if (!badge) return;

  if (!firebaseSyncAtivo) {
    badge.textContent = '📴';
    badge.title = 'Sincronização desabilitada';
    badge.style.background = '#999';
    return;
  }

  if (ultimaSincronizacao) {
    const minutos = Math.floor((new Date() - ultimaSincronizacao) / 60000);
    badge.textContent = minutos < 1 ? '✅' : `${minutos}m`;
    badge.title = `Última sincronização: ${ultimaSincronizacao.toLocaleTimeString()}`;
    badge.style.background = minutos < 30 ? '#28a745' : '#ffc107';
  } else {
    badge.textContent = '⏸️';
    badge.title = 'Nunca sincronizado';
    badge.style.background = '#ffc107';
  }
}

// ==========================================
// UI - BOTÃO DE SINCRONIZAÇÃO
// ==========================================

export function adicionarBotaoSincronizacao() {
  const header = document.querySelector('#gestao-oficina .page-header');
  if (!header || document.getElementById('btn-sync-os')) return;

  const btnSync = document.createElement('button');
  btnSync.id = 'btn-sync-os';
  btnSync.className = 'btn-painel';
  btnSync.innerHTML = '🔄 Sincronizar <span id="badge-sync-os" style="background: #999; color: white; padding: 2px 6px; border-radius: 10px; font-size: 11px; margin-left: 5px;">⏸️</span>';
  btnSync.onclick = sincronizarOSFirebase;

  header.appendChild(btnSync);
  
  // Atualizar badge a cada minuto
  setInterval(atualizarBadgeSincronizacao, 60000);
  atualizarBadgeSincronizacao();
}

// ==========================================
// DEBUG E ESTATÍSTICAS
// ==========================================

window.debugOSFirebase = {
  async verificar() {
    console.log('🔍 Verificando Firebase OS...');
    console.log('Oficina ID:', getOficinaId());
    console.log('Sync Ativo:', firebaseSyncAtivo);
    console.log('Última Sincronização:', ultimaSincronizacao);
    
    const db = await initFirebaseOS();
    console.log('DB:', db ? '✅ Conectado' : '❌ Não conectado');
  },

  async buscarMes(ano, mes) {
    return buscarOSFirebaseMes(ano, mes);
  },

  async sincronizar() {
    return sincronizarOSFirebase();
  },

  async historicoVeiculo(placa) {
    return buscarHistoricoVeiculoOS(placa);
  },

  async estatisticas() {
    const osLocais = carregarOS();
    const osNuvem = await buscarOSFirebaseMesAtual();
    
    console.log('📊 Estatísticas:');
    console.log('Local:', osLocais.length);
    console.log('Nuvem (mês atual):', osNuvem.length);
    console.log('Última Sync:', ultimaSincronizacao);
  },

  ativarSyncAuto(minutos = 15) {
    ativarSincronizacaoAutomatica(minutos);
  },

  desativarSyncAuto() {
    desativarSincronizacaoAutomatica();
  }
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('gestao-oficina')) {
      setTimeout(() => {
        initFirebaseOS().then(() => {
          adicionarBotaoSincronizacao();
          console.log('🔥 Firebase OS Sync carregado!');
          console.log('💡 Use debugOSFirebase no console para testar');
        });
      }, 500);
    }
  });
} else {
  if (document.getElementById('gestao-oficina')) {
    setTimeout(() => {
      initFirebaseOS().then(() => {
        adicionarBotaoSincronizacao();
        console.log('🔥 Firebase OS Sync carregado!');
      });
    }, 500);
  }
}
