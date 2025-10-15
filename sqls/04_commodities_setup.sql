-- 04_commodities_setup.sql
--
-- Commodities data schema
-- Creates table for storing scraped commodities data from investing.com

begin;

-- 1. Commodities table --------------------------------------------------------
create table if not exists public.commodities (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    fifteen_minutes numeric(10, 4),
    hourly numeric(10, 4),
    daily numeric(10, 4),
    one_week numeric(10, 4),
    one_month numeric(10, 4),
    ytd numeric(10, 4),
    three_years numeric(10, 4),
    scraped_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.commodities is 'Commodities data scraped from investing.com';
comment on column public.commodities.name is 'Commodity name (e.g., Gold, Silver, Copper)';
comment on column public.commodities.fifteen_minutes is 'Percentage change in last 15 minutes';
comment on column public.commodities.hourly is 'Percentage change in last hour';
comment on column public.commodities.daily is 'Percentage change in last day';
comment on column public.commodities.one_week is 'Percentage change in last week';
comment on column public.commodities.one_month is 'Percentage change in last month';
comment on column public.commodities.ytd is 'Year-to-date percentage change';
comment on column public.commodities.three_years is 'Percentage change over 3 years';
comment on column public.commodities.scraped_at is 'Timestamp when the data was scraped';

-- Add indexes for better query performance
create index if not exists idx_commodities_name on public.commodities(name);
create index if not exists idx_commodities_scraped_at on public.commodities(scraped_at desc);
create index if not exists idx_commodities_name_scraped_at on public.commodities(name, scraped_at desc);

-- Add timestamp trigger for commodities
drop trigger if exists commodities_set_timestamp on public.commodities;
create trigger commodities_set_timestamp
before update on public.commodities
for each row execute function public.handle_updated_at();

-- 2. Function to upsert commodity data ---------------------------------------
create or replace function public.upsert_commodity(
    p_name text,
    p_fifteen_minutes numeric,
    p_hourly numeric,
    p_daily numeric,
    p_one_week numeric,
    p_one_month numeric,
    p_ytd numeric,
    p_three_years numeric,
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
    insert into public.commodities (
        name,
        fifteen_minutes,
        hourly,
        daily,
        one_week,
        one_month,
        ytd,
        three_years,
        scraped_at
    )
    values (
        p_name,
        p_fifteen_minutes,
        p_hourly,
        p_daily,
        p_one_week,
        p_one_month,
        p_ytd,
        p_three_years,
        p_scraped_at
    )
    returning id into v_id;

    return v_id;
end;
$$;

comment on function public.upsert_commodity is 'Inserts a new commodity record with scraped data';

-- 3. Function to get latest commodities data ---------------------------------
create or replace function public.get_latest_commodities()
returns table (
    id uuid,
    name text,
    fifteen_minutes numeric,
    hourly numeric,
    daily numeric,
    one_week numeric,
    one_month numeric,
    ytd numeric,
    three_years numeric,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select distinct on (c.name)
        c.id,
        c.name,
        c.fifteen_minutes,
        c.hourly,
        c.daily,
        c.one_week,
        c.one_month,
        c.ytd,
        c.three_years,
        c.scraped_at
    from public.commodities c
    order by c.name, c.scraped_at desc;
end;
$$;

comment on function public.get_latest_commodities is 'Returns the most recent data for each commodity';

-- 4. Function to get historical data for a specific commodity ---------------
create or replace function public.get_commodity_history(
    p_name text,
    p_limit integer default 100
)
returns table (
    id uuid,
    name text,
    fifteen_minutes numeric,
    hourly numeric,
    daily numeric,
    one_week numeric,
    one_month numeric,
    ytd numeric,
    three_years numeric,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        c.id,
        c.name,
        c.fifteen_minutes,
        c.hourly,
        c.daily,
        c.one_week,
        c.one_month,
        c.ytd,
        c.three_years,
        c.scraped_at
    from public.commodities c
    where c.name = p_name
    order by c.scraped_at desc
    limit p_limit;
end;
$$;

comment on function public.get_commodity_history is 'Returns historical data for a specific commodity';

-- 5. Function to get commodities data within a time range -------------------
create or replace function public.get_commodities_by_date_range(
    p_start_date timestamptz,
    p_end_date timestamptz
)
returns table (
    id uuid,
    name text,
    fifteen_minutes numeric,
    hourly numeric,
    daily numeric,
    one_week numeric,
    one_month numeric,
    ytd numeric,
    three_years numeric,
    scraped_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
    return query
    select
        c.id,
        c.name,
        c.fifteen_minutes,
        c.hourly,
        c.daily,
        c.one_week,
        c.one_month,
        c.ytd,
        c.three_years,
        c.scraped_at
    from public.commodities c
    where c.scraped_at >= p_start_date
      and c.scraped_at <= p_end_date
    order by c.scraped_at desc, c.name;
end;
$$;

comment on function public.get_commodities_by_date_range is 'Returns commodities data within a specific date range';

-- 6. Function to clean up old data (keep last 30 days) ---------------------
create or replace function public.cleanup_old_commodities_data(
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
    delete from public.commodities
    where scraped_at < timezone('utc', now()) - (p_days_to_keep || ' days')::interval;
    
    get diagnostics v_deleted_count = row_count;
    
    return v_deleted_count;
end;
$$;

comment on function public.cleanup_old_commodities_data is 'Deletes commodities data older than specified days (default 30)';

-- 7. Row Level Security policies --------------------------------------------
alter table public.commodities enable row level security;
alter table public.commodities force row level security;

-- Authenticated users can view all commodities data
drop policy if exists "Authenticated users can view commodities" on public.commodities;
create policy "Authenticated users can view commodities" on public.commodities
for select
to authenticated
using (true);

-- Service role has full access (for scraper)
drop policy if exists "Service role manages commodities" on public.commodities;
create policy "Service role manages commodities" on public.commodities
for all
to service_role
using (true)
with check (true);

-- Admins can manage all data
drop policy if exists "Admins can manage commodities" on public.commodities;
create policy "Admins can manage commodities" on public.commodities
for all
to authenticated
using (public.is_authenticated_admin())
with check (public.is_authenticated_admin());

-- 8. Grant necessary permissions --------------------------------------------
grant select on public.commodities to authenticated;
grant all on public.commodities to service_role;

grant execute on function public.upsert_commodity to service_role;
grant execute on function public.get_latest_commodities to authenticated;
grant execute on function public.get_commodity_history to authenticated;
grant execute on function public.get_commodities_by_date_range to authenticated;
grant execute on function public.cleanup_old_commodities_data to service_role;

commit;