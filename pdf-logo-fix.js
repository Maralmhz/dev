// ==========================================
// PDF LOGO FIX - Converte logo para Base64
// ==========================================
// Garante que a logo apareça no PDF convertendo para base64

const PDFLogoFix = {
  logoBase64Cache: null,
  
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
        console.error('❌ Erro ao carregar imagem:', error);
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
      
      // Buscar logo da configuração
      let logoUrl = window.OFICINA_CONFIG?.logo || 'logo.png';
      
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
      
      console.log('✅ Logo aplicada no resumo');
      
    } catch (error) {
      console.error('❌ Erro ao aplicar logo no resumo:', error);
    }
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

// Hook automático: Interceptar geração de PDF
if (typeof window.gerarPDFResumo === 'function') {
  const originalGerarPDF = window.gerarPDFResumo;
  
  window.gerarPDFResumo = async function() {
    console.log('📝 Preparando logo para PDF...');
    await PDFLogoFix.aplicarLogoResumo();
    
    // Pequeno delay para garantir que a imagem carregou
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return originalGerarPDF.apply(this, arguments);
  };
  
  console.log('✅ Hook de geração de PDF aplicado');
}

console.log('✅ PDF Logo Fix carregado');