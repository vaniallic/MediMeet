-- MediMeet database schema for Supabase (PostgreSQL).
-- Run this whole file once in Supabase → SQL Editor, then run seed.sql.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Catalog (public, read-only for users)
-- ---------------------------------------------------------------------------
create table if not exists public.specialties (
  slug text primary key,
  name text not null,
  icon text not null,
  blurb text
);

create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  phone text,
  rating numeric(2,1) default 4.5,
  color text default '#04677d',
  image text
);
alter table public.hospitals add column if not exists image text;

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  specialty text not null references public.specialties(slug),
  hospital_id uuid not null references public.hospitals(id),
  experience_years int not null default 1,
  patients int not null default 0,
  rating numeric(2,1) not null default 5.0,
  reviews_count int not null default 0,
  fee int not null,
  days int[] not null,          -- ISO-ish weekday numbers, 0 = Sunday … 6 = Saturday
  slots text[] not null,        -- 'HH:MM'
  bio text,
  photo text,
  portrait text
);
alter table public.doctors add column if not exists photo text;
alter table public.doctors add column if not exists portrait text;

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  birth_date date,
  notifications boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  date date not null,
  time text not null,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','confirmed','completed','cancelled')),
  fee int not null default 0,
  admin_fee int not null default 5000,
  insurance_provider text,
  insurance_covered int not null default 0,
  total int not null default 0,
  payment_method text,
  paid_at timestamptz,
  queue_no int,
  created_at timestamptz not null default now()
);

-- One active booking per doctor/date/time: the database itself prevents double booking.
create unique index if not exists appointments_slot_unique
  on public.appointments (doctor_id, date, time)
  where status in ('pending_payment','confirmed');

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.appointments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id),
  items jsonb not null,
  total int not null,
  status text not null default 'unpaid' check (status in ('unpaid','paid')),
  payment_method text,
  paid_at timestamptz,
  pickup_name text not null,
  pickup_address text not null,
  pickup_lat double precision,
  pickup_lng double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.specialties enable row level security;
alter table public.hospitals enable row level security;
alter table public.doctors enable row level security;
alter table public.profiles enable row level security;
alter table public.appointments enable row level security;
alter table public.reviews enable row level security;
alter table public.prescriptions enable row level security;

drop policy if exists "catalog readable" on public.specialties;
create policy "catalog readable" on public.specialties for select using (true);
drop policy if exists "catalog readable" on public.hospitals;
create policy "catalog readable" on public.hospitals for select using (true);
drop policy if exists "catalog readable" on public.doctors;
create policy "catalog readable" on public.doctors for select using (true);

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Users read their own appointments and create pending ones; every status change
-- goes through the security-definer functions below, so there is no update policy.
drop policy if exists "own appointments" on public.appointments;
create policy "own appointments" on public.appointments for select using (auth.uid() = user_id);
drop policy if exists "create own appointment" on public.appointments;
create policy "create own appointment" on public.appointments for insert
  with check (auth.uid() = user_id and status = 'pending_payment');

drop policy if exists "reviews readable" on public.reviews;
create policy "reviews readable" on public.reviews for select using (true);
drop policy if exists "review own completed visit" on public.reviews;
create policy "review own completed visit" on public.reviews for insert with check (
  auth.uid() = user_id and exists (
    select 1 from public.appointments a
    where a.id = appointment_id and a.user_id = auth.uid()
      and a.status = 'completed' and a.doctor_id = reviews.doctor_id
  )
);

drop policy if exists "own prescriptions" on public.prescriptions;
create policy "own prescriptions" on public.prescriptions for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Fill price fields from the doctor and validate the requested slot.
create or replace function public.prepare_appointment()
returns trigger language plpgsql security definer set search_path = public as $$
declare doc public.doctors;
begin
  select * into doc from public.doctors where id = new.doctor_id;
  if not found then raise exception 'Doctor not found'; end if;

  if new.status = 'pending_payment' then
    if new.date < (now() at time zone 'Asia/Jakarta')::date then
      raise exception 'Please choose a date from today onwards';
    end if;
    if not (extract(dow from new.date)::int = any(doc.days)) then
      raise exception 'The doctor does not practise on this day';
    end if;
    if not (new.time = any(doc.slots)) then
      raise exception 'This time is not in the doctor''s schedule';
    end if;
    if new.date = (now() at time zone 'Asia/Jakarta')::date
       and new.time <= to_char(now() at time zone 'Asia/Jakarta', 'HH24:MI') then
      raise exception 'This time has already passed';
    end if;
  end if;

  -- Release unpaid holds older than 15 minutes on this slot.
  update public.appointments set status = 'cancelled'
  where doctor_id = new.doctor_id and date = new.date and time = new.time
    and status = 'pending_payment' and created_at < now() - interval '15 minutes';

  new.fee := doc.fee;
  new.admin_fee := 5000;
  new.insurance_provider := null;
  new.insurance_covered := 0;
  new.total := doc.fee + 5000;
  return new;
