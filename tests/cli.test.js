import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CLI = fileURLToPath(new URL('../bin/nome-proprio.js', import.meta.url));

function run(args, stdin) {
  const r = spawnSync(process.execPath, [CLI, ...args], { input: stdin ?? '', encoding: 'utf8' });
  return { code: r.status, stdout: r.stdout, stderr: r.stderr };
}

test('normaliza o nome passado como argumento', () => {
  const r = run(['JOSÉ DOS SANTOS']);
  assert.equal(r.code, 0);
  assert.equal(r.stdout, 'José dos Santos\n');
});

test('junta argumentos sem aspas em um nome só', () => {
  assert.equal(run(['MARIA', 'DA', 'SILVA']).stdout, 'Maria da Silva\n');
});

test('lê da entrada padrão linha a linha, mantendo as vazias', () => {
  const r = run([], "JOÃO DA SILVA\n\nmaria d'ávila\r\n");
  assert.equal(r.code, 0);
  assert.equal(r.stdout, "João da Silva\n\nMaria D'Ávila\n");
});

test('--abreviar', () => {
  assert.equal(run(['--abreviar', '20', 'Maria Aparecida da Silva Santos']).stdout, 'Maria A. S. Santos\n');
  assert.equal(run(['-a', '20'], 'MARIA APARECIDA DA SILVA SANTOS\nANA SOUZA\n').stdout, 'Maria A. S. Santos\nAna Souza\n');
});

test('--iniciais e --mc', () => {
  assert.equal(run(['--iniciais', 'Maria da Silva']).stdout, 'MS\n');
  assert.equal(run(['--mc', 'RONALD MCDONALD']).stdout, 'Ronald McDonald\n');
});

test('--json', () => {
  const r = run(['--json', 'JOSÉ DOS SANTOS FILHO']);
  assert.deepEqual(JSON.parse(r.stdout), {
    entrada: 'JOSÉ DOS SANTOS FILHO',
    nome: 'José dos Santos Filho',
    primeiroNome: 'José',
    nomesDoMeio: '',
    ultimoSobrenome: 'Santos Filho',
    sobrenomes: 'dos Santos Filho',
    iniciais: 'JSF',
  });
  assert.equal(JSON.parse(run(['--json'], 'ANA\nBIA\n').stdout).length, 2);
});

test('entrada vazia não imprime nada', () => {
  const r = run([], '');
  assert.equal(r.code, 0);
  assert.equal(r.stdout, '');
});

test('erros de uso', () => {
  assert.equal(run(['--abreviar']).code, 2);
  assert.equal(run(['--abreviar', 'zero', 'Ana']).code, 2);
  assert.equal(run(['--abreviar', '0', 'Ana']).code, 2);
  const r = run(['--maiusculas', 'Ana']);
  assert.equal(r.code, 2);
  assert.match(r.stderr, /opção desconhecida: --maiusculas/);
});

test('--help e --version', () => {
  assert.match(run(['--help']).stdout, /^Uso: nome-proprio/);
  assert.match(run(['-v']).stdout, /^\d+\.\d+\.\d+\n$/);
});
