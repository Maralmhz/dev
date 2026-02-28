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
        // Botão hambúrger
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
                <span class="sidebar-plan">⭐ Plano Básico</span>
            </div>

            <nav class="sidebar-nav">
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('novo-checklist')">
                    <i>➕</i>
                    <span>Novo Checklist</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('historico')">
                    <i>📋</i>
                    <span>Histórico</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('relatorios')">
                    <i>📊</i>
                    <span>Relatórios</span>
                </a>
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.close(); switchTab('gestao-oficina')">
                    <i>🛠️</i>
                    <span>Gestão Oficina</span>
                </a>
                
                <div class="sidebar-divider"></div>
                
                <a href="#" class="sidebar-nav-item" onclick="sidebarMenu.showDevices()">
                    <i>📱</i>
                    <span>Dispositivos Ativos</span>
                    <span class="sidebar-badge" id="deviceCount">0</span>
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
            }
        });
    }

    async updateDeviceCount() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            const sessions = await window.sessionManager.getActiveSessions(user.email);
            const count = Object.keys(sessions).length;
            const badge = document.getElementById('deviceCount');
            if (badge) {
                badge.textContent = count;
            }
        } catch (error) {
            console.error('❌ Erro ao contar devices:', error);
        }
    }

    async showDevices() {
        const user = firebase.auth().currentUser;
        if (!user) return;

        try {
            const sessions = await window.sessionManager.getActiveSessions(user.email);
            const count = Object.keys(sessions).length;
            const currentDevice = window.sessionManager.currentDeviceId;

            let message = `📱 <strong>Dispositivos Ativos (${count}/2)</strong>\n\n`;

            for (const [deviceId, info] of Object.entries(sessions)) {
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
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.sidebarMenu = new SidebarMenu();
    });
} else {
    window.sidebarMenu = new SidebarMenu();
}

console.log('✅ Sidebar Menu JS carregado');