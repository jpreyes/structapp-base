alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists profession text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists project_limit integer default 3;
