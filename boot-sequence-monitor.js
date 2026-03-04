(function () {
  if (window.bootMonitor) {
    console.log('🚀 [BOOT] bootMonitor já existe, reutilizando instância.');
    return;
  }

  window.bootMonitor = {
    version: '5.0.0-alpha',
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
      console.error(`❌ [BOOT] ${step} failed:`, error);
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
    getMemoryUsage() {
      if (!window.performance || !window.performance.memory) return null;
      const mem = window.performance.memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit
      };
    },
    exportReport() {
      const report = this.getReport();
      return JSON.stringify(report, null, 2);
    }
  };

  console.log('✅ [BOOT] Monitor initialized (v5.0.0-alpha)');
})();
