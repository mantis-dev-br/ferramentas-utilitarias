/*
 * Leitor de texto – speechEngine.js
 * Thin adapter over the Web Speech API (speechSynthesis). It is the only module
 * that touches the real speech objects, which are injected for testability.
 *
 * Browser bugs handled here:
 *  - Chrome may garbage-collect an utterance that is not referenced, and its
 *    "end" event never fires: every utterance is kept until it ends (rule R13).
 *  - Events are normalized to { id, ... } so the controller can drop stale ones.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});
  if (!ns.createEmitter && typeof require === 'function') require('./emitter.js');

  function createSpeechEngine(options = {}) {
    const synth = options.synth || root.speechSynthesis;
    const Utterance = options.Utterance || root.SpeechSynthesisUtterance;
    if (!synth || typeof Utterance !== 'function') {
      throw new Error('Speech synthesis is not available.');
    }

    const emitter = ns.createEmitter();
    const alive = new Map(); // id -> utterance (keeps references, see header)

    function release(id) {
      const utterance = alive.get(id);
      if (!utterance) return;
      utterance.onstart = utterance.onend = utterance.onerror = utterance.onboundary = null;
      alive.delete(id);
    }

    /**
     * Queues a chunk to be spoken.
     * @param {{text:string}} chunk
     * @param {{id:string, voice?:object, rate?:number, lang?:string}} settings
     */
    function speak(chunk, settings) {
      const { id, voice, rate = 1, lang } = settings;
      const utterance = new Utterance(chunk.text);
      if (voice) utterance.voice = voice;
      utterance.lang = (voice && voice.lang) || lang || 'pt-BR';
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => emitter.emit('start', { id });
      utterance.onend = () => {
        release(id);
        emitter.emit('end', { id });
      };
      utterance.onerror = (event) => {
        release(id);
        emitter.emit('error', { id, error: (event && event.error) || 'unknown' });
      };
      utterance.onboundary = (event) => {
        if (!event || (event.name && event.name !== 'word')) return;
        emitter.emit('boundary', {
          id,
          charIndex: event.charIndex,
          charLength: event.charLength || 0,
        });
      };

      alive.set(id, utterance);
      synth.speak(utterance);
    }

    /** Stops everything. Events from cancelled utterances are swallowed. */
    function cancel() {
      for (const id of Array.from(alive.keys())) release(id);
      synth.cancel();
    }

    function getVoices() {
      try {
        return synth.getVoices() || [];
      } catch (error) {
        return [];
      }
    }

    function onVoicesChanged(fn) {
      if (typeof synth.addEventListener === 'function') {
        synth.addEventListener('voiceschanged', fn);
        return () => synth.removeEventListener('voiceschanged', fn);
      }
      synth.onvoiceschanged = fn;
      return () => {
        if (synth.onvoiceschanged === fn) synth.onvoiceschanged = null;
      };
    }

    return {
      speak,
      cancel,
      getVoices,
      onVoicesChanged,
      on: emitter.on,
      off: emitter.off,
      get pendingCount() {
        return alive.size;
      },
    };
  }

  ns.createSpeechEngine = createSpeechEngine;

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
