/**
 * Nome Próprio: normaliza nomes de pessoas em português.
 */

/** Partículas que ficam em minúsculas, exceto no início do nome. */
export const PARTICULAS = Object.freeze(['da', 'das', 'de', 'do', 'dos', 'e', 'di', 'du', 'del', 'della', 'van', 'von', 'y']);

const PARTICLE_SET = new Set(PARTICULAS);
const ROMAN_NUMERALS = new Set([
  'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
]);
// Agnomes de parentesco: ficam junto do último sobrenome ("Silva Filho").
const SUFFIXES = new Set(['junior', 'jr', 'filho', 'filha', 'neto', 'neta', 'sobrinho', 'sobrinha']);

const lower = (text) => text.toLocaleLowerCase('pt-BR');
const upper = (text) => text.toLocaleUpperCase('pt-BR');

function requireText(value, functionName) {
  if (typeof value !== 'string') throw new TypeError(`${functionName}: informe o nome como texto.`);
}

function splitWords(name) {
  return name.normalize('NFC').trim().split(/\s+/).filter(Boolean);
}

const isParticle = (word) => PARTICLE_SET.has(lower(word));
const isRomanNumeral = (word) => ROMAN_NUMERALS.has(upper(word));
const isSuffix = (word) => SUFFIXES.has(removerAcentos(lower(word)).replace(/\.$/, ''));

