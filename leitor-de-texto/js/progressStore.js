/*
 * Leitor de texto – progressStore.js
 * Preferences and "continue where you left off", on an injected Storage
 * (localStorage in the browser). Every access is guarded: without storage the
 * app keeps working, only without persistence.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});

  const DEFAULT_PREFIX = 'leitor-de-texto:v1';

  /** FNV-1a 32-bit hash, as 8 hex characters. */
  function hashText(text) {
    let hash = 0x811c9dc5;
    const value = String(text);
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }

  function createProgressStore(storage, options = {}) {
    const prefix = options.prefix || DEFAULT_PREFIX;
    const keys = {
      prefs: `${prefix}:prefs`,
      text: `${prefix}:text`,
      position: `${prefix}:position`,
    };

    function read(key) {
      try {
        return storage ? storage.getItem(key) : null;
      } catch (error) {
        return null;
      }
    }

    function write(key, value) {
      try {
        if (!storage) return false;
        storage.setItem(key, value);
        return true;
      } catch (error) {
        return false;
      }
    }

    function remove(key) {
      try {
        if (storage) storage.removeItem(key);
      } catch (error) {
        // ignore
      }
    }

    function readJson(key) {
      const raw = read(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch (error) {
        return null;
      }
    }

    function loadPrefs() {
      const prefs = readJson(keys.prefs);
      return prefs && typeof prefs === 'object' ? prefs : {};
    }

    function savePrefs(partial) {
      return write(keys.prefs, JSON.stringify({ ...loadPrefs(), ...partial }));
    }

    /** Saves the text to resume later; returns its hash. */
    function saveText(text) {
      const hash = hashText(text);
      const current = readJson(keys.position);
      if (!current || current.hash !== hash) {
        write(keys.text, text);
        write(keys.position, JSON.stringify({ hash, sentenceIndex: 0, sentenceCount: 0 }));
      }
      return hash;
    }

    function savePosition(text, sentenceIndex, sentenceCount) {
      const hash = hashText(text);
      const current = readJson(keys.position);
      if (!current || current.hash !== hash) saveText(text);
      return write(
        keys.position,
        JSON.stringify({ hash, sentenceIndex, sentenceCount, updatedAt: Date.now() })
      );
    }

    /** @returns {{text:string, sentenceIndex:number, sentenceCount:number}|null} */
    function loadSession() {
      const text = read(keys.text);
      const position = readJson(keys.position);
      if (!text || !position || position.hash !== hashText(text)) return null;
      return {
        text,
        sentenceIndex: Math.max(0, Number(position.sentenceIndex) || 0),
        sentenceCount: Math.max(0, Number(position.sentenceCount) || 0),
      };
    }

    function clearSession() {
      remove(keys.text);
      remove(keys.position);
    }

    return { loadPrefs, savePrefs, saveText, savePosition, loadSession, clearSession };
  }

  Object.assign(ns, { hashText, createProgressStore });

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
