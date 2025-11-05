create extension if not exists "uuid-ossp";
create table if not exists public.profiles (user_id uuid primary key references auth.users(id) on delete cascade, plan text not null default 'basic', created_at timestamptz not null default now());
create table if not exists public.projects (id uuid primary key default uuid_generate_v4(), name text not null, status text not null default 'draft', created_by uuid not null references auth.users(id), start_date date, end_date date, mandante text, budget numeric(14,2), payment_status text not null default 'not_invoiced', is_archived boolean not null default false, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.calc_runs (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    element_type text not null,
    input_json jsonb not null,
    result_json jsonb not null,
    engine_version text not null default 'v0.1.0',
    created_at timestamptz not null default now()
);
create table if not exists public.project_payments (id uuid primary key default uuid_generate_v4(), project_id uuid not null references public.projects(id) on delete cascade, event_date date not null, kind text not null check (kind in ('invoice','advance','credit_note','payment','refund')), amount numeric(14,2) not null check (amount >= 0), currency text not null default 'CLP', reference text, due_date date, note text, created_at timestamptz not null default now());
create table if not exists public.kanban_columns (id uuid primary key default uuid_generate_v4(), project_id uuid not null references public.projects(id) on delete cascade, name text not null, position numeric not null default 0, created_at timestamptz not null default now());
create table if not exists public.kanban_cards (id uuid primary key default uuid_generate_v4(), project_id uuid not null references public.projects(id) on delete cascade, column_id uuid not null references public.kanban_columns(id) on delete cascade, title text not null, description text, assignee text, due_date date, labels jsonb, position numeric not null default 0, created_at timestamptz not null default now());
create table if not exists public.project_tasks (id uuid primary key default uuid_generate_v4(), project_id uuid not null references public.projects(id) on delete cascade, title text not null, start_date date not null, end_date date not null, progress numeric not null default 0, status text not null default 'todo', assignee text, notes text, created_at timestamptz not null default now());
create table if not exists public.billing_accounts (user_id uuid primary key references auth.users(id) on delete cascade, provider text not null default 'manual', external_customer_id text, external_subscription_id text unique, plan text, status text, current_period_end timestamptz, updated_at timestamptz not null default now());
create table if not exists public.design_bases (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    name text not null,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_projects_owner on public.projects(created_by, updated_at desc);
create index if not exists idx_runs_project on public.calc_runs(project_id, created_at desc);
create index if not exists idx_kb_cols_proj on public.kanban_columns(project_id, position);
create index if not exists idx_kb_cards_col on public.kanban_cards(column_id, position);
create index if not exists idx_kb_cards_proj on public.kanban_cards(project_id, position);
create index if not exists idx_tasks_proj on public.project_tasks(project_id, start_date);
create index if not exists idx_design_bases_proj on public.design_bases(project_id, created_at desc);
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.calc_runs enable row level security;
alter table public.project_payments enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.project_tasks enable row level security;
alter table public.design_bases enable row level security;
create policy "profiles_select" on public.profiles for select using ( user_id = auth.uid() );
create policy "profiles_upsert" on public.profiles for insert with check ( user_id = auth.uid() );
create policy "profiles_update" on public.profiles for update using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
create policy "projects_select" on public.projects for select using ( created_by = auth.uid() );
create policy "projects_insert" on public.projects for insert with check ( created_by = auth.uid() );
create policy "projects_update" on public.projects for update using ( created_by = auth.uid() ) with check ( created_by = auth.uid() );
create policy "projects_delete" on public.projects for delete using ( created_by = auth.uid() );
create policy "runs_select" on public.calc_runs for select using ( created_by = auth.uid() );
create policy "runs_insert" on public.calc_runs for insert with check ( created_by = auth.uid() );
create policy "runs_delete" on public.calc_runs for delete using ( created_by = auth.uid() );
create policy "pp_select" on public.project_payments for select using ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = auth.uid()) );
create policy "pp_insert" on public.project_payments for insert with check ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = auth.uid()) );
create policy "pp_delete" on public.project_payments for delete using ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = auth.uid()) );
create policy "kb_cols_select" on public.kanban_columns for select using ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = auth.uid()) );
create policy "kb_cols_mut" on public.kanban_columns for all using ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = auth.uid()) ) with check ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = auth.uid()) );
create policy "kb_cards_select" on public.kanban_cards for select using ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = auth.uid()) );
create policy "kb_cards_mut" on public.kanban_cards for all using ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = auth.uid()) ) with check ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = auth.uid()) );
create policy "tasks_select" on public.project_tasks for select using ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = auth.uid()) );
create policy "tasks_mut" on public.project_tasks for all using ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = auth.uid()) ) with check ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = auth.uid()) );
create policy "bill_select" on public.billing_accounts for select using ( user_id = auth.uid() );
create policy "bill_upsert" on public.billing_accounts for insert with check ( user_id = auth.uid() );
create policy "bill_update" on public.billing_accounts for update using ( user_id = auth.uid() ) with check ( user_id = auth.uid() );
create policy "design_bases_select" on public.design_bases for select using ( created_by = auth.uid() );
create policy "design_bases_insert" on public.design_bases for insert with check ( created_by = auth.uid() );
create policy "design_bases_update" on public.design_bases for update using ( created_by = auth.uid() ) with check ( created_by = auth.uid() );
create policy "design_bases_delete" on public.design_bases for delete using ( created_by = auth.uid() );
