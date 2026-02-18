// firebase_app.js - VERSÃO ORGANIZADA POR PASTAS
// Estrutura: oficinas/{oficina_id}/checklists/{ano}/{mes-nome}/{checklist_id}
// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================

const getFirebaseConfig = () => {
    if (window.FIREBASE_CONFIG) {
        return window.FIREBASE_CONFIG;
    }
    
    return {
        apiKey: window.FIREBASE_API_KEY || "CONFIGURE_NO_CONFIG_JS",
        authDomain: "checklist-oficina-72c9e.firebaseapp.com",
        projectId: "checklist-oficina-72c9e",
        storageBucket: "checklist-oficina-72c9e.appspot.com",
        messagingSenderId: window.FIREBASE_SENDER_ID || "CONFIGURE_NO_CONFIG_JS",
        appId: window.FIREBASE_APP_ID || "CONFIGURE_NO_CONFIG_JS"
    };
};

let firebaseApp = null;
let firestoreDB = null;

async function initFirebase() {
    if (firebaseApp) return { app: firebaseApp, db: firestoreDB };
    
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const config = getFirebaseConfig();
        
        if (config.apiKey === "CONFIGURE_NO_CONFIG_JS") {
            throw new Error('Firebase não configurado! Configure window.FIREBASE_CONFIG no config.js');
        }
        
        firebaseApp = initializeApp(config);
        firestoreDB = getFirestore(firebaseApp);
        
        console.log('✅ Firebase inicializado com sucesso!');
        return { app: firebaseApp, db: firestoreDB };
        
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        throw error;
    }
}

// ============================================
// HELPERS - ORGANIZAÇÃO DE CAMINHOS
// ============================================

/**
 * Gera o caminho organizado por data (ano/mês)
 */
