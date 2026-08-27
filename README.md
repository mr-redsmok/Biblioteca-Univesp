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

- Navegador web atualizado (Chrome, Firefox, Edge)
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/mr-redsmok/Biblioteca-Univesp
cd biblioteca-univesp
```

### 2. Abra o projeto

Para visualizar o projeto, escolha uma das opções abaixo:

- Online: Acesse diretamente pelo link https://biblioteca-univesp-ten.vercel.app/

- Localmente: Utilize a extensão Live Server ou rode o comando '\python3 -m http.server' no seu terminal.

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
| Frontend | HTML + CSS + JavaScript |
| Persistência | localStorage (navegador) |
| Storage | PostgreSQL (Supabase)|
| Busca de livros | Google Books API + Open Library API |

## Estrutura do projeto (Atual)

```
biblioteca-univesp/
├── css/
│   ├── styles.css        (importa todos os componentes abaixo, via @import)
│   ├── base.css          (variáveis, reset, body, container, input global)
│   ├── header.css        (cabeçalho e abas de navegação)
│   ├── buttons.css       (botões e variações: ghost, danger, small, group)
│   ├── form.css          (formulário de cadastro)
│   ├── cards.css         (cards compartilhados: catálogo e busca)
│   ├── catalog.css       (toolbar e filtros do catálogo)
│   ├── search.css        (barra de busca e mensagens)
│   ├── modal.css         (modal de confirmação)
│   ├── toast.css         (notificações)
│   └── footer.css        (rodapé)
├── js/
│   ├── main.js           (ponto de entrada: init e wiring)
│   ├── utils.js          (helpers: esc, normIsbn, toast, newId, formatDesc)
│   ├── storage.js        (estado do acervo e persistência)
│   ├── validate.js       (validação e sanitização)
│   ├── crud.js           (operações de acervo: adicionar/editar/excluir/filtrar)
│   ├── api.js            (Google Books + Open Library)
│   ├── autofill.js       (auto-preenchimento por heurística)
│   └── ui/
│       ├── catalog.js    (render do catálogo e ações)
│       ├── form.js       (formulário e edição)
│       ├── search.js     (busca na API)
│       ├── tabs.js       (alternância de abas)
│       ├── modal.js      (confirmação de exclusão)
│       └── io.js         (exportar / importar)
├── index.html
└── README.md
```

*Projeto Integrador — UNIVESP 2026*
