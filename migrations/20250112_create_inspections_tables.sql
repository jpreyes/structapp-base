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
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_project_inspections_project_date on public.project_inspections(project_id, inspection_date desc);

alter table public.project_inspections enable row level security;

create policy "project_inspections_access"
  on public.project_inspections
  for all
  using (exists (select 1 from public.projects p where p.id = project_inspections.project_id and p.created_by = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_inspections.project_id and p.created_by = (select auth.uid())));

create table if not exists public.project_inspection_damages (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    structure text not null,
    location text,
    damage_type text not null,
    damage_cause text not null,
    severity text not null check (severity in ('Leve','Media','Alta','Muy Alta')),
    extent text,
    comments text,
    damage_photo_url text,
    created_at timestamptz not null default now()
);

create index if not exists idx_project_inspection_damages_project on public.project_inspection_damages(project_id, severity desc);

alter table public.project_inspection_damages enable row level security;

create policy "inspection_damages_access"
  on public.project_inspection_damages
  for all
  using (exists (select 1 from public.projects p where p.id = project_inspection_damages.project_id and p.created_by = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_inspection_damages.project_id and p.created_by = (select auth.uid())));

create table if not exists public.project_inspection_tests (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
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

alter table public.project_inspection_tests enable row level security;

create policy "inspection_tests_access"
  on public.project_inspection_tests
  for all
  using (exists (select 1 from public.projects p where p.id = project_inspection_tests.project_id and p.created_by = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_inspection_tests.project_id and p.created_by = (select auth.uid())));

create table if not exists public.project_inspection_documents (
    id uuid primary key default uuid_generate_v4(),
    project_id uuid not null references public.projects(id) on delete cascade,
    title text not null,
    category text not null check (category in ('informe','fotografia','ensayo','otro')),
    issued_at date not null,
    issued_by text,
    url text,
    notes text,
    created_at timestamptz not null default now()
);

create index if not exists idx_project_inspection_documents_project on public.project_inspection_documents(project_id, issued_at desc);

alter table public.project_inspection_documents enable row level security;

create policy "inspection_documents_access"
  on public.project_inspection_documents
  for all
  using (exists (select 1 from public.projects p where p.id = project_inspection_documents.project_id and p.created_by = (select auth.uid())))
  with check (exists (select 1 from public.projects p where p.id = project_inspection_documents.project_id and p.created_by = (select auth.uid())));

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
