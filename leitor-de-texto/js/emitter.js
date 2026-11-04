/*
 * Leitor de texto – emitter.js
 * Minimal event emitter shared by the TextReader modules.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});

  function createEmitter() {
    const listeners = new Map();

    function on(type, fn) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(fn);
      return () => off(type, fn);
    }

    function off(type, fn) {
      const set = listeners.get(type);
      if (set) set.delete(fn);
    }

    function emit(type, detail) {
      const set = listeners.get(type);
      if (!set) return;
      for (const fn of Array.from(set)) {
        try {
          fn(detail);
        } catch (error) {
          // A failing listener must never break playback.
          if (typeof console !== 'undefined') console.error(error);
        }
      }
    }

    function clear() {
      listeners.clear();
    }

    return { on, off, emit, clear };
  }

  ns.createEmitter = createEmitter;

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