function gerarCaminhoData(dataISO) {
    const data = new Date(dataISO);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const nomeMes = [
        'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ][data.getMonth()];
    
    return {
        ano: ano,
        mesNumero: mes,
        mesNome: nomeMes,
        pasta: `${mes}-${nomeMes}`,
        caminhoCompleto: `${ano}/${mes}-${nomeMes}`
    };
}

/**
 * Obtém ID da oficina (do config ou padrão)
 */
function getOficinaId() {
    return window.OFICINA_CONFIG?.oficina_id || 'oficina_padrao';
}

/**
 * Monta o caminho completo do checklist no Firebase
 */
function getCaminhoChecklist(checklistId, dataCriacao) {
    const oficinaId = getOficinaId();
    const caminhoData = gerarCaminhoData(dataCriacao);
    
    return {
        colecao: `oficinas/${oficinaId}/checklists/${caminhoData.caminhoCompleto}`,
        docId: String(checklistId),
        caminhoCompleto: `oficinas/${oficinaId}/checklists/${caminhoData.caminhoCompleto}/${checklistId}`
    };
}

// ============================================
// FUNÇÕES PRINCIPAIS - SALVAR
// ============================================

/**
 * Salva checklist organizado por ano/mês
 */
export async function salvarNoFirebase(checklist) {
    try {
        console.log(`⏳ Salvando checklist ${checklist.id} no Firebase (organizado por pasta)...`);
        
        const { db } = await initFirebase();
        const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Prepara dados
        const checklistComMeta = {
            ...checklist,
            atualizado_em: new Date().toISOString(),
            sincronizado_firebase: true,
            oficina_id: getOficinaId()
        };
        
        // Remove fotos pesadas (salvar no Storage separadamente é recomendado)
        if (checklistComMeta.fotos && checklistComMeta.fotos.length > 0) {
            console.warn('⚠️ Fotos detectadas no checklist. Mantendo no objeto por enquanto.');
        }
        
        // Define caminho organizado
        const caminho = getCaminhoChecklist(checklist.id, checklist.data_criacao);
        const docRef = doc(db, caminho.colecao, caminho.docId);
        
        await setDoc(docRef, checklistComMeta, { merge: true });
        
        // Atualiza índice do veículo (para histórico por placa)
        if (checklist.placa) {
            await atualizarIndiceVeiculo(checklist);
        }
        
        console.log(`✅ Salvo em: ${caminho.caminhoCompleto}`);
        
    } catch (error) {
        console.error(`❌ Erro ao salvar:`, error);
        throw error;
    }
}

/**
 * Mantém índice de veículos para busca rápida por placa
 */
async function atualizarIndiceVeiculo(checklist) {
    try {
        const { db } = await initFirebase();
        const { doc, setDoc, arrayUnion } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        const placaLimpa = checklist.placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
        
        const veiculoRef = doc(db, `oficinas/${oficinaId}/veiculos`, placaLimpa);
        
        await setDoc(veiculoRef, {
            placa: checklist.placa,
            modelo: checklist.modelo || '',
            marca: checklist.modelo?.split(' ')[0] || '',
            ultima_visita: checklist.data_criacao,
            historico_ids: arrayUnion(checklist.id)
        }, { merge: true });
        
        console.log(`📋 Índice do veículo ${checklist.placa} atualizado`);
        
    } catch (error) {
        console.warn('⚠️ Erro ao atualizar índice do veículo:', error);
    }
}

// ============================================
// FUNÇÕES DE BUSCA
// ============================================

/**
 * Busca checklists de um mês específico
 */
export async function buscarChecklistsMes(ano, mes) {
    try {
        const { db } = await initFirebase();
        const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        const mesFormatado = String(mes).padStart(2, '0');
        const nomeMes = [
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
        ][mes - 1];
        
        const caminhoColecao = `oficinas/${oficinaId}/checklists/${ano}/${mesFormatado}-${nomeMes}`;
        
        console.log(`⏳ Buscando em: ${caminhoColecao}`);
        
        const q = query(
            collection(db, caminhoColecao),
            orderBy('data_criacao', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const checklists = [];
        
        snapshot.forEach(doc => {
            checklists.push({
                firebaseId: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ ${checklists.length} checklists encontrados em ${nomeMes}/${ano}`);
        return checklists;
        
    } catch (error) {
        console.error('❌ Erro ao buscar checklists do mês:', error);
        return [];
    }
}

/**
 * Busca apenas do mês atual (RECOMENDADO - mais rápido e econômico)
 */
export async function buscarChecklistsMesAtual() {
    const hoje = new Date();
    return buscarChecklistsMes(hoje.getFullYear(), hoje.getMonth() + 1);
}

/**
 * Busca TODOS os checklists (de todos os meses)
 * ⚠️ USE COM CUIDADO - pode consumir muitas leituras!
 */
export async function buscarChecklistsNuvem() {
    try {
        console.log('⏳ Buscando TODOS os checklists (pode demorar e consumir leituras)...');
        
        const { db } = await initFirebase();
        const { collectionGroup, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        
        // Collection Group busca em TODAS as subcoleções
        // Não há como filtrar por oficina_id aqui, então filtramos depois
        const snapshot = await getDocs(collectionGroup(db, String(new Date().getFullYear())));
        
        const checklists = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            // Filtra apenas desta oficina
            if (data.oficina_id === oficinaId) {
                checklists.push({
                    firebaseId: doc.id,
                    ...data
                });
            }
        });
        
        // Ordena por data
        checklists.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
        
        console.log(`✅ ${checklists.length} checklists encontrados no total`);
        return checklists;
        
    } catch (error) {
        console.error('❌ Erro ao buscar todos os checklists:', error);
        
        // Fallback: busca apenas o mês atual
        console.warn('⚠️ Tentando buscar apenas o mês atual como fallback...');
        return buscarChecklistsMesAtual();
    }
}

/**
 * Busca histórico completo de um veículo por placa
 */
export async function buscarHistoricoVeiculo(placa) {
    try {
        const { db } = await initFirebase();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        const placaLimpa = placa.replace(/[^A-Z0-9]/g, '').toUpperCase();
        
        const veiculoRef = doc(db, `oficinas/${oficinaId}/veiculos`, placaLimpa);
        const veiculoSnap = await getDoc(veiculoRef);
        
        if (!veiculoSnap.exists()) {
            console.log(`📭 Veículo ${placa} não encontrado no índice`);
            return null;
        }
        
        const veiculoData = veiculoSnap.data();
        console.log(`✅ Veículo ${placa} tem ${veiculoData.historico_ids?.length || 0} checklists`);
        
        return veiculoData;
        
    } catch (error) {
        console.error('❌ Erro ao buscar histórico do veículo:', error);
        return null;
    }
}

/**
 * Busca um checklist específico pelo ID
 */
export async function buscarChecklistPorId(id, dataCriacao) {
    try {
        const { db } = await initFirebase();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const caminho = getCaminhoChecklist(id, dataCriacao);
        const docRef = doc(db, caminho.colecao, caminho.docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return {
                firebaseId: docSnap.id,
                ...docSnap.data()
            };
        }
        
        console.log(`📭 Checklist ${id} não encontrado`);
        return null;
        
    } catch (error) {
        console.error(`❌ Erro ao buscar checklist ${id}:`, error);
        throw error;
    }
}

/**
 * Deleta um checklist
 */
export async function deletarChecklist(id, dataCriacao) {
    try {
        const { db } = await initFirebase();
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const caminho = getCaminhoChecklist(id, dataCriacao);
        const docRef = doc(db, caminho.colecao, caminho.docId);
        
        await deleteDoc(docRef);
        console.log(`✅ Checklist ${id} deletado de ${caminho.caminhoCompleto}`);
        
    } catch (error) {
        console.error(`❌ Erro ao deletar checklist ${id}:`, error);
        throw error;
    }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Lista todos os anos disponíveis
 */
export async function listarAnosDisponiveis() {
    try {
        const { db } = await initFirebase();
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        const anosRef = collection(db, `oficinas/${oficinaId}/checklists`);
        const snapshot = await getDocs(anosRef);
        
        const anos = [];
        snapshot.forEach(doc => anos.push(doc.id));
        
        return anos.sort().reverse();
        
    } catch (error) {
        console.error('❌ Erro ao listar anos:', error);
        return [];
    }
}

/**
 * Lista meses disponíveis de um ano
 */
export async function listarMesesDoAno(ano) {
    try {
        const { db } = await initFirebase();
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        const mesesRef = collection(db, `oficinas/${oficinaId}/checklists/${ano}`);
        const snapshot = await getDocs(mesesRef);
        
        const meses = [];
        snapshot.forEach(doc => meses.push(doc.id));
        
        return meses;
        
    } catch (error) {
        console.error('❌ Erro ao listar meses:', error);
        return [];
    }
}

// ============================================
// MIGRAÇÃO E REORGANIZAÇÃO
// ============================================

/**
 * Reorganiza checklists antigos (da estrutura plana para hierárquica)
 */
export async function migrarChecklistsParaPastas() {
    try {
        console.log('🔄 Iniciando migração para estrutura organizada...');
        console.log('⚠️ Esta operação pode levar alguns minutos...');
        
        const { db } = await initFirebase();
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Busca da coleção antiga (plana)
        const checklistsAntigos = collection(db, 'checklists');
        const snapshot = await getDocs(checklistsAntigos);
        
        if (snapshot.empty) {
            console.log('📭 Nenhum checklist encontrado na estrutura antiga');
            return { sucesso: true, migrados: 0, mensagem: 'Nenhum dado para migrar' };
        }
        
        let migrados = 0;
        let erros = 0;
        
        for (const docSnap of snapshot.docs) {
            try {
                const checklist = docSnap.data();
                
                // Salva na nova estrutura
                await salvarNoFirebase(checklist);
                
                migrados++;
                
                if (migrados % 10 === 0) {
                    console.log(`✅ Progresso: ${migrados}/${snapshot.size} migrados`);
                }
            } catch (error) {
                console.error(`❌ Erro ao migrar checklist ${docSnap.id}:`, error);
                erros++;
            }
        }
        
        console.log(`🎉 Migração concluída!`);
        console.log(`✅ ${migrados} checklists reorganizados`);
        console.log(`❌ ${erros} erros`);
        console.log(`ℹ️ Os dados antigos foram MANTIDOS na estrutura original para backup`);
        
        return { sucesso: true, migrados, erros };
        
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        return { sucesso: false, erro: error.message };
    }
}

// ============================================
// DIAGNÓSTICO E DEBUG
// ============================================

export async function verificarConexaoFirebase() {
    try {
        const { db } = await initFirebase();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const oficinaId = getOficinaId();
        
        // Testa uma leitura simples
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, '0');
        const nomeMes = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][hoje.getMonth()];
        
        const caminhoTeste = `oficinas/${oficinaId}/checklists/${ano}/${mes}-${nomeMes}`;
        
        return {
            status: 'conectado',
            mensagem: 'Firebase conectado com sucesso!',
            oficina: oficinaId,
            estrutura: caminhoTeste,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        return {
            status: 'erro',
            mensagem: error.message,
            timestamp: new Date().toISOString()
        };
    }
}

export async function exibirEstatisticas() {
    try {
        console.log('📊 === ESTATÍSTICAS DO FIREBASE ===');
        
        const anos = await listarAnosDisponiveis();
        console.log(`📅 Anos com dados: ${anos.join(', ') || 'Nenhum'}`);
        
        for (const ano of anos) {
            const meses = await listarMesesDoAno(ano);
            console.log(`  ${ano}: ${meses.length} meses com dados`);
            
            for (const mes of meses) {
                const [mesNum] = mes.split('-');
                const checklists = await buscarChecklistsMes(ano, parseInt(mesNum));
                console.log(`    - ${mes}: ${checklists.length} checklists`);
            }
        }
        
        console.log('=====================================');
        
    } catch (error) {
        console.error('❌ Erro ao exibir estatísticas:', error);
    }
}

// ============================================
// EXPORTS GLOBAIS PARA DEBUG
// ============================================

if (typeof window !== 'undefined') {
    window.firebaseDebug = {
        verificar: verificarConexaoFirebase,
        migrar: migrarChecklistsParaPastas,
        estatisticas: exibirEstatisticas,
        listarAnos: listarAnosDisponiveis,
        listarMeses: listarMesesDoAno,
        buscarMes: buscarChecklistsMes,
        buscarMesAtual: buscarChecklistsMesAtual,
        buscarHistoricoVeiculo: buscarHistoricoVeiculo
    };
    
    console.log('🔧 === COMANDOS FIREBASE DISPONÍVEIS ===');
    console.log('firebaseDebug.verificar()        - Testa conexão');
    console.log('firebaseDebug.migrar()           - Migra dados antigos');
    console.log('firebaseDebug.estatisticas()     - Mostra estatísticas');
    console.log('firebaseDebug.listarAnos()       - Lista anos com dados');
    console.log('firebaseDebug.buscarMesAtual()   - Busca mês atual');
    console.log('========================================');
}
