/**
 * SCRIPT DE MIGRAÇÃO COMPLETA: 3 OFICINAS -> FIREBASE
 * 
 * Este script migra TODAS as 3 oficinas de uma vez:
 * - Fast Car
 * - Volpini
 * - GogoCars
 * 
 * Cada checklist receberá o campo oficina_id automaticamente.
 */

// ============================================
// CONFIGURAÇÃO
// ============================================

const GIST_CONFIG = {
    TOKEN: '', // Será preenchido via window.CLOUD_CONFIG
    GIST_ID: '75e76a26d9b0c36f602ec356f525680a'
};

const OFICINAS = [
    {
        id: 'fastcar',
        nome: 'Fast Car Centro Automotivo',
        filename: 'backup_fastcar.json'
    },
    {
        id: 'volpini',
        nome: 'Volpini',
        filename: 'backup_volpini.json'
    },
    {
        id: 'gogocars',
        nome: "GogoCar's",
        filename: 'backup_gogocars.json'
    }
];

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCpCfotfXYNpQu5o0fFbBvwOnQgU9PuYqU",
    authDomain: "checklist-oficina-72c9e.firebaseapp.com",
    databaseURL: "https://checklist-oficina-72c9e-default-rtdb.firebaseio.com",
    projectId: "checklist-oficina-72c9e",
    storageBucket: "checklist-oficina-72c9e.firebasestorage.app",
    messagingSenderId: "305423384809",
    appId: "1:305423384809:web:b152970a419848a0147078"
};

const COLLECTION_NAME = 'checklists';

// ============================================
// FUNÇÕES DE MIGRAÇÃO
// ============================================

async function buscarDadosDoGist(filename) {
    try {
        // Obtém token do config.js
        const token = window.CLOUD_CONFIG?.TOKEN || GIST_CONFIG.TOKEN;
        
        if (!token) {
            throw new Error('Token do GitHub não encontrado!');
        }
        
        const url = `https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`;
        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`Erro ao buscar Gist: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.files && data.files[filename]) {
            const content = data.files[filename].content;
            return JSON.parse(content || '[]');
        }
        
        return [];
    } catch (error) {
        console.error(`❌ Erro ao buscar ${filename}:`, error);
        return [];
    }
}

async function inicializarFirebase() {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const app = initializeApp(FIREBASE_CONFIG);
    const db = getFirestore(app);
    
    return db;
}

async function migrarOficina(oficina, db) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🏢 MIGRANDO: ${oficina.nome.toUpperCase()}`);
    console.log('='.repeat(60));
    
    // Buscar dados do Gist
    console.log(`⏳ Buscando dados de ${oficina.filename}...`);
    const checklists = await buscarDadosDoGist(oficina.filename);
    
    if (checklists.length === 0) {
        console.log(`⚠️  Nenhum checklist encontrado em ${oficina.filename}`);
        return { oficina: oficina.nome, total: 0, sucesso: 0, erro: 0 };
    }
    
    console.log(`✅ ${checklists.length} checklists encontrados!`);
    console.log(`⏳ Iniciando migração para o Firebase...\n`);
    
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    let sucesso = 0;
    let erro = 0;
    
    for (let i = 0; i < checklists.length; i++) {
        const checklist = checklists[i];
        
        try {
            // Adiciona oficina_id e metadados
            const checklistComMeta = {
                ...checklist,
                oficina_id: oficina.id,
                oficina_nome: oficina.nome,
                migrado_em: new Date().toISOString(),
                origem: 'gist'
            };
            
            // Salva no Firestore
            const docRef = doc(db, COLLECTION_NAME, String(checklist.id));
            await setDoc(docRef, checklistComMeta);
            
            sucesso++;
            console.log(`✅ [${i + 1}/${checklists.length}] ID: ${checklist.id} | Placa: ${checklist.placa || 'N/A'}`);
            
            // Delay para não sobrecarregar
            if (i % 10 === 0 && i > 0) {
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        } catch (error) {
            erro++;
            console.error(`❌ [${i + 1}/${checklists.length}] Erro no ID ${checklist.id}:`, error.message);
        }
    }
    
    return {
        oficina: oficina.nome,
        total: checklists.length,
        sucesso: sucesso,
        erro: erro
    };
}

async function executarMigracaoCompleta() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 MIGRAÇÃO COMPLETA: 3 OFICINAS → FIREBASE');
    console.log('='.repeat(70));
    console.log('\n🏢 Oficinas a migrar:');
    OFICINAS.forEach((of, i) => {
        console.log(`   ${i + 1}. ${of.nome} (${of.filename})`);
    });
    console.log('\n⏳ Iniciando em 3 segundos...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
        // Inicializar Firebase
        console.log('🔥 Inicializando Firebase...');
        const db = await inicializarFirebase();
        console.log('✅ Firebase conectado!\n');
        
        // Migrar cada oficina
        const resultados = [];
        
        for (const oficina of OFICINAS) {
            const resultado = await migrarOficina(oficina, db);
            resultados.push(resultado);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Relatório Final
        console.log('\n' + '='.repeat(70));
        console.log('🏁 MIGRAÇÃO COMPLETA FINALIZADA!');
        console.log('='.repeat(70) + '\n');
        
        let totalGeral = 0;
        let sucessoGeral = 0;
        let erroGeral = 0;
        
        console.log('📊 RESUMO POR OFICINA:\n');
        resultados.forEach(r => {
            console.log(`🏢 ${r.oficina}:`);
            console.log(`   Total: ${r.total} checklists`);
            console.log(`   ✅ Sucesso: ${r.sucesso}`);
            console.log(`   ❌ Erros: ${r.erro}`);
            console.log('');
            
            totalGeral += r.total;
            sucessoGeral += r.sucesso;
            erroGeral += r.erro;
        });
        
        console.log('='.repeat(70));
        console.log('🌎 TOTAIS GERAIS:');
        console.log(`   Total de checklists: ${totalGeral}`);
        console.log(`   ✅ Migrados com sucesso: ${sucessoGeral}`);
        console.log(`   ❌ Erros: ${erroGeral}`);
        console.log('='.repeat(70));
        
        if (sucessoGeral > 0) {
            console.log('\n🛡️  PRÓXIMOS PASSOS:');
            console.log('1. ✅ Verifique os dados no Firebase Console');
            console.log('   https://console.firebase.google.com/project/checklist-oficina-72c9e/firestore');
            console.log('2. 🔍 Confirme que todos os checklists têm oficina_id');
            console.log('3. 💾 Faça backup do Gist (baixar JSONs) como segurança');
            console.log('4. ❌ Revogue o token do GitHub: https://github.com/settings/tokens');
            console.log('5. 🔄 Atualize os sistemas das oficinas para usar Firebase\n');
        }
        
    } catch (error) {
        console.error('\n❌ ERRO FATAL:', error);
        console.log('\n🐛 Verifique:');
        console.log('   - Token do GitHub está válido?');
        console.log('   - Credenciais do Firebase estão corretas?');
        console.log('   - Conexão com internet está ok?\n');
    }
}

// ============================================
// EXECUÇÃO
// ============================================

if (typeof window !== 'undefined') {
    window.migrarTodasOficinas = executarMigracaoCompleta;
    console.log('📢 Script de migração completa carregado!');
    console.log('📝 Para migrar as 3 oficinas, execute: migrarTodasOficinas()');
}