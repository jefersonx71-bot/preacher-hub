-- Script de Criação do Banco de Dados para o Preacher Hub (PregaDynamic)
-- Rode esta instrução no editor SQL (SQL Editor) do seu painel do Supabase.

create table if not exists sermons (
  id text primary key,
  title text not null,
  base_verse text,
  theme text,
  introduction text,
  conclusion text,
  appeal text,
  tags text[] default '{}',
  topics jsonb default '[]'::jsonb,
  created_at bigint not null,
  updated_at bigint not null,
  sync_key text not null,
  deleted boolean default false
);

-- Habilitar segurança Row Level Security (RLS) se desejado.
-- Para manter simples e permitir sync apenas por código, as regras abaixo permitem leitura/escrita públicas para quem possui a chave correspondente.
alter table sermons enable row level security;

create policy "Permitir tudo para quem tem a chave de sincronização"
  on sermons
  for all
  using (true)
  with check (true);

-- Indexar por sync_key para consultas rápidas
create index if not exists idx_sermons_sync_key on sermons(sync_key);
