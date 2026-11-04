/*
 * Leitor de texto – textSegmenter.js
 * Pure text logic: splits text into sentences (navigation/highlight unit) and
 * sentences into speech chunks (unit sent to the voice). No DOM, no speech API.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});

  const MAX_LENGTH = 500000;
  const WORDS_PER_MINUTE = 150; // average TTS speed at rate 1.0
  const CHARS_PER_SECOND = 14; // average TTS speed at rate 1.0

  const WORD_PATTERN = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
  const HAS_WORD = /[\p{L}\p{N}]/u;
  const LINE_BREAK = /\r\n|\n|\r|\u2028|\u2029/g;
  const SENTENCE_END = /[.!?…]+["'”’»)\]]*(?=\s|$)/g;
  const TRAILING_ABBREVIATION = /(?:^|[\s(«"“'])([\p{L}º]+)\.$/u;

  // Words that end with a period without ending the sentence.
  const ABBREVIATIONS = new Set([
    'adv', 'al', 'ap', 'apto', 'aprox', 'arq', 'art', 'arts', 'av', 'cap', 'cel', 'cf', 'cia',
    'dr', 'dra', 'dras', 'drs', 'ed', 'eng', 'ex', 'fig', 'figs', 'gen', 'inc', 'jr', 'ltda',
    'máx', 'mín', 'mr', 'mrs', 'ms', 'nº', 'núm', 'obs', 'pg', 'pág', 'págs', 'prof', 'profa',
    'profs', 'sgt', 'sr', 'sra', 'sras', 'srs', 'srta', 'st', 'sta', 'sto', 'tel', 'ten', 'vol', 'vs',
  ]);

  // Preferred cut points inside a long sentence, best first. The last group
  // (any whitespace) is accepted anywhere; the others only past 30% of the chunk.
  const CUT_PATTERNS = [/[;:—–](?=\s)/g, /[,)\]](?=\s)/g, /\s+/g];

  const segmenterCache = new Map();

  function getSegmenter(locale) {
    if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
    const key = locale || 'default';
    if (!segmenterCache.has(key)) {
      let segmenter;
      try {
        segmenter = new Intl.Segmenter(locale, { granularity: 'sentence' });
      } catch (error) {
        segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' });
      }
      segmenterCache.set(key, segmenter);
    }
    return segmenterCache.get(key);
  }

  function isSpace(char) {
    return /\s/.test(char);
  }

  function trimRange(text, start, end) {
    while (start < end && isSpace(text[start])) start++;
    while (end > start && isSpace(text[end - 1])) end--;
    return [start, end];
  }

  function lineRanges(text) {
    const ranges = [];
    let start = 0;
    LINE_BREAK.lastIndex = 0;
    let match;
    while ((match = LINE_BREAK.exec(text))) {
      ranges.push([start, match.index]);
      start = match.index + match[0].length;
    }
    ranges.push([start, text.length]);
    return ranges;
  }

  function sentenceRanges(text, start, end, locale, useIntl) {
    const line = text.slice(start, end);
    const ranges = [];
    const segmenter = useIntl ? getSegmenter(locale) : null;

    if (segmenter) {
      for (const part of segmenter.segment(line)) {
        ranges.push([start + part.index, start + part.index + part.segment.length]);
      }
      return ranges;
    }

    let previous = 0;
    SENTENCE_END.lastIndex = 0;
    let match;
    while ((match = SENTENCE_END.exec(line))) {
      const cut = match.index + match[0].length;
      ranges.push([start + previous, start + cut]);
      previous = cut;
    }
    if (previous < line.length) ranges.push([start + previous, end]);
    return ranges;
  }

  function endsWithAbbreviation(text, [start, end]) {
    const match = TRAILING_ABBREVIATION.exec(text.slice(start, end));
    if (!match) return false;
    const word = match[1].toLowerCase();
    return word.length === 1 || ABBREVIATIONS.has(word);
  }

  /**
   * Splits text into sentences. Line breaks always end a sentence; pieces with
   * no letters or digits are skipped. Offsets point into the original text.
   * @returns {Array<{index:number,start:number,end:number,text:string}>}
   */
  function segment(text, options = {}) {
    if (typeof text !== 'string' || !text) return [];
    const { locale = 'pt-BR', useIntl = true } = options;
    const sentences = [];

    for (const [lineStart, lineEnd] of lineRanges(text)) {
      const [start, end] = trimRange(text, lineStart, lineEnd);
      if (start === end) continue;

      const merged = [];
      for (const range of sentenceRanges(text, start, end, locale, useIntl)) {
        const trimmed = trimRange(text, range[0], range[1]);
        if (trimmed[0] === trimmed[1]) continue;
        const last = merged[merged.length - 1];
        if (last && endsWithAbbreviation(text, last)) {
          last[1] = trimmed[1];
        } else {
          merged.push(trimmed);
        }
      }

      for (const [s, e] of merged) {
        const sentenceText = text.slice(s, e);
        if (!HAS_WORD.test(sentenceText)) continue;
        sentences.push({ index: sentences.length, start: s, end: e, text: sentenceText });
      }
    }
    return sentences;
  }

  function findCut(text, start, limit, maxChars) {
    for (let i = 0; i < CUT_PATTERNS.length; i++) {
      const pattern = CUT_PATTERNS[i];
      const isLast = i === CUT_PATTERNS.length - 1;
      const minCut = isLast ? start + 1 : start + Math.floor(maxChars * 0.3);
      const windowText = text.slice(start, limit);
      let best = -1;
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(windowText))) {
        const cut = start + match.index + (isLast ? 0 : match[0].length);
        if (cut > minCut && cut <= limit) best = cut;
        if (match[0].length === 0) pattern.lastIndex++;
      }
      if (best > 0) return best;
    }
    // No separator at all (e.g. a giant URL): hard cut, never inside a surrogate pair.
    const code = text.charCodeAt(limit - 1);
    return code >= 0xd800 && code <= 0xdbff ? limit - 1 : limit;
  }

  /**
   * Splits a sentence into chunks of at most `maxChars` characters, cutting at
   * natural pauses (; : — , then spaces). Offsets are absolute, like the sentence.
   * @returns {Array<{sentenceIndex:number,start:number,end:number,text:string}>}
   */
  function chunk(sentence, options = {}) {
    const maxChars = Math.max(10, Math.floor(options.maxChars || 1000));
    const text = sentence.text;
    const pieces = [];
    let start = 0;

    while (text.length - start > maxChars) {
      const cut = findCut(text, start, start + maxChars, maxChars);
      const [s, e] = trimRange(text, start, cut);
      if (e > s) pieces.push([s, e]);
      start = cut;
      while (start < text.length && isSpace(text[start])) start++;
    }
    const [s, e] = trimRange(text, start, text.length);
    if (e > s) pieces.push([s, e]);

    return pieces.map(([ps, pe]) => ({
      sentenceIndex: sentence.index,
      start: sentence.start + ps,
      end: sentence.start + pe,
      text: text.slice(ps, pe),
    }));
  }

  function countWords(text) {
    if (typeof text !== 'string') return 0;
    const matches = text.match(WORD_PATTERN);
    return matches ? matches.length : 0;
  }

  function estimateMinutes(wordCount, rate = 1) {
    return wordCount / (WORDS_PER_MINUTE * (rate > 0 ? rate : 1));
  }

  /** @returns {string|null} error message, or null when the text can be read. */
  function validateInput(text) {
    if (typeof text !== 'string' || text.trim() === '') return 'Cole um texto para ouvir.';
    if (text.length > MAX_LENGTH) {
      return 'O texto passou do limite de 500.000 caracteres. Divida-o em partes menores.';
    }
    if (!HAS_WORD.test(text)) return 'O texto não tem palavras para ler.';
    return null;
  }

  Object.assign(ns, {
    MAX_LENGTH,
    WORDS_PER_MINUTE,
    CHARS_PER_SECOND,
    segment,
    chunk,
    countWords,
    estimateMinutes,
    validateInput,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
