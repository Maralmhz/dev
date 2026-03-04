/**
 * 🧪 SCRIPT DE TESTE - BUGFIXES GESTÃO V2
 * 
 * Como usar:
 * 1. Abra o site no navegador
 * 2. Abra o Console (F12)
 * 3. Cole este script completo e pressione Enter
 * 4. Aguarde os testes executarem (30-60 segundos)
 * 5. Veja o relatório final com ✅ ou ❌
 * 
 * Referência: Issue #10 - https://github.com/Maralmhz/dev/issues/10
 */

(async function testBugfixesV2() {
  console.clear();
  console.log('%c🧪 INICIANDO TESTES DE BUGFIXES V2', 'background: #2563eb; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  console.log('%c📅 ' + new Date().toLocaleString('pt-BR'), 'color: #666; font-size: 12px;');
  console.log('');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper para testar função
  function testFunction(name, fn) {
    try {
      const exists = typeof fn === 'function';
      if (exists) {
        results.passed.push(`✅ ${name} está exposta`);
        console.log(`%c✅ ${name}`, 'color: #16a34a; font-weight: bold;');
        return true;
      } else {
        results.failed.push(`❌ ${name} não está exposta`);
        console.error(`%c❌ ${name}`, 'color: #dc2626; font-weight: bold;');
        return false;
      }
    } catch (error) {
      results.failed.push(`❌ ${name} - Erro: ${error.message}`);
      console.error(`%c❌ ${name} - Erro:`, 'color: #dc2626; font-weight: bold;', error);
      return false;
    }
  }

  // Helper para testar elemento DOM
  function testElement(selector, description) {
    const element = document.querySelector(selector);
    if (element) {
      results.passed.push(`✅ ${description}`);
      console.log(`%c✅ ${description}`, 'color: #16a34a;');
      return element;
    } else {
      results.failed.push(`❌ ${description} - Não encontrado`);
      console.error(`%c❌ ${description}`, 'color: #dc2626;');
      return null;
    }
  }

  console.log('%c\n📋 TESTE 1: Funções Globais Expostas', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando se funções críticas estão acessíveis...\n');

  testFunction('window.salvarNovoOS', window.salvarNovoOS);
  testFunction('window.salvarOS', window.salvarOS);
  testFunction('window.editarOS', window.editarOS);
  testFunction('window.carregarOS', window.carregarOS);
  testFunction('window.novoOS', window.novoOS);
  testFunction('window.salvarOSFirebase', window.salvarOSFirebase);

  await sleep(500);

  console.log('%c\n📋 TESTE 2: Módulos V2 Inicializados', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando se módulos V2 foram carregados...\n');

  testFunction('window.GestaoV2', window.GestaoV2);
  testFunction('window.AgendamentosV2', window.AgendamentosV2);
  testFunction('window.FinanceiroV2', window.FinanceiroV2);
  testFunction('window.RecibosV2', window.RecibosV2);
  testFunction('window.FirebaseV2', window.FirebaseV2);

  if (window.__GESTAO_V2_BUILD__) {
    results.passed.push(`✅ Build V2: ${window.__GESTAO_V2_BUILD__}`);
    console.log(`%c✅ Build V2: ${window.__GESTAO_V2_BUILD__}`, 'color: #16a34a;');
  } else {
    results.warnings.push(`⚠️ Build V2 não identificada`);
    console.warn(`%c⚠️ Build V2 não identificada`, 'color: #ea580c;');
  }

  await sleep(500);

  console.log('%c\n📋 TESTE 3: Botão "Criar Nova OS"', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Testando se botão funciona sem erros...\n');

  // Procurar botão de criar OS
  const btnCriarOS = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent.includes('Nova OS') || btn.textContent.includes('Criar OS')
  );

  if (btnCriarOS) {
    results.passed.push('✅ Botão "Criar Nova OS" encontrado');
    console.log('%c✅ Botão encontrado', 'color: #16a34a;');
    
    // Verificar se tem onclick inline (não deveria ter)
    if (btnCriarOS.onclick) {
      results.warnings.push('⚠️ Botão usa onclick inline (deveria usar addEventListener)');
      console.warn('%c⚠️ Onclick inline detectado', 'color: #ea580c;');
    } else {
      results.passed.push('✅ Botão usa addEventListener (boas práticas)');
      console.log('%c✅ Usa addEventListener', 'color: #16a34a;');
    }

    // Tentar clicar (simulado)
    try {
      const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
      const oldError = console.error;
      let errorCaught = false;
      
      console.error = (...args) => {
        if (args[0]?.includes?.('salvarNovoOS')) {
          errorCaught = true;
        }
        oldError.apply(console, args);
      };

      btnCriarOS.dispatchEvent(clickEvent);
      await sleep(500);

      console.error = oldError;

      if (!errorCaught) {
        results.passed.push('✅ Clique no botão não gera erro de salvarNovoOS');
        console.log('%c✅ Clique funciona sem erros', 'color: #16a34a;');
      } else {
        results.failed.push('❌ Clique gera erro de salvarNovoOS');
        console.error('%c❌ Erro ao clicar', 'color: #dc2626;');
      }
    } catch (error) {
      results.failed.push(`❌ Erro ao testar clique: ${error.message}`);
      console.error('%c❌ Erro ao testar clique:', 'color: #dc2626;', error);
    }
  } else {
    results.failed.push('❌ Botão "Criar Nova OS" não encontrado');
    console.error('%c❌ Botão não encontrado', 'color: #dc2626;');
  }

  await sleep(500);

  console.log('%c\n📋 TESTE 4: Painel "Veículos na Oficina"', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando se cards são clicáveis/editáveis...\n');

  // Procurar painel de veículos
  const painelVeiculos = Array.from(document.querySelectorAll('h3, h4')).find(
    h => h.textContent.includes('Veículos na Oficina')
  )?.parentElement;

  if (painelVeiculos) {
    results.passed.push('✅ Painel "Veículos na Oficina" encontrado');
    console.log('%c✅ Painel encontrado', 'color: #16a34a;');

    // Procurar cards de veículos
    const cardsVeiculos = painelVeiculos.querySelectorAll('.os-card-v2, .veiculo-card, [data-os-id]');
    
    if (cardsVeiculos.length > 0) {
      results.passed.push(`✅ ${cardsVeiculos.length} card(s) de veículo(s) encontrado(s)`);
      console.log(`%c✅ ${cardsVeiculos.length} card(s) encontrado(s)`, 'color: #16a34a;');

      // Verificar se tem cursor pointer
      const primeiroCard = cardsVeiculos[0];
      const cursorStyle = window.getComputedStyle(primeiroCard).cursor;
      
      if (cursorStyle === 'pointer') {
        results.passed.push('✅ Cards têm cursor:pointer (clicáveis)');
        console.log('%c✅ Cards clicáveis', 'color: #16a34a;');
      } else {
        results.warnings.push('⚠️ Cards não têm cursor:pointer');
        console.warn('%c⚠️ Cards podem não ser clicáveis', 'color: #ea580c;');
      }

      // Verificar se tem event listeners
      const hasClickListener = primeiroCard.onclick || 
                               window.getEventListeners?.(primeiroCard)?.click?.length > 0;
      
      if (hasClickListener) {
        results.passed.push('✅ Cards têm event listener de clique');
        console.log('%c✅ Event listener presente', 'color: #16a34a;');
      } else {
        results.failed.push('❌ Cards não têm event listener de clique');
        console.error('%c❌ Event listener ausente', 'color: #dc2626;');
      }
    } else {
      results.warnings.push('⚠️ Nenhum veículo na oficina no momento');
      console.warn('%c⚠️ Nenhum veículo para testar', 'color: #ea580c;');
    }
  } else {
    results.warnings.push('⚠️ Painel "Veículos na Oficina" não encontrado (pode estar oculto)');
    console.warn('%c⚠️ Painel não visível', 'color: #ea580c;');
  }

  await sleep(500);

  console.log('%c\n📋 TESTE 5: Calendário de Agendamentos', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando renderização de badges entrada/saída...\n');

  // Procurar calendário
  const calendario = document.querySelector('.calendario-diario, .calendario-semana, #calendario-agendamentos');

  if (calendario) {
    results.passed.push('✅ Calendário encontrado');
    console.log('%c✅ Calendário encontrado', 'color: #16a34a;');

    // Procurar badges de entrada
    const badgesEntrada = calendario.querySelectorAll('.badge-entrada, [data-tipo="entrada"]');
    if (badgesEntrada.length > 0) {
      results.passed.push(`✅ ${badgesEntrada.length} badge(s) de entrada encontrado(s)`);
      console.log(`%c✅ ${badgesEntrada.length} entrada(s)`, 'color: #16a34a;');

      // Verificar cor azul
      const primeiraEntrada = badgesEntrada[0];
      const bgColor = window.getComputedStyle(primeiraEntrada).backgroundColor;
      if (bgColor.includes('37, 99, 235') || bgColor.includes('#2563eb')) {
        results.passed.push('✅ Badge entrada tem cor azul');
        console.log('%c✅ Cor azul correta', 'color: #16a34a;');
      } else {
        results.warnings.push(`⚠️ Badge entrada tem cor diferente: ${bgColor}`);
        console.warn(`%c⚠️ Cor: ${bgColor}`, 'color: #ea580c;');
      }
    }

    // Procurar badges de saída
    const badgesSaida = calendario.querySelectorAll('.badge-saida, [data-tipo="saida"]');
    if (badgesSaida.length > 0) {
      results.passed.push(`✅ ${badgesSaida.length} badge(s) de saída encontrado(s)`);
      console.log(`%c✅ ${badgesSaida.length} saída(s)`, 'color: #16a34a;');

      // Verificar cor verde
      const primeiraSaida = badgesSaida[0];
      const bgColor = window.getComputedStyle(primeiraSaida).backgroundColor;
      if (bgColor.includes('22, 163, 74') || bgColor.includes('#16a34a')) {
        results.passed.push('✅ Badge saída tem cor verde');
        console.log('%c✅ Cor verde correta', 'color: #16a34a;');
      } else {
        results.warnings.push(`⚠️ Badge saída tem cor diferente: ${bgColor}`);
        console.warn(`%c⚠️ Cor: ${bgColor}`, 'color: #ea580c;');
      }
    }

    if (badgesEntrada.length === 0 && badgesSaida.length === 0) {
      results.warnings.push('⚠️ Nenhum agendamento no calendário para testar');
      console.warn('%c⚠️ Calendário vazio', 'color: #ea580c;');
    }
  } else {
    results.warnings.push('⚠️ Calendário não encontrado (pode estar em outra aba)');
    console.warn('%c⚠️ Calendário não visível', 'color: #ea580c;');
  }

  await sleep(500);

  console.log('%c\n📋 TESTE 6: Modal Financeiro', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando se campos são editáveis e salvam...\n');

  // Procurar modal financeiro
  const modalFinanceiro = document.querySelector('#modalFinanceiro, .modal-financeiro');

  if (modalFinanceiro) {
    results.passed.push('✅ Modal financeiro encontrado');
    console.log('%c✅ Modal encontrado', 'color: #16a34a;');

    // Verificar inputs editáveis
    const inputs = modalFinanceiro.querySelectorAll('input[type="number"], input[name*="custo"], input[name*="valor"]');
    const inputsEditaveis = Array.from(inputs).filter(input => 
      !input.disabled && !input.readOnly
    );

    if (inputsEditaveis.length > 0) {
      results.passed.push(`✅ ${inputsEditaveis.length} campo(s) editável(is)`);
      console.log(`%c✅ ${inputsEditaveis.length} campo(s) editável(is)`, 'color: #16a34a;');
    } else {
      results.failed.push('❌ Nenhum campo editável no modal financeiro');
      console.error('%c❌ Campos não editáveis', 'color: #dc2626;');
    }

    // Procurar botão salvar
    const btnSalvar = Array.from(modalFinanceiro.querySelectorAll('button')).find(
      btn => btn.textContent.includes('Salvar') || btn.textContent.includes('Confirmar')
    );

    if (btnSalvar) {
      results.passed.push('✅ Botão salvar encontrado');
      console.log('%c✅ Botão salvar presente', 'color: #16a34a;');

      // Verificar event listener
      if (btnSalvar.onclick || window.getEventListeners?.(btnSalvar)?.click?.length > 0) {
        results.passed.push('✅ Botão salvar tem event listener');
        console.log('%c✅ Event listener configurado', 'color: #16a34a;');
      } else {
        results.failed.push('❌ Botão salvar sem event listener');
        console.error('%c❌ Event listener ausente', 'color: #dc2626;');
      }
    } else {
      results.failed.push('❌ Botão salvar não encontrado');
      console.error('%c❌ Botão salvar ausente', 'color: #dc2626;');
    }
  } else {
    results.warnings.push('⚠️ Modal financeiro não visível (abra uma OS primeiro)');
    console.warn('%c⚠️ Modal não visível', 'color: #ea580c;');
  }

  await sleep(500);

  console.log('%c\n📋 TESTE 7: LocalStorage e Firestore', 'background: #1e40af; color: white; padding: 5px; font-weight: bold;');
  console.log('Verificando persistência de dados...\n');

  // Testar localStorage
  try {
    const osData = localStorage.getItem('ordens_servico');
    if (osData) {
      const os = JSON.parse(osData);
      results.passed.push(`✅ LocalStorage OK - ${Array.isArray(os) ? os.length : 0} OS(s)`);
      console.log(`%c✅ LocalStorage: ${Array.isArray(os) ? os.length : 0} OS(s)`, 'color: #16a34a;');
    } else {
      results.warnings.push('⚠️ LocalStorage vazio (nenhuma OS criada ainda)');
      console.warn('%c⚠️ LocalStorage vazio', 'color: #ea580c;');
    }
  } catch (error) {
    results.failed.push(`❌ Erro ao ler localStorage: ${error.message}`);
    console.error('%c❌ Erro localStorage:', 'color: #dc2626;', error);
  }

  // Testar Firestore
  if (window.firebase?.firestore) {
    results.passed.push('✅ Firestore inicializado');
    console.log('%c✅ Firestore OK', 'color: #16a34a;');
  } else {
    results.warnings.push('⚠️ Firestore não inicializado');
    console.warn('%c⚠️ Firestore offline', 'color: #ea580c;');
  }

  await sleep(500);

  // ========================================
  // RELATÓRIO FINAL
  // ========================================

  console.log('\n');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  console.log('%c📊 RELATÓRIO FINAL DOS TESTES', 'background: #0f172a; color: white; padding: 10px; font-size: 18px; font-weight: bold;');
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  console.log('');

  // Estatísticas
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passRate = total > 0 ? ((results.passed.length / total) * 100).toFixed(1) : 0;

  console.log(`%c✅ PASSOU: ${results.passed.length}`, 'color: #16a34a; font-size: 14px; font-weight: bold;');
  console.log(`%c❌ FALHOU: ${results.failed.length}`, 'color: #dc2626; font-size: 14px; font-weight: bold;');
  console.log(`%c⚠️  AVISOS: ${results.warnings.length}`, 'color: #ea580c; font-size: 14px; font-weight: bold;');
  console.log(`%c📈 TAXA DE SUCESSO: ${passRate}%`, 'color: #2563eb; font-size: 14px; font-weight: bold;');
  console.log('');

  // Detalhes dos testes que passaram
  if (results.passed.length > 0) {
    console.log('%c✅ TESTES QUE PASSARAM:', 'color: #16a34a; font-weight: bold; font-size: 12px;');
    results.passed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  // Detalhes dos testes que falharam
  if (results.failed.length > 0) {
    console.log('%c❌ TESTES QUE FALHARAM:', 'color: #dc2626; font-weight: bold; font-size: 12px;');
    results.failed.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  // Avisos
  if (results.warnings.length > 0) {
    console.log('%c⚠️  AVISOS:', 'color: #ea580c; font-weight: bold; font-size: 12px;');
    results.warnings.forEach(msg => console.log(`   ${msg}`));
    console.log('');
  }

  // Veredito final
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  if (results.failed.length === 0) {
    console.log('%c🎉 TODOS OS BUGFIXES FORAM APLICADOS COM SUCESSO!', 'background: #16a34a; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
  } else if (results.failed.length <= 2) {
    console.log('%c⚠️  BUGFIXES APLICADOS COM PEQUENOS PROBLEMAS', 'background: #ea580c; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    console.log('%cRevisão recomendada nos itens que falharam', 'color: #ea580c; font-style: italic;');
  } else {
    console.log('%c❌ BUGFIXES NÃO FORAM APLICADOS CORRETAMENTE', 'background: #dc2626; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
    console.log('%cVerifique se o PR foi mergeado e a página foi recarregada', 'color: #dc2626; font-style: italic;');
  }
  console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #666;');
  console.log('');

  // Sugestões
  console.log('%c💡 PRÓXIMOS PASSOS:', 'color: #2563eb; font-weight: bold;');
  if (results.failed.length > 0) {
    console.log('   1. Revise os itens que falharam acima');
    console.log('   2. Verifique se o PR foi mergeado: https://github.com/Maralmhz/dev/pulls');
    console.log('   3. Faça hard refresh (Ctrl+Shift+R) para limpar cache');
    console.log('   4. Execute este teste novamente');
  } else {
    console.log('   1. ✅ Faça testes manuais para confirmar funcionalidades');
    console.log('   2. ✅ Teste criação de OS completa');
    console.log('   3. ✅ Teste edição de veículos na oficina');
    console.log('   4. ✅ Teste salvamento do financeiro');
    console.log('   5. ✅ Documente quaisquer novos bugs encontrados');
  }
  console.log('');

  // Retornar resultados
  return {
    summary: {
      total,
      passed: results.passed.length,
      failed: results.failed.length,
      warnings: results.warnings.length,
      passRate: `${passRate}%`
    },
    details: results
  };
})();
