(function () {
  'use strict';

  const { MAX_LENGTH, countWords, validateInput, extractTextFromHtml } = window.WordFrequency;
  const CHART_LIMIT = 15;
  const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

  const textForm = document.getElementById('text-form');
  const textInput = document.getElementById('text-input');
  const charCount = document.getElementById('char-count');
  const clearButton = document.getElementById('clear-button');
  const message = document.getElementById('message');
  const summary = document.getElementById('summary');
  const tableBody = document.getElementById('frequency-body');
  const chart = document.getElementById('chart');
  const urlForm = document.getElementById('url-form');
  const urlInput = document.getElementById('url-input');
  const urlButton = document.getElementById('url-button');

  function showMessage(text, type = 'error') {
    message.textContent = text;
    message.className = `message ${type}`;
    message.hidden = false;
  }

  function hideMessage() {
    message.hidden = true;
    message.textContent = '';
  }

  function updateCharCount() {
    charCount.textContent = `${textInput.value.length} / ${MAX_LENGTH}`;
    charCount.classList.toggle('limit', textInput.value.length >= MAX_LENGTH);
  }

  function renderPlaceholder() {
    summary.textContent = 'Nenhuma análise realizada ainda.';
    tableBody.replaceChildren(placeholderRow('A tabela aparecerá aqui.'));
    const p = document.createElement('p');
    p.className = 'empty-chart';
    p.textContent = 'O gráfico aparecerá aqui.';
    chart.replaceChildren(p);
  }

  function placeholderRow(text) {
    const row = document.createElement('tr');
    row.className = 'empty';
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.textContent = text;
    row.appendChild(cell);
    return row;
  }

  function renderTable(frequencies) {
    const rows = frequencies.map(({ word, count }, index) => {
      const row = document.createElement('tr');
      [index + 1, word, count].forEach((value, col) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        if (col !== 1) cell.className = 'num';
        row.appendChild(cell);
      });
      return row;
    });
    tableBody.replaceChildren(...rows);
  }

  function renderChart(frequencies) {
    const top = frequencies.slice(0, CHART_LIMIT);
    const max = top[0].count;
    const bars = top.map(({ word, count }) => {
      const item = document.createElement('div');
      item.className = 'bar-row';

      const label = document.createElement('span');
      label.className = 'bar-label';
      label.textContent = word;
      label.title = word;

      const track = document.createElement('div');
      track.className = 'bar-track';
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.width = `${(count / max) * 100}%`;
      track.appendChild(bar);

      const value = document.createElement('span');
      value.className = 'bar-value';
      value.textContent = count;

      item.append(label, track, value);
      return item;
    });
    chart.replaceChildren(...bars);
  }

  function analyze() {
    const text = textInput.value;
    const error = validateInput(text);
    if (error) {
      showMessage(error);
      textInput.focus();
      return;
    }
    hideMessage();

    const frequencies = countWords(text);
    const total = frequencies.reduce((sum, item) => sum + item.count, 0);
    summary.textContent = `${total} palavra${total === 1 ? '' : 's'} no total, ` +
      `${frequencies.length} única${frequencies.length === 1 ? '' : 's'}.`;
    renderTable(frequencies);
    renderChart(frequencies);
  }

  async function loadFromUrl() {
    const raw = urlInput.value.trim();
    let url;
    try {
      url = new URL(raw);
      if (!/^https?:$/.test(url.protocol)) throw new Error('protocol');
    } catch {
      showMessage('Informe uma URL válida começando com http:// ou https://.');
      urlInput.focus();
      return;
    }

    urlButton.disabled = true;
    urlButton.textContent = 'Carregando...';
    try {
      const response = await fetch(CORS_PROXY + encodeURIComponent(url.href));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const text = extractTextFromHtml(html, new DOMParser());
      if (!text) {
        showMessage('Não foi encontrado texto nessa página.');
        return;
      }
      textInput.value = text.slice(0, MAX_LENGTH);
      updateCharCount();
      if (text.length > MAX_LENGTH) {
        showMessage(`O conteúdo foi truncado para os primeiros ${MAX_LENGTH} caracteres.`, 'info');
      } else {
        hideMessage();
      }
      analyze();
    } catch (err) {
      showMessage(`Não foi possível carregar a página (${err.message}).`);
    } finally {
      urlButton.disabled = false;
      urlButton.textContent = 'Carregar URL';
    }
  }

  textForm.addEventListener('submit', (event) => {
    event.preventDefault();
    analyze();
  });

  urlForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadFromUrl();
  });

  textInput.addEventListener('input', () => {
    updateCharCount();
    if (!message.hidden && textInput.value.trim()) hideMessage();
  });

  clearButton.addEventListener('click', () => {
    textInput.value = '';
    updateCharCount();
    hideMessage();
    renderPlaceholder();
    textInput.focus();
  });

  updateCharCount();
})();
