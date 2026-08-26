# Sistema de Gestão de Bibliotecas

![UNIVESP](https://img.shields.io/badge/UNIVESP-Computação-blue)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)

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

## Pré-requisitos

- Navegador web atualizado (Chrome, Firefox, Edge)
- Git

### 1. Clone o repositório

```bash
git clone https://github.com/mr-redsmok/Biblioteca-Univesp
cd biblioteca-univesp
```

### 2. Abra o projeto

Para visualizar o sistema, basta abrir o arquivo `index.html` diretamente no navegador.

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
| Storage | Supabase (PostgreSQL)|
| Busca de livros | Google Books API + Open Library API |

## Estrutura do projeto (Atual)

```
biblioteca-univesp/
|-- css/
|-- js/
|-- README.md
\-- index.html
```

*Projeto Integrador — UNIVESP 2026*
