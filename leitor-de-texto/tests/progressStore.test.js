'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const TR = require('../js/progressStore.js');

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data,
  };
}

test('hashText is stable and sensitive to changes', () => {
  assert.equal(TR.hashText('abc'), TR.hashText('abc'));
  assert.notEqual(TR.hashText('abc'), TR.hashText('abd'));
  assert.match(TR.hashText(''), /^[0-9a-f]{8}$/);
});

test('prefs round trip and merge', () => {
  const store = TR.createProgressStore(memoryStorage());
  assert.deepEqual(store.loadPrefs(), {});
  store.savePrefs({ rate: 1.5 });
  store.savePrefs({ voiceURI: 'X' });
  assert.deepEqual(store.loadPrefs(), { rate: 1.5, voiceURI: 'X' });
});

test('session round trip; a different text resets the position', () => {
  const store = TR.createProgressStore(memoryStorage());
  assert.equal(store.loadSession(), null);
  store.saveText('Texto um.');
  store.savePosition('Texto um.', 7, 20);
  assert.deepEqual(store.loadSession(), { text: 'Texto um.', sentenceIndex: 7, sentenceCount: 20 });

  store.saveText('Texto dois.');
  assert.deepEqual(store.loadSession(), { text: 'Texto dois.', sentenceIndex: 0, sentenceCount: 0 });

  store.clearSession();
  assert.equal(store.loadSession(), null);
});

test('works without storage or with a storage that throws', () => {
  const throwing = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('quota'); },
    removeItem() { throw new Error('denied'); },
  };
  for (const storage of [null, throwing]) {
    const store = TR.createProgressStore(storage);
    assert.equal(store.savePrefs({ rate: 2 }), false);
    assert.deepEqual(store.loadPrefs(), {});
    store.saveText('abc');
    assert.equal(store.loadSession(), null);
    store.clearSession();
  }
});
