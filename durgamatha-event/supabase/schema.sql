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
