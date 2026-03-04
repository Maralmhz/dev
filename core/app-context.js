class AppContext {
  static init(config) {
    if (!config) throw new Error('AppContext init: config obrigatório');

    this._config = config;
    this._initialized = true;
  }

  static ensureReady() {
    if (!this._initialized) {
      throw new Error('AppContext não inicializado');
    }
  }

  static getOficinaId() {
    this.ensureReady();
    const c = this._config || {};
    return c.oficinaId || c.oficina_id || null;
  }

  static getUser() {
    this.ensureReady();
    return this._config.user || null;
  }

  static getPlano() {
    this.ensureReady();
    return this._config.plano || null;
  }

  static isReady() {
    return !!this._initialized;
  }
}

window.AppContext = AppContext;
