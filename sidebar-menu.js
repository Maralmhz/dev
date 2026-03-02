// ==============================================
// SIDEBAR MENU - GERENCIAMENTO
// ==============================================

class SidebarMenu {
    constructor() {
        this.isOpen = false;
        this.init();
    }

    init() {
        // Criar elementos do menu
        this.createMenu();
        
        // Event listeners
        this.setupListeners();
        
        // Carregar info do usuário
        this.loadUserInfo();
        
        console.log('✅ Sidebar Menu inicializado');
    }

    createMenu() {
        // Botão hambúrguer
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-btn';
        hamburger.id = 'hamburgerBtn';
        hamburger.innerHTML = `
            <span></span>
            <span></span>
            <span></span>
        `;
        document.body.appendChild(hamburger);

        // Overlay
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.id = 'sidebarOverlay';
        document.body.appendChild(overlay);

        // Menu lateral
        const sidebar = document.createElement('div');
        sidebar.className = 'sidebar-menu';
        sidebar.id = 'sidebarMenu';
        sidebar.innerHTML = `
            <div class="sidebar-header">
                <div class="sidebar-user">
                    <div class="sidebar-avatar">👤</div>
                    <div class="sidebar-user-info">
                        <h3>Usuário</h3>
                        <p id="sidebarUserEmail">Carregando...</p>
                    </div>
                </div>
                <span class="sidebar-plan" id="sidebarPlanBadge">⭐ Plano Básico</span>
            </div>

            <nav class="sidebar-nav">
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('novo-checklist')">
                    <i>➞</i>
                    <span>Novo Checklist</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('gestao-oficina')">
                    <i>🛠️</i>
                    <span>Gestão Oficina</span>
                </a>
                
                <div class="sidebar-divider"></div>
                
                <a href="perfil-usuario.html" class="sidebar-nav-item">
                    <i>👤</i>
                    <span>Meu Perfil</span>
                    <span class="sidebar-badge-new">NOVO</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.openPersonalizar()">
                    <i>🎨</i>
                    <span>Personalizar</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('historico')">
                    <i>📜</i>
                    <span>Histórico</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('relatorios')">
                    <i>📊</i>
                    <span>Relatórios</span>
                </a>
                
                <div class="sidebar-divider"></div>
                
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.showDevices()">
                    <i>📱</i>
                    <span>Dispositivos Ativos</span>
                    <span class="sidebar-badge" id="deviceCount">0/2</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.showPlanInfo()">
                    <i>💎</i>
                    <span>Informações do Plano</span>
                </a>
                <a href="#" class="sidebar-nav-item">
                    <i>⚙️</i>
                    <span>Configurações</span>
                </a>
                <a href="#" class="sidebar-nav-item">
                    <i>❓</i>
                    <span>Ajuda & Suporte</span>
                </a>
            </nav>

            <div class="sidebar-logout">
                <button class="btn-logout-sidebar" onclick="fazerLogout()">
                    <span>🚪</span>
                    <span>Sair da Conta</span>
                </button>
            </div>
        `;
        document.body.appendChild(sidebar);
    }

    setupListeners() {
        const hamburger = document.getElementById('hamburgerBtn');
        const overlay = document.getElementById('sidebarOverlay');

        // Abrir/fechar com botão
        hamburger.addEventListener('click', () => this.toggle());

        // Fechar com overlay
        overlay.addEventListener('click', () => this.close());

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        const hamburger = document.getElementById('hamburgerBtn');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.getElementById('sidebarMenu');

        hamburger.classList.add('active');
        overlay.classList.add('active');
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        this.isOpen = true;
        this.updateDeviceCount();
        this.updatePlanBadge();
    }

    close() {
        const hamburger = document.getElementById('hamburgerBtn');
        const overlay = document.getElementById('sidebarOverlay');
        const sidebar = document.getElementById('sidebarMenu');

        hamburger.classList.remove('active');
        overlay.classList.remove('active');
        sidebar.classList.remove('active');
        document.body.style.overflow = '';
        
        this.isOpen = false;
    }

