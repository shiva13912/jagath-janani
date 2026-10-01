-- =====================================================================
-- Durgamatha Event Management - database schema
-- Run this in the Supabase dashboard: SQL Editor -> New query -> Run.
-- =====================================================================


-- ---------------------------------------------------------------------
-- Step 3: roles and the profiles table
-- ---------------------------------------------------------------------

-- The only roles that exist. Postgres rejects any other value.
create type public.user_role as enum ('ADMIN', 'TEAM_MEMBER', 'PUBLIC');

-- One row per user with app-specific information.
-- Passwords are NOT stored here: Supabase Auth keeps them (hashed) in auth.users.
create table public.profiles (
  -- Same id as the Supabase Auth user. If the auth user is deleted, the profile is deleted too.
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  role        public.user_role not null default 'PUBLIC',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Keep updated_at correct automatically whenever a row changes.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Row Level Security: with RLS on, nobody using the public (anon) key can
-- touch this table unless a policy below allows it.
alter table public.profiles enable row level security;

-- A logged-in user may READ only their own profile.
create policy "Users can read their own profile"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- There are deliberately NO insert, update or delete policies.
-- So from the browser nobody can create a profile, change a role, or delete a row.
-- Profiles are created by the signup trigger (Step 4), and roles are changed
-- only by an admin (for now: by hand in the Supabase Table Editor).


-- ---------------------------------------------------------------------
-- Step 4: create a profile automatically when a user signs up
-- ---------------------------------------------------------------------

-- Runs inside the database every time Supabase Auth adds a row to auth.users.
-- "security definer" lets it insert into profiles even though users themselves
-- have no insert permission (see the RLS section above).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    -- full_name comes from the register form (sent as user metadata)
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    -- Always PUBLIC. Any "role" a user sneaks into the signup metadata is ignored.
    'PUBLIC'
  );
  return new;
end;
$$;

-- Only the trigger should run this function, not users calling it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- =====================================================================
-- Phase 3: events
-- =====================================================================

-- ---------------------------------------------------------------------
-- Step 2: the events table
-- ---------------------------------------------------------------------

