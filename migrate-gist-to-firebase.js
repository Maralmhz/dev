/**
 * Script de Migração: GitHub Gist -> Firebase Firestore
 * 
 * Este script migra TODOS os checklists salvos no GitHub Gist para o Firebase Firestore.
 * Execute ANTES de revogar o token do GitHub.
 * 
 * IMPORTANTE: 
 * 1. Configure as credenciais do Firebase abaixo
 * 2. O token do Gist será lido do config.js existente
 * 3. Execute este script UMA VEZ para cada oficina/Gist
 * 4. Verifique os dados no Firebase Console
 * 5. Só depois revogue o token do GitHub
 */

// ============================================
// CONFIGURAÇÃO FIREBASE - PREENCHA COM SEUS DADOS
// ============================================

// Obtenha estas informações em:
// https://console.firebase.google.com/project/checklist-oficina-72c9e/settings/general

const FIREBASE_CONFIG = {
    apiKey: "COLE_SUA_API_KEY_AQUI",
    authDomain: "checklist-oficina-72c9e.firebaseapp.com",
    projectId: "checklist-oficina-72c9e",
    storageBucket: "checklist-oficina-72c9e.appspot.com",
    messagingSenderId: "COLE_SEU_SENDER_ID",
    appId: "COLE_SEU_APP_ID"
};

// Nome da coleção no Firestore onde os checklists serão salvos
const FIRESTORE_COLLECTION = 'checklists';

// ============================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================

async function buscarDadosDoGist() {
    console.log('⏳ Buscando dados do GitHub Gist...');
    
    // Lê configuração do Gist do arquivo config.js existente
    if (!window.CLOUD_CONFIG || !window.CLOUD_CONFIG.TOKEN || !window.CLOUD_CONFIG.GIST_ID) {
        throw new Error('Configuração do Gist não encontrada! Certifique-se que config.js está carregado.');
    }
    
    const config = window.CLOUD_CONFIG;
    
    try {
        const url = `https://api.github.com/gists/${config.GIST_ID}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${config.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar Gist: ${response.statusText}`);
        }

        const data = await response.json();
        const filename = config.FILENAME || 'backup_fastcar.json';
        
        if (data.files && data.files[filename]) {
            const content = data.files[filename].content;
            const checklists = JSON.parse(content || '[]');
            console.log(`✅ ${checklists.length} checklists encontrados no Gist!`);
            return checklists;
        }
        
        console.warn('⚠️ Nenhum dado encontrado no Gist.');
        return [];
    } catch (error) {
        console.error('❌ Erro ao buscar dados do Gist:', error);
        throw error;
    }
}

async function salvarNoFirebase(checklists) {
    console.log(`\n⏳ Iniciando migração de ${checklists.length} checklists para o Firebase...`);
    
    // Importa Firebase
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore, collection, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    // Inicializa Firebase
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    
    let sucesso = 0;
    let erro = 0;
    
    for (let i = 0; i < checklists.length; i++) {
        const checklist = checklists[i];
        
        try {
            // Adiciona timestamp de migração
            const checklistComMeta = {
                ...checklist,
                migrado_em: new Date().toISOString(),
                origem: 'gist'
            };
            
            // Usa o ID do checklist como documento no Firestore
            const docRef = doc(db, FIRESTORE_COLLECTION, String(checklist.id));
            await setDoc(docRef, checklistComMeta);
            
            sucesso++;
            console.log(`✅ [${i + 1}/${checklists.length}] Checklist ${checklist.id} migrado (Placa: ${checklist.placa || 'N/A'})`);
            
            // Pequeno delay para não sobrecarregar o Firebase
            if (i % 10 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            erro++;
            console.error(`❌ [${i + 1}/${checklists.length}] Erro ao migrar checklist ${checklist.id}:`, error.message);
        }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🏁 MIGRAÇÃO CONCLUÍDA!');
    console.log('='.repeat(50));
    console.log(`✅ Sucesso: ${sucesso} checklists`);
    console.log(`❌ Erros: ${erro} checklists`);
    console.log(`\n🔗 Verifique os dados em: https://console.firebase.google.com/project/${FIREBASE_CONFIG.projectId}/firestore`);
    
    return { sucesso, erro, total: checklists.length };
}

async function executarMigracao() {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 SCRIPT DE MIGRAÇÃO: GIST → FIREBASE');
    console.log('='.repeat(50) + '\n');
    
    // Validações
    if (FIREBASE_CONFIG.apiKey === 'COLE_SUA_API_KEY_AQUI') {
        console.error('❌ ERRO: Configure as credenciais do Firebase antes de executar!');
        console.log('\n📖 Passos para obter credenciais:');
        console.log('   1. Acesse: https://console.firebase.google.com/project/checklist-oficina-72c9e/settings/general');
        console.log('   2. Role até "Seus aplicativos"');
        console.log('   3. Clique no ícone da web (</>)');
        console.log('   4. Copie o objeto firebaseConfig');
        console.log('   5. Cole neste arquivo na variável FIREBASE_CONFIG\n');
        return;
    }
    
    try {
        // Passo 1: Buscar dados do Gist
        const checklists = await buscarDadosDoGist();
        
        if (checklists.length === 0) {
            console.log('\n⚠️ Nenhum checklist para migrar. Script finalizado.');
            return;
        }
        
        // Mostra resumo antes de iniciar
        console.log('\n📊 RESUMO DA MIGRAÇÃO:');
        console.log(`   Total de checklists: ${checklists.length}`);
        console.log(`   Destino: Firebase Firestore`);
        console.log(`   Coleção: ${FIRESTORE_COLLECTION}`);
        console.log('\n⏳ Iniciando em 3 segundos...\n');
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Passo 2: Salvar no Firebase
        const resultado = await salvarNoFirebase(checklists);
        
        // Passo 3: Instruções finais
        if (resultado.sucesso > 0) {
            console.log('\n🛡️ PRÓXIMOS PASSOS:');
            console.log('1. ✅ Verifique os dados no Firebase Console');
            console.log('2. 🧪 Teste o sistema com firebase_app.js atualizado');
            console.log('3. 💾 Faça backup do Gist (baixar JSON) como segurança');
            console.log('4. ❌ Revogue o token do GitHub: https://github.com/settings/tokens');
            console.log('5. 🔒 Atualize config.js removendo CLOUD_CONFIG\n');
            
            // Salvar relatório
            const relatorio = {
                data_migracao: new Date().toISOString(),
                total: resultado.total,
                sucesso: resultado.sucesso,
                erros: resultado.erro,
                firebaseProject: FIREBASE_CONFIG.projectId
            };
            
            console.log('📄 Relatório de Migração:');
            console.log(JSON.stringify(relatorio, null, 2));
        }
        
    } catch (error) {
        console.error('\n❌ ERRO FATAL na migração:', error);
        console.log('\n🐛 Possíveis causas:');
        console.log('   - config.js não está carregado');
        console.log('   - Token do Gist inválido ou expirado');
        console.log('   - Credenciais do Firebase incorretas');
        console.log('   - Problemas de conexão com internet\n');
    }
}

// ============================================
// EXECUÇÃO
// ============================================

if (typeof window !== 'undefined') {
    window.migrarGistParaFirebase = executarMigracao;
    console.log('📢 Script de migração carregado!');
    console.log('📝 Para iniciar, execute: migrarGistParaFirebase()');
}
