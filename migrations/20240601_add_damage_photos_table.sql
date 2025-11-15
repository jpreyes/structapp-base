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
create policy "damage_photos_access" on public.project_inspection_damage_photos
    for all using (
        exists (
            select 1 from public.projects p
            where p.id = project_inspection_damage_photos.project_id
            and p.created_by = (select auth.uid())
        )
    ) with check (
        exists (
            select 1 from public.projects p
            where p.id = project_inspection_damage_photos.project_id
            and p.created_by = (select auth.uid())
        )
    );