    async loadUserInfo() {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                const emailEl = document.getElementById('sidebarUserEmail');
                if (emailEl) {
                    emailEl.textContent = user.email;
                }
                this.updatePlanBadge();
                this.updateDeviceCount(); // 🐛 CORREÇÃO: Atualizar contador ao carregar
            }
        });
    }

    async updatePlanBadge() {
        try {
            if (typeof window.PlanoManager === 'undefined') return;
            
            const verificacao = await window.PlanoManager.verificarLimiteUsuarios();
            const badge = document.getElementById('sidebarPlanBadge');
            
            if (badge && verificacao.plano) {
                badge.textContent = `${verificacao.badge} ${verificacao.nome} (${verificacao.usuariosAtivos}/${verificacao.limiteUsuarios})`;
                badge.style.background = verificacao.cor;
                badge.style.color = 'white';
            }
        } catch (error) {
            console.error('❌ Erro ao atualizar badge do plano:', error);
        }
    }

    // 🐛 CORREÇÃO: Função reescrita para garantir contagem correta
    async updateDeviceCount() {
        const user = firebase.auth().currentUser;
        if (!user) {
            console.warn('⚠️ updateDeviceCount: Usuário não autenticado');
            return;
        }

        try {
            // Buscar sessões ativas do Realtime Database
            const userEmail = user.email.replace(/[.@]/g, '_');
            const sessionsRef = firebase.database().ref(`sessions/${userEmail}`);
            
            const snapshot = await sessionsRef.once('value');
            const sessions = snapshot.val() || {};
            
            // Filtrar sessões válidas (menos de 24h inativas)
            const now = Date.now();
            const validSessions = {};
            
            for (const [deviceId, session] of Object.entries(sessions)) {
                if (session.lastActive && (now - session.lastActive < 24 * 60 * 60 * 1000)) {
                    validSessions[deviceId] = session;
                }
            }
            
            const count = Object.keys(validSessions).length;
            const badge = document.getElementById('deviceCount');
            
            if (badge) {
                badge.textContent = `${count}/2`;
                
                // Cor do badge baseado na contagem
                if (count >= 2) {
                    badge.style.background = '#e74c3c'; // Vermelho (limite atingido)
                } else if (count === 1) {
                    badge.style.background = '#f39c12'; // Laranja (1 disponível)
                } else {
                    badge.style.background = '#27ae60'; // Verde (livres)
                }
            }
            
            console.log(`📱 Sessões ativas: ${count}/2`);
            
        } catch (error) {
            console.error('❌ Erro ao contar devices:', error);
            const badge = document.getElementById('deviceCount');
            if (badge) {
                badge.textContent = '?/2';
                badge.style.background = '#95a5a6';
            }
        }
    }

    async showDevices() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            // Buscar sessões do Realtime Database
            const userEmail = user.email.replace(/[.@]/g, '_');
            const sessionsRef = firebase.database().ref(`sessions/${userEmail}`);
            const snapshot = await sessionsRef.once('value');
            const sessions = snapshot.val() || {};
            
            // Filtrar sessões válidas
            const now = Date.now();
            const validSessions = {};
            
            for (const [deviceId, session] of Object.entries(sessions)) {
                if (session.lastActive && (now - session.lastActive < 24 * 60 * 60 * 1000)) {
                    validSessions[deviceId] = session;
                }
            }
            
            const count = Object.keys(validSessions).length;
            const currentDevice = window.sessionManager?.currentDeviceId;

            let message = `📱 <strong>Dispositivos Ativos (${count}/2)</strong>\n\n`;

            for (const [deviceId, info] of Object.entries(validSessions)) {
                const isCurrent = deviceId === currentDevice;
                const browser = info.browser || 'Desconhecido';
                const lastActive = new Date(info.lastActive).toLocaleString('pt-BR');
                
                message += `${isCurrent ? '➡️' : '📱'} ${browser}\n`;
                message += `   Última atividade: ${lastActive}\n`;
                message += isCurrent ? '   (Este dispositivo)\n\n' : '\n';
            }

            if (count < 2) {
                message += `✅ Você pode logar em mais ${2 - count} dispositivo(s)`;
            } else {
                message += `⚠️ Limite atingido! Para adicionar mais dispositivos:\nWhatsApp: R$ 30,00 por dispositivo extra`;
            }

            alert(message);
        } catch (error) {
            console.error('❌ Erro ao listar devices:', error);
            alert('❌ Erro ao carregar dispositivos');
        }

        this.close();
    }

    openPersonalizar() {
        // Fecha o menu
        this.close();
        
        // Aguarda animação de fechamento e abre o modal de personalização
        setTimeout(() => {
            if (typeof window.WhiteLabelManager !== 'undefined') {
                window.WhiteLabelManager.abrirConfiguracao();
            } else {
                console.error('❌ WhiteLabelManager não disponível');
                alert('⚠️ Módulo de personalização não carregado. Recarregue a página.');
            }
        }, 300);
    }

    showPlanInfo() {
        // Fecha o menu
        this.close();
        
        // Aguarda animação de fechamento e mostra info do plano
        setTimeout(() => {
            if (typeof window.PlanoManager !== 'undefined') {
                window.PlanoManager.mostrarInfoPlano();
            } else {
                console.error('❌ PlanoManager não disponível');
                alert('⚠️ Módulo de plano não carregado. Recarregue a página.');
            }
        }, 300);
    }
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sidebarMenu = new SidebarMenu();
    });
} else {
    window.sidebarMenu = new SidebarMenu();
}

console.log('✅ Sidebar Menu JS carregado (contador corrigido)');