end $$;

drop trigger if exists prepare_appointment on public.appointments;
create trigger prepare_appointment before insert on public.appointments
  for each row execute function public.prepare_appointment();

-- Keep each doctor's rating and review count in sync.
create or replace function public.refresh_doctor_rating()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.doctors d set
    reviews_count = d.reviews_count + 1,
    rating = round(((d.rating * d.reviews_count + new.rating) / (d.reviews_count + 1))::numeric, 1)
  where d.id = new.doctor_id;
  return new;
end $$;

drop trigger if exists refresh_doctor_rating on public.reviews;
create trigger refresh_doctor_rating after insert on public.reviews
  for each row execute function public.refresh_doctor_rating();

-- Build the prescription for a finished visit.
create or replace function public.make_prescription(p_appointment uuid, p_paid boolean default false)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  a public.appointments;
  doc public.doctors;
  h public.hospitals;
  tmpl jsonb;
  new_id uuid;
begin
  select * into a from public.appointments where id = p_appointment;
  select * into doc from public.doctors where id = a.doctor_id;
  select * into h from public.hospitals where id = doc.hospital_id;

  tmpl := case doc.specialty
    when 'general' then '[{"name":"Paracetamol 500 mg","dose":"3× a day after meals, as needed","qty":10,"price":1500},{"name":"Vitamin C 500 mg","dose":"1× a day","qty":10,"price":2500}]'
    when 'pediatrics' then '[{"name":"Paracetamol syrup 120 mg/5 ml","dose":"3× a day, 5 ml","qty":1,"price":28000},{"name":"Zinc syrup","dose":"1× a day, 5 ml","qty":1,"price":35000}]'
    when 'internal' then '[{"name":"Omeprazole 20 mg","dose":"1× a day before breakfast","qty":14,"price":4000},{"name":"Antacid suspension","dose":"3× a day before meals","qty":1,"price":26000}]'
    when 'ent' then '[{"name":"Cetirizine 10 mg","dose":"1× a day at night","qty":10,"price":3000},{"name":"Saline nasal spray","dose":"2 sprays, 3× a day","qty":1,"price":45000}]'
    when 'derm' then '[{"name":"Hydrocortisone cream 1%","dose":"Thin layer, 2× a day","qty":1,"price":32000},{"name":"Gentle moisturizer","dose":"Apply after bathing","qty":1,"price":85000}]'
    when 'eye' then '[{"name":"Artificial tears","dose":"1–2 drops, 4× a day","qty":1,"price":48000}]'
    when 'dental' then '[{"name":"Chlorhexidine mouthwash 0.2%","dose":"Rinse 2× a day","qty":1,"price":38000}]'
    else '[{"name":"Paracetamol 500 mg","dose":"3× a day after meals, as needed","qty":10,"price":1500},{"name":"Multivitamin","dose":"1× a day","qty":10,"price":3000}]'
  end::jsonb;

  insert into public.prescriptions
    (user_id, appointment_id, doctor_id, items, total, status, payment_method, paid_at,
     pickup_name, pickup_address, pickup_lat, pickup_lng, created_at)
  values
    (a.user_id, a.id, doc.id, tmpl,
     (select coalesce(sum((i->>'qty')::int * (i->>'price')::int), 0) from jsonb_array_elements(tmpl) i),
     case when p_paid then 'paid' else 'unpaid' end,
     case when p_paid then 'QRIS' end,
     case when p_paid then (a.date + time '12:00') end,
     h.name || ' Pharmacy', h.address, h.lat, h.lng,
     (a.date + a.time::time) + interval '45 minutes')
  returning id into new_id;
  return new_id;
end $$;

revoke all on function public.make_prescription(uuid, boolean) from public, anon, authenticated;

-- New account → profile + a little history so the app isn't empty on first login.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Jakarta')::date;
  a1 uuid;
  a2 uuid;
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
          new.raw_user_meta_data->>'phone');

  insert into public.appointments (user_id, doctor_id, date, time, status, payment_method, paid_at, queue_no)
  values (new.id, '22222222-0000-4000-8000-000000000001', today - 5, '09:00', 'completed', 'QRIS', now() - interval '6 days', 3)
  returning id into a1;

  insert into public.appointments (user_id, doctor_id, date, time, status, payment_method, paid_at, queue_no)
  values (new.id, '22222222-0000-4000-8000-000000000004', today - 40, '10:00', 'completed', 'GoPay', now() - interval '41 days', 1)
  returning id into a2;

  perform public.make_prescription(a1, false);
  perform public.make_prescription(a2, true);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RPC functions called from the app
