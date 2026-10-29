# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório.

## Visão geral

**Word Frequency** — app web (Tier 1, iniciante) que conta a frequência de cada palavra
em um bloco de texto e mostra uma tabela ordenada da maior para a menor frequência.
A especificação original está em [App.md](App.md).

## Stack

- HTML + CSS + JavaScript puro (sem framework, sem bundler, sem dependências de runtime).
- O app abre direto no navegador (`index.html` via `file://` também funciona), por isso os
  scripts são clássicos (não ES modules).
- Testes com o runner nativo do Node (`node --test`, Node >= 18).

## Estrutura

```
index.html          # marcação da página
css/styles.css      # estilos (tokens de cor em :root, tema escuro via prefers-color-scheme)
js/wordFrequency.js # lógica pura: tokenização, contagem, ordenação, extração de texto de HTML
js/app.js           # camada de UI: eventos, validação, renderização da tabela e do gráfico
tests/wordFrequency.test.js
```

`js/wordFrequency.js` não toca no DOM (exceto `extractTextFromHtml`, que recebe um
`DOMParser` injetado) e é exportado tanto em `window.WordFrequency` quanto em
`module.exports` para poder ser testado no Node.

## Comandos

```bash
npm test              # roda os testes unitários
npm start             # serve em http://localhost:8080 (python3 -m http.server)
```

## Regras de negócio

- Entrada máxima: **2048 caracteres** (`MAX_LENGTH`), aplicada no `maxlength` do textarea e
  validada novamente no JS.
- Texto vazio (ou só espaços) → mensagem de erro, tabela não é alterada.
- Palavras: sequências de letras/números Unicode (acentos são preservados); apóstrofos e
  hífens internos fazem parte da palavra (`don't`, `guarda-chuva`). Comparação é
  case-insensitive (tudo vira minúsculo).
- Ordenação: frequência decrescente; empate → ordem alfabética (`localeCompare`).
- O botão principal se chama **Translate**, conforme a especificação.

## Funcionalidades bônus

- Gráfico de barras horizontais (top 15 palavras), feito com `div`s — sem biblioteca.
- Carregar texto de uma URL: o conteúdo é buscado via proxy CORS público
  (`api.allorigins.win`), convertido para texto puro, truncado em 2048 caracteres e
  colocado no textarea. Falhas de rede mostram mensagem de erro.

## Convenções

- Código e identificadores em inglês; textos da interface em português (exceto "Translate").
- Toda saída com conteúdo do usuário vai para o DOM via `textContent`, nunca `innerHTML`.
- Mudou a lógica em `wordFrequency.js`? Atualize/adicione testes e rode `npm test`.