create table public.events (
  -- gen_random_uuid() creates a new random id automatically for each event
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null,
  -- DATE only (no time), e.g. 2026-10-15
  event_date      date not null,
  location        text not null,
  -- Will point to a media record in the Cloudinary phase.
  -- No foreign key yet, because the media table does not exist yet.
  cover_media_id  uuid,
  -- The admin who created the event. The backend fills this in from the logged-in user.
  -- A user who still has events cannot be deleted (the database refuses), so we never lose track of the creator.
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Speeds up sorting and filtering events by date
create index events_event_date_idx on public.events (event_date);

-- Reuse the updated_at function from Phase 2
create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Step 3: security for events
-- ---------------------------------------------------------------------

-- Our app reads and writes events ONLY through the Express backend, which uses the
-- service-role key. That key bypasses RLS, and the backend itself checks who is
-- allowed to do what (requireAuth + requireRole).
--
-- We still turn RLS on, with NO policies. That means anyone calling Supabase
-- directly with the public anon key (for example from the browser console)
-- cannot read, create, change or delete events. The only way in is our API.
alter table public.events enable row level security;

-- =====================================================================
-- PHASE 4: ALBUMS
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran the Phase 2 and Phase 3 sections, run ONLY this part.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Albums table
-- ---------------------------------------------------------------------

-- An album groups the photos and videos of ONE event, e.g. "Inauguration" or
-- "Cultural Events". One event can have many albums (Event 1 ──── * Albums).
-- In this phase an album holds only its own information; media comes in Phase 5.
create table public.albums (
  id              uuid primary key default gen_random_uuid(),
  -- The event this album belongs to. Required: every album belongs to exactly one event.
  -- "on delete cascade": when an event is deleted, the database deletes its albums too,
  -- so an album can never point to an event that no longer exists.
  event_id        uuid not null references public.events (id) on delete cascade,
  name            text not null,
  -- Optional: NULL when the album has no description
  description     text,
  -- The album's cover photo/video. The foreign key to media is added in the
  -- Phase 6 section at the bottom, because the media table is created later.
  cover_media_id  uuid,
  -- The admin or team member who created the album. The backend fills this in from the logged-in user.
  created_by      uuid not null references public.profiles (id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Speeds up "all albums of this event", the most common album query
create index albums_event_id_idx on public.albums (event_id);

-- Reuse the updated_at function from Phase 2
create trigger albums_set_updated_at
  before update on public.albums
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Security for albums
-- ---------------------------------------------------------------------

-- Same as events: RLS on with NO policies, so nobody can use the public anon key
-- to read or change albums directly. Only our Express backend (service-role key) can.
alter table public.albums enable row level security;

-- =====================================================================
-- PHASE 5: MEDIA (photos and videos)
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran Phases 2-4, run ONLY this part.)
--
-- The actual image/video files are stored in Cloudinary.
-- This table stores only metadata and the Cloudinary references (public id + URL),
-- never the files themselves.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Media table
-- ---------------------------------------------------------------------

-- events 1 ──── * albums 1 ──── * media ──── Cloudinary file
create table public.media (
  id                    uuid primary key default gen_random_uuid(),
  -- The album this photo/video belongs to. Every media item belongs to exactly one album.
  -- "on delete cascade": deleting an album deletes its media ROWS. The backend deletes
  -- the Cloudinary FILES first, because the database cannot reach Cloudinary.
  album_id              uuid not null references public.albums (id) on delete cascade,
  -- Who uploaded it. The backend fills this in from the logged-in user.
  uploaded_by           uuid not null references public.profiles (id),
  -- Cloudinary's id for the file, e.g. "durgamatha/events/<id>/albums/<id>/abc123".
  -- Needed to delete the file later. Unique: one row per Cloudinary file.
  cloudinary_public_id  text not null unique,
  -- The https URL used to show the photo/video
  secure_url            text not null,
  resource_type         text not null check (resource_type in ('image', 'video')),
  format                text not null,             -- e.g. jpg, png, webp, mp4, webm, mov
  original_filename     text not null,             -- the name of the file on the uploader's computer
  file_size             bigint not null,           -- in bytes
  width                 integer,                   -- pixels (images and most videos)
  height                integer,
  duration              numeric,                   -- seconds, videos only
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- Speeds up "all media of this album", the query used by the album page
create index media_album_id_idx on public.media (album_id);

-- Reuse the updated_at function from Phase 2
create trigger media_set_updated_at
  before update on public.media
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Security for media
-- ---------------------------------------------------------------------

-- Same as events and albums: RLS on with NO policies, so only our Express backend
-- (service-role key) can read or change media rows.
alter table public.media enable row level security;

-- =====================================================================
-- PHASE 6: GALLERY (album covers)
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran Phases 2-5, run ONLY this part.)
-- =====================================================================

-- albums.cover_media_id (added in Phase 4) now points to a real photo/video.
-- "on delete set null": when the cover photo is deleted, PostgreSQL itself sets the
-- album's cover back to NULL, so an album can never point to a deleted photo.
alter table public.albums
  add constraint albums_cover_media_id_fkey
  foreign key (cover_media_id) references public.media (id) on delete set null;

-- =====================================================================
-- PHASE 7: FINANCE (income and expenses) AND DASHBOARD TOTALS
-- Run this section once in the Supabase SQL Editor.
-- (If you already ran Phases 2-6, run ONLY this part.)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Income table: money received for an event (donations, sponsors, ...)
-- ---------------------------------------------------------------------

create table public.income (
  id             uuid primary key default gen_random_uuid(),
  -- The event this money belongs to. "on delete cascade": deleting an event deletes
  -- its income too, so no "orphan" money is left that would still count in the totals.
  event_id       uuid not null references public.events (id) on delete cascade,
  title          text not null,
  description    text, -- optional
  -- numeric(12,2) stores money EXACTLY (no floating-point rounding), e.g. 10000.50.
  -- Up to 9,999,999,999.99. The check makes PostgreSQL itself refuse 0 and negative amounts.
  amount         numeric(12,2) not null check (amount > 0),
  source         text not null, -- e.g. "Donation", "Sponsor"
  received_date  date not null,
  -- The admin who added it. The backend fills this in from the logged-in user.
  created_by     uuid not null references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Speeds up "all income of this event" and the per-event totals
create index income_event_id_idx on public.income (event_id);

create trigger income_set_updated_at
  before update on public.income
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Expenses table: money spent for an event
-- ---------------------------------------------------------------------

create table public.expenses (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events (id) on delete cascade,
  title        text not null,
  description  text,
  amount       numeric(12,2) not null check (amount > 0),
  -- A fixed list, so a check is enough (no separate categories table needed)
  category     text not null check (category in (
                 'Food', 'Decoration', 'Transportation', 'Equipment', 'Venue',
                 'Printing', 'Sound & Lighting', 'Gifts', 'Maintenance', 'Other')),
  spent_date   date not null,
  created_by   uuid not null references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index expenses_event_id_idx on public.expenses (event_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- Same as the other tables: RLS on with NO policies, so only our Express backend
-- (service-role key) can read or change financial records.
alter table public.income enable row level security;
alter table public.expenses enable row level security;

-- NOTE: there is deliberately NO "remaining balance" column anywhere.
-- The balance is always calculated as (total income - total expenses),
-- so it can never get out of step with the real records.

-- ---------------------------------------------------------------------
-- Dashboard totals, calculated inside PostgreSQL
-- ---------------------------------------------------------------------

-- Why SQL functions? The Supabase API returns at most 1000 rows per request, so adding
-- up rows in Node.js would give wrong totals once there are more records. PostgreSQL
-- counts and sums everything itself and returns just the answer.
-- Money totals are returned as text like "55000.00" so they stay exact.

-- Totals for ONE event. Returns NULL when the event does not exist (the API answers 404).
create function public.get_event_summary(p_event_id uuid)
returns json
language sql
stable
set search_path = ''
as $$
  with
    inc as (select coalesce(sum(amount), 0) as total from public.income where event_id = p_event_id),
    exp as (select coalesce(sum(amount), 0) as total from public.expenses where event_id = p_event_id)
  select json_build_object(
    'eventId', e.id,
    'eventTitle', e.title,
    'totalAlbums', (select count(*) from public.albums a where a.event_id = e.id),
    'totalPhotos', (select count(*) from public.media m join public.albums a on a.id = m.album_id
                    where a.event_id = e.id and m.resource_type = 'image'),
    'totalVideos', (select count(*) from public.media m join public.albums a on a.id = m.album_id
                    where a.event_id = e.id and m.resource_type = 'video'),
    'totalIncome', inc.total::numeric(16,2)::text,
    'totalExpenses', exp.total::numeric(16,2)::text,
    'remainingBalance', (inc.total - exp.total)::numeric(16,2)::text,
    'expensesByCategory', (
      select coalesce(json_agg(json_build_object('category', c.category, 'total', c.total::numeric(16,2)::text)
                               order by c.total desc), '[]'::json)
      from (select category, sum(amount) as total from public.expenses
            where event_id = e.id group by category) c
    )
  )
  from public.events e, inc, exp
  where e.id = p_event_id;
$$;

-- Totals for the whole site, plus the numbers for the dashboard charts.
create function public.get_dashboard_summary()
returns json
language sql
stable
set search_path = ''
as $$
  with
    inc as (select coalesce(sum(amount), 0) as total from public.income),
    exp as (select coalesce(sum(amount), 0) as total from public.expenses),
    -- Income and expenses per event, for the "Income vs Expenses" and "Balance" charts
    per_event as (
      select e.id, e.title, e.event_date,
             coalesce((select sum(amount) from public.income i where i.event_id = e.id), 0) as income,
             coalesce((select sum(amount) from public.expenses x where x.event_id = e.id), 0) as expenses
      from public.events e
    )
  select json_build_object(
    'totalEvents', (select count(*) from public.events),
    'totalAlbums', (select count(*) from public.albums),
    'totalPhotos', (select count(*) from public.media where resource_type = 'image'),
    'totalVideos', (select count(*) from public.media where resource_type = 'video'),
    'totalIncome', inc.total::numeric(16,2)::text,
    'totalExpenses', exp.total::numeric(16,2)::text,
    'remainingBalance', (inc.total - exp.total)::numeric(16,2)::text,
    'expensesByCategory', (
      select coalesce(json_agg(json_build_object('category', c.category, 'total', c.total::numeric(16,2)::text)
                               order by c.total desc), '[]'::json)
      from (select category, sum(amount) as total from public.expenses group by category) c
    ),
    -- The 10 most recent events that have any income or expenses (a chart with
    -- hundreds of bars would be unreadable; pick an event in the dashboard for the rest)
    'events', (
      select coalesce(json_agg(json_build_object(
               'eventId', p.id, 'eventTitle', p.title,
               'totalIncome', p.income::numeric(16,2)::text,
               'totalExpenses', p.expenses::numeric(16,2)::text,
               'remainingBalance', (p.income - p.expenses)::numeric(16,2)::text)
             order by p.event_date desc, p.id), '[]'::json)
      from (select * from per_event where income > 0 or expenses > 0
            order by event_date desc, id limit 10) p
    )
  )
  from inc, exp;
$$;

-- Only our backend (service-role key) may run these. Nobody can call them with the public anon key.
revoke execute on function public.get_event_summary(uuid) from public, anon, authenticated;
revoke execute on function public.get_dashboard_summary() from public, anon, authenticated;
grant execute on function public.get_event_summary(uuid) to service_role;
grant execute on function public.get_dashboard_summary() to service_role;
