// gestao_oficina_plano.js - Simulação de Plano Premium
// ======================================================

(function() {
  'use strict';
  
  if (window.__PlanoManagerLoaded) return;
  window.__PlanoManagerLoaded = true;
  
  console.log('💎 Módulo Plano Manager carregado');
  
  const PlanoManager = {
    
    // Configurações de planos
    planos: {
      free: {
        nome: 'Gratuito',
        limiteUsuarios: 2,
        recursos: ['Gestão de OS', 'Kanban', 'Dashboard Básico']
      },
      premium: {
        nome: 'Premium',
        limiteUsuarios: 999,
        recursos: ['Todos os recursos', 'Usuários ilimitados', 'Suporte prioritário']
      }
    },
    
    // Verifica limite de usuários
    verificarLimiteUsuarios: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) return { permitido: true };
        
        const db = firebase.firestore();
        const docOficina = await db.collection('oficinas').doc(oficinaId).get();
        
        if (!docOficina.exists) {
          return { permitido: true };
        }
        
        const dados = docOficina.data();
        const plano = dados.plano || 'free';
        const usuariosAtivos = dados.usuariosAtivos || 0;
        const limiteUsuarios = this.planos[plano].limiteUsuarios;
        
        return {
          permitido: usuariosAtivos < limiteUsuarios,
          usuariosAtivos,
          limiteUsuarios,
          plano
        };
      } catch (error) {
        console.error('❌ Erro ao verificar limite:', error);
        return { permitido: true };
      }
    },
    
    // Adiciona novo usuário (com verificação de limite)
    adicionarUsuario: async function(emailUsuario) {
      try {
        const verificacao = await this.verificarLimiteUsuarios();
        
        if (!verificacao.permitido) {
          alert(`❌ Limite de usuários atingido!\n\n` +
                `Plano atual: ${verificacao.plano.toUpperCase()}\n` +
                `Usuários ativos: ${verificacao.usuariosAtivos}/${verificacao.limiteUsuarios}\n\n` +
                `📢 Atualize para o plano PREMIUM para adicionar mais usuários!`);
          return false;
        }
        
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        const db = firebase.firestore();
        
        // Adiciona usuário
        await db.collection('oficinas').doc(oficinaId).collection('usuarios').doc(emailUsuario).set({
          email: emailUsuario,
          role: 'user',
          adicionadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          adicionadoPor: firebase.auth().currentUser?.email
        });
        
        // Incrementa contador
        await db.collection('oficinas').doc(oficinaId).update({
          usuariosAtivos: firebase.firestore.FieldValue.increment(1)
        });
        
        // Log de auditoria
        await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
          acao: 'usuario_adicionado',
          usuario: firebase.auth().currentUser?.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          dados: { usuarioAdicionado: emailUsuario }
        });
        
        console.log('✅ Usuário adicionado:', emailUsuario);
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao adicionar usuário:', error);
        alert('❌ Erro ao adicionar usuário: ' + error.message);
        return false;
      }
    },
    
    // Mostra informações do plano
    mostrarInfoPlano: async function() {
      const verificacao = await this.verificarLimiteUsuarios();
      const info = this.planos[verificacao.plano || 'free'];
      
      alert(
        `💎 PLANO ATUAL: ${info.nome.toUpperCase()}\n\n` +
        `👥 Usuários: ${verificacao.usuariosAtivos || 0}/${verificacao.limiteUsuarios}\n\n` +
        `✨ Recursos inclusos:\n` +
        info.recursos.map(r => `  • ${r}`).join('\n') +
        `\n\n` +
        (verificacao.plano === 'free' ? 
          `📢 Atualize para PREMIUM e tenha usuários ilimitados!` : 
          `✅ Você tem acesso a todos os recursos!`)
      );
    },
    
    // Prompt de upgrade para Premium
    promptUpgrade: function() {
      if (confirm(
        '💎 UPGRADE PARA PREMIUM\n\n' +
        '✅ Usuários ilimitados\n' +
        '✅ Todos os recursos\n' +
        '✅ Suporte prioritário\n\n' +
        'Deseja saber mais?'
      )) {
        alert('📧 Entre em contato pelo email: contato@oficina.com');
      }
    },
    
    // Adiciona badge do plano no header
    adicionarBadgePlano: async function() {
      const verificacao = await this.verificarLimiteUsuarios();
      const badge = document.querySelector('.header-badge');
      
      if (badge) {
        const planoNome = verificacao.plano === 'premium' ? '💎 PREMIUM' : '🆓 FREE';
        badge.textContent = planoNome;
        badge.style.cursor = 'pointer';
        badge.onclick = () => this.mostrarInfoPlano();
      }
    }
  };
  
  // Expõe globalmente
  window.PlanoManager = PlanoManager;
  
  // Auto-adiciona badge ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
    });
  } else {
    setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
  }
  
  console.log('✅ PlanoManager exposto globalmente');
})();