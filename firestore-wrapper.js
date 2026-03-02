// ==========================================
// FIRESTORE WRAPPER - QUERIES SEGURAS
// ==========================================

const FirestoreWrapper = {
  db: null,
  
  init() {
    this.db = firebase.firestore();
    console.log('✅ Firestore Wrapper inicializado');
  },
  
  // ==========================================
  // QUERIES COM ISOLAMENTO AUTOMÁTICO
  // ==========================================
  
  getOficinaRef() {
    const oficinaId = window.OficinaGuard.getOficinaId();
    return this.db.collection('oficinas').doc(oficinaId);
  },
  
  // Subcoleção de OS
  osCollection() {
    return this.getOficinaRef().collection('ordens_servico');
  },
  
  // Subcoleção de Checklists
  checklistsCollection() {
    return this.getOficinaRef().collection('checklists');
  },
  
  // Subcoleção de Clientes
  clientesCollection() {
    return this.getOficinaRef().collection('clientes');
  },
  
  // Subcoleção de Veículos
  veiculosCollection() {
    return this.getOficinaRef().collection('veiculos');
  },
  
  // Subcoleção de Peças
  pecasCollection() {
    return this.getOficinaRef().collection('pecas');
  },
  
  // ==========================================
  // BUSCAR OS POR PLACA
  // ==========================================
  
  async buscarOSPorPlaca(placa) {
    try {
      if (!placa || placa.trim() === '') {
        return { success: false, error: 'Placa inválida' };
      }
      
      // Buscar veículo pela placa
      const veiculoSnap = await this.veiculosCollection()
        .where('placa', '==', placa.toUpperCase().trim())
        .limit(1)
        .get();
      
      if (veiculoSnap.empty) {
        return { success: false, error: 'Veículo não encontrado nesta oficina' };
      }
      
      const veiculoId = veiculoSnap.docs[0].id;
      
      // Buscar OS do veículo
      const osSnap = await this.osCollection()
        .where('veiculo_id', '==', veiculoId)
        .orderBy('data_entrada', 'desc')
        .get();
      
      const osList = [];
      osSnap.forEach(doc => {
        osList.push({ id: doc.id, ...doc.data() });
      });
      
      return { 
        success: true, 
        data: {
          veiculo: veiculoSnap.docs[0].data(),
          ordens_servico: osList
        }
      };
      
    } catch (error) {
      console.error('❌ Erro ao buscar OS por placa:', error);
      return { success: false, error: error.message };
    }
  },
  
  // ==========================================
  // LIMPAR DADOS ANTIGOS
  // ==========================================
  
  async limparDadosAntigos(diasAtras = 90) {
    try {
      const oficinaId = window.OficinaGuard.getOficinaId();
      console.log(`🗑️ Iniciando limpeza de dados com mais de ${diasAtras} dias...`);
      
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - diasAtras);
      const timestampLimite = firebase.firestore.Timestamp.fromDate(dataLimite);
      
      // Limpar OS antigas
      const osSnap = await this.osCollection()
        .where('data_entrada', '<', timestampLimite)
        .where('status', 'in', ['FINALIZADO', 'CANCELADO'])
        .get();
      
      let contadorOS = 0;
      const batch = this.db.batch();
      
      osSnap.forEach(doc => {
        batch.delete(doc.ref);
        contadorOS++;
      });
      
      await batch.commit();
      
      console.log(`✅ ${contadorOS} OS antigas removidas`);
      return { success: true, removidos: contadorOS };
      
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      return { success: false, error: error.message };
    }
  }
};

// Inicializar
if (typeof firebase !== 'undefined') {
  FirestoreWrapper.init();
  window.FirestoreWrapper = FirestoreWrapper;
  console.log('✅ Firestore Wrapper carregado');
} else {
  console.warn('⚠️ Firebase não disponível ainda, wrapper será inicializado depois');
  document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
      FirestoreWrapper.init();
      window.FirestoreWrapper = FirestoreWrapper;
    }
  });
}