'use strict';

// Controllable stand-in for window.speechSynthesis + SpeechSynthesisUtterance.
class FakeUtterance {
  constructor(text) {
    this.text = text;
    this.voice = null;
    this.lang = '';
    this.rate = 1;
    this.onstart = this.onend = this.onerror = this.onboundary = null;
  }
}

function createFakeSynth(voices = []) {
  const synth = {
    queue: [], // utterances not finished yet; queue[0] is the one "speaking"
    spoken: [], // every utterance ever passed to speak()
    cancelCount: 0,
    voices,
    speak(utterance) {
      this.queue.push(utterance);
      this.spoken.push(utterance);
    },
    cancel() {
      this.cancelCount++;
      const cancelled = this.queue.splice(0);
      for (const u of cancelled) if (u.onerror) u.onerror({ error: 'canceled' });
    },
    getVoices() {
      return this.voices;
    },
    // --- test helpers ---
    get current() {
      return this.queue[0];
    },
    start() {
      const u = this.queue[0];
      if (u && u.onstart) u.onstart({});
      return u;
    },
    end() {
      const u = this.queue.shift();
      if (u && u.onend) u.onend({});
      return u;
    },
    error(code) {
      const u = this.queue.shift();
      if (u && u.onerror) u.onerror({ error: code });
      return u;
    },
    boundary(charIndex, charLength) {
      const u = this.queue[0];
      if (u && u.onboundary) u.onboundary({ name: 'word', charIndex, charLength });
    },
    /** Speaks everything to the end, like a healthy engine. */
    drain(limit = 10000) {
      let n = 0;
      while (this.queue.length && n++ < limit) {
        this.start();
        this.end();
      }
    },
  };
  return synth;
}

module.exports = { FakeUtterance, createFakeSynth };
