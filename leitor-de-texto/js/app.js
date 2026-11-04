/*
 * Leitor de texto – app.js
 * UI layer: DOM, controls, keyboard shortcuts, accessibility feedback
 * (live region, earcons, tab title), auto-scroll, wake lock and persistence.
 * All playback logic lives in TextReader (readerController.js).
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function () {
  'use strict';

  const TR = window.TextReader;
  const $ = (id) => document.getElementById(id);

  const els = {
    resume: $('resume'),
    resumeText: $('resume-text'),
    resumeContinue: $('resume-continue'),
    resumeRestart: $('resume-restart'),
    editor: $('editor'),
    textInput: $('text-input'),
    textStats: $('text-stats'),
    pasteButton: $('paste-button'),
    clearButton: $('clear-button'),
    reading: $('reading'),
    reader: $('reader'),
    editButton: $('edit-button'),
    followButton: $('follow-button'),
    message: $('message'),
    player: $('player'),
    position: $('position'),
    positionText: $('position-text'),
    prevButton: $('prev-button'),
    playButton: $('play-button'),
    playLabel: $('play-label'),
    iconPlay: $('icon-play'),
    iconPause: $('icon-pause'),
    nextButton: $('next-button'),
    stopButton: $('stop-button'),
    remaining: $('remaining'),
    waiting: $('waiting'),
    settingsButton: $('settings-button'),
    settings: $('settings'),
    voiceSelect: $('voice-select'),
    sampleButton: $('sample-button'),
    rateInput: $('rate-input'),
    rateOutput: $('rate-output'),
    fontInput: $('font-input'),
    fontDown: $('font-down'),
    fontUp: $('font-up'),
    fontLevel: $('font-level'),
    contrastButton: $('contrast-button'),
    presentButton: $('present-button'),
    fontOutput: $('font-output'),
    earconsInput: $('earcons-input'),
    announceInput: $('announce-input'),
    forgetButton: $('forget-button'),
    announcer: $('announcer'),
  };

  const BASE_TITLE = 'Leitor de texto';
  const numberFormat = new Intl.NumberFormat('pt-BR');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const preferredLang = navigator.language || 'pt-BR';

  const store = TR.createProgressStore(safeLocalStorage());
  const prefs = {
    rate: 1,
    fontScale: 100,
    earcons: true,
    announce: true,
    settingsOpen: false,
    theme: 'auto',
    ...store.loadPrefs(),
  };

  const supported =
    'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function';

  let engine = null;
  let reader = null;
  let voices = [];
  let voicesKey = '';
  let loadedText = null;
  let sentenceEls = [];
  let currentIndex = -1;
  let readUpTo = 0;
  let lastStatus = 'idle';
  let followScroll = true;
  let ignoreScrollUntil = 0;
  let wakeLock = null;
  let audioContext = null;
  let rateTimer = null;
  let statsTimer = null;
  let sampleUtterance = null;
  let wordHighlight = null;
  let pendingSession = null;
  let loading = false;
  let seekTimer = null;
  let slowVoiceTimer = null;
  let presenting = false;

  function safeLocalStorage() {
    try {
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  // ---- formatting ----------------------------------------------------------

  function formatDuration(minutes) {
    if (!(minutes > 0)) return '';
    if (minutes < 1) return 'menos de 1 min';
    const total = Math.round(minutes);
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    if (!hours) return `${total} min`;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function formatRate(rate) {
    return rate.toFixed(1).replace('.', ',');
  }

  function currentRate() {
    return TR.clampRate(els.rateInput.value);
  }

  // ---- feedback: messages, live region, earcons, title -----------------------

  function showMessage(text, type = 'error') {
    delete els.message.dataset.code;
    els.message.textContent = text;
    els.message.className = `message ${type}`;
    els.message.hidden = false;
  }

  function hideMessage() {
    els.message.hidden = true;
    els.message.textContent = '';
  }

  function announce(text, force) {
    if (!prefs.announce && !force) return;
    els.announcer.textContent = '';
    // A short delay makes screen readers announce repeated messages too.
    setTimeout(() => {
      els.announcer.textContent = text;
    }, 60);
  }

  const EARCONS = {
    play: [523, 784],
    pause: [587, 392],
    stop: [392, 294],
    finished: [523, 659, 784],
    error: [220, 175],
  };

  function earcon(name) {
    if (!prefs.earcons) return;
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    try {
      audioContext = audioContext || new Context();
      if (audioContext.state === 'suspended') audioContext.resume();
      const start = audioContext.currentTime + 0.02;
      EARCONS[name].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const t = start + i * 0.11;
        oscillator.type = 'sine';
        oscillator.frequency.value = frequency;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(t);
        oscillator.stop(t + 0.12);
      });
    } catch (error) {
      // Audio feedback is optional.
    }
  }

  function positionLabel(state) {
    return `frase ${numberFormat.format(state.sentenceIndex + 1)} de ${numberFormat.format(state.sentenceCount)}`;
  }

  function updateTitle(state) {
    const n = state.sentenceCount;
    const i = state.sentenceIndex + 1;
    const prefix = {
      playing: `▶ Frase ${i}/${n}`,
      paused: '⏸ Pausado',
      finished: '✓ Concluído',
    }[state.status];
    document.title = prefix ? `${prefix} – ${BASE_TITLE}` : BASE_TITLE;
  }

  // ---- editor --------------------------------------------------------------

  function updateStats() {
    const text = els.textInput.value;
    if (!text.trim()) {
      els.textStats.textContent = 'Nenhum texto ainda.';
      return;
    }
    const words = TR.countWords(text);
    const minutes = TR.estimateMinutes(words, currentRate());
    const duration = minutes < 1 ? 'menos de 1 min' : `cerca de ${formatDuration(minutes)}`;
    els.textStats.textContent = [
      `${numberFormat.format(text.length)} caracteres`,
      `${numberFormat.format(words)} ${words === 1 ? 'palavra' : 'palavras'}`,
      `${duration} de áudio`,
    ]
      .filter(Boolean)
      .join(' · ');
  }

  function scheduleStats() {
    clearTimeout(statsTimer);
    statsTimer = setTimeout(updateStats, 200);
  }

  function showEditor() {
    els.reading.hidden = true;
    els.editor.hidden = false;
  }

  function showReading() {
    els.editor.hidden = true;
    els.reading.hidden = false;
  }

  function loadText(text, startAt = 0) {
    loading = true;
    try {
      reader.load(text, { startAt });
    } finally {
      loading = false;
    }
    loadedText = text;
    store.saveText(text);
    hideResume();
  }

  /** Validates the editor text, (re)loads it if it changed and starts reading. */
  function startFromEditor() {
    if (!reader) return;
    const text = els.textInput.value;
    const error = TR.validateInput(text);
    if (error) {
      showMessage(error);
      earcon('error');
      return;
    }
    hideMessage();
    if (text !== loadedText) loadText(text, 0);
    showReading();
    followScroll = true;
    reader.play();
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showMessage('A área de transferência está vazia.', 'info');
        return;
      }
      const input = els.textInput;
      input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
      input.focus();
      updateStats();
      hideMessage();
    } catch (error) {
      showMessage('Não foi possível colar. Use Ctrl+V na caixa de texto.', 'info');
    }
  }

  function clearText() {
    const input = els.textInput;
    if (input.value.length > 500 && !window.confirm('Apagar todo o texto?')) return;
    input.value = '';
    updateStats();
    hideMessage();
    input.focus();
  }

  // ---- reading view and highlight ------------------------------------------

  function renderReader(sentences, text) {
    const fragment = document.createDocumentFragment();
    sentenceEls = [];
    let position = 0;
    for (const sentence of sentences) {
      if (sentence.start > position) {
        fragment.appendChild(document.createTextNode(text.slice(position, sentence.start)));
      }
      const span = document.createElement('span');
      span.className = 'sentence';
      span.dataset.index = String(sentence.index);
      span.textContent = sentence.text;
      fragment.appendChild(span);
      sentenceEls.push(span);
      position = sentence.end;
    }
    if (position < text.length) fragment.appendChild(document.createTextNode(text.slice(position)));
    els.reader.replaceChildren(fragment);
    currentIndex = -1;
    readUpTo = 0;
    clearWordHighlight();
  }

  function markReadUpTo(index) {
    if (index > readUpTo) {
      for (let i = readUpTo; i < index; i++) sentenceEls[i].classList.add('is-read');
    } else {
      for (let i = index; i < readUpTo; i++) sentenceEls[i].classList.remove('is-read');
    }
    readUpTo = index;
  }

  function setCurrent(index) {
    const previous = sentenceEls[currentIndex];
    if (previous) {
      previous.classList.remove('is-current', 'is-waiting');
      previous.removeAttribute('aria-current');
    }
    currentIndex = index;
    const element = sentenceEls[index];
    if (element) {
      element.classList.add('is-current');
      element.classList.toggle('is-waiting', Boolean(reader && reader.getState().buffering));
      element.setAttribute('aria-current', 'true');
    }
    clearWordHighlight();
  }

  function highlightSentence(index) {
    markReadUpTo(index);
    setCurrent(index);
    scrollToCurrent(false);
  }

  function clearHighlight(allRead) {
    setCurrent(-1);
    markReadUpTo(allRead ? sentenceEls.length : 0);
  }

  function clearWordHighlight() {
    if (wordHighlight) wordHighlight.clear();
  }

  function highlightWord({ start, end, sentenceIndex }) {
    if (!wordHighlight || sentenceIndex !== currentIndex) return;
    const element = sentenceEls[sentenceIndex];
    const sentence = reader.getSentences()[sentenceIndex];
    const node = element && element.firstChild;
    if (!node || !sentence) return;
    const from = start - sentence.start;
    const to = Math.min(end - sentence.start, node.length);
    if (from < 0 || from >= to) return;
    const range = document.createRange();
    range.setStart(node, from);
    range.setEnd(node, to);
    wordHighlight.clear();
    wordHighlight.add(range);
  }

  /**
   * The voice was asked to speak but has not started yet (usually network
   * latency of online voices). Visual cue right away; screen readers are told
   * only when the wait gets long, so short gaps do not become chatter.
   */
  function renderBuffering(buffering) {
    els.waiting.hidden = !buffering;
    els.player.setAttribute('aria-busy', String(buffering));
    const element = sentenceEls[currentIndex];
    if (element) element.classList.toggle('is-waiting', buffering);
    clearTimeout(slowVoiceTimer);
    if (buffering) {
      slowVoiceTimer = setTimeout(() => {
        announce('Aguardando a voz responder. Pode ser a conexão com a internet.');
      }, 3000);
    }
  }

  function scrollToCurrent(force) {
    const element = sentenceEls[currentIndex];
    if (!element || els.reading.hidden) return;
    if (!followScroll && !force) return;
    const rect = element.getBoundingClientRect();
    const bottomLimit = window.innerHeight - els.player.offsetHeight - 24;
    if (!force && rect.top >= 24 && rect.bottom <= bottomLimit) return;
    ignoreScrollUntil = performance.now() + 1200;
    element.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }

  function onUserScroll() {
    if (performance.now() < ignoreScrollUntil) return;
    if (lastStatus !== 'playing' || els.reading.hidden || !followScroll) return;
    followScroll = false;
    els.followButton.hidden = false;
  }

  function followCurrent() {
    followScroll = true;
    els.followButton.hidden = true;
    scrollToCurrent(true);
  }

  // ---- player state --------------------------------------------------------

  function renderState(state) {
    const { status, sentenceCount } = state;
    const hasText = sentenceCount > 0;
    const playing = status === 'playing';

    els.playLabel.textContent = playing
      ? 'Pausar'
      : status === 'paused'
        ? 'Continuar'
        : status === 'finished'
          ? 'Ler de novo'
          : 'Ler';
    // SVG elements have no .hidden property: toggle the attribute itself.
    els.iconPlay.toggleAttribute('hidden', playing);
    els.iconPause.toggleAttribute('hidden', !playing);

    els.prevButton.disabled = !hasText;
    els.nextButton.disabled = !hasText || state.sentenceIndex >= sentenceCount - 1;
    els.stopButton.disabled = !hasText || (status === 'idle' && state.sentenceIndex === 0);

    els.position.disabled = !hasText;
    els.position.max = String(Math.max(1, sentenceCount));
    // While the user is moving the slider (seek pending), keep their value.
    if (!seekTimer) {
      els.position.value = String(hasText ? state.sentenceIndex + 1 : 1);
      const label = hasText
        ? `Frase ${numberFormat.format(state.sentenceIndex + 1)} de ${numberFormat.format(sentenceCount)}`
        : 'Nenhum texto carregado';
      els.position.setAttribute('aria-valuetext', label);
      els.positionText.textContent = hasText ? label : 'Frase 0 de 0';
    }

    const remaining = formatDuration(state.remainingMinutes);
    els.remaining.textContent = hasText && remaining && status !== 'finished' ? `${remaining} restantes` : '';

    updateTitle(state);
    document.body.dataset.status = status;

    if (status !== lastStatus) onStatusChange(lastStatus, state);
    lastStatus = status;
  }

  function onStatusChange(previous, state) {
    const where = positionLabel(state);
    if (state.status === 'playing') {
      announce(previous === 'paused' ? `Continuando, ${where}` : `Lendo, ${where}`);
      earcon('play');
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
    if (state.status === 'paused' && previous === 'playing') {
      announce(`Pausado na ${where}`);
      earcon('pause');
    }
    if (state.status === 'idle' && previous !== 'idle' && !loading) {
      clearHighlight(false);
      announce('Leitura parada');
      earcon('stop');
    }
    if (state.status === 'finished') {
      clearHighlight(true);
      announce('Leitura concluída');
      earcon('finished');
      store.savePosition(loadedText, 0, state.sentenceCount);
    }
  }

  function whereAmI() {
    if (!reader || !reader.getState().sentenceCount) {
      announce('Nenhum texto carregado. Cole um texto e pressione Ler.', true);
      return;
    }
    const state = reader.getState();
    const percent = Math.round((state.sentenceIndex / state.sentenceCount) * 100);
    const statusName = {
      playing: 'Lendo',
      paused: 'Pausado',
      finished: 'Concluído',
      idle: 'Parado',
    }[state.status];
    const remaining = formatDuration(state.remainingMinutes);
    announce(
      `${statusName}. Frase ${state.sentenceIndex + 1} de ${state.sentenceCount}, ${percent}% lido.` +
        (remaining && state.status !== 'finished' ? ` Faltam ${remaining}.` : ''),
      true
    );
  }

  // ---- commands ------------------------------------------------------------

  function togglePlay() {
    if (!reader) return;
    if (!els.editor.hidden || !reader.getState().sentenceCount) {
      startFromEditor();
      return;
    }
    followScroll = true;
    els.followButton.hidden = true;
    reader.toggle();
  }

  function navigate(action) {
    if (!reader || !reader.getState().sentenceCount) return;
    followScroll = true;
    els.followButton.hidden = true;
    action();
  }

  function stopReading() {
    if (!reader || !reader.getState().sentenceCount) return;
    reader.stop();
  }

  function changeRate(delta) {
    const value = TR.clampRate(currentRate() + delta);
    els.rateInput.value = String(value);
    applyRate(true);
    announce(`Velocidade ${formatRate(value)} vezes`, true);
  }

  function applyRate(immediate) {
    const rate = currentRate();
    els.rateOutput.textContent = `${formatRate(rate)}×`;
    els.rateInput.setAttribute('aria-valuetext', `${formatRate(rate)} vezes`);
    updateStats();
    prefs.rate = rate;
    store.savePrefs({ rate });
    clearTimeout(rateTimer);
    if (!reader) return;
    if (immediate) reader.setRate(rate);
    else rateTimer = setTimeout(() => reader.setRate(rate), 300);
  }

  const FONT_MIN = 100;
  const FONT_MAX = 300;
  const FONT_STEP = 20;

  function applyFontScale() {
    const raw = Math.round(Number(els.fontInput.value) || FONT_MIN);
    const value = Math.min(FONT_MAX, Math.max(FONT_MIN, raw));
    document.documentElement.style.setProperty('--text-scale', String(value / 100));
    els.fontOutput.textContent = `${value}%`;
    els.fontLevel.textContent = `${value}%`;
    els.fontInput.setAttribute('aria-valuetext', `${value} por cento`);
    els.fontDown.disabled = value <= FONT_MIN;
    els.fontUp.disabled = value >= FONT_MAX;
    prefs.fontScale = value;
    store.savePrefs({ fontScale: value });
    return value;
  }

  function changeFont(delta) {
    els.fontInput.value = String(Number(els.fontInput.value) + delta);
    const value = applyFontScale();
    announce(`Texto em ${value} por cento`, true);
    scrollToCurrent(true);
  }

  // ---- high contrast -------------------------------------------------------

  function applyTheme() {
    const contrast = prefs.theme === 'contrast';
    if (contrast) document.documentElement.dataset.theme = 'contrast';
    else delete document.documentElement.dataset.theme;
    els.contrastButton.setAttribute('aria-pressed', String(contrast));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = contrast ? '#000000' : '#4f46e5';
  }

  function toggleContrast() {
    prefs.theme = prefs.theme === 'contrast' ? 'auto' : 'contrast';
    store.savePrefs({ theme: prefs.theme });
    applyTheme();
    announce(prefs.theme === 'contrast' ? 'Alto contraste ativado' : 'Alto contraste desativado', true);
  }

  // ---- presentation (full screen) -----------------------------------------

  /** Shows only the text, big, plus the player. Uses the Fullscreen API when
   * available (not on iPhone), and works as a plain page mode otherwise. */
  function enterPresentation() {
    if (presenting) return;
    if (!els.editor.hidden || !reader || !reader.getState().sentenceCount) {
      if (!reader) return;
      const text = els.textInput.value;
      const error = TR.validateInput(text);
      if (error) {
        showMessage(error);
        earcon('error');
        return;
      }
      hideMessage();
      if (text !== loadedText) loadText(text, 0);
      showReading();
    }
    presenting = true;
    document.body.classList.add('is-presenting');
    els.presentButton.textContent = 'Sair da tela cheia';
    els.presentButton.title = 'Sair da tela cheia (F ou Esc)';
    const root = document.documentElement;
    if (root.requestFullscreen && !document.fullscreenElement) {
      root.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    }
    announce('Tela cheia. Pressione F ou Esc para sair.', true);
    requestAnimationFrame(() => scrollToCurrent(true));
  }

  function exitPresentation() {
    if (!presenting) return;
    presenting = false;
    document.body.classList.remove('is-presenting');
    els.presentButton.textContent = 'Tela cheia';
    els.presentButton.title = 'Tela cheia (F)';
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    announce('Saiu da tela cheia', true);
    requestAnimationFrame(() => scrollToCurrent(true));
  }

  function togglePresentation() {
    if (presenting) exitPresentation();
    else enterPresentation();
  }

  function toggleSettings(open) {
    const show = typeof open === 'boolean' ? open : els.settings.hidden;
    els.settings.hidden = !show;
    els.settingsButton.setAttribute('aria-expanded', String(show));
    prefs.settingsOpen = show;
    store.savePrefs({ settingsOpen: show });
  }

  // ---- voices --------------------------------------------------------------

  function selectedVoice() {
    return voices.find((voice) => voice.voiceURI === els.voiceSelect.value) || null;
  }

  function populateVoices() {
    const list = engine.getVoices();
    const key = list.map((voice) => voice.voiceURI).join('|');
    if (!list.length || key === voicesKey) return;
    voices = list;
    voicesKey = key;

    const current = els.voiceSelect.value || prefs.voiceURI;
    const fragment = document.createDocumentFragment();
    for (const group of TR.groupVoices(list, { lang: preferredLang })) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = TR.languageName(group.lang);
      for (const voice of group.voices) {
        const option = document.createElement('option');
        option.value = voice.voiceURI;
        option.textContent = `${voice.name}${TR.isOnline(voice) ? ' (online)' : ''}`;
        optgroup.appendChild(option);
      }
      fragment.appendChild(optgroup);
    }
    els.voiceSelect.replaceChildren(fragment);

    const voice = TR.pickVoice(list, { voiceURI: current, lang: preferredLang });
    if (voice) els.voiceSelect.value = voice.voiceURI;
    applyVoice(false);
    if (els.message.dataset.code === 'no-voices') hideMessage();
  }

  function applyVoice(save) {
    const voice = selectedVoice();
    if (!voice) return;
    els.reader.lang = voice.lang || 'pt-BR';
    if (save) {
      prefs.voiceURI = voice.voiceURI;
      store.savePrefs({ voiceURI: voice.voiceURI });
    }
    if (reader) reader.setVoice(voice);
  }

  const SAMPLES = {
    pt: 'Olá! Esta é a voz que vai ler o seu texto.',
    en: 'Hello! This is the voice that will read your text.',
    es: '¡Hola! Esta es la voz que leerá tu texto.',
    fr: 'Bonjour ! Voici la voix qui lira votre texte.',
    de: 'Hallo! Das ist die Stimme, die Ihren Text vorliest.',
    it: 'Ciao! Questa è la voce che leggerà il tuo testo.',
  };

  function playSample() {
    const voice = selectedVoice();
    if (!voice) return;
    if (reader && reader.getState().status === 'playing') reader.pause();
    const lang = String(voice.lang || 'pt').slice(0, 2).toLowerCase();
    window.speechSynthesis.cancel();
    sampleUtterance = new SpeechSynthesisUtterance(SAMPLES[lang] || voice.name);
    sampleUtterance.voice = voice;
    sampleUtterance.lang = voice.lang;
    sampleUtterance.rate = currentRate();
    sampleUtterance.onend = () => {
      sampleUtterance = null;
    };
    window.speechSynthesis.speak(sampleUtterance);
  }

  // ---- resume --------------------------------------------------------------

  function offerResume() {
    const session = store.loadSession();
    if (!session) {
      // No saved text: start with the sample, so there is something to try right away.
      if (!els.textInput.value && typeof window.TextReaderSample === 'string') {
        els.textInput.value = window.TextReaderSample;
        updateStats();
      }
      return;
    }
    els.textInput.value = session.text;
    updateStats();
    if (session.sentenceIndex <= 0 || !reader) return;
    pendingSession = session;
    const preview = session.text.trim().replace(/\s+/g, ' ').slice(0, 80);
    els.resumeText.textContent =
      `Você estava ouvindo “${preview}${session.text.length > 80 ? '…' : ''}” ` +
      `e parou na frase ${numberFormat.format(session.sentenceIndex + 1)} de ` +
      `${numberFormat.format(session.sentenceCount)}.`;
    els.resume.hidden = false;
  }

  function hideResume() {
    els.resume.hidden = true;
    pendingSession = null;
  }

  function continueSession() {
    if (!pendingSession) return;
    const { text, sentenceIndex } = pendingSession;
    els.textInput.value = text;
    loadText(text, sentenceIndex);
    showReading();
    followScroll = true;
    reader.play();
    els.playButton.focus();
  }

  function forgetSession() {
    store.clearSession();
    hideResume();
    showMessage('O texto salvo foi apagado deste navegador.', 'info');
  }

  // ---- wake lock -----------------------------------------------------------

  async function requestWakeLock() {
    if (!('wakeLock' in navigator) || wakeLock || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch (error) {
      wakeLock = null;
    }
  }

  function releaseWakeLock() {
    if (wakeLock) wakeLock.release().catch(() => {});
    wakeLock = null;
  }

  // ---- keyboard ------------------------------------------------------------

  function onKeyDown(event) {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
    const target = event.target;
    if (target.closest && target.closest('textarea, input, select, [contenteditable="true"]')) return;

    const key = event.key;
    const onActivatable = target.closest && target.closest('button, a, summary');
    let handled = true;

    if (key === ' ' || key === 'k' || key === 'K') {
      if (key === ' ' && onActivatable) return; // let the focused button work
      togglePlay();
    } else if (key === 'j' || key === 'J' || key === 'ArrowLeft') {
      navigate(() => reader.previous());
    } else if (key === 'l' || key === 'L' || key === 'ArrowRight') {
      navigate(() => reader.next());
    } else if (key === 'r' || key === 'R') {
      navigate(() => reader.repeat());
    } else if (key === 'i' || key === 'I') {
      whereAmI();
    } else if (key === '+' || key === '=') {
      changeRate(0.1);
    } else if (key === '-' || key === '_') {
      changeRate(-0.1);
    } else if (key === ']') {
      changeFont(FONT_STEP);
    } else if (key === '[') {
      changeFont(-FONT_STEP);
    } else if (key === 'c' || key === 'C') {
      toggleContrast();
    } else if (key === 'f' || key === 'F') {
      togglePresentation();
    } else if (key === 'Escape') {
      if (presenting) exitPresentation();
      else stopReading();
    } else {
      handled = false;
    }
    if (handled) event.preventDefault();
  }

  // ---- wiring --------------------------------------------------------------

  function bindEditor() {
    els.textInput.addEventListener('input', () => {
      scheduleStats();
      if (!els.message.hidden && els.message.classList.contains('error')) hideMessage();
    });
    els.textInput.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        startFromEditor();
      }
    });
    els.clearButton.addEventListener('click', clearText);
    if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
      els.pasteButton.hidden = false;
      els.pasteButton.addEventListener('click', pasteFromClipboard);
    }
  }

  function bindSettings() {
    els.rateInput.value = String(TR.clampRate(prefs.rate));
    els.fontInput.value = String(prefs.fontScale);
    els.earconsInput.checked = prefs.earcons !== false;
    els.announceInput.checked = prefs.announce !== false;
    applyRate(false);
    applyFontScale();
    applyTheme();
    toggleSettings(Boolean(prefs.settingsOpen));

    els.fontDown.addEventListener('click', () => changeFont(-FONT_STEP));
    els.fontUp.addEventListener('click', () => changeFont(FONT_STEP));
    els.contrastButton.addEventListener('click', toggleContrast);
    els.presentButton.addEventListener('click', togglePresentation);
    // The browser leaves full screen on its own (Esc, gesture): follow it.
    document.addEventListener('fullscreenchange', () => {
      if (!document.fullscreenElement && presenting) exitPresentation();
    });

    els.settingsButton.addEventListener('click', () => toggleSettings());
    els.rateInput.addEventListener('input', () => applyRate(false));
    els.fontInput.addEventListener('input', applyFontScale);
    els.earconsInput.addEventListener('change', () => {
      prefs.earcons = els.earconsInput.checked;
      store.savePrefs({ earcons: prefs.earcons });
    });
    els.announceInput.addEventListener('change', () => {
      prefs.announce = els.announceInput.checked;
      store.savePrefs({ announce: prefs.announce });
    });
    els.forgetButton.addEventListener('click', forgetSession);
  }

  function bindPlayer() {
    els.playButton.addEventListener('click', togglePlay);
    els.prevButton.addEventListener('click', () => navigate(() => reader.previous()));
    els.nextButton.addEventListener('click', () => navigate(() => reader.next()));
    els.stopButton.addEventListener('click', stopReading);
    els.position.addEventListener('input', () => {
      // Wait for the slider to settle: one seek, not one per step while dragging.
      // The target is captured now: progress updates must not overwrite it.
      const target = Number(els.position.value) - 1;
      const label = `Frase ${numberFormat.format(target + 1)} de ${numberFormat.format(Number(els.position.max))}`;
      els.position.setAttribute('aria-valuetext', label);
      els.positionText.textContent = label;
      clearTimeout(seekTimer);
      seekTimer = setTimeout(() => {
        seekTimer = null;
        navigate(() => reader.seek(target));
      }, 200);
    });

    els.voiceSelect.addEventListener('change', () => applyVoice(true));
    els.sampleButton.addEventListener('click', playSample);

    els.editButton.addEventListener('click', () => {
      exitPresentation();
      reader.pause();
      showEditor();
      els.textInput.focus();
    });
    els.followButton.addEventListener('click', followCurrent);

    els.reader.addEventListener('click', (event) => {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return; // user is selecting text
      const span = event.target.closest('.sentence');
      if (!span) return;
      navigate(() => {
        reader.seek(Number(span.dataset.index));
        if (reader.getState().status !== 'playing') reader.play();
      });
    });

    els.resumeContinue.addEventListener('click', continueSession);
    els.resumeRestart.addEventListener('click', () => {
      hideResume();
      els.textInput.focus();
    });

    reader.on('load', ({ sentences, text }) => renderReader(sentences, text));
    reader.on('statechange', renderState);
    reader.on('sentence', ({ index, count }) => {
      highlightSentence(index);
      renderState(reader.getState());
      if (loadedText != null) store.savePosition(loadedText, index, count);
    });
    reader.on('word', highlightWord);
    reader.on('buffering', ({ buffering }) => renderBuffering(buffering));
    reader.on('warning', ({ message, fatal }) => {
      showMessage(message, fatal ? 'error' : 'info');
      if (fatal) earcon('error');
    });

    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onUserScroll, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && lastStatus === 'playing') requestWakeLock();
    });
    // Chrome keeps speaking after the page is closed or reloaded.
    window.addEventListener('pagehide', () => engine.cancel());
  }

  function observePlayerHeight() {
    const update = () => {
      document.documentElement.style.setProperty('--player-height', `${els.player.offsetHeight}px`);
    };
    update();
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(els.player);
    else window.addEventListener('resize', update);
  }

  function setupWordHighlight() {
    if (window.CSS && CSS.highlights && typeof window.Highlight === 'function') {
      wordHighlight = new Highlight();
      CSS.highlights.set('tr-word', wordHighlight);
    }
  }

  function init() {
    bindEditor();
    bindSettings();
    observePlayerHeight();
    updateStats();

    if (!supported) {
      showMessage(
        'Seu navegador não tem leitura em voz alta. Use Chrome, Edge, Safari ou Firefox atualizados.'
      );
      els.playButton.disabled = true;
      els.sampleButton.disabled = true;
      els.voiceSelect.disabled = true;
      els.presentButton.disabled = true;
      offerResume();
      return;
    }

    engine = TR.createSpeechEngine();
    reader = TR.createReader({ engine, rate: currentRate(), locale: preferredLang });
    setupWordHighlight();
    bindPlayer();

    engine.cancel(); // clear speech left over from a previous page (R14)
    populateVoices();
    engine.onVoicesChanged(populateVoices);
    setTimeout(() => {
      if (voices.length) return;
      showMessage(
        'Nenhuma voz foi encontrada neste navegador. Instale vozes no sistema ou use o Chrome ou o Edge. ' +
          'Você ainda pode tentar ler com a voz padrão.'
      );
      els.message.dataset.code = 'no-voices';
      els.voiceSelect.replaceChildren(new Option('Voz padrão do sistema', ''));
    }, 3000);

    renderState(reader.getState());
    offerResume();
  }

  init();
})();
