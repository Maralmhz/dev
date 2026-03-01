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
  
  // SuperAdmin - Criação de usuários apenas por superadmin
  const SuperAdmin = {
    isSuperAdmin: async function() {
      try {
        const user = firebase.auth().currentUser;
        if (!user) return false;
        
        const db = firebase.firestore();
        const doc = await db.collection('superadmins').doc(user.email).get();
        
        return doc.exists;
      } catch (error) {
        console.error('❌ Erro verificando superadmin:', error);
        return false;
      }
    },
    
    async criarUsuario(email, nome, sobrenome, plano) {
      try {
        const ehSuperAdmin = await this.isSuperAdmin();
        if (!ehSuperAdmin) {
          alert('❌ Apenas superadmin pode criar usuários!');
          return false;
        }
        
        const planosValidos = ['starter', 'professional', 'enterprise'];
        if (!planosValidos.includes(plano)) {
          alert('❌ Plano inválido! Use: starter, professional ou enterprise');
          return false;
        }
        
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, 'Senha123@Inicial');
        const uid = userCredential.user.uid;
        const oficinaId = `oficina_${uid.slice(0, 20)}`;
        
        const db = firebase.firestore();
        await db.collection('oficinas').doc(oficinaId).set({
          plano: plano,
          planoNome: window.PlanoManager.planos[plano].nome,
          usuariosAtivos: 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdBy: firebase.auth().currentUser.email
        });
        
        await db.collection('oficinas').doc(oficinaId).collection('usuarios').doc(email).set({
          uid: uid,
          email: email,
          nome: nome,
          sobrenome: sobrenome,
          role: 'owner',
          plano: plano,
          oficinaId: oficinaId,
          adicionadoPor: firebase.auth().currentUser.email,
          adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        await db.collection('superadmin_logs').add({
          acao: 'usuario_criado_superadmin',
          superadmin: firebase.auth().currentUser.email,
          usuarioCriado: email,
          nomeCompleto: `${nome} ${sobrenome}`,
          planoDefinido: plano,
          oficinaId: oficinaId,
          uid: uid,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`✅ Usuário criado: ${email}`);
        console.log(`📋 OFICINA ID: ${oficinaId}`);
        console.log(`🔑 UID: ${uid}`);
        console.log(`🔐 Senha inicial: Senha123@Inicial`);
        console.log(`📈 Plano: ${window.PlanoManager.planos[plano].nome}`);
        
        alert(`✅ Usuário criado com sucesso!\n\nEmail: ${email}\nPlano: ${window.PlanoManager.planos[plano].nome}\nOficina ID: ${oficinaId}\n\nSenha inicial: Senha123@Inicial\n\nInstrua o usuário a alterar a senha no primeiro login.`);
        
        if (window.sidebarMenu) window.sidebarMenu.updatePlanBadge();
        if (window.PlanoManager) await window.PlanoManager.adicionarBadgePlano();
        
        return true;
        
      } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        
        if (error.code === 'auth/email-already-in-use') {
          alert('❌ Email já está em uso!');
        } else if (error.code === 'auth/weak-password') {
          alert('❌ Senha muito fraca!');
        } else {
          alert(`❌ Erro: ${error.message}`);
        }
        
        return false;
      }
    },
    
    abrirPainelCriacao: function() {
      SuperAdmin.isSuperAdmin().then(ehSuperAdmin => {
        if (!ehSuperAdmin) {
          alert('❌ Acesso negado! Apenas superadmin.');
          return;
        }
        
        const modal = document.createElement('div');
        modal.id = 'modal-superadmin-criacao';
        modal.style.cssText = `
          position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
          background: rgba(0,0,0,0.8); z-index: 99999; display: flex; 
          align-items: center; justify-content: center; padding: 20px;
        `;
        
        modal.innerHTML = `
          <div style="background: white; border-radius: 15px; padding: 30px; max-width: 500px; width: 100%; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-top: 0; color: #333;">👑 Criar Novo Usuário</h2>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nome *</label>
              <input type="text" id="superadmin-nome" placeholder="Nome completo" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Email *</label>
              <input type="email" id="superadmin-email" placeholder="usuario@oficina.com" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
            </div>
            
            <div style="margin-bottom: 15px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Plano *</label>
              <select id="superadmin-plano" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
                <option value="">Selecione o plano</option>
                <option value="starter">🚀 Starter (2 usuários)</option>
                <option value="professional">🔥 Professional (4 usuários)</option>
                <option value="enterprise">🏢 Enterprise (6 usuários)</option>
              </select>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
              <button onclick="SuperAdmin.confirmarCriacao()" style="
                flex: 1; padding: 15px; background: linear-gradient(135deg, #27ae60, #2ecc71); 
                color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;
              ">✅ Criar Usuário</button>
              <button onclick="SuperAdmin.fecharModalCriacao()" style="
                flex: 1; padding: 15px; background: #e74c3c; 
                color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 16px; cursor: pointer;
              ">❌ Cancelar</button>
            </div>
            
            <div id="superadmin-resultado" style="margin-top: 15px; padding: 10px; border-radius: 6px; display: none;"></div>
          </div>
        `;
        
        document.body.appendChild(modal);
      });
    },
    
    confirmarCriacao: async function() {
      const nome = document.getElementById('superadmin-nome').value.trim();
      const email = document.getElementById('superadmin-email').value.trim();
      const plano = document.getElementById('superadmin-plano').value;
      
      if (!nome || !email || !plano) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
      }
      
      const resultadoEl = document.getElementById('superadmin-resultado');
      resultadoEl.style.display = 'block';
      resultadoEl.innerHTML = '⏳ Criando usuário...';
      resultadoEl.style.background = '#3498db';
      resultadoEl.style.color = 'white';
      
      const sucesso = await SuperAdmin.criarUsuario(email, nome, 'Sobrenome', plano);
      
      if (sucesso) {
        resultadoEl.innerHTML = '✅ Usuário criado com sucesso!';
        resultadoEl.style.background = '#27ae60';
        setTimeout(() => SuperAdmin.fecharModalCriacao(), 2000);
      } else {
        resultadoEl.innerHTML = '❌ Erro ao criar usuário. Verifique o console.';
        resultadoEl.style.background = '#e74c3c';
      }
    },
    
    fecharModalCriacao: function() {
      const modal = document.getElementById('modal-superadmin-criacao');
      if (modal) modal.remove();
    }
  };
  
  window.SuperAdmin = SuperAdmin;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
    });
  } else {
    setTimeout(() => PlanoManager.adicionarBadgePlano(), 1500);
  }
  
  console.log('✅ PlanoManager exposto globalmente');
  console.log('✅ SuperAdmin exposto globalmente');
})();