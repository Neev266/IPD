create table if not exists public.drafts (
  id text primary key,
  user_id text not null,
  payload jsonb not null,
  created_at timestamptz default now()
);

alter table public.drafts enable row level security;

create policy if not exists "Users can view own drafts"
  on public.drafts for select
  using (auth.uid()::text = user_id);

create policy if not exists "Users can insert own drafts"
  on public.drafts for insert
  with check (auth.uid()::text = user_id);

create policy if not exists "Users can update own drafts"
  on public.drafts for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
