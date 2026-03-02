// ==============================================
// SESSION MANAGER - CONTROLE REAL DE SESSÕES
// BLOQUEIO ATÔMICO COM FIREBASE TRANSACTION
// ==============================================

class SessionManager {

    constructor() {
        this.currentDeviceId = this.getDeviceId();
        this.sessionRef = null;

        this.PLANOS_LIMITES = {
            starter: 2,
            professional: 4,
            enterprise: 6
        };

        this.MAX_FREE_SESSIONS = 2;

        this.currentUser = null;
        this.oficinaId = null;
        this.authReadyPromise = null;
    }

    init() {
        if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
            console.warn('Firebase ainda não inicializado');
            return false;
        }

        this.db = firebase.database();
        this.firestore = firebase.firestore();

        if (!this.authReadyPromise) {
            this.authReadyPromise = new Promise((resolve) => {
                firebase.auth().onAuthStateChanged(async (user) => {

                    if (!user) {
                        this.currentUser = null;
                        this.oficinaId = null;
                        resolve(null);
                        return;
                    }

                    this.currentUser = user;

                    try {
                        const oficinaId = await this.resolverOficinaId(user);
                        this.oficinaId = oficinaId;
                        resolve(user);
                    } catch (e) {
                        console.error('Erro ao resolver oficinaId', e);
                        resolve(user);
                    }

                });
            });
        }

        console.log('SessionManager inicializado');
        return true;
    }

    async waitForAuthReady() {
        if (!this.authReadyPromise) this.init();
        return this.authReadyPromise;
    }

    async resolverOficinaId(usuario) {
        const doc = await this.firestore.collection('usuarios').doc(usuario.uid).get();
        if (!doc.exists) throw new Error('Usuário não encontrado');

        const data = doc.data();
        if (data.status && data.status !== 'ativo') {
            throw new Error('Conta não ativa');
        }

        const oficinaId = data.oficinaId;
        if (!oficinaId) throw new Error('oficinaId não encontrado');

        sessionStorage.setItem('oficinaId', oficinaId);
        return oficinaId;
    }

    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substring(2);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            createdAt: Date.now(),
            lastActive: Date.now()
        };
    }

    async getSessionLimitByPlan() {
        try {
            const oficinaId = sessionStorage.getItem('oficinaId');
            if (!oficinaId) return this.MAX_FREE_SESSIONS;

            const doc = await this.firestore.collection('oficinas').doc(oficinaId).get();
            if (!doc.exists) return this.MAX_FREE_SESSIONS;

            const plano = doc.data().plano || 'starter';
            return this.PLANOS_LIMITES[plano] || this.MAX_FREE_SESSIONS;

        } catch (e) {
            console.error('Erro ao buscar plano', e);
            return this.MAX_FREE_SESSIONS;
        }
    }

    // ==========================================
    // VALIDA E REGISTRA EM UMA TRANSACTION
    // ==========================================
    async validateAndRegisterSession() {

        try {

            const user = firebase.auth().currentUser;
            if (!user) return { allowed: false, message: "Usuário não autenticado" };

            const userId = user.uid;
            const maxSessions = await this.getSessionLimitByPlan();
            const sessionsRef = this.db.ref(`sessions/${userId}`);

            const result = await sessionsRef.transaction((sessions) => {

                const now = Date.now();
                sessions = sessions || {};

                // remover expiradas (30 min)
                Object.keys(sessions).forEach((id) => {
                    if (now - sessions[id].lastActive > 30 * 60 * 1000) {
                        delete sessions[id];
                    }
                });

                const activeDevices = Object.keys(sessions);

                // se já existe neste device
                if (sessions[this.currentDeviceId]) {
                    sessions[this.currentDeviceId].lastActive = now;
                    return sessions;
                }

                if (activeDevices.length >= maxSessions) {
                    return; // aborta transaction
                }

                sessions[this.currentDeviceId] = this.getDeviceInfo();
                return sessions;

            });

            if (!result.committed) {
                return {
                    allowed: false,
                    message: `Limite de ${maxSessions} dispositivos atingido`
                };
            }

            this.sessionRef = this.db.ref(`sessions/${userId}/${this.currentDeviceId}`);
            this.sessionRef.onDisconnect().remove();

            this.heartbeatInterval = setInterval(() => {
                if (this.sessionRef) {
                    this.sessionRef.update({ lastActive: Date.now() });
                }
            }, 30000);

            return { allowed: true };

        } catch (error) {
            console.error('Erro na sessão', error);
            return { allowed: true };
        }
    }

    async cleanup() {
        try {
            if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
            if (this.sessionRef) await this.sessionRef.remove();
        } catch (e) {
            console.error('Erro ao limpar sessão', e);
        }
    }
}

// ==============================================
// INICIALIZAÇÃO SEGURA
// ==============================================

window.SessionManager = SessionManager;

if (typeof window !== 'undefined') {

    const wait = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            clearInterval(wait);
            window.sessionManager = new SessionManager();
            window.sessionManager.init();
            console.log('SessionManager pronto');
        }
    }, 100);

}
