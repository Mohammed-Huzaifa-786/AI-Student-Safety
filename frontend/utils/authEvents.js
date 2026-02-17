// Simple auth event emitter to broadcast logout events across the app
const listeners = new Set();

export function onAuthLogout(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitAuthLogout() {
  for (const fn of Array.from(listeners)) {
    try { fn(); } catch (e) { console.warn('authEvents listener error', e); }
  }
}

export default { onAuthLogout, emitAuthLogout };
