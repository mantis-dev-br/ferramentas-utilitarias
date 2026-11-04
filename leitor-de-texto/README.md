<p align="center">
  <img src="favicon.svg" alt="" width="72" height="72">
</p>

<h1 align="center">Leitor de texto</h1>

<p align="center">
  Cole qualquer texto, de qualquer tamanho, e ouça em voz alta com a frase em leitura destacada.<br>
  Parte do <strong>cinto de utilitários</strong> da <a href="https://mantis.dev.br">Mantis.dev.br</a>, ferramentas livres para uso geral da comunidade.
</p>

<p align="center">
  <a href="https://mantis-dev-br.github.io/ferramentas-utilitarias/leitor-de-texto/"><strong>Abrir a demonstração online</strong></a>
</p>

---

## Para que serve

- **Acessibilidade**: feito para pessoas cegas e com baixa visão. Funciona todo pelo teclado, com
  leitores de tela (NVDA, JAWS, Orca, VoiceOver, TalkBack), sons de aviso e texto ampliável.
- **Estudos**: ouvir apostilas, artigos e resumos enquanto faz outra coisa.
- **Revisão de textos**: ouvir o próprio texto revela repetições e frases longas demais.
- **Idiomas**: ouvir a pronúncia de um texto em inglês, espanhol ou outro idioma.
- **Programação**: adicionar "ouvir este texto" em blogs e documentações com a biblioteca.

Tudo é **gratuito**: usa a voz do próprio navegador, sem servidor, sem chave de API e sem cadastro.

## Funcionalidades

- Lê textos de até 500.000 caracteres (horas de áudio) do início ao fim, **sem cortes**.
- Abre com um **texto de exemplo** de cerca de 15 minutos, para experimentar na hora. O botão **Limpar** apaga o exemplo.
- **Destaque da frase** em leitura, frases já lidas atenuadas e rolagem que acompanha a leitura.
- Destaque da **palavra** em leitura, quando a voz informa a posição (normalmente, as vozes locais).
- Ler, pausar, continuar, parar, frase anterior e próxima, e **clicar numa frase** para ler dali.
- Controle de posição ("Frase 12 de 340") e tempo restante estimado.
- Escolha de voz agrupada por idioma, com as vozes de melhor qualidade primeiro e marca **(online)**
  nas vozes que enviam o texto a servidores.
- Velocidade de 0,5× a 3,0×.
- Indicador **"Aguardando a voz…"** quando uma voz online demora a responder (latência de rede).
- **Retoma de onde parou**: o texto e a posição ficam salvos só no seu navegador.
- Mantém a tela do celular ligada durante a leitura.
- **Texto ampliável até 300%** com os botões A− e A+, sem perder o layout.
- **Alto contraste**: fundo preto, texto amarelo e a frase atual em amarelo com letras pretas.
- **Tela cheia** para apresentar o texto: só o texto, grande e centralizado, com os controles de leitura.
- Layout responsivo (a partir de 320 px), tema escuro automático e suporte ao alto contraste do sistema.
- Sem dependências: HTML, CSS e JavaScript puro.

## Acessibilidade

O app foi pensado primeiro para quem não enxerga a tela:

| Recurso | Como funciona |
|---|---|
| Teclado | Tudo funciona sem mouse. O primeiro item da página é o link "Ir para os controles de leitura". |
| Começar rápido | Cole o texto e pressione <kbd>Ctrl</kbd> + <kbd>Enter</kbd> sem sair da caixa de texto. |
| Navegar no texto | O controle "Posição da leitura" é um controle deslizante nativo, anunciado como "Frase 12 de 340". |
| Saber onde está | A tecla <kbd>I</kbd> anuncia a frase, a porcentagem lida e o tempo restante. |
| Sem falas sobrepostas | O leitor de tela só ouve as mudanças de estado ("Lendo", "Pausado", "Leitura concluída"), nunca o texto que a voz do app está lendo. Os anúncios podem ser desligados. |
| Sons de aviso | Tons curtos ao começar, pausar, parar, terminar e em caso de erro. Podem ser desligados. |
| Título da aba | Mostra o estado ("▶ Frase 12/340"), útil ao alternar janelas. |
| Baixa visão | Texto ampliável até 300% (A− e A+), tema de alto contraste amarelo sobre preto, tela cheia com o texto grande, alto contraste do sistema e zoom sem rolagem horizontal. |

### Atalhos de teclado

Funcionam quando o foco não está numa caixa de texto ou num controle deslizante. Com leitor de tela no
modo de navegação, ative o modo de foco (no NVDA, <kbd>Insert</kbd> + <kbd>Espaço</kbd>) ou use os botões.

