/*
 * Leitor de texto – readerController.js
 * Playback state machine: idle → playing ⇄ paused → finished.
 *
 * - Sentences are the navigation unit; chunks (≤ chunkLimit chars) are what the
 *   voice speaks, so online voices never hit Chrome's ~15 s cut-off (R6–R8).
 * - Pause = cancel + remember the sentence; resume re-reads it (R9).
 * - Up to `lookahead` chunks are queued ahead to avoid silent gaps (R10).
 * - A watchdog retries a stalled chunk once, then skips it (R11).
 * - Every cancel bumps a generation number; stale events are ignored (R12).
 * - If a chunk was sent but the voice has not started after `bufferingDelay`
 *   ms (online voices fetch audio from a server), "buffering" is emitted (R22).
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});
  if (typeof require === 'function') {
    if (!ns.createEmitter) require('./emitter.js');
    if (!ns.segment) require('./textSegmenter.js');
    if (!ns.chunkLimit) require('./voiceCatalog.js');
    if (!ns.createSpeechEngine) require('./speechEngine.js');
  }

  // Errors that will not go away by retrying: stop and tell the user.
  const FATAL_ERRORS = new Set([
    'not-allowed',
    'synthesis-unavailable',
    'audio-hardware',
    'language-unavailable',
    'voice-unavailable',
  ]);
  const MAX_CONSECUTIVE_SKIPS = 3;

  const FATAL_MESSAGES = {
    'not-allowed': 'O navegador bloqueou a leitura. Toque em Ler para começar.',
    'audio-hardware': 'Não foi possível usar a saída de áudio do aparelho.',
    'language-unavailable': 'A voz escolhida não está disponível. Escolha outra voz.',
    'voice-unavailable': 'A voz escolhida não está disponível. Escolha outra voz.',
    'synthesis-unavailable': 'A leitura em voz alta não está disponível neste navegador.',
  };

  function defaultClock() {
    return {
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (id) => clearTimeout(id),
    };
  }

  function createReader(options = {}) {
    const engine = options.engine || ns.createSpeechEngine(options);
    const clock = options.clock || defaultClock();
    const lookahead = Math.max(1, options.lookahead || 2);
    const defaultLocale = options.locale || 'pt-BR';
    const bufferingDelay = options.bufferingDelay == null ? 300 : options.bufferingDelay;
    const emitter = ns.createEmitter();

    let text = '';
    let sentences = [];
    let wordsBefore = [0]; // wordsBefore[i] = words in sentences 0..i-1
    let status = 'idle';
    let cursor = 0;
    let voice = options.voice || null;
    let rate = ns.clampRate(options.rate == null ? 1 : options.rate);

    let generation = 0;
    let sequence = 0;
    let inFlight = []; // [{ id, chunk, pos: { s, c } }] in speaking order
    let next = null; // next position to enqueue
    let watchdog = null;
    let bufferTimer = null;
    let buffering = false;
    let lastEmitted = -1;
    let consecutiveSkips = 0;
    const failures = new Map();
    const chunkCache = new Map();

    // ---- helpers -----------------------------------------------------------

    function chunksFor(index) {
      if (!chunkCache.has(index)) {
        const maxChars = ns.chunkLimit(voice, rate);
        chunkCache.set(index, ns.chunk(sentences[index], { maxChars }));
      }
      return chunkCache.get(index);
    }

    function advance(pos) {
      if (pos.c + 1 < chunksFor(pos.s).length) return { s: pos.s, c: pos.c + 1 };
      return pos.s + 1 < sentences.length ? { s: pos.s + 1, c: 0 } : null;
    }

    function clampIndex(index) {
      const value = Math.floor(Number(index) || 0);
      return Math.min(Math.max(0, value), Math.max(0, sentences.length - 1));
    }

    function getState() {
      const remainingWords = sentences.length
        ? wordsBefore[sentences.length] - wordsBefore[cursor]
        : 0;
      return {
        status,
        sentenceIndex: cursor,
        sentenceCount: sentences.length,
        voiceURI: voice ? voice.voiceURI : null,
        rate,
        remainingMinutes: ns.estimateMinutes(remainingWords, rate),
        buffering,
      };
    }

    function setStatus(value, force) {
      if (status === value && !force) return;
      status = value;
      emitter.emit('statechange', getState());
    }

    function emitSentence(index) {
      cursor = index;
      if (lastEmitted === index) return;
      lastEmitted = index;
      const sentence = sentences[index];
      emitter.emit('sentence', {
        index,
        start: sentence.start,
        end: sentence.end,
        count: sentences.length,
      });
    }

    function clearWatchdog() {
      if (watchdog !== null) clock.clearTimeout(watchdog);
      watchdog = null;
      if (bufferTimer !== null) clock.clearTimeout(bufferTimer);
      bufferTimer = null;
    }

    function setBuffering(value) {
      if (buffering === value) return;
      buffering = value;
      emitter.emit('buffering', { buffering: value, sentenceIndex: cursor });
    }

    /** Head chunk sent but not started yet: report "buffering" after a short delay. */
    function watchHeadStart() {
      const head = inFlight[0];
      if (!head || head.started) {
        setBuffering(false);
        return;
      }
      const { id } = head;
      bufferTimer = clock.setTimeout(() => {
        bufferTimer = null;
        if (inFlight[0] && inFlight[0].id === id && !inFlight[0].started) setBuffering(true);
      }, bufferingDelay);
    }

    function armWatchdog() {
      clearWatchdog();
      const head = inFlight[0];
      if (!head) return;
      const seconds = head.chunk.text.length / (ns.CHARS_PER_SECOND * rate);
      const ms = seconds * 2000 + 4000;
      const { id } = head;
      watchdog = clock.setTimeout(() => {
        watchdog = null;
        if (inFlight[0] && inFlight[0].id === id) fail(inFlight[0], 'timeout');
      }, ms);
      watchHeadStart();
    }

    /** Cancels everything queued; events from before this call become stale. */
    function halt() {
      generation++;
      clearWatchdog();
      setBuffering(false);
      inFlight = [];
      next = null;
      engine.cancel();
    }

    function enqueue(pos) {
      const chunk = chunksFor(pos.s)[pos.c];
      const id = `${generation}.${++sequence}`;
      inFlight.push({ id, chunk, pos });
      engine.speak(chunk, { id, voice, rate, lang: (voice && voice.lang) || defaultLocale });
    }

    function fill() {
      const wasEmpty = inFlight.length === 0;
      while (inFlight.length < lookahead && next) {
        const pos = next;
        next = advance(pos);
        enqueue(pos);
      }
      if (wasEmpty && inFlight.length) armWatchdog();
    }

    function run(pos) {
      halt();
      next = pos;
      emitSentence(pos.s);
      setStatus('playing');
      fill();
    }

    function finish() {
      clearWatchdog();
      setBuffering(false);
      inFlight = [];
      next = null;
      cursor = Math.max(0, sentences.length - 1);
      setStatus('finished');
      emitter.emit('finished', getState());
    }

    function stopWithError(code, message) {
      halt();
      setStatus('paused');
      emitter.emit('warning', { code, message, fatal: true });
    }

    function fail(item, reason) {
      if (FATAL_ERRORS.has(reason)) {
        stopWithError(reason, FATAL_MESSAGES[reason]);
        return;
      }
      const key = `${item.pos.s}:${item.pos.c}`;
      const attempts = (failures.get(key) || 0) + 1;
      failures.set(key, attempts);
      if (attempts < 2) {
        run(item.pos); // retry the same chunk once
        return;
      }

      failures.delete(key);
      consecutiveSkips++;
      if (consecutiveSkips >= MAX_CONSECUTIVE_SKIPS) {
        consecutiveSkips = 0;
        stopWithError(
          reason,
          'A voz parou de responder. Tente de novo ou escolha outra voz nos ajustes.'
        );
        return;
      }
      emitter.emit('warning', {
        code: 'skipped',
        message: `Não foi possível ler parte da frase ${item.pos.s + 1}. Ela foi pulada.`,
        sentenceIndex: item.pos.s,
        fatal: false,
      });
      const following = advance(item.pos);
      if (following) run(following);
      else {
        halt();
        finish();
      }
    }

    // ---- engine events -----------------------------------------------------

    function onEngineStart({ id }) {
      const index = inFlight.findIndex((item) => item.id === id);
      if (index < 0) return;
      // A later chunk started: the earlier ones are done even without "end".
      if (index > 0) {
        inFlight.splice(0, index);
        fill();
      }
      inFlight[0].started = true;
      armWatchdog();
      const head = inFlight[0];
      if (head.pos.s !== lastEmitted) emitSentence(head.pos.s);
    }

    function onEngineEnd({ id }) {
      const index = inFlight.findIndex((item) => item.id === id);
      if (index < 0) return;
      inFlight.splice(0, index + 1);
      consecutiveSkips = 0;
      clearWatchdog();
      if (!inFlight.length && !next) {
        finish();
        return;
      }
      fill();
      armWatchdog();
      // Move the cursor as soon as a sentence ends, so pausing in the gap
      // before the next "start" does not re-read the finished sentence.
      if (inFlight[0].pos.s !== lastEmitted) emitSentence(inFlight[0].pos.s);
    }

    function onEngineError({ id, error }) {
      const item = inFlight.find((entry) => entry.id === id);
      if (item) fail(item, error);
    }

    function onEngineBoundary({ id, charIndex, charLength }) {
      const head = inFlight[0];
      if (!head || head.id !== id || !(charIndex >= 0)) return;
      const start = head.chunk.start + charIndex;
      let end = start + (charLength || 0);
      if (!charLength) {
        const match = /^[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/u.exec(text.slice(start, start + 64));
        end = start + (match ? match[0].length : 0);
      }
      if (end > start) emitter.emit('word', { start, end, sentenceIndex: head.pos.s });
    }

    const unsubscribe = [
      engine.on('start', onEngineStart),
      engine.on('end', onEngineEnd),
      engine.on('error', onEngineError),
      engine.on('boundary', onEngineBoundary),
    ];

    // ---- public API --------------------------------------------------------

    /** Loads a new text and stops any reading. Returns the sentences. */
    function load(newText, loadOptions = {}) {
      halt();
      text = String(newText == null ? '' : newText);
      sentences = ns.segment(text, { locale: (voice && voice.lang) || defaultLocale });
      wordsBefore = [0];
      for (const sentence of sentences) {
        wordsBefore.push(wordsBefore[wordsBefore.length - 1] + ns.countWords(sentence.text));
      }
      chunkCache.clear();
      failures.clear();
      consecutiveSkips = 0;
      lastEmitted = -1;
      cursor = clampIndex(loadOptions.startAt);
      emitter.emit('load', { sentences, text });
      setStatus('idle', true);
      return sentences;
    }

    function play() {
      if (!sentences.length) return false;
      if (status === 'playing') return true;
      run({ s: status === 'finished' ? 0 : cursor, c: 0 });
      return true;
    }

    function pause() {
      if (status !== 'playing') return;
      halt();
      setStatus('paused');
    }

    function toggle() {
      if (status === 'playing') pause();
      else play();
    }

    function stop() {
      halt();
      cursor = 0;
      lastEmitted = -1;
      setStatus('idle', true);
    }

    function seek(index) {
      if (!sentences.length) return;
      const target = clampIndex(index);
      if (status === 'playing') {
        run({ s: target, c: 0 });
        return;
      }
      emitSentence(target);
      setStatus(status === 'finished' ? 'paused' : status, true);
    }

    function nextSentence() {
      if (cursor < sentences.length - 1) seek(cursor + 1);
    }

    function previousSentence() {
      seek(cursor - 1);
    }

    function repeat() {
      seek(cursor);
    }

    function setVoice(newVoice) {
      voice = newVoice || null;
      chunkCache.clear();
      if (status === 'playing') run({ s: cursor, c: 0 });
      else setStatus(status, true);
    }

    function setRate(newRate) {
      const value = ns.clampRate(newRate);
      if (value === rate) return;
      rate = value;
      chunkCache.clear();
      if (status === 'playing') run({ s: cursor, c: 0 });
      setStatus(status, true);
    }

    function destroy() {
      halt();
      unsubscribe.forEach((fn) => fn());
      emitter.clear();
    }

    return {
      load,
      play,
      pause,
      toggle,
      stop,
      seek,
      next: nextSentence,
      previous: previousSentence,
      repeat,
      setVoice,
      setRate,
      getState,
      getSentences: () => sentences,
      getText: () => text,
      getVoice: () => voice,
      destroy,
      on: emitter.on,
      off: emitter.off,
    };
  }

  ns.createReader = createReader;

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
