-- 03_currencies_setup.sql
--
-- Currency exchange rates data schema
-- Creates table for storing scraped currency exchange rate data

begin;

-- 1. Currencies table --------------------------------------------------------
create table if not exists public.currencies (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    last_price numeric(15, 4),
    change numeric(15, 4),
    change_percent numeric(10, 4),
    scraped_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.currencies is 'Currency exchange rates data scraped from investing.com';
comment on column public.currencies.name is 'Currency pair name (e.g., Dólar/BRL, EUR/BRL)';
comment on column public.currencies.last_price is 'Current/last exchange rate';
comment on column public.currencies.change is 'Price change from previous close';
comment on column public.currencies.change_percent is 'Percentage change from previous close';
comment on column public.currencies.scraped_at is 'Timestamp when the data was scraped';

-- Add indexes for better query performance
create index if not exists idx_currencies_name on public.currencies(name);
create index if not exists idx_currencies_scraped_at on public.currencies(scraped_at desc);
create index if not exists idx_currencies_name_scraped_at on public.currencies(name, scraped_at desc);

-- Add timestamp trigger for currencies
drop trigger if exists currencies_set_timestamp on public.currencies;
create trigger currencies_set_timestamp
before update on public.currencies
for each row execute function public.handle_updated_at();

-- 2. Function to upsert currency data ---------------------------------------
create or replace function public.upsert_currency(
    p_name text,
    p_last_price numeric,
    p_change numeric,
    p_change_percent numeric,
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
    insert into public.currencies (
        name,
        last_price,
        change,
        change_percent,
        scraped_at
    )
    values (
        p_name,
        p_last_price,
        p_change,
        p_change_percent,
        p_scraped_at
    )
    returning id into v_id;

    return v_id;
end;
$$;

comment on function public.upsert_currency is 'Inserts a new currency record with scraped data';

-- 3. Function to get latest currencies data ---------------------------------
create or replace function public.get_latest_currencies()
returns table (
    id uuid,
    name text,
    last_price numeric,
    change numeric,
    change_percent numeric,
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
        c.last_price,
        c.change,
        c.change_percent,
        c.scraped_at
    from public.currencies c
    order by c.name, c.scraped_at desc;
end;
$$;

comment on function public.get_latest_currencies is 'Returns the most recent data for each currency pair';

-- 4. Function to get historical data for a specific currency ---------------
create or replace function public.get_currency_history(
    p_name text,
    p_limit integer default 100
)
returns table (
    id uuid,
    name text,
    last_price numeric,
    change numeric,
    change_percent numeric,
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
        c.last_price,
        c.change,
        c.change_percent,
        c.scraped_at
    from public.currencies c
    where c.name = p_name
    order by c.scraped_at desc
    limit p_limit;
end;
$$;

comment on function public.get_currency_history is 'Returns historical data for a specific currency pair';

-- 5. Function to get currencies data within a time range -------------------
create or replace function public.get_currencies_by_date_range(
    p_start_date timestamptz,
    p_end_date timestamptz
)
returns table (
    id uuid,
    name text,
    last_price numeric,
    change numeric,
    change_percent numeric,
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
        c.last_price,
        c.change,
        c.change_percent,
        c.scraped_at
    from public.currencies c
    where c.scraped_at >= p_start_date
      and c.scraped_at <= p_end_date
    order by c.scraped_at desc, c.name;
end;
$$;

comment on function public.get_currencies_by_date_range is 'Returns currencies data within a specific date range';

-- 6. Function to clean up old data (keep last 30 days) ---------------------
create or replace function public.cleanup_old_currencies_data(
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
    delete from public.currencies
    where scraped_at < timezone('utc', now()) - (p_days_to_keep || ' days')::interval;
    
    get diagnostics v_deleted_count = row_count;
    
    return v_deleted_count;
end;
$$;

comment on function public.cleanup_old_currencies_data is 'Deletes currencies data older than specified days (default 30)';

-- 7. Row Level Security policies --------------------------------------------
alter table public.currencies enable row level security;
alter table public.currencies force row level security;

-- Authenticated users can view all currencies data
drop policy if exists "Authenticated users can view currencies" on public.currencies;
create policy "Authenticated users can view currencies" on public.currencies
for select
to authenticated
using (true);

-- Service role has full access (for scraper)
drop policy if exists "Service role manages currencies" on public.currencies;
create policy "Service role manages currencies" on public.currencies
for all
to service_role
using (true)
with check (true);

-- Admins can manage all data
drop policy if exists "Admins can manage currencies" on public.currencies;
create policy "Admins can manage currencies" on public.currencies
for all
to authenticated
using (public.is_authenticated_admin())
with check (public.is_authenticated_admin());

-- 8. Grant necessary permissions --------------------------------------------
grant select on public.currencies to authenticated;
grant all on public.currencies to service_role;

grant execute on function public.upsert_currency to service_role;
grant execute on function public.get_latest_currencies to authenticated;
grant execute on function public.get_currency_history to authenticated;
grant execute on function public.get_currencies_by_date_range to authenticated;
grant execute on function public.cleanup_old_currencies_data to service_role;

commit;