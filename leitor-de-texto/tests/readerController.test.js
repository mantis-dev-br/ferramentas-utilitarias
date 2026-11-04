'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const TR = require('../js/readerController.js');
const { FakeUtterance, createFakeSynth } = require('./fakes/fakeSynth.js');
const { createFakeClock } = require('./fakes/fakeClock.js');

const TEXT = 'Primeira frase. Segunda frase. Terceira frase. Quarta frase.';
const ONLINE = { name: 'Google', lang: 'pt-BR', voiceURI: 'g', localService: false };
const LOCAL = { name: 'Local', lang: 'pt-BR', voiceURI: 'l', localService: true };

function setup(options = {}) {
  const synth = createFakeSynth([ONLINE, LOCAL]);
  const clock = createFakeClock();
  const reader = TR.createReader({ synth, Utterance: FakeUtterance, clock, ...options });
  const events = { state: [], sentence: [], word: [], warning: [], finished: 0 };
  reader.on('statechange', (s) => events.state.push(s.status));
  reader.on('sentence', (s) => events.sentence.push(s.index));
  reader.on('word', (w) => events.word.push(w));
  reader.on('warning', (w) => events.warning.push(w));
  reader.on('finished', () => events.finished++);
  return { synth, clock, reader, events };
}

test('reads the whole text to the end, sentence events in order', () => {
  const { synth, reader, events } = setup();
  assert.equal(reader.load(TEXT).length, 4);
  assert.equal(reader.play(), true);
  assert.equal(reader.getState().status, 'playing');
  synth.drain();
  assert.deepEqual(synth.spoken.map((u) => u.text), [
    'Primeira frase.',
    'Segunda frase.',
    'Terceira frase.',
    'Quarta frase.',
  ]);
  assert.deepEqual(events.sentence, [0, 1, 2, 3]);
  assert.equal(events.finished, 1);
  assert.equal(reader.getState().status, 'finished');
});

test('keeps at most `lookahead` chunks queued (no gaps, no flooding)', () => {
  const { synth, reader } = setup({ lookahead: 2 });
  reader.load(TEXT);
  reader.play();
  assert.equal(synth.queue.length, 2);
  synth.start();
  synth.end();
  assert.equal(synth.queue.length, 2);
  assert.equal(synth.queue[1].text, 'Terceira frase.');
});

test('play with no text does nothing', () => {
  const { reader, synth } = setup();
  reader.load('   ');
  assert.equal(reader.play(), false);
  assert.equal(synth.spoken.length, 0);
});

test('pause cancels and resume re-reads the current sentence (R9)', () => {
  const { synth, reader } = setup();
  reader.load(TEXT);
  reader.play();
  synth.start();
  synth.end(); // sentence 0 done
  synth.start(); // sentence 1 speaking
  reader.pause();
  assert.equal(reader.getState().status, 'paused');
  assert.equal(synth.queue.length, 0);
  assert.equal(reader.getState().sentenceIndex, 1);
  reader.play();
  assert.equal(synth.current.text, 'Segunda frase.');
});

