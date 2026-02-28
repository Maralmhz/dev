// ==============================================
// SESSION MANAGER - LIMITE DE SESSÕES
// ==============================================
// Sistema que limita logins simultâneos e cobra por slots extras

class SessionManager {
    constructor() {
        this.db = firebase.database();
        this.currentDeviceId = this.getDeviceId();
        this.sessionRef = null;
        this.MAX_FREE_SESSIONS = 2; // Limite grátis
        this.EXTRA_SESSION_PRICE = 30; // R$ 30 por sessão extra
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

    // Registra sessão ativa
    async registerSession(userId) {
        try {
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
            const userEmail = userId.replace(/[.@]/g, '_');
            const sessionsRef = this.db.ref(`sessions/${userEmail}`);
            const userConfigRef = this.db.ref(`users/${userEmail}/config`);

            // Busca configuração do usuário
            const configSnap = await userConfigRef.once('value');
            const userConfig = configSnap.val() || {};
            const maxSessions = userConfig.maxSessions || this.MAX_FREE_SESSIONS;

            // Busca sessões ativas
            const sessionsSnap = await sessionsRef.once('value');
            const activeSessions = sessionsSnap.val() || {};

            // Limpa sessões expiradas (mais de 5 minutos sem atividade)
            const now = Date.now();
            const validSessions = {};
            
            for (const [deviceId, session] of Object.entries(activeSessions)) {
                if (now - session.lastActive < 5 * 60 * 1000) { // 5 minutos
                    validSessions[deviceId] = session;
                } else {
                    // Remove sessão expirada
                    await this.db.ref(`sessions/${userEmail}/${deviceId}`).remove();
                }
            }

            // Verifica se já está logado neste dispositivo
            if (validSessions[this.currentDeviceId]) {
                return { allowed: true, message: 'Sessão já ativa neste dispositivo' };
            }

            // Verifica limite
            const activeCount = Object.keys(validSessions).length;
            
            if (activeCount >= maxSessions) {
                return {
                    allowed: false,
                    activeCount,
                    maxSessions,
                    needsUpgrade: true,
                    message: `Limite de ${maxSessions} dispositivo(s) atingido. Deslogue de outro dispositivo ou faça upgrade.`
                };
            }

            return { allowed: true };

        } catch (error) {
            console.error('❌ Erro ao verificar sessões:', error);
            return { allowed: true }; // Em caso de erro, permite o login
        }
    }

    // Lista sessões ativas do usuário
    async getActiveSessions(userId) {
        try {
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

    // Atualiza limite de sessões do usuário (para upgrade)
    async updateSessionLimit(userId, newLimit) {
        try {
            const userEmail = userId.replace(/[.@]/g, '_');
            await this.db.ref(`users/${userEmail}/config`).update({
                maxSessions: newLimit,
                updatedAt: Date.now()
            });
            console.log(`✅ Limite atualizado para ${newLimit} sessões`);
        } catch (error) {
            console.error('❌ Erro ao atualizar limite:', error);
        }
    }
}

// Expor globalmente
window.SessionManager = SessionManager;
window.sessionManager = new SessionManager();

console.log('✅ Session Manager inicializado - Limite: 2 devices | R$ 30 por adicional');