class SessionManager {
  constructor() {
    this.MAX_FREE_SESSIONS = 2;
    this.PLANOS_LIMITES = {
      starter: 2,
      pro: 5,
      enterprise: 999
    };
    this.currentDeviceId = this.getDeviceId();
    this.currentUser = null;
    this.oficinaId = null;
    this.db = null;
    this.firestore = null;
    this.authReadyPromise = null;
    this.sessionRef = null;
    this.heartbeatInterval = null;
    this.sessionCreatedAt = Date.now();
  }

  init() {
    if (typeof firebase === 'undefined' || !firebase.apps || firebase.apps.length === 0) {
      console.warn('⚠️ [SessionManager] Firebase ainda não inicializado');
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
            console.error('❌ [SessionManager] Erro ao resolver oficinaId', e);
            resolve(user);
          }
        });
      });
    }

    console.log('✅ [SessionManager] Inicializado');
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
    if (data.status && data.status !== 'ativo') throw new Error('Conta não ativa');

    const oficinaId = data.oficinaId;
    if (!oficinaId) throw new Error('oficinaId não encontrado');

    sessionStorage.setItem('oficinaId', oficinaId);
    return oficinaId;
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2)}`;
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
      console.error('❌ [SessionManager] Erro ao buscar plano', e);
      return this.MAX_FREE_SESSIONS;
    }
  }

  async isSessionValid() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return false;

      const sessionsSnapshot = await this.db.ref(`sessions/${user.uid}`).once('value');
      const sessions = sessionsSnapshot.val() || {};
      const current = sessions[this.currentDeviceId];
      if (!current) return false;

      const expired = Date.now() - (current.lastActive || 0) > 30 * 60 * 1000;
      return !expired;
    } catch (error) {
      console.error('❌ [SessionManager] isSessionValid falhou', error);
      return false;
    }
  }

  async getSessionInfo() {
    const user = firebase.auth().currentUser;
    const sessionId = this.currentDeviceId;

    if (!user) {
      return {
        sessionId,
        createdAt: this.sessionCreatedAt,
        activeSessions: 0,
        sessionLimit: this.MAX_FREE_SESSIONS
      };
    }

    let activeSessions = 0;
    try {
      const snapshot = await this.db.ref(`sessions/${user.uid}`).once('value');
      const sessions = snapshot.val() || {};
      activeSessions = Object.keys(sessions).length;
    } catch (error) {
      console.warn('⚠️ [SessionManager] Não foi possível contar sessões ativas', error);
    }

    return {
      sessionId,
      createdAt: this.sessionCreatedAt,
      activeSessions,
      sessionLimit: await this.getSessionLimitByPlan()
    };
  }

  async validateAndRegisterSession() {
    try {
      const validationPromise = this._validateAndRegisterSessionImpl();
      return await Promise.race([
        validationPromise,
        new Promise((resolve) => setTimeout(() => {
          resolve({ allowed: false, message: 'Timeout ao validar sessão (5s)' });
        }, 5000))
      ]);
    } catch (error) {
      console.error('❌ [SessionManager] Erro na validação de sessão', error);
      return { allowed: false, message: `Erro na validação de sessão: ${error.message || error}` };
    }
  }

  async _validateAndRegisterSessionImpl() {
    const user = firebase.auth().currentUser;
    if (!user) return { allowed: false, message: 'Usuário não autenticado' };

    const userId = user.uid;
    const maxSessions = await this.getSessionLimitByPlan();
    const sessionsRef = this.db.ref(`sessions/${userId}`);

    const result = await sessionsRef.transaction((sessions) => {
      const now = Date.now();
      const updated = sessions || {};

      Object.keys(updated).forEach((id) => {
        if (now - updated[id].lastActive > 30 * 60 * 1000) delete updated[id];
      });

      const activeDevices = Object.keys(updated);
      if (updated[this.currentDeviceId]) {
        updated[this.currentDeviceId].lastActive = now;
        return updated;
      }

      if (activeDevices.length >= maxSessions) return;

      updated[this.currentDeviceId] = this.getDeviceInfo();
      return updated;
    });

    if (!result.committed) {
      return {
        allowed: false,
        message: `Limite de ${maxSessions} dispositivos ativos atingido`
      };
    }

    this.sessionRef = this.db.ref(`sessions/${userId}/${this.currentDeviceId}`);
    this.sessionRef.onDisconnect().remove();

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = setInterval(() => {
      if (this.sessionRef) this.sessionRef.update({ lastActive: Date.now() });
    }, 30000);

    console.log('✅ [SessionManager] Sessão validada e registrada');
    return { allowed: true, message: 'Sessão válida' };
  }

  async cleanup() {
    try {
      if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
      if (this.sessionRef) await this.sessionRef.remove();
    } catch (e) {
      console.error('❌ [SessionManager] Erro ao limpar sessão', e);
    }
  }
}

window.SessionManager = SessionManager;

if (typeof window !== 'undefined') {
  const wait = setInterval(() => {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      clearInterval(wait);
      window.sessionManager = new SessionManager();
      window.sessionManager.init();
      console.log('✅ [SessionManager] Pronto globalmente');
    }
  }, 100);
}
