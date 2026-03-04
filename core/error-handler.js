class ErrorHandler {
  static init() {
    window.onerror = (msg, url, line, col, error) => {
      console.error('[GLOBAL ERROR]', msg, error);

      if (window.bootMonitor?.fail) {
        window.bootMonitor.fail('global_error', error);
      }
    };

    window.onunhandledrejection = (event) => {
      console.error('[UNHANDLED PROMISE]', event.reason);

      if (window.bootMonitor?.fail) {
        window.bootMonitor.fail('unhandled_promise', event.reason);
      }
    };
  }

  static capture(error, context = 'manual') {
    console.error(`[CAPTURED - ${context}]`, error);

    if (window.bootMonitor?.fail) {
      window.bootMonitor.fail(context, error);
    }
  }
}

window.ErrorHandler = ErrorHandler;
ErrorHandler.init();