-- ---------------------------------------------------------------------------

-- Taken slots for a doctor on a date (without exposing who booked them).
create or replace function public.booked_slots(p_doctor uuid, p_date date)
returns setof text language sql stable security definer set search_path = public as $$
  select time from public.appointments
  where doctor_id = p_doctor and date = p_date
    and (status = 'confirmed'
         or (status = 'pending_payment' and created_at > now() - interval '15 minutes'));
$$;

-- Simulated payment: no money moves. Marks the booking as paid and gives a queue number.
create or replace function public.pay_appointment(p_id uuid, p_method text, p_insurance text default null)
returns public.appointments language plpgsql security definer set search_path = public as $$
declare a public.appointments; covered int := 0;
begin
  select * into a from public.appointments where id = p_id and user_id = auth.uid() for update;
  if not found then raise exception 'Appointment not found'; end if;
  if a.status = 'cancelled' then raise exception 'This booking expired. Please choose the time again.'; end if;
  if a.status <> 'pending_payment' then raise exception 'This appointment is already paid'; end if;
  if p_method not in ('QRIS','GoPay','Virtual Account','Card') then raise exception 'Unknown payment method'; end if;

  if p_insurance is not null and length(trim(p_insurance)) > 0 then
    covered := floor(a.fee * 0.8);
  end if;

  update public.appointments set
    status = 'confirmed',
    payment_method = p_method,
    paid_at = now(),
    insurance_provider = nullif(trim(p_insurance), ''),
    insurance_covered = covered,
    total = fee + admin_fee - covered,
    queue_no = (select count(*) + 1 from public.appointments
                where doctor_id = a.doctor_id and date = a.date and status in ('confirmed','completed'))
  where id = p_id
  returning * into a;
  return a;
end $$;

create or replace function public.cancel_appointment(p_id uuid)
returns public.appointments language plpgsql security definer set search_path = public as $$
declare a public.appointments;
begin
  update public.appointments set status = 'cancelled'
  where id = p_id and user_id = auth.uid() and status in ('pending_payment','confirmed')
  returning * into a;
  if not found then raise exception 'This appointment can''t be cancelled'; end if;
  return a;
end $$;

-- Demo helper: pretend the consultation happened, so history, reviews and prescriptions can be tried.
create or replace function public.finish_visit(p_id uuid)
returns public.appointments language plpgsql security definer set search_path = public as $$
declare a public.appointments;
begin
  update public.appointments set status = 'completed'
  where id = p_id and user_id = auth.uid() and status = 'confirmed'
  returning * into a;
  if not found then raise exception 'Only confirmed appointments can be finished'; end if;
  perform public.make_prescription(p_id, false);
  return a;
end $$;

create or replace function public.pay_prescription(p_id uuid, p_method text)
returns public.prescriptions language plpgsql security definer set search_path = public as $$
declare p public.prescriptions;
begin
  if p_method not in ('QRIS','GoPay','Virtual Account','Card') then raise exception 'Unknown payment method'; end if;
  update public.prescriptions set status = 'paid', payment_method = p_method, paid_at = now()
  where id = p_id and user_id = auth.uid() and status = 'unpaid'
  returning * into p;
  if not found then raise exception 'Prescription not found or already paid'; end if;
  return p;
end $$;

create or replace function public.change_pickup(p_id uuid, p_name text, p_address text, p_lat double precision, p_lng double precision)
returns public.prescriptions language plpgsql security definer set search_path = public as $$
declare p public.prescriptions;
begin
  update public.prescriptions set pickup_name = p_name, pickup_address = p_address, pickup_lat = p_lat, pickup_lng = p_lng
  where id = p_id and user_id = auth.uid()
  returning * into p;
  if not found then raise exception 'Prescription not found'; end if;
  return p;
end $$;

grant execute on function public.booked_slots(uuid, date) to anon, authenticated;
grant execute on function public.pay_appointment(uuid, text, text) to authenticated;
grant execute on function public.cancel_appointment(uuid) to authenticated;
grant execute on function public.finish_visit(uuid) to authenticated;
grant execute on function public.pay_prescription(uuid, text) to authenticated;
grant execute on function public.change_pickup(uuid, text, text, double precision, double precision) to authenticated;
