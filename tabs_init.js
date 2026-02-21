// ==========================================
// INICIALIZADOR DE ABAS - Evita erros "is not defined"
// ==========================================
// Este arquivo garante que as funções sejam carregadas ANTES dos onclick

(function() {
    'use strict';

    function esperarFuncoes() {
        return new Promise((resolve) => {
            const intervalo = setInterval(() => {
                // Verificar se as funções críticas estão carregadas
                if (window.iniciarGestaoOficina && window.abrirModalNovoOS && window.switchTab) {
                    clearInterval(intervalo);
                    resolve();
                }
            }, 50); // Verifica a cada 50ms

            // Timeout de segurança de 5 segundos
            setTimeout(() => {
                clearInterval(intervalo);
                console.warn('⚠️ Timeout: Algumas funções podem não ter carregado');
                resolve();
            }, 5000);
        });
    }

    async function inicializarAbas() {
        console.log('🔄 Aguardando carregamento das funções...');
        await esperarFuncoes();
        console.log('✅ Funções carregadas! Inicializando abas...');

        // Inicializar aba Gestão Oficina com addEventListener
        const abaGestaoOficina = document.querySelector('[onclick*="gestao-oficina"]');
        if (abaGestaoOficina && window.iniciarGestaoOficina) {
            // Remover onclick inline para evitar erro
            abaGestaoOficina.removeAttribute('onclick');
            
            // Adicionar listener seguro
            abaGestaoOficina.addEventListener('click', function() {
                if (typeof window.switchTab === 'function') {
                    window.switchTab('gestao-oficina');
                }
                if (typeof window.iniciarGestaoOficina === 'function') {
                    window.iniciarGestaoOficina();
                }
            });
            console.log('✅ Aba Gestão Oficina inicializada');
        }

        // Inicializar botão Nova OS com addEventListener
        const botaoNovaOS = document.querySelector('.page-header button[onclick*="abrirModalNovoOS"]');
        if (botaoNovaOS && window.abrirModalNovoOS) {
            botaoNovaOS.removeAttribute('onclick');
            botaoNovaOS.addEventListener('click', function() {
                if (typeof window.abrirModalNovoOS === 'function') {
                    window.abrirModalNovoOS();
                }
            });
            console.log('✅ Botão Nova OS inicializado');
        }

        console.log('🎉 Inicialização de abas concluída!');
    }

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarAbas);
    } else {
        inicializarAbas();
    }
})();
