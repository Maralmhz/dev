// ==========================================
// 🔥 INICIALIZAÇÃO GARANTIDA - GESTÃO OFICINA V2.3.1
// ==========================================
// Este arquivo GARANTE que todas as funções estejam no escopo global

(function() {
  'use strict';
  
  console.log('🚀 Inicializando Gestão Oficina...');

  // ==========================================
  // AGUARDAR CARREGAMENTO DO MÓDULO PRINCIPAL
  // ==========================================
  
  function aguardarFuncoes() {
    return new Promise((resolve) => {
      let tentativas = 0;
      const maxTentativas = 50; // 5 segundos
      
      const intervalo = setInterval(() => {
        tentativas++;
        
        // Verificar se as funções internas existem
        const funcoesCarregadas = 
          typeof window.abrirModalNovoOS === 'function' &&
          typeof window.editarOS === 'function' &&
          typeof window.excluirOS === 'function' &&
          typeof window.mudarVisualizacao === 'function' &&
          typeof window.irParaColunaKanban === 'function';
        
        if (funcoesCarregadas) {
          clearInterval(intervalo);
          console.log('✅ Todas as funções principais carregadas!');
          resolve(true);
        } else if (tentativas >= maxTentativas) {
          clearInterval(intervalo);
          console.error('❌ Timeout aguardando funções');
          resolve(false);
        }
      }, 100);
    });
  }

  // ==========================================
  // GARANTIR EXPOSIÇÃO GLOBAL
  // ==========================================
  
  async function garantirExposicao() {
    const carregado = await aguardarFuncoes();
    
    if (!carregado) {
      console.error('❌ FALHA: Funções não carregadas após 5s');
      return;
    }

    // Listar todas as funções que DEVEM existir
    const funcoesObrigatorias = [
      'abrirModalNovoOS',
      'editarOS',
      'excluirOS',
      'acaoOS',
      'mudarEtapa',
      'toggleDropdownEtapa',
      'mudarVisualizacao',
      'abrirDetalhesOS',
      'irParaColunaKanban',
      'toggleCalendarioCompacto',
      'iniciarGestaoOficina',
      'salvarNovoOS',
      'fecharModal',
      'autocompletarNovaOS',
      'salvarOS',
      'carregarOS',
      'renderizarVisao',
      'mostrarNotificacao',
      'atualizarBadgeAlertas'
    ];

    const faltando = [];
    
    funcoesObrigatorias.forEach(nomeFuncao => {
      if (typeof window[nomeFuncao] !== 'function') {
        faltando.push(nomeFuncao);
      }
    });

    if (faltando.length > 0) {
      console.error('❌ FUNÇÕES FALTANDO:', faltando);
      console.error('🔧 Tentando recuperar...');
      
      // Tentar acessar do namespace interno
      if (window.GestaoV2) {
        faltando.forEach(nome => {
          if (window.GestaoV2[nome]) {
            window[nome] = window.GestaoV2[nome];
            console.log(`✅ Recuperado: ${nome}`);
          }
        });
      }
    } else {
      console.log('✅ Todas as', funcoesObrigatorias.length, 'funções estão disponíveis!');
    }

    // Verificação final
    console.log('🔍 Verificação final:', {
      abrirModalNovoOS: typeof window.abrirModalNovoOS,
      editarOS: typeof window.editarOS,
      excluirOS: typeof window.excluirOS,
      mudarVisualizacao: typeof window.mudarVisualizacao,
      irParaColunaKanban: typeof window.irParaColunaKanban,
      salvarOS: typeof window.salvarOS,
      carregarOS: typeof window.carregarOS
    });
  }

  // ==========================================
  // AUTO-EXECUTAR
  // ==========================================
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', garantirExposicao);
  } else {
    setTimeout(garantirExposicao, 500);
  }

  // ==========================================
  // FUNÇÃO GLOBAL DE DEBUG
  // ==========================================
  
  window.debugGestaoFuncoes = function() {
    console.log('🔍 DIAGNÓSTICO DE FUNÇÕES:');
    console.log('========================');
    
    const funcoes = [
      'abrirModalNovoOS',
      'editarOS',
      'excluirOS',
      'mudarVisualizacao',
      'irParaColunaKanban',
      'salvarOS',
      'carregarOS'
    ];
    
    funcoes.forEach(nome => {
      const tipo = typeof window[nome];
      const status = tipo === 'function' ? '✅' : '❌';
      console.log(`${status} ${nome}: ${tipo}`);
    });
    
    console.log('========================');
    
    // Verificar localStorage
    const osKey = 'os_agenda_oficina';
    const osData = localStorage.getItem(osKey);
    console.log('📦 OS no localStorage:', osData ? JSON.parse(osData).length : 0);
    
    return {
      funcoes: funcoes.reduce((acc, nome) => {
        acc[nome] = typeof window[nome];
        return acc;
      }, {}),
      localStorage: {
        totalOS: osData ? JSON.parse(osData).length : 0
      }
    };
  };

  console.log('💡 Execute debugGestaoFuncoes() no console para verificar');

})();
