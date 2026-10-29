<p align="center">
  <img src="favicon.svg" alt="" width="72" height="72">
</p>

<h1 align="center">Contador de palavras</h1>

<p align="center">
  Conta quantas vezes cada palavra aparece em um texto e mostra o resultado em tabela e gráfico.<br>
  Parte do <strong>cinto de utilitários</strong> da <a href="https://mantis.dev.br">Mantis.dev.br</a>, ferramentas livres para uso geral da comunidade.
</p>

<p align="center">
  <a href="https://mantis-dev-br.github.io/ferramentas-utilitarias/word-freak-js/"><strong>Abrir a demonstração online</strong></a>
</p>

---

## Para que serve

Saber quais palavras se repetem em um texto é útil para:

- **Revisão de texto**: encontrar palavras repetidas demais em uma redação, artigo ou post.
- **SEO e marketing**: conferir a densidade de palavras-chave de uma página.
- **Estudos e pesquisa**: análise rápida de vocabulário, base de técnicas como *bag of words*.
- **Programação**: contar termos em logs, respostas de API ou qualquer texto, direto no seu código.

O utilitário pode ser usado de duas formas:

1. **App pronto**: cole o texto (até 2048 caracteres) ou informe a URL de uma página e clique em **Translate**.
2. **Biblioteca JavaScript**: use a função de contagem no seu próprio site ou projeto Node, sem a interface.

## Funcionalidades

- Tabela com cada palavra e sua frequência, da mais para a menos frequente (empates em ordem alfabética).
- Gráfico de barras com as 15 palavras mais frequentes.
- Carregamento do texto a partir da URL de uma página web.
- Funciona com acentos e outros alfabetos; maiúsculas e minúsculas contam como a mesma palavra;
  palavras com apóstrofo ou hífen (`don't`, `guarda-chuva`) contam como uma só.
- Layout responsivo (celular a partir de 320px) e tema escuro automático.
- Sem dependências: HTML, CSS e JavaScript puro, cerca de 4 KB de JavaScript minificado.

## Como usar o app

