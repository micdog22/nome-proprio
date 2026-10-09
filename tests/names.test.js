import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  nomeProprio,
  separarNome,
  iniciais,
  abreviarNome,
  removerAcentos,
  compararNomes,
  primeiroNome,
  PARTICULAS,
} from '../src/index.js';

describe('nomeProprio', () => {
  const cases = [
    ['JOÃO DA SILVA', 'João da Silva'],
    ['joão da silva', 'João da Silva'],
    ['MARIA DAS GRAÇAS', 'Maria das Graças'],
    ['MARIA DO CARMO DOS SANTOS', 'Maria do Carmo dos Santos'],
    ['PAULO DE TARSO', 'Paulo de Tarso'],
    ['MARIA E SILVA', 'Maria e Silva'],
    ['LEONARDO DI CAPRIO', 'Leonardo di Caprio'],
    ['GÉRARD DU PONT', 'Gérard du Pont'],
    ['PENÉLOPE DEL RIO', 'Penélope del Rio'],
    ['GIOVANNI DELLA ROSA', 'Giovanni della Rosa'],
    ['LUDWIG VAN BEETHOVEN', 'Ludwig van Beethoven'],
    ['WERNHER VON BRAUN', 'Wernher von Braun'],
    ['JOSÉ ORTEGA Y GASSET', 'José Ortega y Gasset'],
    ['DA SILVA', 'Da Silva'],
    ['DE OLIVEIRA', 'De Oliveira'],
    ['VAN GOGH', 'Van Gogh'],
    ["D'ÁVILA", "D'Ávila"],
    ["MARIA D'ÁVILA", "Maria D'Ávila"],
    ["SANT'ANNA", "Sant'Anna"],
    ["DALL'AGNOL", "Dall'Agnol"],
    ["O'NEILL", "O'Neill"],
    ['MARIA D\u2019ÁVILA', 'Maria D\u2019Ávila'],
    ['ANA-CLARA SOUZA', 'Ana-Clara Souza'],
    ['JEAN-PAUL SARTRE', 'Jean-Paul Sartre'],
    ['PEDRO II', 'Pedro II'],
    ['papa joão paulo ii', 'Papa João Paulo II'],
    ['luís xiv', 'Luís XIV'],
    ['HENRIQUE VIII', 'Henrique VIII'],
    ['carlos xx', 'Carlos XX'],
    ['JOSÉ CARLOS DE OLIVEIRA JÚNIOR', 'José Carlos de Oliveira Júnior'],
    ['JOSE DA SILVA JUNIOR', 'Jose da Silva Junior'],
    ['ANTÔNIO SOUZA JR.', 'Antônio Souza Jr.'],
    ['JOÃO DA SILVA FILHO', 'João da Silva Filho'],
    ['PEDRO ALVES NETO', 'Pedro Alves Neto'],
    ['MÁRIO LIMA SOBRINHO', 'Mário Lima Sobrinho'],
    ['J. R. R. TOLKIEN', 'J. R. R. Tolkien'],
    ['j.r.r. tolkien', 'J.R.R. Tolkien'],
    ['MARIA A SILVA', 'Maria A Silva'],
    ['ÉRICA ÇÃO ÜBER', 'Érica Ção Über'],
    ['  ana   maria \t de   souza  ', 'Ana Maria de Souza'],
    ['', ''],
  ];
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} → ${JSON.stringify(expected)}`, () => {
      assert.equal(nomeProprio(input), expected);
    });
  }

  test('lista de partículas', () => {
    assert.deepEqual([...PARTICULAS], ['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'della', 'van', 'von', 'y']);
  });

  test('normaliza para NFC e mantém os acentos', () => {
    const decomposed = 'JOA\u0303O CONCEIC\u0327A\u0303O';
    const result = nomeProprio(decomposed);
    assert.equal(result, 'João Conceição');
    assert.equal(result, result.normalize('NFC'));
  });

  test('espaço não separável e quebras de linha contam como espaço', () => {
    assert.equal(nomeProprio('MARIA\u00a0DA\nSILVA'), 'Maria da Silva');
  });

  test('é idempotente', () => {
    for (const name of ["Maria D'Ávila Filho", 'Papa João Paulo II', 'J. R. R. Tolkien']) {
      assert.equal(nomeProprio(nomeProprio(name)), nomeProprio(name));
    }
  });

  test('Mc e Mac são opcionais', () => {
    assert.equal(nomeProprio('RONALD MCDONALD'), 'Ronald Mcdonald');
    assert.equal(nomeProprio('RONALD MCDONALD', { mcMac: true }), 'Ronald McDonald');
    assert.equal(nomeProprio('PAUL MCCARTNEY', { mcMac: true }), 'Paul McCartney');
    assert.equal(nomeProprio('ANGUS MACLEOD', { mcMac: true }), 'Angus MacLeod');
    assert.equal(nomeProprio('IAN MACDONALD-SMITH', { mcMac: true }), 'Ian MacDonald-Smith');
  });

  test('Mac não atrapalha sobrenomes portugueses', () => {
    const options = { mcMac: true };
    assert.equal(nomeProprio('JOÃO MACHADO', options), 'João Machado');
    assert.equal(nomeProprio('ANA MACEDO', options), 'Ana Macedo');
    assert.equal(nomeProprio('LUIZ MACIEL', options), 'Luiz Maciel');
    assert.equal(nomeProprio('MARIA MACK', options), 'Maria Mack');
  });

  test('entrada inválida', () => {
    for (const value of [null, undefined, 42, {}]) assert.throws(() => nomeProprio(value), TypeError);
  });
});

describe('separarNome', () => {
  test('nome completo', () => {
    assert.deepEqual(separarNome('MARIA APARECIDA DA SILVA SANTOS'), {
      primeiroNome: 'Maria',
      nomesDoMeio: 'Aparecida da Silva',
      ultimoSobrenome: 'Santos',
      sobrenomes: 'Aparecida da Silva Santos',
    });
  });
  test('partícula antes do último sobrenome não entra nos nomes do meio', () => {
    assert.deepEqual(separarNome('maria da silva'), {
      primeiroNome: 'Maria',
      nomesDoMeio: '',
      ultimoSobrenome: 'Silva',
      sobrenomes: 'da Silva',
    });
  });
  test('agnome fica com o último sobrenome', () => {
    assert.deepEqual(separarNome('JOSÉ CARLOS DOS SANTOS FILHO'), {
      primeiroNome: 'José',
      nomesDoMeio: 'Carlos',
      ultimoSobrenome: 'Santos Filho',
      sobrenomes: 'Carlos dos Santos Filho',
    });
    assert.equal(separarNome('Antônio Souza Jr.').ultimoSobrenome, 'Souza Jr.');
  });
  test('só o primeiro nome', () => {
    assert.deepEqual(separarNome('  maria '), {
      primeiroNome: 'Maria',
      nomesDoMeio: '',
      ultimoSobrenome: '',
      sobrenomes: '',
    });
    assert.deepEqual(separarNome(''), { primeiroNome: '', nomesDoMeio: '', ultimoSobrenome: '', sobrenomes: '' });
  });
  test('repassa as opções', () => {
    assert.equal(separarNome('ronald mcdonald', { mcMac: true }).ultimoSobrenome, 'McDonald');
  });
});

describe('iniciais', () => {
  test('sem partículas', () => {
    assert.equal(iniciais('Maria da Silva'), 'MS');
    assert.equal(iniciais('JOSÉ CARLOS DOS SANTOS'), 'JCS');
    assert.equal(iniciais('ludwig van beethoven'), 'LB');
  });
  test('acentos, hífen, apóstrofo e números romanos', () => {
    assert.equal(iniciais('Érica Ávila'), 'ÉÁ');
    assert.equal(iniciais('Ana-Clara de Souza'), 'ACS');
    assert.equal(iniciais("Pedro D'Ávila"), 'PD');
    assert.equal(iniciais('Papa João Paulo II'), 'PJP');
  });
  test('partícula no início conta', () => {
    assert.equal(iniciais('Da Silva'), 'DS');
    assert.equal(iniciais(''), '');
  });
});

describe('abreviarNome', () => {
  const name = 'Maria Aparecida da Silva Santos';
  test('exemplo do limite de 20 caracteres', () => {
    assert.equal(abreviarNome(name, 20), 'Maria A. S. Santos');
  });
  test('cada etapa só acontece se precisar', () => {
    assert.equal(abreviarNome(name, 40), 'Maria Aparecida da Silva Santos');
    assert.equal(abreviarNome(name, 31), 'Maria Aparecida da Silva Santos');
    assert.equal(abreviarNome(name, 30), 'Maria Aparecida S. Santos');
    assert.equal(abreviarNome(name, 25), 'Maria Aparecida S. Santos');
    assert.equal(abreviarNome(name, 24), 'Maria A. S. Santos');
    assert.equal(abreviarNome(name, 15), 'Maria A. Santos');
    assert.equal(abreviarNome(name, 12), 'Maria Santos');
    assert.equal(abreviarNome(name, 10), 'M. Santos');
    assert.equal(abreviarNome(name, 5), 'M. Sa');
  });
  test('o resultado nunca passa do limite', () => {
    for (let max = 1; max <= 40; max++) assert.ok(abreviarNome(name, max).length <= max, String(max));
  });
  test('sem limite, abrevia todos os nomes do meio', () => {
    assert.equal(abreviarNome(name), 'Maria A. S. Santos');
    assert.equal(abreviarNome('José Carlos dos Santos'), 'José C. dos Santos');
    assert.equal(abreviarNome('Maria Santos'), 'Maria Santos');
  });
  test('partícula antes do último sobrenome sai só se precisar', () => {
    assert.equal(abreviarNome('José Carlos dos Santos', 18), 'José C. dos Santos');
    assert.equal(abreviarNome('José Carlos dos Santos', 17), 'José C. Santos');
  });
  test('agnome continua junto do sobrenome', () => {
    assert.equal(abreviarNome('José da Silva Filho', 15), 'J. Silva Filho');
    assert.equal(abreviarNome('JOSÉ ROBERTO DA SILVA JÚNIOR', 22), 'José R. Silva Júnior');
  });
  test('normaliza antes de abreviar', () => {
    assert.equal(abreviarNome('MARIA APARECIDA DA SILVA SANTOS', 20), 'Maria A. S. Santos');
    assert.equal(abreviarNome('ronald angus mcdonald', 14, { mcMac: true }), 'R. McDonald');
  });
  test('limite inválido', () => {
    for (const max of [0, -1, 2.5, '20', null]) assert.throws(() => abreviarNome(name, max), RangeError);
  });
});

describe('removerAcentos, compararNomes e primeiroNome', () => {
  test('removerAcentos', () => {
    assert.equal(removerAcentos('João Conceição'), 'Joao Conceicao');
    assert.equal(removerAcentos('ÂNGELA MÜLLER ÑUÑEZ'), 'ANGELA MULLER NUNEZ');
    assert.equal(removerAcentos("D'Ávila"), "D'Avila");
    assert.throws(() => removerAcentos(null), TypeError);
  });
  test('compararNomes ignora acentos, maiúsculas e espaços', () => {
    assert.equal(compararNomes('JOÃO  DA SILVA', 'joao da silva'), true);
    assert.equal(compararNomes(' Maria Conceição ', 'MARIA CONCEICAO'), true);
    assert.equal(compararNomes('J. R. R. Tolkien', 'J.R.R. Tolkien'), true);
    assert.equal(compararNomes("D'Ávila", 'D\u2019Avila'), true);
    assert.equal(compararNomes('Maria', 'Mario'), false);
    assert.equal(compararNomes('Maria da Silva', 'Maria Silva'), false);
    assert.equal(compararNomes(null, 'Maria'), false);
  });
  test('primeiroNome', () => {
    assert.equal(primeiroNome('  JOÃO DA SILVA'), 'João');
    assert.equal(primeiroNome(''), '');
  });
});
