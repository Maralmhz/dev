// bootstrap-controller.js
// Sistema de inicialização sem race conditions
// ================================================

(function() {
  'use strict';
  
  if (window.__BootstrapControllerLoaded) return;
  window.__BootstrapControllerLoaded = true;
  
  console.log('🚀 Bootstrap Controller carregado');
  
  // 🔒 Estado global protegido
  let bootstrapStarted = false;
  let bootstrapCompleted = false;
  
  const BootstrapController = {
    
    /**
     * Aguarda módulos essenciais usando Promise (SEM setInterval)
     */
    async aguardarModulosEssenciais() {
      console.log('⏳ Aguardando módulos essenciais...');
      
      const MAX_TENTATIVAS = 50; // 50 x 100ms = 5 segundos
      let tentativas = 0;
      
      while (tentativas < MAX_TENTATIVAS) {
        const oficinaIdOk = !!window.OFICINA_CONFIG?.oficinaId;
        const gestaoV2Ok = typeof window.GestaoOficinaV2 !== 'undefined';
        const moduloOSOk = typeof window.ModuloOS !== 'undefined';
        
        if (tentativas % 10 === 0) {
          console.log(`🔍 Check [${tentativas}]: oficinaId=${oficinaIdOk}, GestaoV2=${gestaoV2Ok}, ModuloOS=${moduloOSOk}`);
        }
        
        if (oficinaIdOk && gestaoV2Ok && moduloOSOk) {
          console.log('✅ Todos os módulos essenciais carregados!');
          return true;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        tentativas++;
      }
      
      console.error('❌ Timeout: módulos não carregaram em 5 segundos');
      return false;
    },
    
    /**
     * Carrega todos os scripts do sistema
     */
    async carregarScripts() {
      console.log('📦 Carregando scripts do sistema...');
      
      const scripts = [
        "auth-guard.js",
        "oficina-guard.js",
        "firestore-wrapper.js",
        "pdf-logo-fix.js",
        "placa-os-updater.js",
        "app.js",
        "core_utils.js",
        "firebase.js",
        "checklist.js",
        "gestao_oficina.js",
        "gestao_oficina_v2.js",
        "gestao_oficina_agendamentos.js",
        "gestao_oficina_financeiro.js",
        "gestao_oficina_recibos.js",
        "gestao_oficina_os.js",
        "gestao_oficina_checklist.js",
        "gestao_oficina_clientes.js",
        "gestao_oficina_estoque.js",
        "gestao_oficina_dashboard.js",
        "kanban_manager.js",
        "v2-modules-expose.js",
        "gestao_oficina_init.js",
        "logout.js",
        "session-manager.js",
        "sidebar-menu.js",
        "status-monitor.js",
        "gestao_oficina_whitelabel.js",
        "gestao_oficina_oficinaid.js",
        "gestao_oficina_plano.js"
      ];
      
      const placeholder = document.getElementById('modulos-placeholder') || document.body;
      const version = '3.8';
      
      // Carregar scripts em paralelo
      await Promise.all(scripts.map(src => new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = `${src}?v=${version}`;
        script.onload = () => {
          console.log(`✅ ${src}`);
          resolve();
        };
        script.onerror = () => {
          console.error(`❌ Falha: ${src}`);
          resolve(); // Continua mesmo com erro
        };
        placeholder.appendChild(script);
      })));
      
      // Módulo Firebase separado (type=module)
      const moduloFirebase = document.createElement('script');
      moduloFirebase.type = 'module';
      moduloFirebase.src = `gestao_oficina_firebase.js?v=${version}`;
      await new Promise(resolve => {
        moduloFirebase.onload = resolve;
        moduloFirebase.onerror = resolve;
        placeholder.appendChild(moduloFirebase);
      });
      
      console.log('✅ Todos os scripts carregados');
    },
    
    /**
     * Inicializa tabs e interface
     */
    async inicializarInterface() {
      console.log('🎨 Inicializando interface...');
      
      const placeholder = document.getElementById('modulos-placeholder') || document.body;
      const tabsScript = document.createElement('script');
      tabsScript.src = 'tabs_init.js?v=3.8';
      
      await new Promise((resolve) => {
        tabsScript.onload = () => {
          console.log('✅ Tabs inicializadas');
          resolve();
        };
        tabsScript.onerror = () => {
          console.error('❌ Erro ao carregar tabs');
          resolve();
        };
        placeholder.appendChild(tabsScript);
      });
      
      // Garantir que dashboard está visível
      const dashboard = document.getElementById('dashboard') || document.getElementById('app');
      if (dashboard) {
        dashboard.style.display = 'block';
        dashboard.style.opacity = '1';
        dashboard.style.visibility = 'visible';
      }
      
      console.log('🎉 Interface inicializada!');
    },
    
    /**
     * Fluxo principal de bootstrap (EXECUTA APENAS UMA VEZ)
     */
    async iniciar() {
      if (bootstrapStarted) {
        console.warn('⚠️ Bootstrap já iniciado, ignorando chamada duplicada');
        return false;
      }
      
      bootstrapStarted = true;
      console.log('🚀 Iniciando sistema completo...');
      
      try {
        // 1. Carregar scripts
        await this.carregarScripts();
        
        // 2. Aguardar módulos essenciais
        const modulosOk = await this.aguardarModulosEssenciais();
        
        if (!modulosOk) {
          console.error('❌ Sistema não pôde ser inicializado (módulos faltando)');
          return false;
        }
        
        // 3. Pequeno delay para estabilizar
        await new Promise(resolve => setTimeout(resolve, 150));
        
        // 4. Inicializar interface
        await this.inicializarInterface();
        
        bootstrapCompleted = true;
        console.log('✅ BOOTSTRAP CONCLUÍDO COM SUCESSO');
        return true;
        
      } catch (error) {
        console.error('❌ Erro fatal no bootstrap:', error);
        return false;
      }
    },
    
    /**
     * Getter para estado do bootstrap
     */
    isStarted() {
      return bootstrapStarted;
    },
    
    isCompleted() {
      return bootstrapCompleted;
    }
  };
  
  // Expor globalmente
  window.BootstrapController = BootstrapController;
  
  // Criar alias para compatibilidade com código legado
  window.iniciarSistemaCompleto = function() {
    return BootstrapController.iniciar();
  };
  
  console.log('✅ BootstrapController exposto globalmente');
})();