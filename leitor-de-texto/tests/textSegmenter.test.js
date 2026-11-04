'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const TR = require('../js/textSegmenter.js');

const texts = (sentences) => sentences.map((s) => s.text);

function assertOffsets(source, items) {
  for (const item of items) {
    assert.equal(source.slice(item.start, item.end), item.text, `offsets of "${item.text}"`);
  }
}

for (const useIntl of [true, false]) {
  const mode = useIntl ? 'Intl.Segmenter' : 'regex fallback';
  const segment = (text) => TR.segment(text, { locale: 'pt-BR', useIntl });

  test(`[${mode}] splits common sentences`, () => {
    const source = 'O gato correu. O rato fugiu! Para onde? Ninguém sabe…';
    const result = segment(source);
    assert.deepEqual(texts(result), ['O gato correu.', 'O rato fugiu!', 'Para onde?', 'Ninguém sabe…']);
    assert.deepEqual(result.map((s) => s.index), [0, 1, 2, 3]);
    assertOffsets(source, result);
  });

  test(`[${mode}] keeps abbreviations and initials inside the sentence`, () => {
    const source = 'O Dr. Silva chegou com a Sra. Souza. J. R. Tolkien escreveu livros. Fim.';
    assert.deepEqual(texts(segment(source)), [
      'O Dr. Silva chegou com a Sra. Souza.',
      'J. R. Tolkien escreveu livros.',
      'Fim.',
    ]);
  });

  test(`[${mode}] does not split numbers`, () => {
    const source = 'Custa R$ 1.500,00 hoje. O valor de pi é 3.14 aproximadamente.';
    assert.deepEqual(texts(segment(source)), [
      'Custa R$ 1.500,00 hoje.',
      'O valor de pi é 3.14 aproximadamente.',
    ]);
  });

  test(`[${mode}] line breaks end sentences; blank lines and symbols are skipped`, () => {
    const source = 'Título\n\n- primeiro item\r\n- segundo item\n***\n   \nÚltima linha sem ponto';
    const result = segment(source);
    assert.deepEqual(texts(result), [
      'Título',
      '- primeiro item',
      '- segundo item',
      'Última linha sem ponto',
    ]);
    assertOffsets(source, result);
  });
}

test('segment handles empty and invalid input', () => {
  assert.deepEqual(TR.segment(''), []);
  assert.deepEqual(TR.segment('   \n  '), []);
  assert.deepEqual(TR.segment(null), []);
});

test('chunk keeps short sentences whole', () => {
  const [sentence] = TR.segment('Uma frase curta.');
  assert.deepEqual(TR.chunk(sentence, { maxChars: 100 }), [
    { sentenceIndex: 0, start: 0, end: 16, text: 'Uma frase curta.' },
  ]);
});

test('chunk prefers ; and : then commas, never cutting words', () => {
  const source =
    'Primeiro ponto importante da lista; segundo ponto, com detalhes adicionais, e mais coisas ainda para dizer aqui.';
  const [sentence] = TR.segment(source);
  const chunks = TR.chunk(sentence, { maxChars: 60 });
  assert.equal(chunks[0].text, 'Primeiro ponto importante da lista;');
  for (const c of chunks) {
    assert.ok(c.text.length <= 60, `"${c.text}" has ${c.text.length} chars`);
    assert.ok(!/^\s|\s$/.test(c.text));
  }
  assertOffsets(source, chunks);
  // Every word survives the split.
  assert.equal(chunks.map((c) => c.text).join(' '), source);
});

test('chunk falls back to spaces when there is no punctuation', () => {
  const words = Array.from({ length: 60 }, (_, i) => `palavra${i}`);
  const source = words.join(' ');
  const [sentence] = TR.segment(source);
  const chunks = TR.chunk(sentence, { maxChars: 80 });
  assert.ok(chunks.length > 1);
  for (const c of chunks) assert.ok(c.text.length <= 80);
  assert.equal(chunks.map((c) => c.text).join(' '), source);
  assertOffsets(source, chunks);
});

test('chunk hard-cuts a giant word and keeps absolute offsets', () => {
  const source = `Veja https://exemplo.com/${'a'.repeat(200)} agora.`;
  const [sentence] = TR.segment(`Intro.\n${source}`).slice(1);
  const chunks = TR.chunk(sentence, { maxChars: 50 });
  for (const c of chunks) assert.ok(c.text.length <= 50);
  assertOffsets(`Intro.\n${source}`, chunks);
  assert.equal(chunks.map((c) => c.text).join('').replace(/\s/g, ''), source.replace(/\s/g, ''));
});

test('countWords, estimateMinutes and validateInput', () => {
  assert.equal(TR.countWords("Don't stop, guarda-chuva 2026!"), 4);
  assert.equal(TR.estimateMinutes(300, 1), 2);
  assert.equal(TR.estimateMinutes(300, 2), 1);
  assert.match(TR.validateInput('   '), /Cole um texto/);
  assert.match(TR.validateInput('*** ---'), /não tem palavras/);
  assert.match(TR.validateInput('a'.repeat(TR.MAX_LENGTH + 1)), /500\.000/);
  assert.equal(TR.validateInput('Olá mundo.'), null);
});
