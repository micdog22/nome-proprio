# Nome Próprio — normalize nomes de pessoas em português (JavaScript • Node.js)

Biblioteca sem dependências para escrever nomes de pessoas do jeito certo: "JOÃO DA SILVA" vira "João da Silva" e "maria d'ávila" vira "Maria D'Ávila". Serve para limpar cadastros importados de planilhas e sistemas antigos, gerar crachás e certificados, separar nome e sobrenome e abreviar nomes que não cabem num campo. Acompanha uma linha de comando e uma página de demonstração.

**Demonstração online:** https://micdog22.github.io/nome-proprio/

## Recursos

- Partículas em minúsculas, menos no início do nome: da, das, de, do, dos, e, di, du, del, della, van, von e y.
- Apóstrofos ("D'Ávila", "Sant'Anna"), hífens ("Ana-Clara") e iniciais ("J. R. R. Tolkien").
- Números romanos isolados em maiúsculas, de II a XX ("Pedro II").
- Agnomes com inicial maiúscula e tratados como parte do sobrenome: Júnior, Jr., Filho, Neto, Sobrinho.
- Mc e Mac opcionais (McDonald, MacLeod), desligados por padrão para não estragar Machado e Macedo.
- Remove espaços extras, normaliza o Unicode (NFC) e mantém os acentos.
- Funções auxiliares: separar nome e sobrenomes, iniciais, abreviação com limite de caracteres, remoção de acentos e comparação de nomes.
- CLI `nome-proprio`, que também processa listas pela entrada padrão.

## Instalação

```bash
npm install github:micdog22/nome-proprio
```

## Como usar

```js
import {
  nomeProprio, separarNome, iniciais, abreviarNome,
  removerAcentos, compararNomes, primeiroNome,
} from 'nome-proprio';

nomeProprio('JOÃO DA SILVA');          // 'João da Silva'
nomeProprio("D'ÁVILA");                // "D'Ávila"
nomeProprio('ANA-CLARA DOS SANTOS');   // 'Ana-Clara dos Santos'
nomeProprio('papa joão paulo ii');     // 'Papa João Paulo II'
nomeProprio('J. R. R. TOLKIEN');       // 'J. R. R. Tolkien'
nomeProprio('  josé   da silva júnior '); // 'José da Silva Júnior'
nomeProprio('RONALD MCDONALD', { mcMac: true }); // 'Ronald McDonald'

separarNome('Maria Aparecida da Silva Santos');
// { primeiroNome: 'Maria', nomesDoMeio: 'Aparecida da Silva',
//   ultimoSobrenome: 'Santos', sobrenomes: 'Aparecida da Silva Santos' }
separarNome('José dos Santos Filho').ultimoSobrenome; // 'Santos Filho'

iniciais('Maria da Silva');            // 'MS'
primeiroNome('JOÃO DA SILVA');         // 'João'

abreviarNome('Maria Aparecida da Silva Santos', 20); // 'Maria A. S. Santos'
abreviarNome('Maria Aparecida da Silva Santos', 25); // 'Maria Aparecida S. Santos'
abreviarNome('José Carlos dos Santos');              // 'José C. dos Santos'

removerAcentos('João Conceição');      // 'Joao Conceicao'
compararNomes('JOÃO  DA SILVA', 'joao da silva'); // true
```

### Separação do nome

- `primeiroNome`: a primeira palavra.
- `sobrenomes`: tudo depois do primeiro nome, como nos formulários que pedem "nome" e "sobrenome".
- `ultimoSobrenome`: o último sobrenome sem a partícula, junto do agnome quando houver ("Silva Filho"), como nas referências bibliográficas.
- `nomesDoMeio`: o que fica entre o primeiro nome e o último sobrenome.

Não dá para saber, só pelo texto, se "Maria Aparecida" é um nome composto, então "Aparecida" aparece em `nomesDoMeio` e em `sobrenomes`.

### Abreviação

`abreviarNome(nome, max)` faz o mínimo necessário para o nome caber em `max` caracteres, nesta ordem:

1. abrevia os nomes do meio, do último para o primeiro, e tira as partículas que vinham antes deles;
2. tira as partículas que sobraram;
3. tira as iniciais do meio;
4. abrevia o primeiro nome;
5. em último caso, corta o texto no limite.

O primeiro nome e o último sobrenome (com o agnome) são preservados enquanto possível. Sem `max`, a função abrevia todos os nomes do meio.

### Linha de comando

```bash
npx nome-proprio "JOSÉ DOS SANTOS"
# José dos Santos

npx nome-proprio --abreviar 20 "maria aparecida da silva santos"
# Maria A. S. Santos

npx nome-proprio --iniciais "Maria da Silva"
# MS

npx nome-proprio < nomes.txt > nomes-corrigidos.txt
```

Opções: `--abreviar N`, `--iniciais`, `--mc` (Mc e Mac), `--json` (com as partes de cada nome), `--help` e `--version`. Pela entrada padrão, cada linha vira uma linha de saída, inclusive as vazias, para a lista continuar alinhada com a planilha de origem.

## Como rodar localmente

```bash
node bin/nome-proprio.js "JOSÉ DOS SANTOS"
```

Para abrir a página de demonstração, sirva a pasta do projeto e acesse http://localhost:8000 (módulos ES não carregam via `file://`):

```bash
python3 -m http.server 8000
```

## Testes

```bash
npm test
```

## Limitações

- Algumas grafias dependem de cada pessoa e não há regra que acerte todas. "Junior" sem acento continua sem acento, e "D'Ávila" sempre recebe D maiúsculo.
- Palavras isoladas que coincidem com números romanos de II a XX (como "Vi" ou "Xi") ficam em maiúsculas quando não estão no início do nome.
- A opção `mcMac` usa uma heurística: "Mac" só é tratado antes de consoante (exceto h) e com pelo menos mais duas letras, para preservar Machado, Macedo e Maciel. Confira o resultado quando usar.

## Contribuindo

Issues e pull requests são bem-vindos.

## Licença

MIT — veja [LICENSE](LICENSE).
