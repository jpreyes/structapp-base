alter table public.profiles add column if not exists approved boolean not null default false;
alter table public.profiles add column if not exists approval_token text;
alter table public.profiles add column if not exists approval_requested_at timestamptz not null default now();
alter table public.profiles add column if not exists approved_at timestamptz;
