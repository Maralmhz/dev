// ==========================================
// PDF LOGO FIX - Converte logo para Base64
// ==========================================
// Garante que a logo apareça no PDF convertendo para base64

const PDFLogoFix = {
  logoBase64Cache: null,
  hookAplicado: false,
  
  /**
   * Converte imagem para Base64
   * @param {string} imageUrl - URL da imagem
   * @returns {Promise<string>} - Data URL em base64
   */
  async imageToBase64(imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous'; // Importante para imagens externas
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          // Converter para base64 (formato PNG)
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.error('❌ Erro ao converter imagem:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', imageUrl, error);
        reject(error);
      };
      
      img.src = imageUrl;
    });
  },
  
  /**
   * Prepara logo para o PDF
   * @returns {Promise<string>} - Logo em base64
   */
  async prepararLogoPDF() {
    try {
      // Verifica se já tem no cache
      if (this.logoBase64Cache) {
        console.log('✅ Logo carregada do cache');
        return this.logoBase64Cache;
      }
      
      // Buscar logo da configuração ou elemento DOM
      let logoUrl = window.OFICINA_CONFIG?.logo || 'logo.png';
      
      // Tentar pegar do elemento logo-oficina se existir
      const logoOficina = document.getElementById('logo-oficina');
      if (logoOficina && logoOficina.src) {
        logoUrl = logoOficina.src;
      }
      
      // Se for URL relativa, converter para absoluta
      if (!logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
        logoUrl = window.location.origin + '/' + logoUrl.replace(/^\//, '');
      }
      
      console.log('🖼️ Convertendo logo para base64:', logoUrl);
      
      // Converter para base64
      const base64 = await this.imageToBase64(logoUrl);
      
      // Cachear para próximas gerações
      this.logoBase64Cache = base64;
      
      console.log('✅ Logo convertida para base64 com sucesso');
      return base64;
      
    } catch (error) {
      console.error('❌ Erro ao preparar logo para PDF:', error);
      
      // Retornar logo padrão transparente 1x1px
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    }
  },
  
  /**
   * Aplica logo no elemento de resumo antes de gerar PDF
   */
  async aplicarLogoResumo() {
    try {
      const logoResumo = document.getElementById('logoResumo');
      
      if (!logoResumo) {
        console.warn('⚠️ Elemento logoResumo não encontrado');
        return;
      }
      
      // Converter logo para base64
      const logoBase64 = await this.prepararLogoPDF();
      
      // Aplicar no elemento
      logoResumo.src = logoBase64;
      logoResumo.style.display = 'block'; // Garantir visibilidade
      
      console.log('✅ Logo aplicada no resumo');
      
    } catch (error) {
      console.error('❌ Erro ao aplicar logo no resumo:', error);
    }
  },
  
  /**
   * Aplica hook na função gerarPDFResumo
   */
  aplicarHook() {
    if (this.hookAplicado) {
      console.log('⚠️ Hook já foi aplicado');
      return;
    }
    
    if (typeof window.gerarPDFResumo !== 'function') {
      console.warn('⚠️ Função gerarPDFResumo ainda não existe, aguardando...');
      return false;
    }
    
    const originalGerarPDF = window.gerarPDFResumo;
    
    window.gerarPDFResumo = async function() {
      console.log('📝 Preparando logo para PDF...');
      await PDFLogoFix.aplicarLogoResumo();
      
      // Pequeno delay para garantir que a imagem carregou
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return originalGerarPDF.apply(this, arguments);
    };
    
    this.hookAplicado = true;
    console.log('✅ Hook de geração de PDF aplicado com sucesso');
    return true;
  },
  
  /**
   * Tenta aplicar hook periodicamente até ter sucesso
   */
  tentarAplicarHook() {
    const maxTentativas = 50; // 5 segundos (50 x 100ms)
    let tentativas = 0;
    
    const intervalo = setInterval(() => {
      tentativas++;
      
      if (this.aplicarHook()) {
        clearInterval(intervalo);
        console.log('✅ Hook aplicado após', tentativas, 'tentativas');
      } else if (tentativas >= maxTentativas) {
        clearInterval(intervalo);
        console.error('❌ Timeout: não foi possível aplicar hook de PDF');
      }
    }, 100);
  },
  
  /**
   * Limpar cache (usar após atualizar logo)
   */
  limparCache() {
    this.logoBase64Cache = null;
    console.log('🗑️ Cache de logo limpo');
  }
};

// Expor globalmente
window.PDFLogoFix = PDFLogoFix;

// Aplicar hook quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    PDFLogoFix.tentarAplicarHook();
  });
} else {
  // DOM já está pronto
  PDFLogoFix.tentarAplicarHook();
}

console.log('✅ PDF Logo Fix carregado');
