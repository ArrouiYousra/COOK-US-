-- Ensure the reservations table exposes the cook profile reference used by the API
alter table if exists public.reservations
    add column if not exists cook_profile_id uuid;

do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'reservations'
          and column_name = 'cook_id'
    ) then
        update public.reservations r
        set cook_profile_id = cp.id
        from public.cook_profiles cp
        where r.cook_profile_id is null
          and r.cook_id is not null
          and cp.user_id = r.cook_id;
    end if;
end $$;

-- Add the foreign key only if it is missing
do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'reservations_cook_profile_id_fkey'
    ) then
        alter table public.reservations
            add constraint reservations_cook_profile_id_fkey
            foreign key (cook_profile_id)
            references public.cook_profiles (id)
            on delete cascade;
    end if;
end $$;

-- Index to speed up lookups by cook profile
create index if not exists idx_reservations_cook_profile_id
    on public.reservations (cook_profile_id);

