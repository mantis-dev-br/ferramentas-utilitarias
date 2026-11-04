/*
 * Leitor de texto – sampleText.js
 * Default sample text shown in the editor when there is no saved text.
 * Long on purpose (about 15 minutes of audio) and written to exercise the
 * segmenter: headings without periods, lists, abbreviations, numbers, quotes,
 * questions, ellipses and very long sentences that must be split into chunks.
 * (c) 2026 Willian Rocha – Mantis.dev.br – MIT License
 */
(function (root) {
  'use strict';

  root.TextReaderSample = `A voz das máquinas: uma breve história da leitura em voz alta

Apresentação

Este é um texto de exemplo do Leitor de texto. Ele foi escrito para você experimentar a ferramenta antes de colar o seu próprio conteúdo. Para começar, pressione o botão Ler. Se preferir o teclado, coloque o cursor na caixa de texto e pressione Ctrl e Enter ao mesmo tempo. Para apagar este exemplo e colar outro texto, use o botão Limpar.

Durante a leitura, a frase que está sendo falada fica destacada na tela, e as frases já lidas ficam com uma cor mais suave. Você pode clicar em qualquer frase para continuar a leitura a partir dela, ou usar o controle de posição, na parte de baixo da tela, para pular para outro trecho. A velocidade e a voz podem ser trocadas a qualquer momento no botão Ajustes, e a mudança vale na hora.

O texto é longo de propósito: são cerca de quinze minutos de áudio na velocidade normal. Assim dá para conferir que a leitura segue do começo ao fim, sem cortes, mesmo com as vozes online, que antigamente paravam de falar depois de poucos segundos.

O sonho de uma máquina que fala

A ideia de uma máquina capaz de falar é muito mais antiga do que o computador. Durante séculos, inventores e curiosos tentaram imitar a voz humana com foles, tubos, palhetas e câmaras de ressonância, inspirados no funcionamento dos pulmões, das cordas vocais e da boca.

No fim do século XVIII, o inventor húngaro Wolfgang von Kempelen construiu uma das máquinas falantes mais conhecidas da história. Ela usava um fole no lugar dos pulmões, uma palheta vibrante no lugar das cordas vocais e uma espécie de boca de couro que o operador moldava com as mãos. O resultado estava longe de ser natural, mas a máquina conseguia pronunciar palavras e frases curtas, o que impressionava quem assistia às demonstrações.

Será que aquelas pessoas imaginavam que, dois séculos depois, um telefone de bolso leria livros inteiros em voz alta? Provavelmente não. Mas a pergunta que movia Kempelen era a mesma que move os pesquisadores de hoje: como transformar a escrita em som de um jeito que qualquer pessoa consiga entender?

A eletricidade entra em cena

No século XX, a eletricidade mudou completamente o problema. Em vez de imitar a garganta com peças mecânicas, os engenheiros passaram a gerar e combinar sinais elétricos que, amplificados em um alto-falante, soavam como vozes.

Um marco dessa época foi o Voder, apresentado pelos Laboratórios Bell na Feira Mundial de Nova York, em 1939. O aparelho era tocado como um instrumento musical: uma operadora treinada durante meses usava teclas e pedais para controlar os sons, e o público ouvia frases sintetizadas, ainda um pouco metálicas, saindo de uma caixa. A demonstração mostrou que a fala podia ser decomposta em elementos simples e reconstruída artificialmente.

Em 1961, outro momento entrou para a história: um computador IBM 704, programado por pesquisadores dos Laboratórios Bell, cantou a canção "Daisy Bell". Era a primeira vez que muita gente ouvia um computador cantar, e a cena inspirou, anos depois, uma passagem famosa do cinema de ficção científica.

Ler para quem não enxerga

Até então, a síntese de voz era sobretudo uma curiosidade de laboratório. Isso começou a mudar quando ela encontrou um propósito social muito claro: dar acesso à palavra escrita a pessoas cegas ou com baixa visão.

Em 1976, o inventor norte-americano Ray Kurzweil apresentou uma máquina de leitura capaz de reconhecer as letras impressas de um livro, com uma câmera, e de lê-las em voz alta com uma voz sintetizada. O aparelho era grande, caro e lento para os padrões atuais, mas representou uma pequena revolução: pela primeira vez, uma pessoa cega podia "ler" sozinha um livro comum, sem depender de alguém que lesse para ela nem de uma versão em braile.

Nas décadas seguintes, os sintetizadores de voz ficaram menores e mais baratos, e passaram a ser usados em computadores pessoais. Vozes como as dos anos 1980, com aquele timbre robótico inconfundível, tornaram-se familiares para muita gente, inclusive por causa de cientistas e personalidades que as usavam para se comunicar.

Os leitores de tela

Com a chegada das interfaces gráficas, com janelas, ícones e mouse, surgiu um novo desafio. Não bastava ler um texto corrido: era preciso descrever botões, menus, caixas de seleção e tudo o que aparece na tela, e permitir que a pessoa navegasse por eles usando apenas o teclado.

É isso que fazem os leitores de tela. O JAWS, lançado em meados dos anos 1990 para o Windows, tornou-se uma ferramenta profissional muito usada por pessoas cegas no trabalho. Em 2006, dois desenvolvedores australianos, Michael Curran e James Teh, criaram o NVDA, um leitor de tela gratuito e de código aberto que hoje é usado no mundo inteiro, inclusive no Brasil, e que democratizou o acesso ao computador para quem não podia pagar por uma licença.

A Apple incorporou o VoiceOver ao sistema dos seus computadores em 2005 e, em 2009, levou o recurso ao iPhone, mostrando que até uma tela de vidro, sem teclas físicas, podia ser usada por uma pessoa cega com gestos simples. O Android tem o TalkBack, e o Linux tem o Orca. Hoje, praticamente todo sistema operacional vem com um leitor de tela pronto para usar.

Uma pessoa que usa leitor de tela costuma ouvir a voz sintetizada em velocidades que parecem impossíveis para quem não está acostumado: duas, três e até quatro vezes mais rápido do que a fala normal. Com a prática, o cérebro se adapta, e a leitura fica tão eficiente quanto a leitura visual. É por isso que este leitor permite chegar a três vezes a velocidade normal.

As vozes neurais

Durante muito tempo, as vozes sintetizadas eram produzidas de duas maneiras principais. Na primeira, regras matemáticas geravam o som de cada fonema, o que produzia vozes compreensíveis, mas claramente artificiais. Na segunda, chamada de síntese por concatenação, pequenos pedaços de gravações de uma pessoa real eram recortados e colados uns nos outros, o que soava mais natural, mas criava emendas audíveis e uma entonação muitas vezes estranha.

A partir de meados da década de 2010, as redes neurais mudaram esse cenário. Em 2016, pesquisadores da DeepMind apresentaram o WaveNet, um modelo capaz de gerar o som da voz amostra por amostra, aprendendo diretamente com gravações humanas. As vozes neurais que vieram depois respiram, fazem pausas, mudam a entonação no fim das perguntas e soam, em muitos casos, quase indistinguíveis de uma pessoa falando.

Muitas dessas vozes estão disponíveis de graça nos navegadores. No Microsoft Edge, as vozes chamadas Natural, como Francisca e Antonio, em português do Brasil, são vozes neurais. No Google Chrome, a voz Google português do Brasil também é gerada nos servidores da empresa. Por serem geradas em servidores, essas vozes precisam de internet e recebem o texto que está sendo lido, e é por isso que este leitor marca cada uma delas com a palavra online.

O problema dos textos longos

Há alguns anos, quem tentava usar a voz do navegador para ouvir um texto longo descobria um problema curioso: depois de uns quinze segundos, a voz simplesmente sumia, sem nenhuma mensagem de erro. Isso acontece porque, em alguns navegadores, as vozes online não conseguem falar um trecho muito longo de uma vez só.

A solução mais comum era quebrar o texto em pedaços com um número fixo de palavras e enviá-los um de cada vez. Funcionava, mas a leitura ficava robótica: as frases eram cortadas no meio, a voz fazia entonação de final de frase onde a frase não tinha terminado, e havia um pequeno silêncio entre um pedaço e outro.

Este leitor resolve o problema de outra forma. Primeiro, o texto é dividido em frases, respeitando abreviações como Dr., Sra. e Prof., e números como R$ 1.500,00 ou 3,14, que têm pontos e vírgulas mas não terminam frase nenhuma. Depois, só as frases muito longas são divididas em trechos menores, sempre numa pausa natural: primeiro no ponto e vírgula ou nos dois-pontos, depois na vírgula e, só em último caso, entre duas palavras. Assim, a voz respira onde uma pessoa também respiraria.

Para testar isso, aqui vai uma frase propositalmente enorme, daquelas que aparecem em contratos, leis e textos acadêmicos, com muitas orações encadeadas, vírgulas, pontos e vírgulas e explicações dentro de explicações; ela continua por muito mais tempo do que qualquer voz online conseguiria falar de uma só vez, passando por assuntos variados, como a história da escrita, a invenção da imprensa, a popularização dos livros, o surgimento das bibliotecas públicas, a chegada do rádio e da televisão, a criação dos computadores pessoais e, finalmente, a explosão da internet, que colocou uma quantidade inimaginável de textos ao alcance de qualquer pessoa com um telefone no bolso, mas que, ao mesmo tempo, criou novas barreiras para quem não enxerga bem, não lê com facilidade ou simplesmente prefere ouvir a ler, e é exatamente para essas pessoas que ferramentas como esta existem.

Se você chegou até aqui ouvindo, a frase acima foi lida inteira, sem cortes e com pausas nos lugares certos.

Enquanto a voz fala um trecho, o próximo já fica esperando na fila. Por isso, não há silêncio entre um trecho e outro. E, se por algum motivo a voz travar, o leitor percebe, tenta de novo e, se não conseguir, pula aquele pedaço e avisa você, em vez de ficar parado em silêncio.

Dicas para ouvir melhor

- Experimente vozes diferentes: a qualidade muda bastante de um navegador para outro.
- No Edge, prefira as vozes Natural, que são as mais agradáveis para textos longos.
- Comece na velocidade normal e aumente aos poucos, de um décimo em um décimo.
- Use as teclas J e L para voltar e avançar uma frase, e R para repetir a frase atual.
- Pressione I para saber em que frase você está e quanto tempo falta.
- No celular, a tela fica ligada durante a leitura, porque a maioria dos navegadores para de falar quando a tela é bloqueada.
- Se precisar parar, não se preocupe: o leitor lembra onde você parou e oferece continuar dali na próxima vez.

Perguntas frequentes

O meu texto vai para algum servidor? Este site não envia o seu texto para lugar nenhum. Mas, se você escolher uma voz marcada como online, o navegador envia o texto ao servidor da empresa dona da voz para gerar o áudio. Para privacidade total, escolha uma voz sem essa marca.

Posso usar sem internet? Pode, desde que escolha uma voz instalada no próprio aparelho, ou seja, sem a marca online. As vozes online precisam de conexão.

Por que a voz do meu computador parece um robô? Provavelmente porque ela é uma voz antiga, instalada com o sistema. No Windows, é possível instalar vozes melhores nas configurações de fala. No Linux, as vozes padrão costumam ser simples, e vale a pena usar o Chrome ou o Edge, que trazem vozes próprias.

Funciona com o meu leitor de tela? Sim. O leitor foi pensado para funcionar com NVDA, JAWS, Orca, VoiceOver e TalkBack. Ele avisa o leitor de tela apenas quando a leitura começa, pausa ou termina, para que as duas vozes não falem ao mesmo tempo, e você pode desligar até esses avisos nos ajustes.

Um pouco de tudo, para testar a pronúncia

O Sr. Oliveira e a Sra. Costa marcaram uma reunião para as 14h30 do dia 15/03/2027, na Av. Paulista, nº 1.000. A pauta tinha três itens: o orçamento de R$ 2.350.000,00, o cronograma de 18 meses e a contratação de 12 pessoas. "Precisamos decidir hoje", disse a Profa. Lima. Ninguém discordou... mas também ninguém respondeu.

Ela insistiu: "E então?" O silêncio continuou por alguns segundos. Até que alguém, lá no fundo da sala, levantou a mão e perguntou se o café já tinha acabado!

Endereços de internet também aparecem nos textos, como https://mantis-dev-br.github.io/ferramentas-utilitarias/leitor-de-texto/, e o leitor lê o que estiver escrito, do jeito que estiver escrito.

Para fechar

A história da síntese de voz é, no fundo, a história de uma pergunta simples: como fazer a palavra escrita chegar a todas as pessoas? Dos foles de Kempelen às vozes neurais, cada geração de inventores respondeu com as ferramentas do seu tempo.

Hoje, a resposta cabe num navegador, é gratuita e está ao alcance de um clique. Este leitor é uma pequena contribuição a essa história: uma ferramenta livre, sem cadastro e sem custo, feita para que qualquer pessoa, enxergando ou não, possa ouvir qualquer texto do começo ao fim.

Obrigado por ouvir até aqui. Agora é a sua vez: apague este exemplo com o botão Limpar, cole o texto que quiser e boa leitura.`;
})(typeof window !== 'undefined' ? window : globalThis);
