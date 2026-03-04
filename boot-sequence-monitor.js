(function () {
  if (window.bootMonitor) {
    console.log('🚀 [BOOT] bootMonitor já existe, reutilizando instância.');
    return;
  }

  window.bootMonitor = {
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
        steps: this.steps,
        errors: this.errors,
        generatedAt: new Date().toISOString()
      };
    }
  };

  console.log('✅ [BOOT] Monitor initialized');
})();
