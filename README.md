# Sistema de Gestão de Bibliotecas

![UNIVESP](https://img.shields.io/badge/UNIVESP-Computação-blue)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=flat&logo=git&logoColor=white)

## Descrição

Esse projeto faz parte do **Projeto Integrador** do segundo semestre de 2026 da UNIVESP — Eixo de Computação e tem como finalidade facilitar e automatizar a gestão de cadastro e empréstimos de livros em bibliotecas escolares/institucionais.

A versão atual do frontend está em **Vue 3 + Vite**, com integração ao Supabase e fallback para `localStorage`.

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

## Prévia do Projeto

- **Demonstração ao vivo:** [Biblioteca - Sistema de Gestão](https://biblioteca-univesp-ten.vercel.app/)

## Como rodar localmente

### Pré-requisitos

- Node.js 18+ e npm
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/mr-redsmok/Biblioteca-Univesp
cd biblioteca-univesp
```

### 2. Configure o ambiente e rode o projeto Vue

```bash
cp .env.example .env
npm install
npm run dev
```

Sem `.env`, o app funciona apenas com `localStorage` (útil para testar a interface).

Para usar o Supabase, copie `.env.example` para `.env` e preencha as credenciais do projeto. A migração `sql/001_alunos_turma.sql` já está aplicada no banco; para um novo ambiente, execute-a no SQL Editor.

- Após iniciar, o Vite exibe a URL local no terminal. Acesse essa URL — por padrão, `http://localhost:5174`.
- A porta padrão está definida em `vite.config.js` e pode ser alterada ali.
- Demonstração online: https://biblioteca-univesp-ten.vercel.app/

### Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe o servidor de desenvolvimento do Vite (porta padrão 5174) |
| `npm run build` | Gera `dist/` para produção |
| `npm run preview` | Serve `dist/` localmente (porta 4173) |
| `npm run lint` | Roda ESLint em `src/` e `tests/` |
| `npm run format` | Formata `src/` e `tests/` com Prettier |
| `npm test` | Roda Vitest (`tests/*.test.js`) |

## Funcionalidades

- Cadastro de livros com validação de campos
- Busca automática via Google Books API com fallback para Open Library
- Auto-preenchimento inteligente a partir do título
- Catálogo com cards, filtros avançados e ordenação
- Edição e exclusão de livros
- Bloqueio de duplicidade por ISBN
- Exportar / Importar acervo em JSON
- Gestão de alunos e matrículas, com turma e ano letivo
- Importação de alunos por CSV, com prévia, confirmação e proteção contra duplicidade
- Inativação automática de alunos com situação diferente de "Ativo" e seleção manual de possíveis saídas
- Empréstimos com pesquisa e seleção do livro no acervo, devolução e controle de atrasos
- Configuração do prazo padrão de empréstimo (1 a 90 dias)
- Interface dark mode com abas
- Acessibilidade básica (ARIA roles)

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Vue 3 + Vite 5 + Vue Router 4 + Pinia 2 |
| Persistência | Supabase (PostgreSQL) + cache local em `localStorage` |
| Banco de dados | PostgreSQL (Supabase) |
| Hospedagem | Vercel |
| Versionamento | Git |
| Busca de livros | Google Books + Open Library + seed local; busca de exemplares no acervo |

## Estrutura do projeto (Atual — Vue)

```
biblioteca-univesp/
├── src/
│   ├── main.js
│   ├── App.vue
│   ├── router/index.js
│   ├── stores/          (acervo, alunos, emprestimos, toast, precadastro)
│   ├── views/           (catálogo, cadastro, busca, alunos, matrículas,
│   │                     importação, empréstimos, configurações)
│   ├── components/
│   ├── composables/
│   └── lib/             (api, autofill, validate, meta, tombo, sedCsv,
│                         importAlunos, configEmprestimo, supabase, mapper, turmas)
├── css/                 (legado reaproveitado via @import no App.vue)
├── sql/                 (001_alunos_turma.sql)
├── tests/               (Vitest)
├── public/ / index.html / vite.config.js
└── README.md
```

> Histórico: versão anterior em `css/ + js/` vanilla foi migrada para Vue. O `css/` foi mantido como legado.


## Próximos passos

- Autenticação e perfis de acesso
- Dashboard e relatórios de circulação
- Gestão individual de exemplares e estados

## Persistência

- Com `.env` configurado, os dados são gravados no Supabase e mantidos em cache local para fallback.
- Sem `.env`, o app funciona somente com `localStorage`.
- Chaves locais: `sgbl_livros`, `sgbl_alunos`, `sgbl_emprestimos`, `sgbl_tombo_seq`, `sgbl_tombo_config`, `sgbl_emprestimo_config`, `sgbl_api_cache` e `sgbl_precadastro`.
- A migração `sql/001_alunos_turma.sql` adiciona `turma`, `ano_letivo` e o índice único de matrícula em `alunos`.

## Limitações conhecidas

- O prazo padrão de empréstimo fica no `localStorage` de cada navegador; não sincroniza entre dispositivos.
- A gestão de exemplares ainda é limitada: o acervo controla quantidade/tombo, sem status individual completo.
- Não há autenticação/perfis; o acesso ao app é aberto.
- `node_modules/` e `dist/` não são versionados (ver `.gitignore`).


*Projeto Integrador — UNIVESP 2026*
