const test = require('node:test');
const assert = require('node:assert/strict');
const { MAX_LENGTH, tokenize, countWords, validateInput } = require('../js/wordFrequency.js');

test('tokenize lowercases and ignores punctuation', () => {
  assert.deepEqual(tokenize('Olá, mundo! OLÁ... mundo?'), ['olá', 'mundo', 'olá', 'mundo']);
});

test('tokenize keeps inner apostrophes and hyphens', () => {
  assert.deepEqual(tokenize("Don't use o guarda-chuva - ok"), ["don't", 'use', 'o', 'guarda-chuva', 'ok']);
});

test('tokenize normalizes typographic apostrophe', () => {
  assert.deepEqual(tokenize('it’s'), ["it's"]);
});

test('tokenize returns empty array for non-words', () => {
  assert.deepEqual(tokenize('  ... !!! '), []);
  assert.deepEqual(tokenize(undefined), []);
});

test('countWords sorts by frequency desc, then alphabetically', () => {
  assert.deepEqual(countWords('b a c b a b'), [
    { word: 'b', count: 3 },
    { word: 'a', count: 2 },
    { word: 'c', count: 1 },
  ]);
  assert.deepEqual(countWords('zeta alfa beta'), [
    { word: 'alfa', count: 1 },
    { word: 'beta', count: 1 },
    { word: 'zeta', count: 1 },
  ]);
});

test('validateInput rejects empty and whitespace-only text', () => {
  assert.ok(validateInput(''));
  assert.ok(validateInput('   \n\t'));
});

test('validateInput rejects text over the limit', () => {
  assert.ok(validateInput('a'.repeat(MAX_LENGTH + 1)));
  assert.equal(validateInput('a'.repeat(MAX_LENGTH)), null);
});

test('validateInput rejects text without words', () => {
  assert.ok(validateInput('!!! ???'));
});
