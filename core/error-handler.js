class ErrorHandler {
  static init() {
    window.onerror = (msg, url, line, col, error) => {
      console.error('[GLOBAL ERROR]', msg, error);
    };

    window.onunhandledrejection = (event) => {
      console.error('[UNHANDLED PROMISE]', event.reason);
    };
  }
}

window.ErrorHandler = ErrorHandler;
ErrorHandler.init();
