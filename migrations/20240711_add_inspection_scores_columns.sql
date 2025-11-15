alter table public.project_inspection_damages
    add column if not exists deterministic_score numeric(5,2),
    add column if not exists llm_score numeric(5,2),
    add column if not exists llm_reason text,
    add column if not exists llm_payload jsonb,
    add column if not exists score_updated_at timestamptz;

alter table public.project_inspections
    add column if not exists deterministic_score numeric(5,2),
    add column if not exists llm_score numeric(5,2),
    add column if not exists llm_reason text,
    add column if not exists llm_payload jsonb,
    add column if not exists score_updated_at timestamptz;
