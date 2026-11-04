'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const TR = require('../js/voiceCatalog.js');

const voice = (name, lang, localService = true, extra = {}) => ({
  name,
  lang,
  voiceURI: name,
  localService,
  default: false,
  ...extra,
});

const voices = [
  voice('English US', 'en-US'),
  voice('eSpeak Portuguese', 'pt-PT'),
  voice('Microsoft Daniel', 'pt-BR'),
  voice('Microsoft Francisca Online (Natural)', 'pt-BR', false),
  voice('Google português do Brasil', 'pt_BR', false),
  voice('Español', 'es-ES'),
];

test('rankVoices puts the preferred language and better voices first', () => {
  const names = TR.rankVoices(voices, { lang: 'pt-BR' }).map((v) => v.name);
  assert.deepEqual(names.slice(0, 4), [
    'Google português do Brasil',
    'Microsoft Francisca Online (Natural)',
    'Microsoft Daniel',
    'eSpeak Portuguese',
  ]);
});

test('groupVoices groups by language, preferred first', () => {
  const groups = TR.groupVoices(voices, { lang: 'pt-BR' });
  assert.deepEqual(groups.map((g) => g.lang), ['pt-BR', 'pt-PT', 'en-US', 'es-ES']);
  assert.equal(groups[0].voices.length, 3);
});

test('pickVoice keeps the saved voice when it still exists', () => {
  assert.equal(TR.pickVoice(voices, { voiceURI: 'Microsoft Daniel' }).name, 'Microsoft Daniel');
  assert.equal(TR.pickVoice(voices, { voiceURI: 'Sumiu' }).name, 'Google português do Brasil');
  assert.equal(TR.pickVoice([], {}), null);
});

test('isOnline and chunkLimit follow rule R7', () => {
  const online = voices[3];
  const local = voices[2];
  assert.equal(TR.isOnline(online), true);
  assert.equal(TR.isOnline(local), false);
  assert.equal(TR.chunkLimit(online, 1), 180);
  assert.equal(TR.chunkLimit(online, 0.5), 90);
  assert.equal(TR.chunkLimit(online, 3), 300);
  assert.equal(TR.chunkLimit(local, 1), 1000);
  assert.equal(TR.chunkLimit(null, 1), 1000);
});

test('clampRate limits to 0.5–3 in steps of 0.1', () => {
  assert.equal(TR.clampRate(0.1), 0.5);
  assert.equal(TR.clampRate(9), 3);
  assert.equal(TR.clampRate(1.26), 1.3);
  assert.equal(TR.clampRate('x'), 1);
});

test('languageName returns a readable name', () => {
  assert.match(TR.languageName('pt-BR'), /portugu/i);
});
