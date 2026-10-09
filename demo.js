import { nomeProprio, abreviarNome, iniciais, separarNome } from './src/index.js';

const namesInput = document.getElementById('names');
const output = document.getElementById('output');
const maxLengthInput = document.getElementById('max-length');
const maxLengthHint = document.getElementById('max-length-hint');
const mcMacToggle = document.getElementById('mcmac-toggle');
const partsBody = document.getElementById('parts-body');
const copyButton = document.getElementById('copy-button');
const notice = document.getElementById('notice');

const STORAGE_KEY = 'nome-proprio:estado';
const DEFAULT_HINT = maxLengthHint.textContent;

function cell(text) {
  const td = document.createElement('td');
  td.textContent = text || '—';
  if (!text) td.className = 'empty';
  return td;
}

function readMaxLength() {
  const text = maxLengthInput.value.trim();
  if (!text) return { max: undefined };
  const max = Number(text);
  if (!Number.isInteger(max) || max < 1) return { error: 'Use um número inteiro maior que zero.' };
  return { max };
}

function update() {
  const options = { mcMac: mcMacToggle.checked };
  const { max, error } = readMaxLength();
  maxLengthHint.textContent = error ?? DEFAULT_HINT;
  maxLengthHint.classList.toggle('error', Boolean(error));

  const lines = namesInput.value.split(/\r?\n/);
  const results = lines.map((line) => {
    const name = nomeProprio(line, options);
    return max ? abreviarNome(name, max, options) : name;
  });
  output.value = results.join('\n');
  copyButton.disabled = !results.some(Boolean);
  notice.textContent = '';

  const rows = lines
    .filter((line) => line.trim())
    .map((line) => {
      const parts = separarNome(line, options);
      const tr = document.createElement('tr');
      tr.append(cell(nomeProprio(line, options)), cell(parts.primeiroNome), cell(parts.ultimoSobrenome), cell(iniciais(line)));
      return tr;
    });
  if (rows.length === 0) {
    const tr = document.createElement('tr');
    const td = cell('');
    td.colSpan = 4;
    td.textContent = 'Digite ao menos um nome.';
    tr.append(td);
    rows.push(tr);
  }
  partsBody.replaceChildren(...rows);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ names: namesInput.value, maxLength: maxLengthInput.value, mcMac: mcMacToggle.checked }),
    );
  } catch {
    // sem armazenamento local: a página funciona igual, só não lembra a lista
  }
}

async function copyResult() {
  notice.classList.remove('failed');
  try {
    await navigator.clipboard.writeText(output.value);
    notice.textContent = 'Copiado!';
  } catch {
    output.focus();
    output.select();
    notice.classList.add('failed');
    notice.textContent = 'Não deu para copiar automaticamente. O texto está selecionado: use Ctrl+C.';
  }
}

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (saved && typeof saved.names === 'string') {
    namesInput.value = saved.names;
    maxLengthInput.value = typeof saved.maxLength === 'string' ? saved.maxLength : '';
    mcMacToggle.checked = saved.mcMac === true;
  }
} catch {
  // segue com os exemplos
}

namesInput.addEventListener('input', update);
maxLengthInput.addEventListener('input', update);
mcMacToggle.addEventListener('change', update);
copyButton.addEventListener('click', copyResult);

update();
