// ==========================================
// PLACA OS UPDATER - Atualiza OS ao digitar
// ==========================================
// Corrige bug: Ao digitar placa, número da OS não atualizava

const PlacaOSUpdater = {
  
  /**
   * Gera número da OS baseado na placa e data
   * @param {string} placa - Placa do veículo
   * @param {Date} data - Data de entrada (opcional)
   * @returns {string} - Número da OS (formato: PLACA-DDMMAA)
   */
  gerarNumeroOS(placa, data = null) {
    const placaLimpa = (placa || 'SEM').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    
    const dataObj = data ? new Date(data) : new Date();
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const ano = String(dataObj.getFullYear()).slice(-2);
    
    return `${placaLimpa}-${dia}${mes}${ano}`;
  },
  
  /**
   * Atualiza todos os elementos que exibem o número da OS
   * @param {string} numeroOS - Número da OS
   */
  atualizarElementosOS(numeroOS) {
    // Elementos que precisam ser atualizados
    const elementos = [
      'barraFixaOS',     // Barra fixa no topo
      'osNumero',        // Resumo PDF
      'numeroOSAtual'    // Outros locais
    ];
    
    elementos.forEach(id => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = numeroOS;
        console.log(`✅ Atualizado ${id}: ${numeroOS}`);
      }
    });
  },
  
  /**
   * Atualiza resumos de veículo em todas as abas
   * @param {Object} dados - Dados do veículo (placa, modelo, km, chassi, etc)
   */
  atualizarResumos(dados) {
    const resumos = [
      { prefixo: 'resumo', sufixo: '' },           // Aba principal
      { prefixo: 'resumo', sufixo: '2' },          // Aba orçamento
      { prefixo: 'resumo', sufixo: '3' },          // Aba fotos
      { prefixo: 'r', sufixo: '' }                 // Resumo PDF
    ];
    
    resumos.forEach(({ prefixo, sufixo }) => {
      if (dados.placa) {
        const elPlaca = document.getElementById(`${prefixo}Placa${sufixo}`);
        if (elPlaca) elPlaca.textContent = dados.placa;
      }
      
      if (dados.modelo) {
        const elModelo = document.getElementById(`${prefixo}Modelo${sufixo}`);
        if (elModelo) elModelo.textContent = dados.modelo;
      }
      
      if (dados.km) {
        const elKm = document.getElementById(`${prefixo}KmEntrada${sufixo}`);
        if (elKm) elKm.textContent = dados.km;
      }
      
      if (dados.chassi) {
        const elChassi = document.getElementById(`${prefixo}Chassi${sufixo}`);
        if (elChassi) elChassi.textContent = dados.chassi;
      }
      
      if (dados.data) {
        const elData = document.getElementById(`${prefixo}Data${sufixo}`);
        if (elData) elData.textContent = dados.data;
      }
    });
    
    console.log('✅ Resumos atualizados em todas as abas');
  },
  
  /**
   * Inicializa listeners nos campos do formulário
   */
  inicializarListeners() {
    console.log('🎯 Inicializando listeners de atualização de OS...');
    
    // Campo PLACA
    const inputPlaca = document.getElementById('placa');
    if (inputPlaca) {
      inputPlaca.addEventListener('input', (e) => {
        const placa = e.target.value.trim().toUpperCase();
        
        if (placa.length >= 3) {
          // Pegar data do campo (ou usar hoje)
          const inputData = document.getElementById('data');
          const data = inputData?.value ? new Date(inputData.value + 'T00:00:00') : new Date();
          
          // Gerar número da OS
          const numeroOS = this.gerarNumeroOS(placa, data);
          
          // Atualizar todos os elementos
          this.atualizarElementosOS(numeroOS);
          
          // Atualizar resumos
          this.atualizarResumos({ placa });
        } else {
          // Limpar se placa for muito curta
          this.atualizarElementosOS('-');
        }
      });
      
      console.log('✅ Listener de PLACA instalado');
    }
    
    // Campo DATA
    const inputData = document.getElementById('data');
    if (inputData) {
      inputData.addEventListener('change', (e) => {
        const inputPlaca = document.getElementById('placa');
        const placa = inputPlaca?.value?.trim()?.toUpperCase();
        
        if (placa && placa.length >= 3) {
          const data = new Date(e.target.value + 'T00:00:00');
          const numeroOS = this.gerarNumeroOS(placa, data);
          this.atualizarElementosOS(numeroOS);
          this.atualizarResumos({ data: e.target.value });
        }
      });
      
      console.log('✅ Listener de DATA instalado');
    }
    
    // Campo MODELO
    const inputModelo = document.getElementById('modelo');
    if (inputModelo) {
      inputModelo.addEventListener('input', (e) => {
        this.atualizarResumos({ modelo: e.target.value });
      });
      
      console.log('✅ Listener de MODELO instalado');
    }
    
    // Campo KM ENTRADA
    const inputKm = document.getElementById('km_entrada');
    if (inputKm) {
      inputKm.addEventListener('input', (e) => {
        this.atualizarResumos({ km: e.target.value });
      });
      
      console.log('✅ Listener de KM instalado');
    }
    
    // Campo CHASSI
    const inputChassi = document.getElementById('chassi');
    if (inputChassi) {
      inputChassi.addEventListener('input', (e) => {
        this.atualizarResumos({ chassi: e.target.value });
      });
      
      console.log('✅ Listener de CHASSI instalado');
    }
  },
  
  /**
   * Inicializa o módulo
   */
  init() {
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.inicializarListeners());
    } else {
      this.inicializarListeners();
    }
  }
};

// Expor globalmente
window.PlacaOSUpdater = PlacaOSUpdater;

// Inicializar automaticamente
PlacaOSUpdater.init();

console.log('✅ Placa OS Updater carregado');
