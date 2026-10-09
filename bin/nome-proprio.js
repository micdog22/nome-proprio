#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { nomeProprio, abreviarNome, iniciais, separarNome } from '../src/index.js';

const HELP = `Uso: nome-proprio [opções] [nome]

Normaliza nomes de pessoas em português: "JOÃO DA SILVA" vira "João da Silva".

Exemplos:
  nome-proprio "JOSÉ DOS SANTOS"               José dos Santos
  nome-proprio --abreviar 20 "maria aparecida da silva santos"
                                               Maria A. S. Santos
  nome-proprio --iniciais "Maria da Silva"     MS
  nome-proprio < nomes.txt > nomes-ok.txt      um nome por linha

Opções:
  -a, --abreviar N   abrevia os nomes para caber em N caracteres
  -i, --iniciais     mostra só as iniciais
      --mc           trata os prefixos Mc e Mac (McDonald, MacLeod)
      --json         saída em JSON, com as partes do nome
  -h, --help         mostra esta ajuda
  -v, --version      mostra a versão

Sem nome na linha de comando, lê um nome por linha da entrada padrão e
mantém as linhas vazias, para a saída ficar alinhada com a entrada.`;

function packageVersion() {
  return JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
}

function main(argv) {
  let maxLength;
  let mode = 'name';
  let mcMac = false;
  const words = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-a' || arg === '--abreviar') {
      const value = argv[++i];
      if (!/^\d+$/.test(value ?? '') || Number(value) < 1) {
        console.error('nome-proprio: --abreviar precisa de um número inteiro maior que zero.');
        return 2;
      }
      maxLength = Number(value);
    } else if (arg === '-i' || arg === '--iniciais') {
      mode = 'initials';
    } else if (arg === '--json') {
      mode = 'json';
    } else if (arg === '--mc') {
      mcMac = true;
    } else if (arg === '-h' || arg === '--help') {
      console.log(HELP);
      return 0;
    } else if (arg === '-v' || arg === '--version') {
      console.log(packageVersion());
      return 0;
    } else if (arg.startsWith('-')) {
      console.error(`nome-proprio: opção desconhecida: ${arg}\nUse "nome-proprio --help" para ver as opções.`);
      return 2;
    } else {
      words.push(arg);
    }
  }

  let lines;
  if (words.length) {
    lines = [words.join(' ')];
  } else if (process.stdin.isTTY) {
    console.error(HELP);
    return 2;
  } else {
    lines = readFileSync(0, 'utf8').split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
  }

  const options = { mcMac };
  const convert = (line) => {
    const name = nomeProprio(line, options);
    const result = maxLength ? abreviarNome(name, maxLength, options) : name;
    if (mode === 'initials') return iniciais(result);
    if (mode === 'json') return { entrada: line, nome: result, ...separarNome(name, options), iniciais: iniciais(name) };
    return result;
  };

  const results = lines.map(convert);
  if (mode === 'json') console.log(JSON.stringify(words.length ? results[0] : results, null, 2));
  else if (results.length) console.log(results.join('\n'));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
