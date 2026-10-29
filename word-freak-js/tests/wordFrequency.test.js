const test = require('node:test');
const assert = require('node:assert/strict');
const {
  MAX_LENGTH, tokenize, countWords, clusterByFrequency, chartData, analyze, validateInput,
} = require('../js/wordFrequency.js');

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

test('clusterByFrequency groups words with the same count', () => {
  assert.deepEqual(clusterByFrequency(countWords('b a c b a b d')), [
    { count: 3, words: ['b'], size: 1 },
    { count: 2, words: ['a'], size: 1 },
    { count: 1, words: ['c', 'd'], size: 2 },
  ]);
  assert.deepEqual(clusterByFrequency([]), []);
});

test('chartData returns labels, values and percentages limited to the top N', () => {
  const frequencies = countWords('b a c b a b d e');
  assert.deepEqual(chartData(frequencies, 8, 2), {
    labels: ['b', 'a'],
    values: [3, 2],
    percentages: [37.5, 25],
  });
});

test('analyze returns counts, clusters and chart in one object', () => {
  const result = analyze('O gato e o rato. O gato correu!');
  assert.equal(result.total, 8);
  assert.equal(result.unique, 5);
  assert.deepEqual(result.frequencies[0], { word: 'o', count: 3 });
  assert.deepEqual(result.clusters.map((c) => c.count), [3, 2, 1]);
  assert.deepEqual(result.chart.labels, ['o', 'gato', 'correu', 'e', 'rato']);
  assert.deepEqual(result.chart.percentages, [37.5, 25, 12.5, 12.5, 12.5]);
});

test('analyze respects chartLimit and handles empty text', () => {
  assert.equal(analyze('a b c d', { chartLimit: 2 }).chart.labels.length, 2);
  assert.deepEqual(analyze(''), {
    total: 0, unique: 0, frequencies: [], clusters: [],
    chart: { labels: [], values: [], percentages: [] },
  });
});