test('seek, next, previous and repeat while playing', () => {
  const { synth, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  reader.seek(2);
  assert.equal(synth.current.text, 'Terceira frase.');
  reader.next();
  assert.equal(synth.current.text, 'Quarta frase.');
  reader.next(); // already at the last sentence: no-op
  assert.equal(reader.getState().sentenceIndex, 3);
  reader.previous();
  assert.equal(synth.current.text, 'Terceira frase.');
  reader.repeat();
  assert.equal(synth.current.text, 'Terceira frase.');
  assert.deepEqual(events.sentence, [0, 2, 3, 2]);
});

test('seek while paused moves the cursor; after finishing, play restarts', () => {
  const { synth, reader } = setup();
  reader.load(TEXT);
  reader.seek(2);
  assert.equal(reader.getState().sentenceIndex, 2);
  reader.play();
  assert.equal(synth.current.text, 'Terceira frase.');
  synth.drain();
  assert.equal(reader.getState().status, 'finished');
  reader.play();
  assert.equal(synth.current.text, 'Primeira frase.');
});

test('load with startAt resumes from a saved position', () => {
  const { synth, reader } = setup();
  reader.load(TEXT, { startAt: 3 });
  reader.play();
  assert.equal(synth.current.text, 'Quarta frase.');
});

test('stop goes back to the beginning', () => {
  const { synth, reader } = setup();
  reader.load(TEXT);
  reader.play();
  reader.seek(2);
  reader.stop();
  assert.equal(reader.getState().status, 'idle');
  assert.equal(reader.getState().sentenceIndex, 0);
  assert.equal(synth.queue.length, 0);
});

test('online voices get chunks below the cut-off (R7)', () => {
  const { synth, reader } = setup({ voice: ONLINE });
  const long = `${'palavra '.repeat(80).trim()}.`; // ~640 chars, one sentence
  reader.load(long);
  reader.play();
  synth.drain();
  assert.ok(synth.spoken.length >= 4);
  for (const u of synth.spoken) assert.ok(u.text.length <= 180, `${u.text.length} chars`);
  assert.equal(synth.spoken.map((u) => u.text).join(' '), long);
  assert.equal(synth.spoken[0].voice, ONLINE);
  assert.equal(synth.spoken[0].lang, 'pt-BR');
});

test('changing rate or voice while playing restarts the current sentence', () => {
  const { synth, reader } = setup({ voice: LOCAL });
  reader.load(TEXT);
  reader.play();
  synth.start();
  synth.end();
  reader.setRate(2);
  assert.equal(synth.current.text, 'Segunda frase.');
  assert.equal(synth.current.rate, 2);
  reader.setVoice(ONLINE);
  assert.equal(synth.current.voice, ONLINE);
  assert.equal(reader.getState().voiceURI, 'g');
  assert.equal(reader.getState().rate, 2);
});

test('events from cancelled utterances are ignored (R12)', () => {
  const { synth, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  const stale = synth.current;
  const staleOnEnd = stale.onend;
  reader.seek(3);
  if (staleOnEnd) staleOnEnd({}); // late "end" from the old generation
  assert.equal(reader.getState().status, 'playing');
  assert.equal(reader.getState().sentenceIndex, 3);
  assert.equal(events.finished, 0);
});

test('a later chunk starting implies the earlier ended (missing "end")', () => {
  const { synth, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  synth.start();
  const first = synth.queue.shift(); // engine "forgets" to fire end
  assert.ok(first);
  synth.start(); // second chunk starts
  assert.deepEqual(events.sentence, [0, 1]);
  synth.drain();
  assert.equal(events.finished, 1);
});

test('watchdog retries a stalled chunk once, then skips it (R11)', () => {
  const { synth, clock, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  synth.start();
  const before = synth.spoken.length;
  clock.tick(7000); // no "end" (~6.1 s limit): retry
  assert.ok(synth.spoken.length > before);
  assert.equal(synth.current.text, 'Primeira frase.');
  synth.start();
  clock.tick(7000); // stalled again: skip
  assert.equal(events.warning.length, 1);
  assert.equal(events.warning[0].code, 'skipped');
  assert.equal(synth.current.text, 'Segunda frase.');
  synth.drain();
  assert.equal(events.finished, 1);
});

test('recoverable errors retry; fatal errors pause with a message', () => {
  const { synth, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  synth.error('network');
  assert.equal(synth.current.text, 'Primeira frase.'); // retried
  synth.error('not-allowed');
  assert.equal(reader.getState().status, 'paused');
  assert.equal(events.warning.at(-1).fatal, true);
  assert.match(events.warning.at(-1).message, /bloqueou/);
});

test('repeated failures stop instead of racing through the text', () => {
  const { synth, reader, events } = setup();
  reader.load(TEXT);
  reader.play();
  for (let i = 0; i < 20 && reader.getState().status === 'playing'; i++) synth.error('synthesis-failed');
  assert.equal(reader.getState().status, 'paused');
  assert.equal(events.warning.at(-1).fatal, true);
});

test('word boundaries are mapped to absolute offsets', () => {
  const { synth, reader, events } = setup();
  reader.load(`Intro.\n${TEXT}`);
  reader.seek(1);
  reader.play();
  synth.start();
  synth.boundary(9, 0); // "frase" inside "Primeira frase."
  const [word] = events.word;
  assert.equal(`Intro.\n${TEXT}`.slice(word.start, word.end), 'frase');
});

test('getState reports remaining time', () => {
  const { reader } = setup();
  reader.load(TEXT);
  const total = reader.getState().remainingMinutes;
  reader.seek(2);
  assert.ok(reader.getState().remainingMinutes < total);
  assert.equal(reader.getState().sentenceCount, 4);
});

test('reports buffering while the voice has not started (R22)', () => {
  const { synth, clock, reader } = setup();
  const changes = [];
  reader.on('buffering', ({ buffering }) => changes.push(buffering));
  reader.load(TEXT);
  reader.play();
  clock.tick(200);
  assert.deepEqual(changes, []); // short waits are not reported (no flicker)
  clock.tick(150);
  assert.deepEqual(changes, [true]);
  assert.equal(reader.getState().buffering, true);
  synth.start();
  assert.deepEqual(changes, [true, false]);
  synth.end(); // next chunk queued but not started yet
  clock.tick(350);
  assert.deepEqual(changes, [true, false, true]);
  reader.pause();
  assert.deepEqual(changes, [true, false, true, false]);
  assert.equal(reader.getState().buffering, false);
});

test('a chunk that starts quickly never reports buffering', () => {
  const { synth, clock, reader } = setup();
  const changes = [];
  reader.on('buffering', ({ buffering }) => changes.push(buffering));
  reader.load(TEXT);
  reader.play();
  for (let i = 0; i < 4; i++) {
    clock.tick(50);
    synth.start();
    clock.tick(500);
    synth.end();
  }
  assert.deepEqual(changes, []);
});
