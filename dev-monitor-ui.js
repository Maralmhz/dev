(function () {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug') || params.get('debug') !== '1') {
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'dev-monitor';
  panel.style.cssText = [
    'position:fixed', 'bottom:10px', 'right:10px', 'z-index:999999',
    'background:rgba(0,0,0,.85)', 'color:#fff', 'padding:10px',
    'border-radius:8px', 'font:12px/1.4 monospace', 'min-width:240px', 'box-shadow:0 4px 12px rgba(0,0,0,.3)'
  ].join(';');

  panel.innerHTML = `
    <div>🚀 Boot: <span id="boot-status">⏳</span></div>
    <div>🔥 Firebase: <span id="fb-status">⏳</span></div>
    <div>📦 Modules: <span id="modules-status">0/0</span></div>
    <div>💾 Memory: <span id="memory-usage">n/a</span></div>
    <div>❗ Errors: <span id="errors-count">0</span></div>
    <button id="copy-debug-report" style="margin-top:8px;width:100%;padding:4px;">📋 Copy Report</button>
  `;

  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));

  function copyDebugReport() {
    const report = {
      boot: window.bootMonitor?.getReport?.() || {},
      firebaseApps: window.firebase?.apps?.length || 0,
      modules: {
        loaded: window.__modulosCarregados || 0,
        total: window.__modulosTotal || 0,
        status: window.__modulosStatus || {}
      },
      memory: performance.memory || null,
      href: window.location.href,
      timestamp: new Date().toISOString()
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2)).then(() => {
      console.log('📋 [DEV-MONITOR] Report copied.');
    }).catch((err) => {
      console.error('❌ [DEV-MONITOR] Failed to copy report', err);
    });
  }

  const update = () => {
    const report = window.bootMonitor?.getReport?.();
    const steps = report?.steps || {};
    const hasFailure = Object.values(steps).some((s) => s.status === 'failed');
    const running = Object.values(steps).some((s) => s.status === 'running');

    const bootStatus = hasFailure ? '❌' : running ? '⏳' : '✅';
    const firebaseStatus = window.firebase?.apps?.length ? '✅' : '⏳';

    document.getElementById('boot-status').textContent = bootStatus;
    document.getElementById('fb-status').textContent = firebaseStatus;
    document.getElementById('modules-status').textContent = `${window.__modulosCarregados || 0}/${window.__modulosTotal || 0}`;
    document.getElementById('errors-count').textContent = (report?.errors || []).length;

    if (performance.memory) {
      const mb = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
      document.getElementById('memory-usage').textContent = `${mb} MB`;
    }
  };

  document.addEventListener('click', (event) => {
    if (event.target && event.target.id === 'copy-debug-report') {
      copyDebugReport();
    }
  });

  setInterval(update, 1000);
  update();
})();
