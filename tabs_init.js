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
                if (window.switchTab) {
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

        // ✅ Inicializar aba Gestão Oficina com data-tab-gestao
        const abaGestaoOficina = document.querySelector('[data-tab-gestao]');
        if (abaGestaoOficina) {
            console.log('🔍 Botão Gestão Oficina encontrado!');
            
            // Remover onclick inline se existir
            abaGestaoOficina.removeAttribute('onclick');
            
            // Adicionar listener seguro
            abaGestaoOficina.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('👆 Clique na aba Gestão Oficina');
                
                // 1. Trocar de aba
                if (typeof window.switchTab === 'function') {
                    window.switchTab('gestao-oficina');
                    console.log('✅ Aba trocada para gestao-oficina');
                } else {
                    console.error('❌ switchTab não está disponível');
                }
                
                // 2. Aguardar renderização e iniciar dashboard
                setTimeout(() => {
                    if (typeof window.iniciarDashboardFirestore === 'function') {
                        window.iniciarDashboardFirestore();
                        console.log('🔥 Dashboard iniciado!');
                    } else {
                        console.warn('⚠️ iniciarDashboardFirestore não disponível');
                    }
                }, 100);
            });
            
            console.log('✅ Aba Gestão Oficina inicializada');
        } else {
            console.error('❌ Botão [data-tab-gestao] não encontrado no DOM');
        }

        // ✅ Inicializar botão Nova OS
        const observarBotaoNovaOS = () => {
            const botaoNovaOS = document.querySelector('[data-btn-nova-os]');
            if (botaoNovaOS) {
                botaoNovaOS.removeAttribute('onclick');
                botaoNovaOS.addEventListener('click', function(e) {
                    e.preventDefault();
                    if (typeof window.abrirModalNovoOS === 'function') {
                        window.abrirModalNovoOS();
                    }
                });
                console.log('✅ Botão Nova OS inicializado');
            }
        };

        // Observar quando botão Nova OS aparecer (ele é renderizado dinamicamente)
        const observer = new MutationObserver(observarBotaoNovaOS);
        observer.observe(document.body, { childList: true, subtree: true });
        observarBotaoNovaOS(); // Tentar imediatamente também

        console.log('🎉 Inicialização de abas concluída!');
    }

    // Executar quando DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarAbas);
    } else {
        inicializarAbas();
    }
})();
