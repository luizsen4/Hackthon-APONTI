-- RAIZ — esquema do banco (Supabase/Postgres) com Row Level Security por setor (comunidade).
-- Rodar no SQL Editor do Supabase ou com `supabase db push`.
-- Ativar no painel: Authentication > Providers > Email (sem confirmação de e-mail na demo)
-- e Authentication > Anonymous sign-ins (o morador não tem conta).

create extension if not exists pgcrypto;

-- Lideranças: perfil ligado ao usuário do Supabase Auth. O setor define o que ela enxerga.
create table if not exists public.liderancas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome text not null check (char_length(nome) <= 60),
  assoc text not null default '',
  setor text not null,
  tel text not null unique,
  criado_em timestamptz not null default now()
);

create or replace function public.lidera(s text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.liderancas l where l.user_id = auth.uid() and l.setor = s);
$$;

-- Residências
create table if not exists public.casas (
  id text primary key default gen_random_uuid()::text,
  setor text not null,
  apelido text not null default '',
  endereco text not null default '',
  referencia text not null default '',
  zona text not null,
  pos jsonb,
  status text not null default 'Pendente' check (status in ('Pendente','Visitado','Precisa Defesa Civil','Não encontrado')),
  status_em bigint,
  tem_foto boolean not null default false,
  criado_em bigint not null,
  ficticio boolean not null default false
);

-- Moradores (dados pessoais e de acessibilidade; só a liderança do setor lê)
create table if not exists public.pessoas (
  id text primary key default gen_random_uuid()::text,
  setor text not null,
  casa_id text references public.casas(id) on delete set null,
  nome text not null check (char_length(nome) <= 80),
  cpf text not null default '' check (cpf = '' or cpf ~ '^[0-9]{11}$'),
  sem_documento boolean not null default false,
  endereco text not null default '',
  referencia text not null default '',
  necessidades text[] not null default '{}',
  necessidade_outro text not null default '',
  canal text not null default 'visita' check (canal in ('visita','audio','texto_facil','libras','ligacao')),
  contato text not null default '',
  zona text not null,
  pos jsonb,
  tem_fotos jsonb,
  consentimento jsonb not null,
  revisar_ate bigint not null,
  criado_em bigint not null,
  ficticio boolean not null default false,
  status text,
  status_em bigint
);

-- Fotos ficam separadas dos cadastros (id = id da pessoa ou 'casa-<id>')
create table if not exists public.fotos (
  id text primary key,
  setor text not null,
  casa text,
  pessoa text,
  ilustrativa boolean not null default false
);

-- Sinais de risco enviados por moradores ou registrados pela liderança
create table if not exists public.relatos (
  id text primary key default gen_random_uuid()::text,
  setor text not null,
  sinal text not null check (sinal in ('lona_rasgada','rachadura','agua_barrenta','muro_poste_inclinado','agua_subindo','lixo_canal','lixo_queima_encosta')),
  zona text,
  pos jsonb,
  origem text not null check (origem in ('foto','texto','desenho','liderança')),
  autor uuid default auth.uid(),
  criado_em bigint not null,
  ficticio boolean not null default false
);

-- Identificação de quem avisou (selfie ou CPF); id = auth.uid() do morador
create table if not exists public.idents (
  id text primary key,
  setor text not null,
  cpf text not null default '',
  selfie text not null default '',
  em bigint not null
);

-- Avisos da liderança (feed público da comunidade)
create table if not exists public.avisos (
  id text primary key default gen_random_uuid()::text,
  setor text not null,
  tipo text not null check (tipo in ('urgente','abrigo','aviso','campanha')),
  titulo text not null check (char_length(titulo) <= 80),
  texto text not null default '' check (char_length(texto) <= 800),
  endereco text not null default '',
  autor text not null default '',
  criado_em bigint not null
);

-- Pedidos de cadastro enviados pelo morador
create table if not exists public.pedidos (
  id text primary key default gen_random_uuid()::text,
  setor text not null,
  mensagem text not null check (char_length(mensagem) <= 1500),
  cpf text not null default '',
  selfie text not null default '',
  para text not null default 'eu' check (para in ('eu','outro')),
  para_nome text not null default '',
  parentesco text not null default '',
  status text not null default 'pendente' check (status in ('pendente','cadastrado','recusado')),
  status_em bigint,
  casa_nome text,
  pessoa_nome text,
  autor uuid default auth.uid(),
  consentimento jsonb not null,
  criado_em bigint not null,
  ficticio boolean not null default false
);

-- Alerta ligado/desligado por comunidade
create table if not exists public.setores_estado (
  setor text primary key,
  alerta boolean not null default false,
  atualizado_em timestamptz not null default now()
);

-- ===== Row Level Security =====
alter table public.liderancas enable row level security;
alter table public.casas enable row level security;
alter table public.pessoas enable row level security;
alter table public.fotos enable row level security;
alter table public.relatos enable row level security;
alter table public.idents enable row level security;
alter table public.avisos enable row level security;
alter table public.pedidos enable row level security;
alter table public.setores_estado enable row level security;

create policy "liderança lê e cria o próprio perfil" on public.liderancas
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Casas, moradores e fotos: só a liderança do setor
create policy "liderança do setor" on public.casas for all using (public.lidera(setor)) with check (public.lidera(setor));
create policy "liderança do setor" on public.pessoas for all using (public.lidera(setor)) with check (public.lidera(setor));
create policy "liderança do setor" on public.fotos for all using (public.lidera(setor)) with check (public.lidera(setor));

-- Sinais: qualquer sessão (inclusive anônima) envia em nome próprio; só a liderança do setor lê
create policy "morador envia sinal" on public.relatos for insert with check (autor = auth.uid() or public.lidera(setor));
create policy "liderança lê sinais" on public.relatos for select using (public.lidera(setor));
create policy "liderança apaga sinais" on public.relatos for delete using (public.lidera(setor));

-- Identificação: o morador grava a dele; a liderança do setor lê
create policy "morador grava a própria identificação" on public.idents for insert with check (id = auth.uid()::text);
create policy "morador atualiza a própria identificação" on public.idents for update using (id = auth.uid()::text);
create policy "liderança lê identificações" on public.idents for select using (public.lidera(setor) or id = auth.uid()::text);

-- Avisos: comunidade lê; liderança publica e apaga
create policy "todos leem avisos" on public.avisos for select using (true);
create policy "liderança publica" on public.avisos for insert with check (public.lidera(setor));
create policy "liderança apaga" on public.avisos for delete using (public.lidera(setor));

-- Pedidos: morador envia e acompanha o status do seu; liderança do setor lê e responde
create policy "morador envia pedido" on public.pedidos for insert with check (autor = auth.uid());
create policy "morador vê o seu, liderança vê o setor" on public.pedidos for select using (autor = auth.uid() or public.lidera(setor));
create policy "liderança responde" on public.pedidos for update using (public.lidera(setor));

-- Alerta: todos leem; liderança liga e desliga
create policy "todos leem alerta" on public.setores_estado for select using (true);
create policy "liderança muda alerta" on public.setores_estado for insert with check (public.lidera(setor));
create policy "liderança atualiza alerta" on public.setores_estado for update using (public.lidera(setor));

-- Tempo real para o painel
alter publication supabase_realtime add table public.casas, public.pessoas, public.relatos, public.avisos, public.pedidos, public.setores_estado;

create index if not exists casas_setor on public.casas (setor);
create index if not exists pessoas_setor on public.pessoas (setor);
create index if not exists relatos_setor on public.relatos (setor, criado_em desc);
create index if not exists pedidos_setor on public.pedidos (setor, criado_em desc);
