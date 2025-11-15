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
create table if not exists public.user_subscriptions (
    user_id uuid primary key references auth.users(id) on delete cascade,
    plan text not null default 'trial',
    status text not null default 'active',
    started_at timestamptz not null default now(),
    expires_at timestamptz,
    trial_started_at timestamptz,
    trial_expires_at timestamptz,
    flow_subscription_id text,
    flow_customer_id text,
    provider_plan_id text,
    updated_at timestamptz not null default now()
);
create table if not exists public.design_bases (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    name text not null,
    data jsonb not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create table if not exists public.design_base_runs (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    created_by uuid not null references auth.users(id),
    design_base_id uuid references public.design_bases(id) on delete set null,
    name text not null,
    data jsonb not null,
    document_url text,
    created_at timestamptz not null default now()
);
create index if not exists idx_projects_owner on public.projects(created_by, updated_at desc);
create index if not exists idx_runs_project on public.calc_runs(project_id, created_at desc);
create index if not exists idx_kb_cols_proj on public.kanban_columns(project_id, position);
create index if not exists idx_kb_cards_col on public.kanban_cards(column_id, position);
create index if not exists idx_kb_cards_proj on public.kanban_cards(project_id, position);
create index if not exists idx_tasks_proj on public.project_tasks(project_id, start_date);
create index if not exists idx_design_bases_proj on public.design_bases(project_id, created_at desc);
create index if not exists idx_design_base_runs_proj on public.design_base_runs(project_id, created_at desc);
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.calc_runs enable row level security;
alter table public.project_payments enable row level security;
alter table public.billing_accounts enable row level security;
alter table public.user_subscriptions enable row level security;
alter table public.kanban_columns enable row level security;
alter table public.kanban_cards enable row level security;
alter table public.project_tasks enable row level security;
alter table public.design_bases enable row level security;
alter table public.design_base_runs enable row level security;
create policy "profiles_select" on public.profiles for select using ( user_id = (select auth.uid()) );
create policy "profiles_upsert" on public.profiles for insert with check ( user_id = (select auth.uid()) );
create policy "profiles_update" on public.profiles for update using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
create policy "projects_select" on public.projects for select using ( created_by = (select auth.uid()) );
create policy "projects_insert" on public.projects for insert with check ( created_by = (select auth.uid()) );
create policy "projects_update" on public.projects for update using ( created_by = (select auth.uid()) ) with check ( created_by = (select auth.uid()) );
create policy "projects_delete" on public.projects for delete using ( created_by = (select auth.uid()) );
create policy "runs_select" on public.calc_runs for select using ( created_by = (select auth.uid()) );
create policy "runs_insert" on public.calc_runs for insert with check ( created_by = (select auth.uid()) );
create policy "runs_delete" on public.calc_runs for delete using ( created_by = (select auth.uid()) );
create policy "pp_select" on public.project_payments for select using ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = (select auth.uid())) );
create policy "pp_insert" on public.project_payments for insert with check ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = (select auth.uid())) );
create policy "pp_delete" on public.project_payments for delete using ( exists (select 1 from public.projects p where p.id = project_payments.project_id and p.created_by = (select auth.uid())) );
create policy "kb_cols_select" on public.kanban_columns for select using ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = (select auth.uid())) );
create policy "kb_cols_mut" on public.kanban_columns for all using ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = kanban_columns.project_id and p.created_by = (select auth.uid())) );
create policy "kb_cards_select" on public.kanban_cards for select using ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = (select auth.uid())) );
create policy "kb_cards_mut" on public.kanban_cards for all using ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = kanban_cards.project_id and p.created_by = (select auth.uid())) );
create policy "tasks_select" on public.project_tasks for select using ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = (select auth.uid())) );
create policy "tasks_mut" on public.project_tasks for all using ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_tasks.project_id and p.created_by = (select auth.uid())) );
create policy "bill_select" on public.billing_accounts for select using ( user_id = (select auth.uid()) );
create policy "bill_upsert" on public.billing_accounts for insert with check ( user_id = (select auth.uid()) );
create policy "bill_update" on public.billing_accounts for update using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
create policy "subscriptions_select" on public.user_subscriptions for select using ( user_id = (select auth.uid()) );
create policy "subscriptions_upsert" on public.user_subscriptions for insert with check ( user_id = (select auth.uid()) );
create policy "subscriptions_update" on public.user_subscriptions for update using ( user_id = (select auth.uid()) ) with check ( user_id = (select auth.uid()) );
create policy "design_bases_select" on public.design_bases for select using ( created_by = (select auth.uid()) );
create policy "design_bases_insert" on public.design_bases for insert with check ( created_by = (select auth.uid()) );
create policy "design_bases_update" on public.design_bases for update using ( created_by = (select auth.uid()) ) with check ( created_by = (select auth.uid()) );
create policy "design_bases_delete" on public.design_bases for delete using ( created_by = (select auth.uid()) );
create policy "design_base_runs_select" on public.design_base_runs for select using ( created_by = (select auth.uid()) );
create policy "design_base_runs_insert" on public.design_base_runs for insert with check ( created_by = (select auth.uid()) );
create policy "design_base_runs_delete" on public.design_base_runs for delete using ( created_by = (select auth.uid()) );

