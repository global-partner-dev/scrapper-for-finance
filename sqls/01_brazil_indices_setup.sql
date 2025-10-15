-- 01_brazil_indices_setup.sql
--
-- Brazilian indices data schema
-- Creates table for storing scraped Brazilian stock market indices data

begin;

-- 1. Brazilian indices table -------------------------------------------------
create table if not exists public.brazil_indices (
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

comment on table public.brazil_indices is 'Brazilian stock market indices data scraped from investing.com';
comment on column public.brazil_indices.name is 'Index name (e.g., Bovespa, Brazil 50)';
comment on column public.brazil_indices.last is 'Current/last price of the index';
comment on column public.brazil_indices.high is 'Day''s high price';
comment on column public.brazil_indices.low is 'Day''s low price';
comment on column public.brazil_indices.change is 'Price change from previous close';
comment on column public.brazil_indices.change_percent is 'Percentage change from previous close';
comment on column public.brazil_indices.time is 'Last update time from the source';
comment on column public.brazil_indices.scraped_at is 'Timestamp when the data was scraped';

-- Add indexes for better query performance
create index if not exists idx_brazil_indices_name on public.brazil_indices(name);
create index if not exists idx_brazil_indices_scraped_at on public.brazil_indices(scraped_at desc);
create index if not exists idx_brazil_indices_name_scraped_at on public.brazil_indices(name, scraped_at desc);

-- Add timestamp trigger for brazil_indices
drop trigger if exists brazil_indices_set_timestamp on public.brazil_indices;
create trigger brazil_indices_set_timestamp
before update on public.brazil_indices
for each row execute function public.handle_updated_at();

-- 2. Function to upsert brazil indices data ---------------------------------
create or replace function public.upsert_brazil_index(
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
    insert into public.brazil_indices (
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

comment on function public.upsert_brazil_index is 'Inserts a new Brazil index record with scraped data';

-- 3. Function to get latest indices data ------------------------------------
create or replace function public.get_latest_brazil_indices()
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
    select distinct on (bi.name)
        bi.id,
        bi.name,
        bi.last,
        bi.high,
        bi.low,
        bi.change,
        bi.change_percent,
        bi."time",
        bi.scraped_at
    from public.brazil_indices bi
    order by bi.name, bi.scraped_at desc;
end;
$$;

comment on function public.get_latest_brazil_indices is 'Returns the most recent data for each Brazil index';

-- 4. Function to get historical data for a specific index ------------------
create or replace function public.get_brazil_index_history(
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
        bi.id,
        bi.name,
        bi.last,
        bi.high,
        bi.low,
        bi.change,
        bi.change_percent,
        bi."time",
        bi.scraped_at
    from public.brazil_indices bi
    where bi.name = p_name
    order by bi.scraped_at desc
    limit p_limit;
end;
$$;

comment on function public.get_brazil_index_history is 'Returns historical data for a specific Brazil index';

-- 5. Function to get indices data within a time range ----------------------
create or replace function public.get_brazil_indices_by_date_range(
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
        bi.id,
        bi.name,
        bi.last,
        bi.high,
        bi.low,
        bi.change,
        bi.change_percent,
        bi."time",
        bi.scraped_at
    from public.brazil_indices bi
    where bi.scraped_at >= p_start_date
      and bi.scraped_at <= p_end_date
    order by bi.scraped_at desc, bi.name;
end;
$$;

comment on function public.get_brazil_indices_by_date_range is 'Returns Brazil indices data within a specific date range';

-- 6. Function to clean up old data (keep last 30 days) ---------------------
create or replace function public.cleanup_old_brazil_indices_data(
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
    delete from public.brazil_indices
    where scraped_at < timezone('utc', now()) - (p_days_to_keep || ' days')::interval;
    
    get diagnostics v_deleted_count = row_count;
    
    return v_deleted_count;
end;
$$;

comment on function public.cleanup_old_brazil_indices_data is 'Deletes Brazil indices data older than specified days (default 30)';

-- 7. Row Level Security policies --------------------------------------------
alter table public.brazil_indices enable row level security;
alter table public.brazil_indices force row level security;

-- Authenticated users can view all indices data
drop policy if exists "Authenticated users can view indices" on public.brazil_indices;
create policy "Authenticated users can view indices" on public.brazil_indices
for select
to authenticated
using (true);

-- Service role has full access (for scraper)
drop policy if exists "Service role manages indices" on public.brazil_indices;
create policy "Service role manages indices" on public.brazil_indices
for all
to service_role
using (true)
with check (true);

-- Admins can manage all data
drop policy if exists "Admins can manage indices" on public.brazil_indices;
create policy "Admins can manage indices" on public.brazil_indices
for all
to authenticated
using (public.is_authenticated_admin())
with check (public.is_authenticated_admin());

-- 8. Grant necessary permissions --------------------------------------------
grant select on public.brazil_indices to authenticated;
grant all on public.brazil_indices to service_role;

grant execute on function public.upsert_brazil_index to service_role;
grant execute on function public.get_latest_brazil_indices to authenticated;
grant execute on function public.get_brazil_index_history to authenticated;
grant execute on function public.get_brazil_indices_by_date_range to authenticated;
grant execute on function public.cleanup_old_brazil_indices_data to service_role;

commit;