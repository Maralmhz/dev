// gestao_oficina_plano.js - Sistema de Planos Pagos
// ==================================================

(function() {
  'use strict';
  
  if (window.__PlanoManagerLoaded) return;
  window.__PlanoManagerLoaded = true;
  
  console.log('💎 Módulo Plano Manager carregado');
  
  const PlanoManager = {
    
    planos: {
      starter: {
        nome: 'Starter',
        limiteUsuarios: 2,
        badge: '🚀',
        cor: '#3498db',
        recursos: ['Gestão de OS', 'Kanban', 'Dashboard Básico']
      },
      professional: {
        nome: 'Professional',
        limiteUsuarios: 4,
        badge: '🔥',
        cor: '#e67e22',
        recursos: ['Todos recursos Starter', 'Relatórios Avançados', 'Suporte Prioritário']
      },
      enterprise: {
        nome: 'Enterprise',
        limiteUsuarios: 6,
        badge: '🏢',
        cor: '#27ae60',
        recursos: ['Todos recursos Professional', 'White-label Completo', 'API Access', 'Suporte 24/7']
      }
    },
    
    async atualizarPlano(planName) {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) {
          console.error('❌ oficinaId não disponível');
          return false;
        }
        
        const plano = planName.toLowerCase();
        if (!this.planos[plano]) {
          console.error('❌ Plano inválido:', planName);
          return false;
        }
        
        const db = firebase.firestore();
        await db.collection('oficinas').doc(oficinaId).set({
          plano: plano,
          planoNome: this.planos[plano].nome,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
          acao: 'plano_atualizado',
          usuario: firebase.auth().currentUser?.email,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          dados: { planoNovo: plano }
        });
        
        console.log(`✅ Plano atualizado para: ${this.planos[plano].nome}`);
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao atualizar plano:', error);
        return false;
      }
    },
    
    async verificarLimiteUsuarios() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) return { permitido: true, plano: 'starter', usuariosAtivos: 0, limiteUsuarios: 2 };
        
        const db = firebase.firestore();
        const docOficina = await db.collection('oficinas').doc(oficinaId).get();
        
        if (!docOficina.exists) {
          return { permitido: true, plano: 'starter', usuariosAtivos: 0, limiteUsuarios: 2 };
        }
        
        const dados = docOficina.data();
        const plano = dados.plano || 'starter';
        const usuariosAtivos = dados.usuariosAtivos || 0;
        const limiteUsuarios = this.planos[plano].limiteUsuarios;
        
        return {
          permitido: usuariosAtivos < limiteUsuarios,
          usuariosAtivos,
          limiteUsuarios,
          plano,
          badge: this.planos[plano].badge,
          cor: this.planos[plano].cor,
          nome: this.planos[plano].nome
        };
      } catch (error) {
        console.error('❌ Erro ao verificar limite:', error);
        return { permitido: true, plano: 'starter', usuariosAtivos: 0, limiteUsuarios: 2 };
      }
    },
    
    async adicionarUsuario(emailUsuario) {
      try {
        const verificacao = await this.verificarLimiteUsuarios();
        
        if (!verificacao.permitido) {
          alert(`❌ Limite de usuários atingido!\n\n` +
                `Plano atual: ${verificacao.badge} ${verificacao.nome}\n` +
                `Usuários: ${verificacao.usuariosAtivos}/${verificacao.limiteUsuarios}\n\n` +
                `📢 Faça upgrade do seu plano para adicionar mais usuários!`);
          return false;
        }
        
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        const db = firebase.firestore();
        
        await db.collection('oficinas').doc(oficinaId).collection('usuarios').doc(emailUsuario).set({
          email: emailUsuario,
          role: 'user',
          adicionadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          adicionadoPor: firebase.auth().currentUser?.email
        });
        
        await db.collection('oficinas').doc(oficinaId).update({
          usuariosAtivos: firebase.firestore.FieldValue.increment(1)
        });
        
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
    
    async mostrarInfoPlano() {
      const verificacao = await this.verificarLimiteUsuarios();
      const info = this.planos[verificacao.plano];
      
      alert(
        `${info.badge} PLANO ${info.nome.toUpperCase()}\n\n` +
        `👥 Usuários: ${verificacao.usuariosAtivos}/${verificacao.limiteUsuarios}\n\n` +
        `✨ Recursos inclusos:\n` +
        info.recursos.map(r => `  • ${r}`).join('\n') +
        `\n\n` +
        `📧 Contato: contato@oficina.com`
      );
    },
    
    async adicionarBadgePlano() {
      const verificacao = await this.verificarLimiteUsuarios();
      const badge = document.querySelector('.header-badge');
      
      if (badge) {
        badge.textContent = `${verificacao.badge} ${verificacao.nome} (${verificacao.usuariosAtivos}/${verificacao.limiteUsuarios})`;
        badge.style.background = verificacao.cor;
        badge.style.cursor = 'pointer';
        badge.onclick = () => this.mostrarInfoPlano();
      }
    }
  };
  
  window.PlanoManager = PlanoManager;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
    });
  } else {
    setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
  }
  
  console.log('✅ PlanoManager exposto globalmente');
})();