create table if not exists public.project_inspections (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    structure_name text not null,
    location text,
    inspection_date date not null,
    inspector text not null,
    overall_condition text not null check (overall_condition in ('operativa','observacion','critica')),
    summary text not null,
    photos jsonb not null default '[]'::jsonb,
    exposure text,
    accessibility text,
    deterministic_score numeric(5,2),
    llm_score numeric(5,2),
    llm_reason text,
    llm_payload jsonb,
    score_updated_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
create index if not exists idx_project_inspections_project_date on public.project_inspections(project_id, inspection_date desc);
alter table public.project_inspections enable row level security;
create policy "project_inspections_access" on public.project_inspections for all using ( exists (select 1 from public.projects p where p.id = project_inspections.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_inspections.project_id and p.created_by = (select auth.uid())) );

create table if not exists public.project_inspection_damages (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    inspection_id uuid not null references public.project_inspections(id) on delete cascade,
    structure text not null,
    location text,
    damage_type text not null,
    damage_cause text not null,
    severity text not null check (severity in ('Leve','Media','Alta','Muy Alta')),
    extent text,
    comments text,
    damage_photo_url text,
    deterministic_score numeric(5,2),
    llm_score numeric(5,2),
    llm_reason text,
    llm_payload jsonb,
    score_updated_at timestamptz,
    created_at timestamptz not null default now()
);
create index if not exists idx_project_inspection_damages_project on public.project_inspection_damages(project_id, severity desc);
create index if not exists idx_project_inspection_damages_inspection on public.project_inspection_damages(inspection_id);
alter table public.project_inspection_damages enable row level security;
create policy "inspection_damages_access" on public.project_inspection_damages for all using ( exists (select 1 from public.projects p where p.id = project_inspection_damages.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_inspection_damages.project_id and p.created_by = (select auth.uid())) );

create table if not exists public.project_inspection_tests (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    inspection_id uuid not null references public.project_inspections(id) on delete cascade,
    test_type text not null,
    method text,
    standard text,
    executed_at date not null,
    laboratory text,
    sample_location text,
    result_summary text not null,
    attachment_url text,
    created_at timestamptz not null default now()
);
create index if not exists idx_project_inspection_tests_project on public.project_inspection_tests(project_id, executed_at desc);
create index if not exists idx_project_inspection_tests_inspection on public.project_inspection_tests(inspection_id);
alter table public.project_inspection_tests enable row level security;
create policy "inspection_tests_access" on public.project_inspection_tests for all using ( exists (select 1 from public.projects p where p.id = project_inspection_tests.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_inspection_tests.project_id and p.created_by = (select auth.uid())) );

create table if not exists public.project_inspection_documents (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    inspection_id uuid not null references public.project_inspections(id) on delete cascade,
    title text not null,
    category text not null check (category in ('informe','fotografia','ensayo','otro')),
    issued_at date not null,
    issued_by text,
    url text,
    notes text,
    created_at timestamptz not null default now()
);
create index if not exists idx_project_inspection_documents_project on public.project_inspection_documents(project_id, issued_at desc);
create index if not exists idx_project_inspection_documents_inspection on public.project_inspection_documents(inspection_id);
alter table public.project_inspection_documents enable row level security;
create policy "inspection_documents_access" on public.project_inspection_documents for all using ( exists (select 1 from public.projects p where p.id = project_inspection_documents.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_inspection_documents.project_id and p.created_by = (select auth.uid())) );

create table if not exists public.project_inspection_damage_photos (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    inspection_id uuid not null references public.project_inspections(id) on delete cascade,
    damage_id uuid not null references public.project_inspection_damages(id) on delete cascade,
    photo_url text not null,
    comments text,
    created_at timestamptz not null default now()
);
create index if not exists idx_project_inspection_damage_photos_damage on public.project_inspection_damage_photos(damage_id, created_at desc);
alter table public.project_inspection_damage_photos enable row level security;
create policy "damage_photos_access" on public.project_inspection_damage_photos for all using ( exists (select 1 from public.projects p where p.id = project_inspection_damage_photos.project_id and p.created_by = (select auth.uid())) ) with check ( exists (select 1 from public.projects p where p.id = project_inspection_damage_photos.project_id and p.created_by = (select auth.uid())) );

create table if not exists public.inspection_damage_catalog (
    slug text primary key,
    label text not null
);

create table if not exists public.inspection_damage_cause_catalog (
    slug text primary key,
    label text not null
);

insert into public.inspection_damage_catalog (slug, label) values
    ('fisura-longitudinal-vigas','Fisura longitudinal en vigas'),
    ('fisura-diagonal-cortante','Fisura diagonal por cortante'),
    ('fisuracion-nodos','Fisuración en nodos'),
    ('desprendimiento-recubrimiento','Desprendimiento de recubrimiento'),
    ('corrosion-armaduras','Corrosión de armaduras expuestas'),
    ('pandeo-local-perfiles','Pandeo local en perfiles'),
    ('deformacion-excesiva-losas','Deformación excesiva de losas'),
    ('asentamiento-diferencial','Asentamiento diferencial'),
    ('delaminacion-hormigon','Delaminación en elementos de hormigón'),
    ('aplastamiento-apoyos','Aplastamiento en apoyos'),
    ('grieta-vertical-muros','Grieta vertical en muros'),
    ('humedad-eflorescencias','Humedad capilar y eflorescencias'),
    ('fisura-soldaduras','Fallo o fisura en soldaduras'),
    ('pernos-sueltos','Aflojamiento o pérdida de pernos'),
    ('erosion-fundaciones','Erosión o socavación en fundaciones'),
    ('impacto-localizado','Impacto localizado en elementos'),
    ('fatiga-metalicos','Fatiga en elementos metálicos'),
    ('perdida-arriostramientos','Rotura o pérdida de arriostramientos'),
    ('perdida-seccion-corrosion','Pérdida de sección por corrosión generalizada'),
    ('desalineacion-marcos','Desalineación o desplazamiento de marcos')
on conflict (slug) do nothing;

insert into public.inspection_damage_cause_catalog (slug, label) values
    ('sobrecarga-gravitacional','Sobrecarga gravitacional sostenida'),
    ('sobrecarga-accidental','Sobrecarga accidental o impacto'),
    ('diseno-deficiente','Deficiencias de diseño estructural'),
    ('detalle-constructivo-pobre','Detalles constructivos deficientes'),
    ('curado-inadecuado','Curado inadecuado del hormigón'),
    ('corrosion-cloruros','Corrosión inducida por cloruros'),
    ('carbonatacion-avanzada','Carbonatación avanzada'),
    ('humedad-permanente','Humedad permanente o fugas'),
    ('movimiento-sismico','Movimiento sísmico recurrente'),
    ('vibraciones-maquinaria','Vibraciones por maquinaria'),
    ('cambio-uso-no-evaluado','Cambio de uso no evaluado'),
    ('fatiga-ciclica','Fatiga por cargas cíclicas'),
    ('incendio-accion-termica','Incendio o acción térmica'),
    ('asentamiento-terreno','Asentamiento del terreno'),
    ('socavacion-agua','Socavación por agua subterránea'),
    ('impacto-vehicular','Impacto vehicular'),
    ('choque-equipos','Choque de equipos móviles'),
    ('errores-mantenimiento','Errores de mantenimiento'),
    ('compatibilidad-materiales','Compatibilidad deficiente de materiales'),
    ('corrosion-galvanica','Corrosión galvánica')
on conflict (slug) do nothing;
