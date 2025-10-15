-- 02_us_indices_setup.sql
--
-- US indices data schema
-- Creates table for storing scraped US stock market indices data

begin;

-- 1. US indices table -------------------------------------------------
create table if not exists public.us_indices (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    last numeric(15, 2),
    high numeric(15, 2),
    low numeric(15, 2),
    change numeric(15, 2),
    change_percent numeric(10, 4),
    "time" text,
    scraped_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.us_indices is 'US stock market indices data scraped from investing.com';
comment on column public.us_indices.name is 'Index name (e.g., S&P 500, Dow Jones, Nasdaq)';
comment on column public.us_indices.last is 'Current/last price of the index';
comment on column public.us_indices.high is 'Day''s high price';
comment on column public.us_indices.low is 'Day''s low price';
comment on column public.us_indices.change is 'Price change from previous close';
comment on column public.us_indices.change_percent is 'Percentage change from previous close';
comment on column public.us_indices.time is 'Last update time from the source';
comment on column public.us_indices.scraped_at is 'Timestamp when the data was scraped';

-- Add indexes for better query performance
create index if not exists idx_us_indices_name on public.us_indices(name);
create index if not exists idx_us_indices_scraped_at on public.us_indices(scraped_at desc);
create index if not exists idx_us_indices_name_scraped_at on public.us_indices(name, scraped_at desc);

-- Add timestamp trigger for us_indices
drop trigger if exists us_indices_set_timestamp on public.us_indices;
create trigger us_indices_set_timestamp
before update on public.us_indices
for each row execute function public.handle_updated_at();

-- 2. Function to upsert us indices data ---------------------------------
create or replace function public.upsert_us_index(
    p_name text,
    p_last numeric,
    p_high numeric,
    p_low numeric,
    p_change numeric,
    p_change_percent numeric,
    p_time text,
    p_scraped_at timestamptz default timezone('utc', now())
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_id uuid;
begin
    -- Insert new record
    insert into public.us_indices (
        name,
        last,
        high,
        low,
        change,
        change_percent,
        "time",
        scraped_at
    )
    values (
        p_name,
        p_last,
        p_high,
        p_low,
        p_change,
        p_change_percent,
        p_time,
        p_scraped_at
    )
    returning id into v_id;

    return v_id;
end;
$$;

comment on function public.upsert_us_index is 'Inserts a new US index record with scraped data';

-- 3. Function to get latest indices data ------------------------------------
create or replace function public.get_latest_us_indices()
returns table (
    id uuid,
    name text,
    last numeric,
    high numeric,
    low numeric,
    change numeric,
    change_percent numeric,
    "time" text,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select distinct on (ui.name)
        ui.id,
        ui.name,
        ui.last,
        ui.high,
        ui.low,
        ui.change,
        ui.change_percent,
        ui."time",
        ui.scraped_at
    from public.us_indices ui
    order by ui.name, ui.scraped_at desc;
end;
$$;

comment on function public.get_latest_us_indices is 'Returns the most recent data for each US index';

-- 4. Function to get historical data for a specific index ------------------
create or replace function public.get_us_index_history(
    p_name text,
    p_limit integer default 100
)
returns table (
    id uuid,
    name text,
    last numeric,
    high numeric,
    low numeric,
    change numeric,
    change_percent numeric,
    "time" text,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        ui.id,
        ui.name,
        ui.last,
        ui.high,
        ui.low,
        ui.change,
        ui.change_percent,
        ui."time",
        ui.scraped_at
    from public.us_indices ui
    where ui.name = p_name
    order by ui.scraped_at desc
    limit p_limit;
end;
$$;

comment on function public.get_us_index_history is 'Returns historical data for a specific US index';

-- 5. Function to get indices data within a time range ----------------------
create or replace function public.get_us_indices_by_date_range(
    p_start_date timestamptz,
    p_end_date timestamptz
)
returns table (
    id uuid,
    name text,
    last numeric,
    high numeric,
    low numeric,
    change numeric,
    change_percent numeric,
    "time" text,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        ui.id,
        ui.name,
        ui.last,
        ui.high,
        ui.low,
        ui.change,
        ui.change_percent,
        ui."time",
        ui.scraped_at
    from public.us_indices ui
    where ui.scraped_at >= p_start_date
      and ui.scraped_at <= p_end_date
    order by ui.scraped_at desc, ui.name;
end;
$$;

comment on function public.get_us_indices_by_date_range is 'Returns US indices data within a specific date range';

-- 6. Function to clean up old data (keep last 30 days) ---------------------
create or replace function public.cleanup_old_us_indices_data(
    p_days_to_keep integer default 30
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_deleted_count integer;
begin
    delete from public.us_indices
    where scraped_at < timezone('utc', now()) - (p_days_to_keep || ' days')::interval;
    
    get diagnostics v_deleted_count = row_count;
    
    return v_deleted_count;
end;
$$;

comment on function public.cleanup_old_us_indices_data is 'Deletes US indices data older than specified days (default 30)';

-- 7. Row Level Security policies --------------------------------------------
alter table public.us_indices enable row level security;
alter table public.us_indices force row level security;

-- Authenticated users can view all indices data
drop policy if exists "Authenticated users can view indices" on public.us_indices;
create policy "Authenticated users can view indices" on public.us_indices
for select
to authenticated
using (true);

-- Service role has full access (for scraper)
drop policy if exists "Service role manages indices" on public.us_indices;
create policy "Service role manages indices" on public.us_indices
for all
to service_role
using (true)
with check (true);

-- Admins can manage all data
drop policy if exists "Admins can manage indices" on public.us_indices;
create policy "Admins can manage indices" on public.us_indices
for all
to authenticated
using (public.is_authenticated_admin())
with check (public.is_authenticated_admin());

-- 8. Grant necessary permissions --------------------------------------------
grant select on public.us_indices to authenticated;
grant all on public.us_indices to service_role;

grant execute on function public.upsert_us_index to service_role;
grant execute on function public.get_latest_us_indices to authenticated;
grant execute on function public.get_us_index_history to authenticated;
grant execute on function public.get_us_indices_by_date_range to authenticated;
grant execute on function public.cleanup_old_us_indices_data to service_role;

commit;