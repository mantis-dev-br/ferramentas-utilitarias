(function (root) {
  'use strict';

  const MAX_LENGTH = 2048;

  // Letters/numbers in any script, allowing inner apostrophes and hyphens.
  const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

  function tokenize(text) {
    if (typeof text !== 'string') return [];
    const matches = text.toLowerCase().match(WORD_PATTERN);
    return matches ? matches.map((word) => word.replace(/’/g, "'")) : [];
  }

  function countWords(text) {
    const counts = new Map();
    for (const word of tokenize(text)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
    return Array.from(counts, ([word, count]) => ({ word, count })).sort(
      (a, b) => b.count - a.count || a.word.localeCompare(b.word)
    );
  }

  function validateInput(text) {
    if (typeof text !== 'string' || text.trim() === '') {
      return 'Digite ou cole algum texto antes de clicar em Translate.';
    }
    if (text.length > MAX_LENGTH) {
      return `O texto excede o limite de ${MAX_LENGTH} caracteres.`;
    }
    if (tokenize(text).length === 0) {
      return 'Nenhuma palavra encontrada no texto.';
    }
    return null;
  }

  function extractTextFromHtml(html, parser) {
    const doc = parser.parseFromString(html, 'text/html');
    doc.querySelectorAll('script, style, noscript, template, svg').forEach((el) => el.remove());
    const text = (doc.body ? doc.body.textContent : doc.documentElement.textContent) || '';
    return text.replace(/\s+/g, ' ').trim();
  }

  const api = { MAX_LENGTH, tokenize, countWords, validateInput, extractTextFromHtml };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  } else {
    root.WordFrequency = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
