(function () {
  const INIT_STEP = 'firebase-init';
  const LOG_PREFIX = '🔥 [FIREBASE-INIT]';

  if (window.firebaseReady && typeof window.firebaseReady.then === 'function') {
    console.log(`${LOG_PREFIX} Reusing existing firebaseReady promise.`);
    return;
  }

  const waitForFirebaseSdk = () => new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const timeoutMs = 10000;
    const intervalMs = 100;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const sdkReady = typeof window.firebase !== 'undefined' && typeof window.firebase.initializeApp === 'function';

      if (sdkReady) {
        clearInterval(timer);
        console.log(`${LOG_PREFIX} Firebase SDK detected after ${elapsed}ms.`);
        resolve();
        return;
      }

      if (elapsed >= timeoutMs) {
        clearInterval(timer);
        reject(new Error('Firebase SDK indisponível após 10s. Verifique conexão/CDN.'));
      }
    }, intervalMs);
  });

  window.firebaseReady = new Promise(async (resolve, reject) => {
    const timeoutMs = 10000;
    const timeoutHandle = setTimeout(() => {
      const error = new Error('Timeout global de inicialização do Firebase (10s).');
      console.error(`${LOG_PREFIX} ${error.message}`);
      if (window.bootMonitor) window.bootMonitor.fail(INIT_STEP, error.message);
      reject(error);
    }, timeoutMs);

    try {
      if (window.bootMonitor) window.bootMonitor.start(INIT_STEP);
      console.log(`${LOG_PREFIX} Starting Promise-based initialization.`);

      await waitForFirebaseSdk();

      if (!window.FIREBASE_CONFIG) {
        throw new Error('FIREBASE_CONFIG não encontrado. Carregue config.js antes de firebase-init.js.');
      }

      if (window.firebase.apps && window.firebase.apps.length > 0) {
        console.log(`${LOG_PREFIX} Firebase já inicializado (${window.firebase.apps.length} app).`);
        clearTimeout(timeoutHandle);
        if (window.bootMonitor) window.bootMonitor.complete(INIT_STEP);
        resolve(window.firebase.app());
        return;
      }

      console.log(`${LOG_PREFIX} Initializing Firebase app...`);
      const app = window.firebase.initializeApp(window.FIREBASE_CONFIG);
      console.log(`${LOG_PREFIX} Firebase initialized successfully.`);

      clearTimeout(timeoutHandle);
      if (window.bootMonitor) window.bootMonitor.complete(INIT_STEP);
      resolve(app);
    } catch (error) {
      clearTimeout(timeoutHandle);
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      if (window.bootMonitor) window.bootMonitor.fail(INIT_STEP, error.message || String(error));
      reject(error);
    }
  });
})();
