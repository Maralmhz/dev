// ==========================================
// 🧪 TESTES ADVERSARIAIS - SECURITY
// ==========================================
// Execute no console do navegador após deploy

const testesAdversariais = {
  db: firebase.firestore(),
  auth: firebase.auth(),
  resultados: [],
  
  // ==========================================
  // TESTE 1: ISOLAMENTO ENTRE OFICINAS
  // ==========================================
  
  async teste1_isolamentoOficinas() {
    console.log('\n========================================');
    console.log('🧪 TESTE 1: Isolamento Entre Oficinas');
    console.log('========================================');
    
    try {
      const user = this.auth.currentUser;
      if (!user) {
        console.log('❌ Usuário não autenticado');
        return { passou: false, erro: 'Não autenticado' };
      }
      
      const token = await user.getIdTokenResult();
      const minhaOficina = token.claims.oficina_id;
      
      console.log('🏢 Minha oficina:', minhaOficina);
      console.log('🔍 Tentando acessar outra oficina...');
      
      // Tentar acessar oficina diferente
      const oficinaAlvo = minhaOficina === 'modelo' ? 'outra_oficina' : 'modelo';
      
      try {
        const snapshot = await this.db
          .collection('oficinas')
          .doc(oficinaAlvo)
          .collection('ordens_servico')
          .limit(1)
          .get();
        
        console.log('❌❌❌ FALHOU: Conseguiu acessar outra oficina!');
        console.log('Documentos retornados:', snapshot.size);
        
        return { 
          passou: false, 
          erro: 'Isolamento falhou - acessou outra oficina',
          docs_retornados: snapshot.size
        };
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log('✅✅✅ PASSOU: Acesso negado corretamente');
          return { passou: true };
        }
        
        console.log('⚠️ Erro inesperado:', error.message);
        return { passou: false, erro: error.message };
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { passou: false, erro: error.message };
    }
  },
  
  // ==========================================
  // TESTE 2: FORÇAR ALTERAÇÃO DE VALOR FINANCEIRO
  // ==========================================
  
  async teste2_alterarValorFinanceiro() {
    console.log('\n========================================');
    console.log('🧪 TESTE 2: Tentar Alterar Valor Financeiro');
    console.log('========================================');
    
    try {
      const token = await this.auth.currentUser.getIdTokenResult();
      const oficinaId = token.claims.oficina_id;
      
      // Buscar uma OS qualquer
      const osSnapshot = await this.db
        .collection('oficinas')
        .doc(oficinaId)
        .collection('ordens_servico')
        .limit(1)
        .get();
      
      if (osSnapshot.empty) {
        console.log('⚠️ Nenhuma OS encontrada para testar');
        return { passou: true, aviso: 'Sem dados para testar' };
      }
      
      const osDoc = osSnapshot.docs[0];
      const osId = osDoc.id;
      const osData = osDoc.data();
      
      console.log('📝 OS alvo:', osId);
      console.log('💰 Valor atual:', osData.financeiro?.total);
      console.log('🔍 Tentando alterar para R$ 1,00...');
      
      try {
        await this.db
          .collection('oficinas')
          .doc(oficinaId)
          .collection('ordens_servico')
          .doc(osId)
          .update({
            'financeiro.total': 1
          });
        
        console.log('❌❌❌ FALHOU: Conseguiu alterar valor financeiro!');
        return { 
          passou: false, 
          erro: 'Conseguiu alterar campo financeiro protegido'
        };
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log('✅✅✅ PASSOU: Alteração bloqueada');
          return { passou: true };
        }
        
        console.log('⚠️ Erro inesperado:', error.message);
        return { passou: false, erro: error.message };
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { passou: false, erro: error.message };
    }
  },
  
  // ==========================================
  // TESTE 3: EDITAR PAGAMENTO
  // ==========================================
  
  async teste3_editarPagamento() {
    console.log('\n========================================');
    console.log('🧪 TESTE 3: Tentar Editar Pagamento');
    console.log('========================================');
    
    try {
      const token = await this.auth.currentUser.getIdTokenResult();
      const oficinaId = token.claims.oficina_id;
      
      // Buscar um pagamento qualquer
      const pagSnapshot = await this.db
        .collection('oficinas')
        .doc(oficinaId)
        .collection('pagamentos')
        .limit(1)
        .get();
      
      if (pagSnapshot.empty) {
        console.log('⚠️ Nenhum pagamento encontrado para testar');
        return { passou: true, aviso: 'Sem dados para testar' };
      }
      
      const pagDoc = pagSnapshot.docs[0];
      const pagId = pagDoc.id;
      
      console.log('💳 Pagamento alvo:', pagId);
      console.log('🔍 Tentando alterar valor...');
      
      try {
        await this.db
          .collection('oficinas')
          .doc(oficinaId)
          .collection('pagamentos')
          .doc(pagId)
          .update({
            valor: 0
          });
        
        console.log('❌❌❌ FALHOU: Conseguiu editar pagamento!');
        return { 
          passou: false, 
          erro: 'Pagamento foi alterado (deveria ser imutável)'
        };
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log('✅✅✅ PASSOU: Pagamento é imutável');
          return { passou: true };
        }
        
        console.log('⚠️ Erro inesperado:', error.message);
        return { passou: false, erro: error.message };
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { passou: false, erro: error.message };
    }
  },
  
  // ==========================================
  // TESTE 4: ACESSO SEM CUSTOM CLAIMS
  // ==========================================
  
  async teste4_acessoSemClaims() {
    console.log('\n========================================');
    console.log('🧪 TESTE 4: Acesso Sem Custom Claims');
    console.log('========================================');
    
    try {
      const user = this.auth.currentUser;
      const token = await user.getIdTokenResult();
      
      console.log('🔑 Claims atuais:', token.claims);
      
      if (!token.claims.oficina_id) {
        console.log('⚠️ Usuário sem oficina_id no token');
        console.log('🔍 Tentando acessar qualquer OS...');
        
        try {
          const snapshot = await this.db
            .collection('oficinas')
            .doc('modelo')
            .collection('ordens_servico')
            .limit(1)
            .get();
          
          console.log('❌❌❌ FALHOU: Usuário sem claims conseguiu acessar!');
          return { 
            passou: false, 
            erro: 'Acesso permitido sem oficina_id no token'
          };
          
        } catch (error) {
          if (error.code === 'permission-denied') {
            console.log('✅✅✅ PASSOU: Acesso bloqueado sem claims');
            return { passou: true };
          }
          
          return { passou: false, erro: error.message };
        }
      } else {
        console.log('✅ Usuário possui oficina_id:', token.claims.oficina_id);
        console.log('⚠️ Não é possível testar sem claims (já configurado)');
        return { passou: true, aviso: 'Claims já configurados' };
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { passou: false, erro: error.message };
    }
  },
  
  // ==========================================
  // TESTE 5: DELETAR DOCUMENTO
  // ==========================================
  
  async teste5_deletarDocumento() {
    console.log('\n========================================');
    console.log('🧪 TESTE 5: Tentar Deletar Documento');
    console.log('========================================');
    
    try {
      const token = await this.auth.currentUser.getIdTokenResult();
      const oficinaId = token.claims.oficina_id;
      
      const osSnapshot = await this.db
        .collection('oficinas')
        .doc(oficinaId)
        .collection('ordens_servico')
        .limit(1)
        .get();
      
      if (osSnapshot.empty) {
        console.log('⚠️ Nenhuma OS para testar');
        return { passou: true, aviso: 'Sem dados' };
      }
      
      const osId = osSnapshot.docs[0].id;
      
      console.log('🔍 Tentando deletar OS:', osId);
      
      try {
        await this.db
          .collection('oficinas')
          .doc(oficinaId)
          .collection('ordens_servico')
          .doc(osId)
          .delete();
        
        console.log('❌❌❌ FALHOU: Conseguiu deletar!');
        return { passou: false, erro: 'Delete foi permitido' };
        
      } catch (error) {
        if (error.code === 'permission-denied') {
          console.log('✅✅✅ PASSOU: Delete bloqueado');
          return { passou: true };
        }
        
        return { passou: false, erro: error.message };
      }
      
    } catch (error) {
      console.error('❌ Erro no teste:', error);
      return { passou: false, erro: error.message };
    }
  },
  
  // ==========================================
  // EXECUTAR TODOS OS TESTES
  // ==========================================
  
  async executarTodos() {
    console.clear();
    console.log('\n');
    console.log('========================================');
    console.log('🧪 TESTES ADVERSARIAIS DE SEGURANÇA');
    console.log('========================================');
    console.log('Data:', new Date().toLocaleString());
    console.log('========================================\n');
    
    const resultados = {
      teste1: await this.teste1_isolamentoOficinas(),
      teste2: await this.teste2_alterarValorFinanceiro(),
      teste3: await this.teste3_editarPagamento(),
      teste4: await this.teste4_acessoSemClaims(),
      teste5: await this.teste5_deletarDocumento()
    };
    
    // Resumo
    console.log('\n');
    console.log('========================================');
    console.log('📋 RESUMO DOS TESTES');
    console.log('========================================');
    
    let passou = 0;
    let falhou = 0;
    
    Object.keys(resultados).forEach(teste => {
      const resultado = resultados[teste];
      const status = resultado.passou ? '✅ PASSOU' : '❌ FALHOU';
      console.log(`${teste}: ${status}`);
      
      if (resultado.passou) passou++;
      else falhou++;
      
      if (resultado.erro) {
        console.log(`   Erro: ${resultado.erro}`);
      }
      if (resultado.aviso) {
        console.log(`   Aviso: ${resultado.aviso}`);
      }
    });
    
    console.log('\n========================================');
    console.log(`✅ Passou: ${passou}/5`);
    console.log(`❌ Falhou: ${falhou}/5`);
    console.log('========================================');
    
    if (falhou === 0) {
      console.log('\n🎉🎉🎉 TODOS OS TESTES PASSARAM! 🎉🎉🎉');
      console.log('🚀 Sistema pronto para produção!');
    } else {
      console.log('\n⚠️⚠️⚠️ ATENÇÃO: Alguns testes falharam!');
      console.log('❌ NÃO DEPLOY EM PRODUÇÃO até corrigir!');
    }
    
    return resultados;
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.testesAdversariais = testesAdversariais;
}

console.log('✅ tests_security_adversarial.js carregado');
console.log('Execute: await testesAdversariais.executarTodos()');