// ==========================================
// 🔄 MIGRADOR DE CHECKLISTS ANTIGOS
// Recupera checklists 'perdidos' na mudança multi-tenant
// V1.0 - 21/02/2026
// ==========================================

(function() {
    'use strict';
    
    console.log('🔄 ==== MIGRADOR DE CHECKLISTS ====');
    
    // Aguardar OFICINA_CONFIG estar carregado
    if (!window.OFICINA_CONFIG?.oficina_id) {
        console.warn('⚠️ OFICINA_CONFIG não carregado ainda. Aguardando...');
        setTimeout(() => {
            if (window.OFICINA_CONFIG?.oficina_id) {
                executarMigracao();
            } else {
                console.error('❌ OFICINA_CONFIG.oficina_id não encontrado!');
            }
        }, 2000);
        return;
    }
    
    executarMigracao();
    
    function executarMigracao() {
        const oficinaId = window.OFICINA_CONFIG.oficina_id;
        const chaveNova = `checklists_${oficinaId}`;
        const chaveAntiga = 'checklists';
        
        console.log(`🏷️ Oficina ID: ${oficinaId}`);
        console.log(`🔑 Chave nova: ${chaveNova}`);
        
        // 1. Verificar se já tem dados na nova chave
        let checklistsNovos = [];
        try {
            const dadosNovos = localStorage.getItem(chaveNova);
            if (dadosNovos) {
                checklistsNovos = JSON.parse(dadosNovos);
                console.log(`✅ ${checklistsNovos.length} checklists já existem na nova chave`);
            } else {
                console.log('🆕 Nenhum checklist na nova chave ainda');
            }
        } catch (e) {
            console.error('❌ Erro ao ler nova chave:', e);
        }
        
        // 2. Buscar dados na chave antiga
        let checklistsAntigos = [];
        try {
            const dadosAntigos = localStorage.getItem(chaveAntiga);
            if (dadosAntigos) {
                checklistsAntigos = JSON.parse(dadosAntigos);
                console.log(`📦 ${checklistsAntigos.length} checklists encontrados na chave antiga`);
            } else {
                console.log('🆕 Nenhum checklist na chave antiga');
            }
        } catch (e) {
            console.error('❌ Erro ao ler chave antiga:', e);
        }
        
        // 3. Filtrar apenas da oficina atual
        const checklistsDaOficina = checklistsAntigos.filter(c => {
            const oficinaDoChecklist = c.oficina_id || oficinaId;
            return oficinaDoChecklist === oficinaId;
        });
        
        if (checklistsDaOficina.length === 0) {
            console.log('✅ Nenhum checklist antigo para migrar');
            exibirResumo(checklistsNovos.length, 0, 0);
            return;
        }
        
        console.log(`🎯 ${checklistsDaOficina.length} checklists pertencem a esta oficina`);
        
        // 4. Criar set de IDs já existentes
        const idsExistentes = new Set(
            checklistsNovos.map(c => normalizarId(c.id))
        );
        
        // 5. Identificar checklists a adicionar
        const paraAdicionar = checklistsDaOficina.filter(c => {
            return !idsExistentes.has(normalizarId(c.id));
        });
        
        if (paraAdicionar.length === 0) {
            console.log('✅ Todos os checklists antigos já estão na nova chave');
            exibirResumo(checklistsNovos.length, 0, 0);
            return;
        }
        
        console.log(`📥 ${paraAdicionar.length} checklists serão migrados:`);
        
        // 6. Listar os que serão migrados
        paraAdicionar.forEach((c, i) => {
            const data = new Date(c.data_criacao).toLocaleDateString('pt-BR');
            console.log(`  ${i+1}. ${c.placa || 'SEM PLACA'} - ${c.nome_cliente || 'SEM NOME'} (${data})`);
        });
        
        // 7. Fazer merge
        const checklistsFinais = [...checklistsNovos, ...paraAdicionar];
        
        // 8. Ordenar por data (mais recente primeiro)
        checklistsFinais.sort((a, b) => {
            return new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0);
        });
        
        // 9. Salvar
        try {
            localStorage.setItem(chaveNova, JSON.stringify(checklistsFinais));
            console.log('✅ MIGRAÇÃO CONCLUÍDA!');
            
            exibirResumo(
                checklistsNovos.length,
                paraAdicionar.length,
                checklistsFinais.length
            );
            
            // Notificar usuário
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(
                    `🔄 ${paraAdicionar.length} checklist(s) antigo(s) recuperado(s)!`,
                    'success'
                );
            } else {
                alert(`✅ MIGRAÇÃO CONCLUÍDA!\n\n${paraAdicionar.length} checklists recuperados.`);
            }
            
            // Recarregar histórico se estiver na aba
            if (typeof carregarHistorico === 'function') {
                setTimeout(carregarHistorico, 500);
            }
            
        } catch (e) {
            console.error('❌ Erro ao salvar migração:', e);
            
            if (e.name === 'QuotaExceededError') {
                alert(
                    '⚠️ ESPAÇO INSUFICIENTE!\n\n' +
                    'Migração falhou por falta de espaço.\n\n' +
                    'Ações recomendadas:\n' +
                    '1. Exporte seus checklists atuais\n' +
                    '2. Limpe dados antigos\n' +
                    '3. Sincronize com a nuvem'
                );
            }
        }
    }
    
    function normalizarId(id) {
        return String(id ?? '').trim();
    }
    
    function exibirResumo(antes, migrados, depois) {
        console.log('📊 ==== RESUMO DA MIGRAÇÃO ====');
        console.log(`  Antes: ${antes} checklists`);
        console.log(`  Migrados: ${migrados} checklists`);
        console.log(`  Depois: ${depois} checklists`);
        console.log('================================');
    }
    
    // Expor função para re-executar manualmente
    window.reexecutarMigracao = function() {
        console.clear();
        executarMigracao();
    };
    
    console.log('🛠️ Para re-executar manualmente: reexecutarMigracao()');
})();