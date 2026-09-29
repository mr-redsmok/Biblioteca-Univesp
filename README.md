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

### 2. Rode o projeto Vue (atual)

```bash
npm install
npm run dev
```

- Acesse pelo navegador: http://localhost:5173
- Online: https://biblioteca-univesp-ten.vercel.app/

### Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Sobe Vite em modo dev (porta 5173) |
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
- Interface dark mode com abas
- Acessibilidade básica (ARIA roles)

## Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | Vue 3 + Vite 5 + Vue Router 4 + Pinia 2 |
| Persistência atual | localStorage (navegador: `sgbl_livros`, `sgbl_tombo_seq`, `sgbl_api_cache`) |
| Banco de dados | PostgreSQL (Supabase) - em implementação|
| Hospedagem | Vercel
| Versionamento | Git 
| Busca de livros | Google Books API + Open Library API + Seed local (offline) |

## Estrutura do projeto (Atual — Vue)

```
biblioteca-univesp/
├── src/
│   ├── main.js             (createApp + Pinia + Router)
│   ├── App.vue             (header/abbas, router-view, modal global, toast)
│   ├── router/index.js     (/catalogo, /cadastrar, /cadastrar/:id, /buscar, /configuracoes)
│   ├── stores/acervo.js    (CRUD, filtros/ordenação, export/import JSON, localStorage)
│   │   ├── stores/toast.js     (fila de toast, usado por utils.toast)
│   │   ├── stores/precadastro.js (ponte Search -> Form, espelha sessionStorage)
│   ├── views/
│   │   ├── CatalogView.vue (toolbar + count, usa FiltersBar/BookCard/ImportExport)
│   │   ├── FormView.vue    (thin; lógica em useLivroForm)
│   │   ├── SearchView.vue  (busca API + pré-cadastro)
│   │   └── ConfigView.vue  (formato do tombo)
│   ├── composables/
│   │   ├── useBuscaLivros.js (useBuscaLivros + useAutofill, Abort + debounce)
│   │   ├── useConfirmModal.js (estado do modal excluir)
│   │   └── useLivroForm.js   (form, dirty-guard, autofill, salvar)
│   ├── lib/
│   │   ├── api.js          (Open Library primeiro, Google fallback, cache 30min)
│   │   ├── autofill.js     (escolherMelhorResultado, enriquecer, patch)
│   │   ├── validate.js     (validarLivro, sanitizar, isbnDuplicado)
│   │   ├── meta.js         (metaBits/metaBusca dos cards)
│   │   ├── tombo.js        (gerarTombo, peek, config sgbl_tombo_config)
│   │   └── utils.js        (normIsbn, newId via randomUUID, formatDesc, toast)
│   ├── assets/seed.json    (fallback offline curado)
│   ├── components/         (BookCard, BookCover, FiltersBar, ImportExport, ConfirmModal, AppToast)
│   ├── tests/              (vitest: validate, tombo, meta)
├── css/                    (legado reaproveitado via @import no App.vue)
├── public/ / index.html / vite.config.js (@ → ./src)
└── README.md
```

> Histórico: versão anterior em `css/ + js/` vanilla foi migrada para Vue. O `css/` foi mantido como legado.


Próximas Implementações (Supabase pausado para revisão — sem migração por enquanto)
- Integração com Supabase
- Migração da persistência de dados do localStorage para PostgreSQL
- Persistência centralizada dos dados
- Melhorias na sincronização do acervo

## Persistência atual (decisão)

- Mantido `localStorage` por enquanto para facilitar revisão em grupo (sem `.env`, sem backend).
- Chaves: `sgbl_livros` (acervo), `sgbl_tombo_seq` + `sgbl_tombo_config` (tombo), `sgbl_api_cache` (busca 30min), `sgbl_precadastro` (ponte Search→Form via store).
- Supabase/Postgres segue como próximo passo pós-revisão; sem código de migração neste commit.

## Limitações conhecidas

- Sem backend: cada navegador tem seu acervo; `sgbl_tombo_seq` colide entre dispositivos.
- Exemplares são só `{id, tombo}` + quantidade — sem status individual (disponível/emprestado/danificado).
- Módulo de empréstimos/devoluções ainda não implementado (só cadastro/catálogo/busca/tombo).
- `node_modules/` e `dist/` não são versionados (ver `.gitignore`).


*Projeto Integrador — UNIVESP 2026*
