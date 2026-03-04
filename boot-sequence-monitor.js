(function () {
  if (window.bootMonitor) {
    console.log('🚀 [BOOT] bootMonitor já existe, reutilizando instância.');
    return;
  }

  window.bootMonitor = {
    version: '5.0.0-alpha',
    startTime: window.performance?.now ? window.performance.now() : Date.now(),
    status: 'running',
    steps: {},
    errors: [],
    start(step) {
      this.steps[step] = {
        started: Date.now(),
        status: 'running'
      };
      console.log(`🚀 [BOOT] ${step} started`);
    },
    complete(step) {
      if (!this.steps[step]) this.start(step);
      this.steps[step].completed = Date.now();
      this.steps[step].status = 'success';
      this.steps[step].duration = this.steps[step].completed - this.steps[step].started;
      console.log(`✅ [BOOT] ${step} completed in ${this.steps[step].duration}ms`);
    },
    fail(step, error) {
      if (!this.steps[step]) this.start(step);
      this.steps[step].failed = Date.now();
      this.steps[step].status = 'failed';
      this.steps[step].error = error;
      this.errors.push({ step, error, timestamp: Date.now() });
      this.status = 'failed';
      console.error(`❌ [BOOT] ${step} failed:`, error);
    },
    getMemoryUsage() {
      if (window.performance?.memory) {
        return {
          usedJSHeapSize: window.performance.memory.usedJSHeapSize,
          totalJSHeapSize: window.performance.memory.totalJSHeapSize
        };
      }
      return null;
    },
    getReport() {
      return {
        version: this.version,
        steps: this.steps,
        errors: this.errors,
        memory: this.getMemoryUsage(),
        generatedAt: new Date().toISOString()
      };
    },
    exportReport() {
      const now = window.performance?.now ? window.performance.now() : Date.now();
      return {
        version: this.version,
        uptime: now - this.startTime,
        memory: this.getMemoryUsage?.(),
        steps: this.steps || [],
        status: this.status || 'unknown'
      };
    }
  };

  console.log('✅ [BOOT] Monitor initialized (v5.0.0-alpha)');
})();