| Tecla | Ação |
|---|---|
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Começar a ler (dentro da caixa de texto) |
| <kbd>Espaço</kbd> ou <kbd>K</kbd> | Ler, pausar e continuar |
| <kbd>J</kbd> ou <kbd>←</kbd> | Frase anterior |
| <kbd>L</kbd> ou <kbd>→</kbd> | Próxima frase |
| <kbd>R</kbd> | Repetir a frase atual |
| <kbd>I</kbd> | Onde estou |
| <kbd>+</kbd> e <kbd>-</kbd> | Aumentar e diminuir a velocidade |
| <kbd>]</kbd> e <kbd>[</kbd> | Aumentar e diminuir o texto |
| <kbd>C</kbd> | Alto contraste (fundo preto, texto amarelo) |
| <kbd>F</kbd> | Tela cheia (apresentação) |
| <kbd>Esc</kbd> | Sair da tela cheia; fora dela, parar |

## Qual navegador e qual voz usar

| Navegador | Vozes |
|---|---|
| Microsoft Edge | As melhores gratuitas: vozes "Natural" (em português, Francisca e Antonio). São online. |
| Google Chrome | Voz "Google português do Brasil", boa e online. Também mostra as vozes do sistema. |
| Safari (macOS e iOS) | Vozes do sistema. Em Ajustes > Acessibilidade > Conteúdo Falado, baixe vozes "Melhorada" ou "Premium". |
| Firefox | Vozes do sistema. No Linux, costumam ser robóticas (eSpeak). |
| Android | Vozes do mecanismo de voz do aparelho (Configurações > Acessibilidade > Saída de texto para fala). |

No Windows, outras vozes podem ser instaladas em Configurações > Hora e idioma > Fala.

## Como usar o app

Use direto pela [demonstração online](https://mantis-dev-br.github.io/ferramentas-utilitarias/leitor-de-texto/),
ou baixe/clone o repositório e abra `leitor-de-texto/index.html` no navegador. Não precisa de servidor.

```bash
git clone https://github.com/mantis-dev-br/ferramentas-utilitarias.git
cd ferramentas-utilitarias/leitor-de-texto
python3 -m http.server 8080   # opcional: http://localhost:8080
```

## Como importar em outros sites

### 1. Botão "ouvir este artigo"

```html
<button id="ouvir">Ouvir este artigo</button>
<article id="artigo">…</article>

<script src="https://cdn.jsdelivr.net/gh/mantis-dev-br/ferramentas-utilitarias@main/leitor-de-texto/js/textReader.min.js"></script>
<script>
  const leitor = TextReader.createReader();          // usa window.speechSynthesis
  const botao = document.getElementById('ouvir');

  botao.addEventListener('click', () => {
    if (!leitor.getSentences().length) {
      leitor.load(document.getElementById('artigo').innerText);
    }
    leitor.toggle();                                  // ler / pausar / continuar
  });

  leitor.on('statechange', ({ status }) => {
    botao.textContent = status === 'playing' ? 'Pausar' : 'Ouvir este artigo';
  });
</script>
```

> Em produção, troque `@main` por um commit ou tag para que uma atualização do repositório não mude o
> comportamento do seu site sem aviso.

### 2. Escolher a voz e a velocidade

```js
const vozes = speechSynthesis.getVoices();           // no Chrome, espere o evento "voiceschanged"
const voz = TextReader.pickVoice(vozes, { lang: 'pt-BR' });
const leitor = TextReader.createReader({ voice: voz, rate: 1.2 });
```

### 3. Destacar a frase em leitura

```js
leitor.on('sentence', ({ index, start, end, count }) => {
  // start/end são posições no texto original passado para load()
  console.log(`Frase ${index + 1} de ${count}:`, texto.slice(start, end));
});
```

### 4. Só a divisão do texto (Node.js)

```js
const TextReader = require('./textSegmenter.js');

const frases = TextReader.segment('O Dr. Silva chegou. Era tarde!');
// [{ index: 0, start: 0, end: 19, text: 'O Dr. Silva chegou.' },
//  { index: 1, start: 20, end: 30, text: 'Era tarde!' }]

TextReader.chunk(frases[0], { maxChars: 10 });       // partes de no máximo 10 caracteres
```

### 5. App completo embutido (iframe)

```html
<iframe src="https://mantis-dev-br.github.io/ferramentas-utilitarias/leitor-de-texto/"
        title="Leitor de texto"
        style="width: 100%; height: 900px; border: 0;"
        loading="lazy"></iframe>
```

## Referência da API

### `TextReader.createReader(opções)`

| Opção | Padrão | Descrição |
|---|---|---|
| `voice` | `null` (voz padrão) | Um `SpeechSynthesisVoice`. |
| `rate` | `1` | Velocidade, de 0,5 a 3. |
| `locale` | `'pt-BR'` | Idioma usado para dividir as frases quando não há voz escolhida. |
| `lookahead` | `2` | Quantos trechos ficam na fila da voz ao mesmo tempo. |
| `bufferingDelay` | `300` | Milissegundos de espera antes de emitir `buffering`. |
| `synth`, `Utterance`, `engine`, `clock` | navegador | Dependências injetáveis (usadas nos testes). |

| Método | Descrição |
|---|---|
| `load(texto, { startAt })` | Carrega um texto e devolve as frases. `startAt` define a frase inicial. |
| `play()`, `pause()`, `toggle()`, `stop()` | Controle da leitura. `pause` + `play` relê a frase atual. |
| `seek(índice)`, `next()`, `previous()`, `repeat()` | Navegação por frase. |
| `setVoice(voz)`, `setRate(velocidade)` | Valem na hora: a frase atual recomeça com a nova configuração. |
| `getState()` | `{ status, sentenceIndex, sentenceCount, voiceURI, rate, remainingMinutes, buffering }` |
| `getSentences()`, `getText()`, `getVoice()` | Dados carregados. |
| `on(evento, função)` / `off(...)` | Assina eventos. `on` devolve uma função para cancelar. |
| `destroy()` | Para a leitura e remove os ouvintes. |

| Evento | Dados |
|---|---|
| `statechange` | O mesmo objeto de `getState()`. `status`: `idle`, `playing`, `paused` ou `finished`. |
| `sentence` | `{ index, start, end, count }` quando uma frase começa. |
| `word` | `{ start, end, sentenceIndex }` quando a voz informa a palavra (nem todas informam). |
| `load` | `{ sentences, text }` |
| `finished` | Estado final. |
| `warning` | `{ code, message, fatal }`: trecho pulado ou erro que pausou a leitura. |
| `buffering` | `{ buffering, sentenceIndex }`: `true` quando a voz demora para começar um trecho (latência das vozes online); `false` quando ela começa. |

### Funções puras

| Função | Descrição |
|---|---|
| `segment(texto, { locale })` | Divide em frases `{ index, start, end, text }`. Quebras de linha encerram frases; abreviações ("Dr.", "Sra.") e números não cortam. |
| `chunk(frase, { maxChars })` | Divide uma frase em trechos, preferindo `;` `:`, depois vírgulas, depois espaços. |
| `rankVoices(vozes, { lang })`, `groupVoices(...)`, `pickVoice(...)` | Ordenam, agrupam e escolhem vozes. |
| `isOnline(voz)`, `chunkLimit(voz, velocidade)` | Voz online e tamanho máximo de trecho para ela. |
| `countWords(texto)`, `estimateMinutes(palavras, velocidade)`, `validateInput(texto)` | Utilitários. |
| `createProgressStore(storage)`, `hashText(texto)` | Preferências e "continuar de onde parou". |

## Como funciona

A API de voz dos navegadores (`speechSynthesis`) é gratuita, mas tem falhas conhecidas com textos longos.
O app contorna cada uma:

| Problema do navegador | Solução |
|---|---|
| No Chrome, vozes online param depois de uns 15 segundos de fala contínua. | O texto é dividido em **frases**, e frases longas em **trechos** de no máximo ~13 segundos, cortados em pausas naturais (`;`, `:`, vírgula). A entonação continua natural. |
| Silêncio entre um trecho e outro. | O trecho seguinte já fica na fila da voz enquanto o atual é falado. |
| `pause()`/`resume()` travam com vozes online e no Android. | Pausar cancela a fala e guarda a frase; continuar relê a frase do início. |
| O Chrome às vezes "perde" a fala e nunca avisa que terminou. | Todas as falas ficam referenciadas, e um vigia reenvia o trecho travado uma vez ou o pula com aviso. |
| Eventos atrasados de falas canceladas. | Cada cancelamento cria uma nova geração; eventos antigos são ignorados. |

Arquitetura em camadas, todas em `js/`:

| Módulo | Papel |
|---|---|
| `textSegmenter.js` | Frases e trechos (lógica pura) |
| `voiceCatalog.js` | Ordenação de vozes e limites (lógica pura) |
| `progressStore.js` | Preferências e retomada (armazenamento injetado) |
| `speechEngine.js` | Adaptador da `speechSynthesis` |
| `readerController.js` | Máquina de estados da leitura |
| `emitter.js` | Eventos |
| `sampleText.js` | Texto de exemplo (só no app, fora da biblioteca) |
| `app.js` | Interface |

## Privacidade

Este app não envia o seu texto a nenhum servidor e não usa cookies nem rastreamento. **Atenção**: as vozes
marcadas como **(online)** são geradas pela Google (Chrome) ou pela Microsoft (Edge), e o texto lido vai
para os servidores delas. Para privacidade total, escolha uma voz sem essa marca. O texto salvo para
retomar a leitura fica só no seu navegador e pode ser apagado em **Ajustes > Esquecer texto salvo**.

## Contribuindo

Sugestões e correções são bem-vindas: abra uma *issue* ou um *pull request* no
[repositório](https://github.com/mantis-dev-br/ferramentas-utilitarias).

A página carrega as versões minificadas, então, depois de editar um `.js`:

```bash
cd leitor-de-texto
npm install      # instala o terser (minificador)
npm test         # testes da lógica (node --test)
npm run build    # regera js/textReader.min.js e js/app.min.js — inclua-os no commit
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
