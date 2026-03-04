(function(global) {
  function normalizeId(value) {
    return String(value ?? '').trim();
  }

  function generateStableId(prefix = 'id') {
    if (global.crypto?.randomUUID) {
      return `${prefix}_${global.crypto.randomUUID()}`;
    }

    const randomPart = Math.random().toString(36).slice(2, 10);
    const timePart = Date.now().toString(36);
    return `${prefix}_${timePart}_${randomPart}`;
  }

  const api = { normalizeId, generateStableId };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.CoreUtils = api;
})(typeof window !== 'undefined' ? window : globalThis);
