// gestao_oficina_oficinaid.js - Gerador automático de oficinaId
// ==============================================================

(function() {
  'use strict';
  
  if (window.__OficinaIdGeneratorLoaded) return;
  window.__OficinaIdGeneratorLoaded = true;
  
  console.log('🆔 Módulo OficinaId Generator carregado');
  
  const OficinaIdGenerator = {
    
    // Gera oficinaId baseado no nome da oficina
    gerarOficinaId: function(nomeOficina) {
      // Remove acentos e caracteres especiais
      const normalizado = nomeOficina
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 30);
      
      // Adiciona timestamp curto para evitar colisões
      const timestamp = Date.now().toString(36).substring(-6);
      const oficinaId = `${normalizado}-${timestamp}`;
      
      console.log('🆔 oficinaId gerado:', oficinaId);
      return oficinaId;
    },
    
    // Verifica se oficinaId já existe
    verificarDuplicidade: async function(oficinaId) {
      try {
        const db = firebase.firestore();
        const doc = await db.collection('oficinas').doc(oficinaId).get();
        return doc.exists;
      } catch (error) {
        console.error('❌ Erro ao verificar duplicidade:', error);
        return false;
      }
    },
    
    // Cria oficinaId para novo usuário
    criarOficinaId: async function(nomeOficina, emailUsuario) {
      try {
        let oficinaId = this.gerarOficinaId(nomeOficina);
        
        // Verifica duplicidade
        let tentativas = 0;
        while (await this.verificarDuplicidade(oficinaId) && tentativas < 5) {
          console.warn('⚠️ oficinaId duplicado, gerando novo...');
          const random = Math.random().toString(36).substring(2, 6);
          oficinaId = `${oficinaId.split('-')[0]}-${random}`;
          tentativas++;
        }
        
        if (tentativas >= 5) {
          throw new Error('Não foi possível gerar oficinaId único após 5 tentativas');
        }
        
        // Cria documento no Firestore
        const db = firebase.firestore();
        await db.collection('oficinas').doc(oficinaId).set({
          oficinaId: oficinaId,
          nome: nomeOficina,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
          criadoPor: emailUsuario,
          plano: 'free',
          usuariosAtivos: 1,
          limiteUsuarios: 2
        });
        
        // Adiciona usuário criador
        await db.collection('oficinas').doc(oficinaId).collection('usuarios').doc(emailUsuario).set({
          email: emailUsuario,
          role: 'admin',
          adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Log de auditoria
        await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
          acao: 'oficina_criada',
          usuario: emailUsuario,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          dados: { nomeOficina, oficinaId }
        });
        
        // Salva em sessionStorage
        sessionStorage.setItem('oficinaId', oficinaId);
        window.OFICINA_CONFIG.oficinaId = oficinaId;
        
        console.log('✅ OficinaId criado com sucesso:', oficinaId);
        return oficinaId;
        
      } catch (error) {
        console.error('❌ Erro ao criar oficinaId:', error);
        throw error;
      }
    },
    
    // Prompt para criação de oficinaId
    promptCriarOficina: async function() {
      const nomeOficina = prompt('📝 Digite o nome da sua oficina:', 'Minha Oficina');
      
      if (!nomeOficina || nomeOficina.trim() === '') {
        alert('❌ Nome da oficina é obrigatório');
        return null;
      }
      
      try {
        const emailUsuario = firebase.auth().currentUser?.email;
        if (!emailUsuario) {
          alert('❌ Usuário não autenticado');
          return null;
        }
        
        const oficinaId = await this.criarOficinaId(nomeOficina.trim(), emailUsuario);
        alert(`✅ Oficina criada com sucesso!\n\nID: ${oficinaId}`);
        
        // Recarrega a página para aplicar novo oficinaId
        window.location.reload();
        
        return oficinaId;
      } catch (error) {
        alert('❌ Erro ao criar oficina: ' + error.message);
        return null;
      }
    },
    
    // Verifica se usuário já tem oficinaId
    verificarOficinaUsuario: async function(emailUsuario) {
      try {
        const db = firebase.firestore();
        const snapshot = await db.collection('oficinas')
          .where('criadoPor', '==', emailUsuario)
          .limit(1)
          .get();
        
        if (!snapshot.empty) {
          const oficinaId = snapshot.docs[0].id;
          console.log('✅ OficinaId encontrado para usuário:', oficinaId);
          return oficinaId;
        }
        
        return null;
      } catch (error) {
        console.error('❌ Erro ao verificar oficina do usuário:', error);
        return null;
      }
    }
  };
  
  // Expõe globalmente
  window.OficinaIdGenerator = OficinaIdGenerator;
  
  // Auto-verifica oficinaId ao carregar
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user && !sessionStorage.getItem('oficinaId')) {
      console.log('🔍 Verificando oficinaId para usuário:', user.email);
      const oficinaId = await OficinaIdGenerator.verificarOficinaUsuario(user.email);
      
      if (oficinaId) {
        sessionStorage.setItem('oficinaId', oficinaId);
        window.OFICINA_CONFIG.oficinaId = oficinaId;
        console.log('✅ OficinaId carregado automaticamente:', oficinaId);
      } else {
        console.warn('⚠️ Usuário sem oficinaId, solicitando criação...');
        // Aguarda 2 segundos e pergunta ao usuário
        setTimeout(() => {
          if (confirm('📋 Você ainda não tem uma oficina configurada. Deseja criar agora?')) {
            OficinaIdGenerator.promptCriarOficina();
          }
        }, 2000);
      }
    }
  });
  
  console.log('✅ OficinaIdGenerator exposto globalmente');
})();