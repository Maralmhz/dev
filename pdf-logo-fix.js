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
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        } catch (error) {
          console.error('❌ Erro ao converter imagem:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', imageUrl);
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
      if (this.logoBase64Cache) {
        console.log('✅ Logo do cache');
        return this.logoBase64Cache;
      }
      
      // PRIORIDADE 1: Pegar do elemento logo-oficina (já está em base64)
      const logoOficina = document.getElementById('logo-oficina');
      if (logoOficina && logoOficina.src && logoOficina.src.startsWith('data:')) {
        console.log('🖼️ Logo encontrada no elemento logo-oficina (já em base64)');
        
        // Se for AVIF, converter para PNG
        if (logoOficina.src.includes('avif')) {
          console.log('🔄 Convertendo AVIF para PNG...');
          const base64 = await this.imageToBase64(logoOficina.src);
          this.logoBase64Cache = base64;
          console.log('✅ Logo convertida (' + (base64.length / 1024).toFixed(1) + 'KB)');
          return base64;
        }
        
        // Já é PNG ou outro formato compatível
        this.logoBase64Cache = logoOficina.src;
        console.log('✅ Logo já em base64 compatível (' + (logoOficina.src.length / 1024).toFixed(1) + 'KB)');
        return logoOficina.src;
      }
      
      // PRIORIDADE 2: Pegar URL externa do elemento
      if (logoOficina && logoOficina.src && !logoOficina.src.startsWith('data:')) {
        console.log('🖼️ Convertendo logo de URL:', logoOficina.src);
        const base64 = await this.imageToBase64(logoOficina.src);
        this.logoBase64Cache = base64;
        console.log('✅ Logo convertida (' + (base64.length / 1024).toFixed(1) + 'KB)');
        return base64;
      }
      
      // PRIORIDADE 3: Tentar config
      let logoUrl = window.OFICINA_CONFIG?.logo;
      if (logoUrl) {
        if (!logoUrl.startsWith('http') && !logoUrl.startsWith('data:')) {
          logoUrl = window.location.origin + '/' + logoUrl.replace(/^\//, '');
        }
        console.log('🖼️ Convertendo logo de config:', logoUrl);
        const base64 = await this.imageToBase64(logoUrl);
        this.logoBase64Cache = base64;
        console.log('✅ Logo convertida (' + (base64.length / 1024).toFixed(1) + 'KB)');
        return base64;
      }
      
      throw new Error('Logo não encontrada');
      
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
      
      const logoBase64 = await this.prepararLogoPDF();
      logoResumo.src = logoBase64;
      logoResumo.style.display = 'block';
      
      console.log('✅ Logo aplicada no resumo');
      
    } catch (error) {
      console.error('❌ Erro ao aplicar logo no resumo:', error);
    }
  },
  
  /**
   * Wrapper para gerarPDFResumo que aplica logo antes
   */
  async gerarPDFComLogo(funcaoOriginal, ...args) {
    console.log('📝 Preparando logo para PDF...');
    await this.aplicarLogoResumo();
    await new Promise(resolve => setTimeout(resolve, 500));
    return funcaoOriginal.apply(window, args);
  },
  
  /**
   * Instalar Proxy para interceptar definição de gerarPDFResumo
   */
  instalarProxy() {
    if (this.hookAplicado) {
      console.log('⚠️ Hook já foi aplicado');
      return;
    }
    
    // Se a função já existe, aplicar hook imediatamente
    if (typeof window.gerarPDFResumo === 'function') {
      const original = window.gerarPDFResumo;
      window.gerarPDFResumo = (...args) => this.gerarPDFComLogo(original, ...args);
      this.hookAplicado = true;
      console.log('✅ Hook aplicado em gerarPDFResumo existente');
      return;
    }
    
    // Caso contrário, usar Object.defineProperty para interceptar
    let _gerarPDFResumo = undefined;
    
    Object.defineProperty(window, 'gerarPDFResumo', {
      get() {
        return _gerarPDFResumo;
      },
      set(novaFuncao) {
        if (typeof novaFuncao === 'function' && !PDFLogoFix.hookAplicado) {
          console.log('✅ gerarPDFResumo detectada! Aplicando hook...');
          _gerarPDFResumo = (...args) => PDFLogoFix.gerarPDFComLogo(novaFuncao, ...args);
          PDFLogoFix.hookAplicado = true;
        } else {
          _gerarPDFResumo = novaFuncao;
        }
      },
      configurable: true
    });
    
    console.log('✅ Proxy instalado para interceptar gerarPDFResumo');
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

// Instalar proxy imediatamente
PDFLogoFix.instalarProxy();

console.log('✅ PDF Logo Fix carregado (proxy ativo)');
