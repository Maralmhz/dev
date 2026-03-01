// gestao_oficina_whitelabel.js - White-label com Cores Customizáveis
// ===================================================================

(function() {
  'use strict';
  
  if (window.__WhiteLabelLoaded) return;
  window.__WhiteLabelLoaded = true;
  
  console.log('🎨 Módulo White-Label carregado');
  
  const WhiteLabelManager = {
    
    abrirConfiguracao: function() {
      console.log('🎨 Abrindo configuração white-label');
      
      const modal = this.criarModal();
      document.body.appendChild(modal);
      
      this.carregarDadosAtuais();
    },
    
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
            
            <h3 style="margin-top: 30px; margin-bottom: 15px; color: #333;">🎨 Cores Personalizadas</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div>
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cor Primária</label>
                <input type="color" id="wl-cor-primary" value="#3498db" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
              </div>
              <div>
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cor Secundária</label>
                <input type="color" id="wl-cor-secondary" value="#2ecc71" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
              </div>
              <div>
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cor de Fundo</label>
                <input type="color" id="wl-cor-background" value="#ecf0f1" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
              </div>
              <div>
                <label style="display: block; font-weight: bold; margin-bottom: 5px;">Cor de Destaque</label>
                <input type="color" id="wl-cor-highlight" value="#e74c3c" style="width: 100%; height: 40px; border: 1px solid #ddd; border-radius: 6px; cursor: pointer;">
              </div>
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
    
    carregarDadosAtuais: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) {
          console.error('❌ oficinaId não disponível');
          return;
        }
        
        const db = firebase.firestore();
        const docOficina = await db.collection('oficinas').doc(oficinaId).get();
        
        if (docOficina.exists) {
          const dados = docOficina.data();
          document.getElementById('wl-nome').value = dados.nome || '';
          document.getElementById('wl-endereco').value = dados.endereco || '';
          document.getElementById('wl-cnpj').value = dados.cnpj || '';
          document.getElementById('wl-telefone').value = dados.telefone || '';
          
          if (dados.logoBase64) {
            document.getElementById('wl-logo-preview').innerHTML = `
              <img src="${dados.logoBase64}" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 6px;">
            `;
          }
        }
        
        const docTema = await db.collection('oficinas').doc(oficinaId).collection('whitelabel').doc('tema').get();
        if (docTema.exists) {
          const tema = docTema.data();
          document.getElementById('wl-cor-primary').value = tema.primary || '#3498db';
          document.getElementById('wl-cor-secondary').value = tema.secondary || '#2ecc71';
          document.getElementById('wl-cor-background').value = tema.background || '#ecf0f1';
          document.getElementById('wl-cor-highlight').value = tema.highlight || '#e74c3c';
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      }
    },
    
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
        
        const primary = document.getElementById('wl-cor-primary').value;
        const secondary = document.getElementById('wl-cor-secondary').value;
        const background = document.getElementById('wl-cor-background').value;
        const highlight = document.getElementById('wl-cor-highlight').value;
        
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
        
        const logoFile = document.getElementById('wl-logo').files[0];
        if (logoFile) {
          const reader = new FileReader();
          reader.onload = async function(e) {
            dados.logoBase64 = e.target.result;
            await db.collection('oficinas').doc(oficinaId).set(dados, { merge: true });
            
            await db.collection('oficinas').doc(oficinaId).collection('whitelabel').doc('tema').set({
              primary,
              secondary,
              background,
              highlight,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
              acao: 'whitelabel_update',
              usuario: firebase.auth().currentUser?.email,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              dados: { nome, endereco, cnpj, telefone, logoAtualizado: true, coresAtualizadas: true }
            });
            
            alert('✅ Configurações salvas com sucesso!');
            window.WhiteLabelManager.fecharModal();
            window.WhiteLabelManager.aplicarConfiguracoes();
          };
          reader.readAsDataURL(logoFile);
        } else {
          await db.collection('oficinas').doc(oficinaId).set(dados, { merge: true });
          
          await db.collection('oficinas').doc(oficinaId).collection('whitelabel').doc('tema').set({
            primary,
            secondary,
            background,
            highlight,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          
          await db.collection('oficinas').doc(oficinaId).collection('auditoria').add({
            acao: 'whitelabel_update',
            usuario: firebase.auth().currentUser?.email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            dados: { nome, endereco, cnpj, telefone, coresAtualizadas: true }
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
    
    aplicarConfiguracoes: async function() {
      try {
        const oficinaId = window.OFICINA_CONFIG?.oficinaId;
        if (!oficinaId) return;
        
        const db = firebase.firestore();
        const doc = await db.collection('oficinas').doc(oficinaId).get();
        
        if (doc.exists) {
          const dados = doc.data();
          
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
        }
        
        const docTema = await db.collection('oficinas').doc(oficinaId).collection('whitelabel').doc('tema').get();
        if (docTema.exists) {
          const tema = docTema.data();
          document.documentElement.style.setProperty('--color-primary', tema.primary);
          document.documentElement.style.setProperty('--color-secondary', tema.secondary);
          document.documentElement.style.setProperty('--color-background', tema.background);
          document.documentElement.style.setProperty('--color-highlight', tema.highlight);
          console.log('✅ Cores customizadas aplicadas:', tema);
        }
        
        console.log('✅ Configurações aplicadas na interface');
      } catch (error) {
        console.error('❌ Erro ao aplicar configurações:', error);
      }
    },
    
    fecharModal: function() {
      const modal = document.getElementById('modal-whitelabel');
      if (modal) modal.remove();
    }
  };
  
  window.WhiteLabelManager = WhiteLabelManager;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => WhiteLabelManager.aplicarConfiguracoes(), 1000);
    });
  } else {
    setTimeout(() => WhiteLabelManager.aplicarConfiguracoes(), 1000);
  }
  
  console.log('✅ WhiteLabelManager exposto globalmente');
})();