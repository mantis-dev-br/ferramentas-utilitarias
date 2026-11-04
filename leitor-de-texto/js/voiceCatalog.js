/*
 * Leitor de texto – voiceCatalog.js
 * Pure voice logic: ranking, grouping by language and chunk size limits.
 * Works with SpeechSynthesisVoice objects or any {name, lang, voiceURI, localService, default}.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  const ns = (root.TextReader = root.TextReader || {});

  const ONLINE_CHARS_PER_RATE = 180; // ~13 s of speech, below Chrome's ~15 s cut-off
  const ONLINE_MIN_CHARS = 80;
  const ONLINE_MAX_CHARS = 300;
  const LOCAL_MAX_CHARS = 1000;
  const MIN_RATE = 0.5;
  const MAX_RATE = 3;

  const QUALITY_PATTERN = /natural|neural|online|google|premium|enhanced|siri|wavenet/i;

  function normalizeLang(lang) {
    return String(lang || '').replace(/_/g, '-').toLowerCase();
  }

  function baseLang(lang) {
    return normalizeLang(lang).split('-')[0];
  }

  /** Online voices send the text to the vendor's servers and suffer the ~15 s cut-off. */
  function isOnline(voice) {
    return Boolean(voice) && voice.localService === false;
  }

  function langScore(voiceLang, preferred) {
    const lang = normalizeLang(voiceLang);
    const wanted = normalizeLang(preferred);
    if (!wanted) return 0;
    if (lang === wanted) return 2;
    return baseLang(lang) === baseLang(wanted) ? 1 : 0;
  }

  function qualityScore(voice) {
    return QUALITY_PATTERN.test(voice.name || '') ? 1 : 0;
  }

  function compareVoices(a, b) {
    return (
      qualityScore(b) - qualityScore(a) ||
      Number(Boolean(b.default)) - Number(Boolean(a.default)) ||
      String(a.name).localeCompare(String(b.name))
    );
  }

  /** Voices sorted: preferred language first, then better quality, then name. */
  function rankVoices(voices, options = {}) {
    const { lang = 'pt-BR' } = options;
    return Array.from(voices || []).sort(
      (a, b) =>
        langScore(b.lang, lang) - langScore(a.lang, lang) ||
        normalizeLang(a.lang).localeCompare(normalizeLang(b.lang)) ||
        compareVoices(a, b)
    );
  }

  /** Groups ranked voices by language: [{ lang, voices }], preferred language first. */
  function groupVoices(voices, options = {}) {
    const groups = [];
    const byLang = new Map();
    for (const voice of rankVoices(voices, options)) {
      const key = normalizeLang(voice.lang) || 'und';
      if (!byLang.has(key)) {
        const group = { lang: String(voice.lang || 'und').replace(/_/g, '-'), voices: [] };
        byLang.set(key, group);
        groups.push(group);
      }
      byLang.get(key).voices.push(voice);
    }
    return groups;
  }

  /** Saved voice if still available, else the best voice for the language. */
  function pickVoice(voices, options = {}) {
    const list = Array.from(voices || []);
    if (options.voiceURI) {
      const saved = list.find((voice) => voice.voiceURI === options.voiceURI);
      if (saved) return saved;
    }
    return rankVoices(list, options)[0] || null;
  }

  function clampRate(rate) {
    const value = Number(rate);
    if (!Number.isFinite(value)) return 1;
    return Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(value * 10) / 10));
  }

  /** Max characters per spoken chunk for this voice and rate (rule R7). */
  function chunkLimit(voice, rate = 1) {
    if (!isOnline(voice)) return LOCAL_MAX_CHARS;
    const value = Math.round(ONLINE_CHARS_PER_RATE * clampRate(rate));
    return Math.min(ONLINE_MAX_CHARS, Math.max(ONLINE_MIN_CHARS, value));
  }

  /** Human-readable language name, e.g. "português (Brasil)". */
  function languageName(lang, displayLocale = 'pt-BR') {
    try {
      const names = new Intl.DisplayNames([displayLocale], { type: 'language' });
      return names.of(String(lang).replace(/_/g, '-')) || lang;
    } catch (error) {
      return lang || 'Outros';
    }
  }

  Object.assign(ns, {
    MIN_RATE,
    MAX_RATE,
    isOnline,
    rankVoices,
    groupVoices,
    pickVoice,
    clampRate,
    chunkLimit,
    languageName,
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = ns;
})(typeof window !== 'undefined' ? window : globalThis);