function formatWord(word, index, options) {
  if (index > 0 && isParticle(word)) return lower(word);
  if (index > 0 && isRomanNumeral(word)) return upper(word);
  // Primeira letra de cada parte em maiúscula: Ana-Clara, D'Ávila, J.R.R.
  let result = lower(word).replace(
    /(^|[-'\u2019.])([^\p{L}]*)(\p{L})/gu,
    (_, separator, before, letter) => separator + before + upper(letter),
  );
  if (options.mcMac) {
    result = result
      .replace(/(^|[-'\u2019])Mc(\p{Ll})/gu, (_, separator, letter) => `${separator}Mc${upper(letter)}`)
      // "Mac" só antes de consoante (menos h) e com pelo menos mais duas letras: MacDonald, mas Machado e Macedo não
      .replace(
        /(^|[-'\u2019])Mac([bcdfgjklmnpqrstvwxz])(\p{Ll}{2,})/gu,
        (_, separator, letter, rest) => `${separator}Mac${upper(letter)}${rest}`,
      );
  }
  return result;
}

/**
 * Normaliza um nome: nomeProprio("JOÃO DA SILVA") → "João da Silva".
 * @param {string} name
 * @param {{mcMac?: boolean}} [options]  mcMac: trata prefixos escoceses e irlandeses (McDonald, MacLeod).
 */
export function nomeProprio(name, options) {
  requireText(name, 'nomeProprio');
  const opts = { mcMac: Boolean(options && options.mcMac) };
  return splitWords(name)
    .map((word, i) => formatWord(word, i, opts))
    .join(' ');
}

/** Remove acentos e cedilha: "João Conceição" → "Joao Conceicao". */
export function removerAcentos(text) {
  requireText(text, 'removerAcentos');
  return text.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC');
}

/** Primeiro nome, já normalizado. Aceita as mesmas opções de nomeProprio. */
export function primeiroNome(name, options) {
  requireText(name, 'primeiroNome');
  return splitWords(nomeProprio(name, options))[0] ?? '';
}

/** Divide as palavras do nome em nomes do meio, partículas do último sobrenome e o bloco do último sobrenome. */
function splitParts(words) {
  const rest = words.slice(1);
  let end = rest.length;
  while (end > 0 && (isSuffix(rest[end - 1]) || isRomanNumeral(rest[end - 1]))) end--;
  let last = end - 1;
  while (last >= 0 && isParticle(rest[last])) last--;
  if (last < 0) {
    // só partículas ou agnomes depois do primeiro nome
    return { middle: [], lastParticles: [], lastBlock: end < rest.length ? rest.slice(end) : [], rest };
  }
  let middleEnd = last;
  while (middleEnd > 0 && isParticle(rest[middleEnd - 1])) middleEnd--;
  return { middle: rest.slice(0, middleEnd), lastParticles: rest.slice(middleEnd, last), lastBlock: rest.slice(last), rest };
}

/**
 * Separa as partes do nome.
 * separarNome("Maria Aparecida da Silva Santos") →
 *   { primeiroNome: "Maria", nomesDoMeio: "Aparecida da Silva", ultimoSobrenome: "Santos",
 *     sobrenomes: "Aparecida da Silva Santos" }
 * O último sobrenome inclui agnomes como Filho e Júnior ("Silva Filho").
 * Aceita as mesmas opções de nomeProprio.
 */
export function separarNome(name, options) {
  requireText(name, 'separarNome');
  const words = splitWords(nomeProprio(name, options));
  if (words.length === 0) return { primeiroNome: '', nomesDoMeio: '', ultimoSobrenome: '', sobrenomes: '' };
  const { middle, lastBlock, rest } = splitParts(words);
  return {
    primeiroNome: words[0],
    nomesDoMeio: middle.join(' '),
    ultimoSobrenome: lastBlock.join(' '),
    sobrenomes: rest.join(' '),
  };
}

/** Iniciais sem as partículas: iniciais("Maria da Silva") → "MS". Nomes com hífen contam cada parte. */
export function iniciais(name) {
  requireText(name, 'iniciais');
  return splitWords(nomeProprio(name))
    .filter((word, i) => i === 0 || !(isParticle(word) || isRomanNumeral(word)))
    .flatMap((word) => word.split('-').map((part) => (part.match(/\p{L}/u) ?? [''])[0]))
    .join('');
}

function initialOf(word) {
  const letter = word.match(/\p{L}/u);
  return letter ? `${upper(letter[0])}.` : word;
}

/**
 * Abrevia o nome até caber em `max` caracteres. Na ordem, até caber:
 * 1. abrevia os nomes do meio, do último para o primeiro, tirando as partículas deles;
 * 2. tira as partículas que sobraram; 3. tira as iniciais do meio; 4. abrevia o primeiro nome;
 * 5. em último caso, corta o texto.
 * Sem `max`, abrevia todos os nomes do meio: "Maria Aparecida da Silva Santos" → "Maria A. S. Santos".
 * Aceita, em `options`, as mesmas opções de nomeProprio.
 */
export function abreviarNome(name, max, options) {
  requireText(name, 'abreviarNome');
  if (max !== undefined && (!Number.isInteger(max) || max < 1)) {
    throw new RangeError('abreviarNome: o tamanho máximo deve ser um número inteiro maior que zero.');
  }
  const full = nomeProprio(name, options);
  const words = splitWords(full);
  if (words.length === 0) return '';
  if (max !== undefined && full.length <= max) return full;

  const { middle, lastParticles, lastBlock } = splitParts(words);
  const parts = [
    { text: words[0], kind: 'first' },
    ...middle.map((text) => ({ text, kind: isParticle(text) ? 'particle' : 'middle' })),
    ...lastParticles.map((text) => ({ text, kind: 'particle' })),
    ...lastBlock.map((text) => ({ text, kind: 'last' })),
  ];
  const build = () =>
    parts
      .filter((part) => !part.removed)
      .map((part) => (part.abbreviated ? initialOf(part.text) : part.text))
      .join(' ');
  const fits = () => max !== undefined && build().length <= max;

  const middleNames = parts.filter((part) => part.kind === 'middle');
  for (let i = middleNames.length - 1; i >= 0; i--) {
    const part = middleNames[i];
    part.abbreviated = true;
    for (let j = parts.indexOf(part) - 1; j > 0 && parts[j].kind === 'particle'; j--) parts[j].removed = true;
    if (fits()) return build();
  }
  if (max === undefined) return build();

  const particles = parts.filter((part) => part.kind === 'particle' && !part.removed);
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].removed = true;
    if (fits()) return build();
  }
  for (let i = middleNames.length - 1; i >= 0; i--) {
    middleNames[i].removed = true;
    if (fits()) return build();
  }
  if (parts.length > 1) {
    parts[0].abbreviated = true;
    if (fits()) return build();
  }
  return build().slice(0, max).trimEnd();
}

/** Compara dois nomes sem diferenciar acentos, maiúsculas e espaços. */
export function compararNomes(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const key = (text) => lower(removerAcentos(text.normalize('NFC'))).replace(/\u2019/g, "'").replace(/\s+/g, '');
  return key(a) === key(b);
}
