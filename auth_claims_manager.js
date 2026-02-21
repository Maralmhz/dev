// ==========================================
// 🔑 AUTH CLAIMS MANAGER
// ==========================================
// Gerenciamento de custom claims no frontend

const authClaimsManager = {
  
  // ==========================================
  // SETAR CLAIMS DE OFICINA
  // ==========================================
  
  async setOficinaClaims(uid, oficina_id, role = 'user') {
    try {
      console.log('🔄 Setando claims...', { uid, oficina_id, role });
      
      // Chamar Cloud Function
      const setUserOficinaClaim = firebase.functions().httpsCallable('setUserOficinaClaim');
      
      const result = await setUserOficinaClaim({
        uid: uid,
        oficina_id: oficina_id,
        role: role
      });
      
      console.log('✅ Claims setados:', result.data);
      
      // Forçar refresh do token
      const user = firebase.auth().currentUser;
      if (user) {
        await user.getIdToken(true);
        console.log('✅ Token refreshed');
      }
      
      return { success: true, data: result.data };
      
    } catch (error) {
      console.error('❌ Erro ao setar claims:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // BUSCAR CLAIMS DO USUÁRIO ATUAL
  // ==========================================
  
  async getCurrentUserClaims() {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      // Forçar refresh para garantir claims atualizados
      const tokenResult = await user.getIdTokenResult(true);
      
      console.log('📊 Claims atuais:', tokenResult.claims);
      
      return {
        success: true,
        claims: tokenResult.claims,
        oficina_id: tokenResult.claims.oficina_id || null,
        role: tokenResult.claims.role || null
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar claims:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // VALIDAR SE USUÁRIO PERTENCE À OFICINA
  // ==========================================
  
  async pertenceOficina(oficina_id) {
    const result = await this.getCurrentUserClaims();
    
    if (!result.success) {
      return false;
    }
    
    return result.oficina_id === oficina_id;
  },
  
  // ==========================================
  // VERIFICAR SE É ADMIN
  // ==========================================
  
  async isAdmin() {
    const result = await this.getCurrentUserClaims();
    
    if (!result.success) {
      return false;
    }
    
    return result.role === 'admin';
  },
  
  // ==========================================
  // MIGRAR USUÁRIOS EXISTENTES (ADMIN ONLY)
  // ==========================================
  
  async migrateExistingUsers(oficina_id_padrao) {
    try {
      const isAdmin = await this.isAdmin();
      
      if (!isAdmin) {
        return { success: false, error: 'Apenas administradores podem migrar usuários' };
      }
      
      console.log('🔄 Iniciando migração de usuários...');
      
      const migrateFunction = firebase.functions().httpsCallable('migrateExistingUsers');
      
      const result = await migrateFunction({
        oficina_id_padrao: oficina_id_padrao
      });
      
      console.log('✅ Migração concluída:', result.data);
      
      return { success: true, data: result.data };
      
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // SETUP INICIAL - CHAMAR APÓS LOGIN
  // ==========================================
  
  async setupUserAfterLogin(oficina_id) {
    try {
      const user = firebase.auth().currentUser;
      
      if (!user) {
        return { success: false, error: 'Usuário não autenticado' };
      }
      
      // Verificar se já tem claims
      const currentClaims = await this.getCurrentUserClaims();
      
      if (currentClaims.oficina_id) {
        console.log('✅ Usuário já possui claims:', currentClaims);
        return { success: true, claims: currentClaims };
      }
      
      // Se não tem, setar
      console.log('🆕 Primeira vez - setando claims...');
      return await this.setOficinaClaims(user.uid, oficina_id, 'user');
      
    } catch (error) {
      console.error('❌ Erro no setup:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // DEBUG - MOSTRAR CLAIMS NO CONSOLE
  // ==========================================
  
  async debugClaims() {
    console.log('\n========================================');
    console.log('🔍 DEBUG: CUSTOM CLAIMS');
    console.log('========================================');
    
    const user = firebase.auth().currentUser;
    
    if (!user) {
      console.log('❌ Usuário não autenticado');
      return;
    }
    
    console.log('👤 UID:', user.uid);
    console.log('📧 Email:', user.email);
    
    const tokenResult = await user.getIdTokenResult();
    console.log('\n📊 CLAIMS:');
    console.log(JSON.stringify(tokenResult.claims, null, 2));
    
    console.log('\n🏢 Oficina ID:', tokenResult.claims.oficina_id || 'NÃO CONFIGURADO');
    console.log('🔑 Role:', tokenResult.claims.role || 'NÃO CONFIGURADO');
    console.log('========================================\n');
  }
};

// Expor globalmente
if (typeof window !== 'undefined') {
  window.authClaimsManager = authClaimsManager;
}

console.log('✅ auth_claims_manager.js v1.0 carregado');