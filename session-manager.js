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

        this.currentUser = null;
        this.oficinaId = null;
        this.authReadyPromise = null;
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

        if (!this.authReadyPromise) {
            this.authReadyPromise = new Promise((resolve) => {
                firebase.auth().onAuthStateChanged(async (user) => {
                    if (!user) {
                        this.currentUser = null;
                        this.oficinaId = null;
                        window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId: null };
                        window.oficinaId = null;
                        resolve(null);
                        return;
                    }

                    this.currentUser = user;

                    try {
                        const oficinaId = await this.resolverOficinaId(user);
                        this.oficinaId = oficinaId;
                        window.OFICINA_CONFIG = { ...window.OFICINA_CONFIG, oficinaId };
                        window.oficinaId = oficinaId;
                        console.log('✅ SessionManager: oficinaId resolvido:', oficinaId);
                        resolve(user);
                    } catch (error) {
                        console.error('❌ SessionManager: falha ao resolver oficinaId:', error);
                        resolve(user);
                    }
                });
            });
        }

        return true;
    }

    async waitForAuthReady() {
        if (!this.authReadyPromise) {
            this.init();
        }

        return this.authReadyPromise;
    }

    async resolverOficinaId(usuario) {
        if (!usuario) {
            throw new Error('Usuário não autenticado para resolver oficinaId');
        }

        let oficinaId = sessionStorage.getItem('oficinaId');
        if (oficinaId && oficinaId !== 'undefined' && oficinaId !== 'null') {
            return oficinaId;
        }

        const userDocRef = this.firestore.collection('usuarios').doc(usuario.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            throw new Error('Usuário não encontrado no Firestore');
        }

        const userData = userDoc.data() || {};
        if (userData.status && userData.status !== 'ativo') {
            throw new Error(`Conta não está ativa. Status: ${userData.status}`);
        }

        oficinaId = userData.oficinaId;

        if (!oficinaId) {
            oficinaId = await this.criarOficinaParaUsuario(usuario, userData);
            await userDocRef.set({ oficinaId }, { merge: true });
        }

        sessionStorage.setItem('oficinaId', oficinaId);
        sessionStorage.setItem('userRole', userData.role || 'admin');
        sessionStorage.setItem('userEmail', usuario.email || '');

        return oficinaId;
    }

    async criarOficinaParaUsuario(usuario, userData = {}) {
        const nomeBase = (userData.nomeOficina || userData.nome || usuario.displayName || 'Minha Oficina').trim();
        const nomeNormalizado = nomeBase
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 24) || 'oficina';

        let oficinaId = `${nomeNormalizado}-${Date.now().toString(36).slice(-6)}`;
        let tentativas = 0;

        while (tentativas < 5) {
            const oficinaDoc = await this.firestore.collection('oficinas').doc(oficinaId).get();
            if (!oficinaDoc.exists) break;

            tentativas += 1;
            const sufixo = Math.random().toString(36).substring(2, 6);
            oficinaId = `${nomeNormalizado}-${sufixo}`;
        }

        if (tentativas >= 5) {
            throw new Error('Não foi possível gerar oficinaId único após 5 tentativas');
        }

        await this.firestore.collection('oficinas').doc(oficinaId).set({
            oficinaId,
            nome: nomeBase,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
            criadoPor: usuario.email || userData.email || usuario.uid,
            plano: 'starter',
            usuariosAtivos: 1,
            limiteUsuarios: 2
        });

        if (usuario.email) {
            await this.firestore
                .collection('oficinas')
                .doc(oficinaId)
                .collection('usuarios')
                .doc(usuario.email)
                .set({
                    email: usuario.email,
                    role: userData.role || 'admin',
                    adicionadoEm: firebase.firestore.FieldValue.serverTimestamp()
                });
        }

        return oficinaId;
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



window.resolverOficinaId = async function resolverOficinaId(usuario) {
    if (!window.sessionManager) {
        throw new Error('SessionManager não inicializado');
    }

    return window.sessionManager.resolverOficinaId(usuario);
};

window.waitForOficinaIdReady = async function() {
    if (!window.sessionManager) {
        throw new Error('SessionManager não inicializado');
    }

    const user = await window.sessionManager.waitForAuthReady();
    if (!user) {
        throw new Error('Usuário não autenticado');
    }

    const oficinaId = window.sessionManager.oficinaId || sessionStorage.getItem('oficinaId');
    if (!oficinaId || oficinaId === 'undefined' || oficinaId === 'null') {
        throw new Error('oficinaId não resolvido');
    }

    return oficinaId;
};

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
