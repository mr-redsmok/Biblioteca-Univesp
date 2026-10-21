-- Migração 001 — turma e ano letivo dos alunos
--
-- IMPORTANTE: este arquivo NÃO é executado automaticamente.
-- Rode manualmente no painel do Supabase (SQL Editor do projeto) antes de
-- usar a importação de alunos do SED.
--
-- A matrícula é a chave natural do aluno no app (formato <RA>-<DIG>).
-- O índice único abaixo protege contra duplicidade mesmo que a importação
-- seja executada duas vezes.

alter table public.alunos add column if not exists turma text;
alter table public.alunos add column if not exists ano_letivo integer;

create unique index if not exists alunos_matricula_key on public.alunos (matricula);
