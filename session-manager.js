// ==============================================
// SESSION MANAGER - LIMITE DE SESSÕES POR PLANO
// ==============================================
// Sistema que limita logins simultâneos baseado no plano

class SessionManager {
    constructor() {
        // ⚠️ NãO inicializar firebase aqui - aguardar está pronto
        this.currentDeviceId = this.getDeviceId();
        this.sessionRef = null;
        
        // 👉 LIMITES POR PLANO (sincronizado com gestao_oficina_plano.js)
        this.PLANOS_LIMITES = {
            starter: 2,
            professional: 4,
            enterprise: 6
        };
        
        this.MAX_FREE_SESSIONS = 2; // Fallback padrão
        this.EXTRA_SESSION_PRICE = 30; // R$ 30 por sessão extra
    }

    // Inicializar Firebase refs (chamar DEPOIS do Firebase estar pronto)
    init() {
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('⚠️ Firebase ainda não inicializado. SessionManager em modo espera.');
            return false;
        }
        
        this.db = firebase.database();
        this.firestore = firebase.firestore();
        console.log('✅ SessionManager inicializado com Firebase');
        return true;
    }

    // Gera ID único do dispositivo
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    // Obtém informações do dispositivo
    getDeviceInfo() {
        return {
            browser: navigator.userAgent.split('(')[1]?.split(')')[0] || 'Desconhecido',
            platform: navigator.platform || 'Desconhecido',
            timestamp: Date.now(),
            lastActive: Date.now()
        };
    }

    // 🆕 Busca limite de sessões baseado no plano
    async getSessionLimitByPlan(userId) {
        try {
            // Garantir que Firebase está pronto
            if (!this.firestore) {
                if (!this.init()) {
                    console.error('❌ Firebase não disponível');
                    return this.MAX_FREE_SESSIONS;
                }
            }
            
            const oficinaId = window.OFICINA_CONFIG?.oficinaId;
            
            if (!oficinaId) {
                console.log('⚠️ oficinaId não encontrado, usando limite padrão: 2');
                return this.MAX_FREE_SESSIONS;
            }
            
            // Busca plano da oficina no Firestore
            const docOficina = await this.firestore.collection('oficinas').doc(oficinaId).get();
            
            if (!docOficina.exists) {
                console.log('⚠️ Oficina não encontrada, usando limite padrão: 2');
                return this.MAX_FREE_SESSIONS;
            }
            
            const dados = docOficina.data();
            const plano = dados.plano || 'starter';
            const limite = this.PLANOS_LIMITES[plano] || this.MAX_FREE_SESSIONS;
            
            console.log(`✅ Plano "${plano}" detectado - Limite: ${limite} sessões`);
            return limite;
            
        } catch (error) {
            console.error('❌ Erro ao buscar plano:', error);
            return this.MAX_FREE_SESSIONS; // Fallback em caso de erro
        }
    }

    // Registra sessão ativa
    async registerSession(userId) {
        try {
            // Garantir que Firebase está pronto
            if (!this.db) {
                if (!this.init()) {
                    console.error('❌ Firebase não disponível para registrar sessão');
                    return;
                }
            }
            
            const userEmail = userId.replace(/[.@]/g, '_');
            this.sessionRef = this.db.ref(`sessions/${userEmail}/${this.currentDeviceId}`);

            // Registra sessão
            await this.sessionRef.set(this.getDeviceInfo());

            // Remove sessão quando desconectar
            this.sessionRef.onDisconnect().remove();

            // Atualiza lastActive a cada 30 segundos
            this.heartbeatInterval = setInterval(() => {
                if (this.sessionRef) {
                    this.sessionRef.update({ lastActive: Date.now() });
                }
            }, 30000);

            console.log('✅ Sessão registrada:', this.currentDeviceId);
        } catch (error) {
            console.error('❌ Erro ao registrar sessão:', error);
        }
    }

    // Verifica limite de sessões antes de logar
    async checkSessionLimit(userId) {
        try {
            // Garantir que Firebase está pronto
            if (!this.db) {
                if (!this.init()) {
                    console.error('❌ Firebase não disponível');
                    return { allowed: true }; // Permitir em caso de erro de inicialização
                }
            }
            
            const userEmail = userId.replace(/[.@]/g, '_');
            const sessionsRef = this.db.ref(`sessions/${userEmail}`);

            // 👉 BUSCA LIMITE BASEADO NO PLANO
            const maxSessions = await this.getSessionLimitByPlan(userId);

            // Busca sessões ativas
            const sessionsSnap = await sessionsRef.once('value');
            const activeSessions = sessionsSnap.val() || {};

            // 🧼 Limpa sessões expiradas (24 horas)
            const now = Date.now();
            const validSessions = {};
            
            for (const [deviceId, session] of Object.entries(activeSessions)) {
                if (now - session.lastActive < 24 * 60 * 60 * 1000) { // 24 horas
                    validSessions[deviceId] = session;
                } else {
                    // Remove sessão expirada
                    await this.db.ref(`sessions/${userEmail}/${deviceId}`).remove();
                    console.log('🗑️ Sessão expirada removida:', deviceId);
                }
            }

            // 👉 CORREÇÃO: Se já está logado neste dispositivo, permitir (não contar como novo)
            if (validSessions[this.currentDeviceId]) {
                console.log('✅ Sessão já ativa neste dispositivo - permitindo');
                return { allowed: true, message: 'Sessão já ativa neste dispositivo' };
            }

            // 👉 CONTAR APENAS OUTROS DISPOSITIVOS (excluir o atual)
            const otherDevices = Object.keys(validSessions).filter(id => id !== this.currentDeviceId);
            const activeCount = otherDevices.length;
            
            console.log(`📊 Sessões ativas: ${activeCount} dispositivo(s) (excluindo atual)`);
            console.log(`📊 Limite do plano: ${maxSessions}`);
            console.log(`📊 Dispositivos: ${otherDevices.join(', ')}`);
            
            // 👉 VERIFICAR SE PODE ADICIONAR MAIS UM
            if (activeCount >= maxSessions) {
                console.warn(`⚠️ Limite atingido! ${activeCount} sessões ativas, limite é ${maxSessions}`);
                
                return {
                    allowed: false,
                    activeCount,
                    maxSessions,
                    needsUpgrade: true,
                    message: `Limite de ${maxSessions} dispositivo(s) atingido. Deslogue de outro dispositivo ou faça upgrade do plano.`
                };
            }

            console.log(`✅ Sessão permitida! (${activeCount + 1}/${maxSessions} após login)`);
            return { allowed: true, activeCount, maxSessions };

        } catch (error) {
            console.error('❌ Erro ao verificar sessões:', error);
            return { allowed: true }; // Em caso de erro, permite o login
        }
    }

    // Lista sessões ativas do usuário
    async getActiveSessions(userId) {
        try {
            if (!this.db) this.init();
            
            const userEmail = userId.replace(/[.@]/g, '_');
            const sessionsRef = this.db.ref(`sessions/${userEmail}`);
            const snapshot = await sessionsRef.once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('❌ Erro ao buscar sessões:', error);
            return {};
        }
    }

    // Remove sessão específica
    async removeSession(userId, deviceId) {
        try {
            if (!this.db) this.init();
            
            const userEmail = userId.replace(/[.@]/g, '_');
            await this.db.ref(`sessions/${userEmail}/${deviceId}`).remove();
            console.log('✅ Sessão removida:', deviceId);
        } catch (error) {
            console.error('❌ Erro ao remover sessão:', error);
        }
    }

    // Limpa sessão atual ao fazer logout
    async cleanup(userId) {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
            }
            
            if (this.sessionRef) {
                await this.sessionRef.remove();
            }

            console.log('✅ Sessão limpa');
        } catch (error) {
            console.error('❌ Erro ao limpar sessão:', error);
        }
    }

    // Atualiza limite de sessões do usuário (para upgrade) - DEPRECATED
    async updateSessionLimit(userId, newLimit) {
        console.warn('⚠️ updateSessionLimit() DEPRECATED - Use PlanoManager.atualizarPlano()');
        console.warn('⚠️ O limite agora é definido pelo plano no Firestore');
    }
}

// Expor globalmente
window.SessionManager = SessionManager;

// ⚠️ NÃO instanciar automaticamente - aguardar Firebase estar pronto
// A instância será criada manualmente após Firebase.initializeApp()
if (typeof window !== 'undefined') {
    // Criar instância após Firebase estar disponível
    const waitForFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
            clearInterval(waitForFirebase);
            window.sessionManager = new SessionManager();
            window.sessionManager.init();
            console.log('✅ Session Manager pronto - Limites: Starter=2 | Professional=4 | Enterprise=6');
        }
    }, 100);
    
    // Timeout de segurança (10 segundos)
    setTimeout(() => {
        if (!window.sessionManager) {
            clearInterval(waitForFirebase);
            console.warn('⚠️ Firebase não detectado em 10s - criando SessionManager sem inicialização');
            window.sessionManager = new SessionManager();
        }
    }, 10000);
}