# Sistema de Gestão de Bibliotecas

![UNIVESP](https://img.shields.io/badge/UNIVESP-Computa%C3%A7%C3%A3o-blue)
![Vue 3](https://img.shields.io/badge/Vue_3-4FC08D?style=flat&logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=flat&logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia_2-FFD859?style=flat&logo=pinia&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js_20.19%2B-339933?style=flat&logo=node.js&logoColor=white)

## Descrição

Esse projeto faz parte do **Projeto Integrador** do segundo semestre de 2026 da UNIVESP — Eixo de Computação e tem como finalidade facilitar e automatizar a gestão de cadastro e empréstimos de livros em bibliotecas escolares/institucionais.

A versão atual do frontend está em **Vue 3 + Vite**, com integração ao Supabase e fallback para `localStorage`. O sistema também importa alunos a partir do CSV exportado pela **Secretaria Escolar Digital (SED)**, com prévia, atualização de cadastros e proteção contra duplicidade.

## Autores

| Nome | RA |
|------|-----|
| Eduardo Felipe Sanches | 24201835 |
| Gabriel Francisco Marvullo Rossini | 24211592 |
| Guilherme Gabriel Martins de Freitas | 24214988 |
| Maikon Nogueira Florentino Marins | 2207270 |
| Marcio Alberto Pires | 24221136 |
| Tiago Luiz de Oliveira Carpinteiro | 24208627 |
| Wesley Eduardo Maximiano Firmino | 24226877 |

## Demonstração

- **Aplicação online:** [Biblioteca — Sistema de Gestão](https://biblioteca-univesp-ten.vercel.app/)
- **Repositório:** [github.com/mr-redsmok/Biblioteca-Univesp](https://github.com/mr-redsmok/Biblioteca-Univesp)
- **Deploy:** Vercel, com publicação automática a partir da branch `master`.

## Funcionalidades

### Acervo

- Cadastro de livros com validação de campos.
- Busca automática de metadados na **Open Library** e **Google Books**, com base local de demonstração e cache de 30 minutos.
- Auto-preenchimento de título, autor, editora, ano, páginas, capa, ISBN e descrição.
- Catálogo em cards com filtros por texto, autor, editora e ano, além de ordenação.
- Edição e exclusão de livros.
- Bloqueio de duplicidade por ISBN.
- Controle de exemplares por tombo, com quantidade e estado do livro.
- Exportação e importação do acervo em JSON.

### Alunos e matrículas

- Cadastro manual de alunos com nome, telefone, matrícula, turma, ano letivo e situação.
- Matrícula no formato `RA-Dígito` (ex.: `000012345-X`).
- Filtros por nome, matrícula, turma e ano letivo.
- Importação de alunos pelo CSV do SED, com um arquivo por turma.
- Prévia da importação antes de gravar: novos, atualizados, sem mudança, inativações e possíveis saídas.
- Atualização de alunos existentes pela matrícula e bloqueio de duplicidades.
- Inativação automática de alunos com situação diferente de "Ativo" e seleção manual de possíveis saídas.
- Nenhum aluno é excluído durante a importação.

### Empréstimos

- Registro de empréstimo com seleção do exemplar (tombo) e do aluno.
- Pesquisa de livros por título, autor, ISBN ou tombo.
- Prazo padrão configurável entre 1 e 90 dias, podendo ser ajustado em cada empréstimo.
- Controle de empréstimos ativos, devolução, histórico, atrasos e próximos vencimentos.
- Bloqueio de empréstimo de exemplar que já está emprestado.

### Interface e infraestrutura

- Tema escuro com menu lateral e gavetas de navegação.
- Componentes de modal e toast para confirmações e avisos.
- Indicador de origem dos dados (`☁️ nuvem` ou `💾 local`).
- Rotas de SPA com fallback configurado para a Vercel.
- Rótulos e marcos de acessibilidade (ARIA) nos principais controles.

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Vue 3.4, Vite 5, Vue Router 4 e Pinia 2 |
| Estilos | CSS com custom properties e estilos legados em `css/` |
| Persistência | Supabase (PostgreSQL) com cache local em `localStorage` |
| Busca de livros | Open Library, Google Books, seed local e cache de 30 min |
| Testes | Vitest e jsdom |
| Hospedagem | Vercel |
| Versionamento | Git e GitHub |
| Runtime | Node.js 20.19+ (recomendado: 22 LTS) |

## Como rodar localmente

### Pré-requisitos

- **Node.js 20.19+** (recomendado: 22 LTS)
- **npm 9+**
- **Git**
- Projeto no Supabase (opcional; sem ele o app roda somente com `localStorage`)

### 1. Clone o repositório

```bash
git clone https://github.com/mr-redsmok/Biblioteca-Univesp
cd biblioteca-univesp
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente (opcional)

```bash
cp .env.example .env
```

Preencha o `.env` com as credenciais do seu projeto Supabase:

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública `anon` do projeto |

> Use somente a chave `anon` no frontend. Nunca exponha a `service_role`.
> Sem `.env`, o app funciona apenas com `localStorage`, o que é útil para testar a interface.

### 4. Rode o projeto

```bash
npm run dev
```

O Vite exibe a URL local no terminal. Por padrão, a aplicação usa `http://localhost:5174`.

### 5. Build de produção (opcional)

```bash
npm run build
npm run preview
```

O build gera a pasta `dist/`; o `preview` serve essa pasta localmente na porta `4173`.

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite (porta 5174) |
| `npm run build` | Gera `dist/` para produção |
| `npm run preview` | Serve `dist/` localmente (porta 4173) |
| `npm run lint` | Roda ESLint em `src/` e `tests/` |
| `npm run format` | Formata `src/` e `tests/` com Prettier |
| `npm test` | Roda todos os testes com Vitest |

## Rotas

| Rota | Tela |
|------|------|
| `/` | Redireciona para `/catalogo` |
| `/catalogo` | Acervo de livros |
| `/cadastrar` | Cadastro de livro |
| `/cadastrar/:id` | Edição de livro |
| `/buscar` | Busca de livros nas APIs |
| `/alunos` | Lista de alunos |
| `/alunos/importar` | Importação de alunos do SED (também acessível em **Matrículas → Importar alunos**) |
| `/matriculas` | Matrícula e edição de alunos |
| `/emprestimos` | Empréstimos, devoluções e atrasos |
| `/configuracoes` | Formato de tombo e prazo padrão de empréstimo |

## Importação de alunos pelo SED

A importação foi feita para o CSV exportado pela Secretaria Escolar Digital (SED), com **um arquivo por turma**.

### Formato aceito

- Codificação **Windows-1252**.
- Separador `;` e quebras de linha CRLF.
- Preâmbulo antes do cabeçalho é permitido; o cabeçalho é localizado pela coluna `Nome do Aluno`, não por posição fixa.
- Campos entre aspas e aspas escapadas (`""`) são suportados.

| Coluna | Obrigatória | Uso |
|--------|-------------|-----|
| `Nome do Aluno` | Sim | Nome do aluno |
| `RA` | Sim | Registro do aluno |
| `Dig. RA` | Sim | Dígito verificador |
| `Situação do Aluno` | Sim | Define se o aluno fica ativo |
| `Ano Letivo` | Não | Ano letivo detectado no arquivo |

> As colunas de **e-mail** e **data de nascimento** são deliberadamente ignoradas e não são gravadas nem registradas em log. O CSV é lido no navegador; nada é gravado antes da confirmação.

### Fluxo de importação

1. Exporte o CSV de cada turma no SED.
2. Acesse **Matrículas → Importar alunos**.
3. Informe o ano letivo, selecione os arquivos e escolha a turma correspondente a cada um.
4. Clique em **Gerar prévia** para revisar novos alunos, atualizações, registros sem mudança, inativações e possíveis saídas.
5. Confirme a importação.

### Regras aplicadas

- A matrícula é a chave natural do aluno, no formato `RA-Dígito`.
- Alunos já existentes são atualizados pela matrícula; duplicidades no mesmo arquivo ou entre arquivos são bloqueadas.
- Somente a situação **"Ativo"** (sem diferenciar maiúsculas ou acentos) mantém o aluno ativo.
- Alunos com outra situação são inativados automaticamente.
- Alunos que não aparecem nos arquivos são listados como **possíveis saídas** e só são inativados se forem selecionados manualmente.
- Linhas com erro são exibidas na prévia e ignoradas; as linhas válidas continuam sendo importadas.
- O telefone não vem no CSV do SED e é preservado quando o aluno já existe.

## Persistência e banco de dados

Com o Supabase configurado, os dados são gravados no PostgreSQL e mantidos em cache local para fallback. As tabelas usadas são:

| Tabela | Conteúdo |
|--------|----------|
| `livro` | Dados do acervo (título, autor, ISBN, editora, capa etc.) |
| `exemplares` | Um registro por tombo, com status e estado do livro |
| `alunos` | Nome, telefone, matrícula, turma, ano letivo e situação |
| `emprestimos` | Exemplar, aluno, datas, prazo, status e observação |

A migração `sql/001_alunos_turma.sql` deve ser executada uma vez no **SQL Editor** do Supabase. Ela adiciona `turma`, `ano_letivo` e o índice único de matrícula em `alunos`, necessário para a importação do SED.

Sem `.env`, o app funciona somente com `localStorage`. As chaves usadas são:

```text
sgbl_livros
sgbl_alunos
sgbl_emprestimos
sgbl_tombo_seq
sgbl_tombo_config
sgbl_emprestimo_config
sgbl_api_cache
sgbl_precadastro
```

Quando o Supabase está indisponível, o app usa o cache local e indica `💾 local` na interface.

## Estrutura do projeto

```text
.
├── src/
│   ├── assets/          # seed local de livros e imagens
│   ├── components/      # cards, filtros, modais, toast e import/export
│   ├── composables/     # busca, formulário de livro e modal de confirmação
│   ├── lib/             # api, autofill, sedCsv, importAlunos, mapper,
│   │                    # tombo, turmas, validação e configurações
│   ├── router/          # rotas da SPA
│   ├── stores/          # acervo, alunos, empréstimos, pré-cadastro e toast
│   ├── views/           # telas do sistema
│   ├── App.vue
│   └── main.js
├── css/                 # estilos legados ainda importados por App.vue
├── sql/                 # migração de alunos/turmas
├── tests/               # testes com Vitest
├── public/
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js
├── vercel.json          # fallback de SPA para o Vue Router
└── README.md
```

> `node_modules/`, `dist/` e arquivos `.env` não são versionados (ver `.gitignore`).

## Testes

```bash
npm test
```

A suíte atual tem **8 arquivos e 37 testes**, cobrindo:

- Leitura e normalização do CSV do SED.
- Planejamento da importação (novos, atualizações, duplicidades, inativações e possíveis saídas).
- Mapeamento entre o formato do app e o Supabase.
- Store de alunos.
- Validação de livros.
- Configuração do prazo de empréstimo.
- Metadados exibidos nos cards.
- Geração e configuração de tombos.

Para rodar um arquivo específico:

```bash
npx vitest run tests/sedCsv.test.js
```

## Deploy

O projeto é publicado na Vercel a partir da branch `master`.

- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Variáveis de ambiente:** configuradas no painel da Vercel (`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)
- **Fallback de SPA:** o `vercel.json` reescreve as rotas para `index.html`, permitindo abrir e atualizar URLs como `/alunos` e `/alunos/importar` diretamente.

Cada push na `master` gera um novo deploy de produção.

## Limitações conhecidas

- Não há autenticação nem perfis de acesso; o app é aberto.
- O prazo padrão de empréstimo fica no `localStorage` de cada navegador e não sincroniza entre dispositivos.
- A gestão de exemplares ainda é limitada: o acervo controla quantidade e tombo, sem histórico completo de status individual.
- O fallback local é um cache de emergência, não um modo offline completo com sincronização de conflitos.
- A importação do SED aceita somente o CSV no layout descrito acima; arquivos XLSX não são suportados.
- A migração do banco não é executada automaticamente pela aplicação.

## Próximos passos

- Autenticação e perfis de acesso (bibliotecário, administrador e consulta).
- Dashboard com indicadores de circulação, atrasos e acervo.
- Histórico completo por exemplar e gestão individual de estados.
- Exportação de alunos e relatórios de matrículas.
- Testes de componentes/telas e testes ponta a ponta.

## Contribuindo

1. Crie uma branch a partir da `master` (`feature/nome-da-alteracao` ou `fix/nome-do-ajuste`).
2. Faça as alterações e rode `npm test` e `npm run build`.
3. Abra um pull request descrevendo a mudança.

---

*Projeto Integrador — UNIVESP 2026*