Use direto pela [demonstração online](https://mantis-dev-br.github.io/ferramentas-utilitarias/word-freak-js/), ou baixe/clone o repositório e abra
`word-freak-js/index.html` no navegador. Não precisa de servidor nem de instalação.

```bash
git clone https://github.com/mantis-dev-br/ferramentas-utilitarias.git
cd ferramentas-utilitarias/word-freak-js
python3 -m http.server 8080   # opcional: http://localhost:8080
```

## Como importar em outros sites

### 1. Biblioteca via CDN (só a lógica)

Inclua o script e chame `WordFrequency.analyze(texto)`. Ele devolve um objeto com a contagem,
a clusterização e os valores prontos para gráfico:

```html
<script src="https://cdn.jsdelivr.net/gh/mantis-dev-br/ferramentas-utilitarias@main/word-freak-js/js/wordFrequency.min.js"></script>
<script>
  const resultado = WordFrequency.analyze('O gato e o rato. O gato correu!');
  console.log(resultado);
</script>
```

Resultado:

```js
{
  total: 8,        // total de palavras
  unique: 5,       // palavras distintas
  // Contagem: cada palavra e sua frequência, da maior para a menor
  frequencies: [
    { word: 'o', count: 3 },
    { word: 'gato', count: 2 },
    { word: 'correu', count: 1 },
    { word: 'e', count: 1 },
    { word: 'rato', count: 1 }
  ],
  // Clusterização: palavras agrupadas pela mesma frequência
  clusters: [
    { count: 3, words: ['o'], size: 1 },
    { count: 2, words: ['gato'], size: 1 },
    { count: 1, words: ['correu', 'e', 'rato'], size: 3 }
  ],
  // Gráfico: séries prontas para Chart.js, ApexCharts, ECharts etc. (top 15 por padrão)
  chart: {
    labels: ['o', 'gato', 'correu', 'e', 'rato'],
    values: [3, 2, 1, 1, 1],
    percentages: [37.5, 25, 12.5, 12.5, 12.5]   // % sobre o total de palavras
  }
}
```

Para mudar quantas palavras entram no gráfico: `WordFrequency.analyze(texto, { chartLimit: 30 })`.

> Em produção, troque `@main` por um commit ou tag (ex.: `@c9890f1`) para que uma atualização do
> repositório não mude o comportamento do seu site sem aviso.

### 2. Exemplo: tabela e gráfico com Chart.js

```html
<textarea id="texto" rows="6" cols="50"></textarea>
<button id="contar">Contar palavras</button>
<ol id="resultado"></ol>
<canvas id="grafico"></canvas>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/mantis-dev-br/ferramentas-utilitarias@main/word-freak-js/js/wordFrequency.min.js"></script>
<script>
  let grafico;

  document.getElementById('contar').addEventListener('click', () => {
    const texto = document.getElementById('texto').value;
    const erro = WordFrequency.validateInput(texto);
    if (erro) {
      alert(erro);
      return;
    }

    const { frequencies, chart } = WordFrequency.analyze(texto, { chartLimit: 10 });

    const lista = document.getElementById('resultado');
    lista.replaceChildren(...frequencies.slice(0, 10).map(({ word, count }) => {
      const item = document.createElement('li');
      item.textContent = `${word}: ${count}`;
      return item;
    }));

    grafico?.destroy();
    grafico = new Chart(document.getElementById('grafico'), {
      type: 'bar',
      data: { labels: chart.labels, datasets: [{ label: 'Frequência', data: chart.values }] },
      options: { indexAxis: 'y' },
    });
  });
</script>
```

### 3. Exemplo: Node.js

Copie `js/wordFrequency.min.js` para o seu projeto:

```js
const WordFrequency = require('./wordFrequency.min.js');

const texto = require('fs').readFileSync('artigo.txt', 'utf8');
const { total, unique, frequencies, clusters } = WordFrequency.analyze(texto);

console.log(`${total} palavras, ${unique} distintas`);
console.table(frequencies.slice(0, 5));
console.log('Palavras que aparecem uma vez só:', clusters.at(-1).words);
```

> No Node não há limite de tamanho: o limite de 2048 caracteres só é aplicado por `validateInput`.

### 4. App completo embutido (iframe)

Incorpore a versão hospedada no GitHub Pages com um `iframe` (ou hospede a pasta `word-freak-js/`
no seu próprio servidor e troque o endereço):

```html
<iframe src="https://mantis-dev-br.github.io/ferramentas-utilitarias/word-freak-js/"
        title="Contador de palavras"
        style="width: 100%; height: 900px; border: 0;"
        loading="lazy"></iframe>
```

Dentro da página do app, cada clique em **Translate** também dispara o evento
`wordfrequency:result` no `document`, com o mesmo objeto de `analyze` em `event.detail`, e guarda
o último resultado em `WordFrequency.lastResult`.

## Referência da API

Todas as funções estão em `WordFrequency` (navegador) ou no objeto retornado por `require` (Node).

| Função / constante | Retorno | Descrição |
|---|---|---|
| `analyze(texto, { chartLimit = 15 })` | `{ total, unique, frequencies, clusters, chart }` | Análise completa: contagem, clusterização e valores do gráfico (formato acima). |
| `countWords(texto)` | `Array<{ word, count }>` | Só a contagem, ordenada por frequência (decrescente) e depois alfabeticamente. |
| `clusterByFrequency(frequencies)` | `Array<{ count, words, size }>` | Agrupa o resultado de `countWords` por frequência, do grupo mais frequente ao menos frequente. |
| `chartData(frequencies, total, limite)` | `{ labels, values, percentages }` | Séries para gráfico com as `limite` palavras mais frequentes. |
| `tokenize(texto)` | `string[]` | Separa o texto em palavras, em minúsculas e na ordem em que aparecem. |
| `validateInput(texto)` | `string \| null` | Mensagem de erro (texto vazio, acima do limite ou sem palavras) ou `null` se válido. |
| `extractTextFromHtml(html, parser)` | `string` | Extrai o texto visível de um HTML, sem scripts e estilos. No navegador, passe `new DOMParser()`. |
| `MAX_LENGTH` | `number` | Limite de caracteres do app: `2048`. |

## Privacidade

O texto digitado é processado no próprio navegador e não é enviado a nenhum servidor. A única exceção
é o recurso **Carregar URL**: o endereço informado é buscado pelo serviço público
[allorigins.win](https://allorigins.win), necessário porque os navegadores bloqueiam a leitura
direta de páginas de outros sites.

## Contribuindo

Sugestões e correções são bem-vindas: abra uma *issue* ou um *pull request* no
[repositório](https://github.com/mantis-dev-br/ferramentas-utilitarias).

O código-fonte fica em `js/wordFrequency.js` (lógica, sem DOM) e `js/app.js` (interface). A página
carrega as versões minificadas, então, depois de editar:

```bash
cd word-freak-js
npm install      # instala o terser (minificador)
npm test         # testes da lógica (node --test)
npm run build    # regera js/*.min.js — inclua os .min.js no commit
```

## Licença

Software livre sob a [licença MIT](../LICENSE): use, copie, modifique e distribua, inclusive em
projetos comerciais, mantendo o aviso de copyright.

---

<p align="center">
  <img src="css/mantis_white_background.png" alt="Mantis" width="48" height="48"><br>
  © 2026 <a href="https://mantis.dev.br">Mantis.dev.br</a> – Sistemas de Visão Computacional<br>
  Autor: Willian Rocha
</p>
