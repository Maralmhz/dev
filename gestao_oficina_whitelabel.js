// gestao_oficina_whitelabel.js - White-label básico para teste
// ============================================================

(function() {
  'use strict';
  
  if (window.__WhiteLabelLoaded) return;
  window.__WhiteLabelLoaded = true;
  
  console.log('🎨 Módulo White-Label carregado');
  
  const WhiteLabelManager = {
    
    // Abre modal de configuração do white-label
    abrirConfiguracao: function() {
      console.log('🎨 Abrindo configuração white-label');
      
      const modal = this.criarModal();
      document.body.appendChild(modal);
      
      // Carrega dados atuais
      this.carregarDadosAtuais();
    },
    
    // Cria o modal HTML
    criarModal: function() {
      const modal = document.createElement('div');
      modal.id = 'modal-whitelabel';
      modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
          <div style="background: white; border-radius: 12px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
            <h2 style="margin-top: 0; color: #333;">🎨 Personalização da Oficina</h2>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Logo da Oficina</label>
              <input type="file" id="wl-logo" accept="image/*" style="margin-bottom: 10px;">
              <div id="wl-logo-preview" style="margin-top: 10px;"></div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Nome da Oficina</label>
              <input type="text" id="wl-nome" placeholder="Nome da sua oficina" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Endereço Completo</label>
              <textarea id="wl-endereco" placeholder="Rua, número, bairro, cidade - UF" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; min-height: 60px;"></textarea>
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">CNPJ</label>
              <input type="text" id="wl-cnpj" placeholder="00.000.000/0000-00" maxlength="18" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-weight: bold; margin-bottom: 5px;">Telefone / WhatsApp</label>
              <input type="text" id="wl-telefone" placeholder="(31) 99999-9999" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 25px;">
              <button onclick="window.WhiteLabelManager.salvar()" style="flex: 1; padding: 12px; background: #27ae60; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">💾 Salvar</button>
              <button onclick="window.WhiteLabelManager.fecharModal()" style="flex: 1; padding: 12px; background: #e74c3c; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer;">❌ Cancelar</button>
            </div>
          </div>
        </div>
      `;
      return modal;
    },
    
    // Carrega dados atuais do Firestore
    carregarDadosAtuais: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) {
          console.error('❌ oficinaId não disponível');
          return;
        }
        
        const db = firebase.firestore();
        const doc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (doc.exists) {
          const dados = doc.data();
          document.getElementById('wl-nome').value = dados.nome || '';
          document.getElementById('wl-endereco').value = dados.endereco || '';
          document.getElementById('wl-cnpj').value = dados.cnpj || '';
          document.getElementById('wl-telefone').value = dados.telefone || '';
          
          if (dados.logoUrl) {
            document.getElementById('wl-logo-preview').innerHTML = `
              <img src="${dados.logoUrl}" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 6px;">
            `;
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      }
    },
    
    // Salva configurações no Firestore
    salvar: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) {
          alert('❌ oficinaId não disponível');
          return;
        }
        
        const nome = document.getElementById('wl-nome').value.trim();
        const endereco = document.getElementById('wl-endereco').value.trim();
        const cnpj = document.getElementById('wl-cnpj').value.trim();
        const telefone = document.getElementById('wl-telefone').value.trim();
        
        if (!nome) {
          alert('⚠️ Nome da oficina é obrigatório');
          return;
        }
        
        const db = firebase.firestore();
        const dados = {
          nome,
          endereco,
          cnpj,
          telefone,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedBy: firebase.auth().currentUser?.email || 'desconhecido'
        };
        
        // Upload de logo (se houver)
        const logoFile = document.getElementById('wl-logo').files[0];
        if (logoFile) {
          // Para teste, vamos usar base64 (em produção, usar Firebase Storage)
          const reader = new FileReader();
          reader.onload = async function(e) {
            dados.logoBase64 = e.target.result;
            await db.collection('oficinas').doc(oficinaId).set(dados, { merge: true });
            
            // Log de auditoria
            await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
              acao: 'whitelabel_update',
              usuario: firebase.auth().currentUser?.email,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              dados: { nome, endereco, cnpj, telefone, logoAtualizado: true }
            });
            
            alert('✅ Configurações salvas com sucesso!');
            window.WhiteLabelManager.fecharModal();
            window.WhiteLabelManager.aplicarConfiguracoes();
          };
          reader.readAsDataURL(logoFile);
        } else {
          await db.collection('oficinas').doc(oficinaId).set(dados, { merge: true });
          
          // Log de auditoria
          await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
            acao: 'whitelabel_update',
            usuario: firebase.auth().currentUser?.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            dados: { nome, endereco, cnpj, telefone }
          });
          
          alert('✅ Configurações salvas com sucesso!');
          this.fecharModal();
          this.aplicarConfiguracoes();
        }
        
      } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('❌ Erro ao salvar configurações: ' + error.message);
      }
    },
    
    // Aplica configurações na interface
    aplicarConfiguracoes: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) return;
        
        const db = firebase.firestore();
        const doc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (doc.exists) {
          const dados = doc.data();
          
          // Atualiza elementos na página
          if (dados.nome) {
            const nomeEl = document.getElementById('nome-oficina');
            if (nomeEl) nomeEl.textContent = dados.nome;
          }
          
          if (dados.endereco) {
            const enderecoEl = document.getElementById('endereco-oficina');
            if (enderecoEl) enderecoEl.textContent = dados.endereco;
          }
          
          if (dados.cnpj) {
            const cnpjEl = document.getElementById('cnpj-oficina');
            if (cnpjEl) cnpjEl.textContent = 'CNPJ: ' + dados.cnpj;
          }
          
          if (dados.telefone) {
            const telefoneEl = document.getElementById('telefone-oficina');
            if (telefoneEl) telefoneEl.textContent = dados.telefone;
          }
          
          if (dados.logoBase64) {
            const logoEl = document.getElementById('logo-oficina');
            if (logoEl) logoEl.src = dados.logoBase64;
          }
          
          console.log('✅ Configurações aplicadas na interface');
        }
      } catch (error) {
        console.error('❌ Erro ao aplicar configurações:', error);
      }
    },
    
    // Fecha modal
    fecharModal: function() {
      const modal = document.getElementById('modal-whitelabel');
      if (modal) modal.remove();
    }
  };
  
  // Expõe globalmente
  window.WhiteLabelManager = WhiteLabelManager;
  
  // Auto-aplica configurações ao carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => WhiteLabelManager.aplicarConfiguracoes(), 1000);
    });
  } else {
    setTimeout(() => WhiteLabelManager.aplicarConfiguracoes(), 1000);
  }
  
  console.log('✅ WhiteLabelManager exposto globalmente');
})();